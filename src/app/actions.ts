"use server";

import { prisma } from "@/lib/prisma";
import {
  MAXIMO_ITENS_POR_RETIRADA,
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  type Categoria,
  type EquipamentoDisponivel,
  type MotivoDeFalha,
  type Resultado,
  type RetiradaConfirmada,
  type UsuarioIdentificado,
} from "@/lib/tipos";

/**
 * Server Actions do Fluxo 1 — Retirada de Equipamento (spec, seção 4).
 *
 * Toda action é um endpoint POST público: qualquer um na rede local pode
 * chamá-la sem passar pela interface. Por isso nenhuma delas confia no que
 * chega do cliente — matrícula e etiquetas são sempre reconferidas no banco
 * antes de virar escrita. O MVP não tem autenticação no tablet (decisão da
 * spec: a barreira é física, o tablet fica na bancada da secretaria).
 */

/** Ordem em que as categorias aparecem no tablet. O resto vem depois, alfabético. */
const ORDEM_DAS_CATEGORIAS = ["Notebook", "Tablet", "Extensão"];

function falha(
  motivo: MotivoDeFalha,
  mensagem: string,
  detalhe?: string,
  indisponiveis?: string[],
): Resultado<never> {
  return { ok: false, motivo, mensagem, detalhe, indisponiveis };
}

/** Normaliza a matrícula sem tocar em zeros à esquerda (são significativos). */
function limparMatricula(bruta: unknown): string {
  return typeof bruta === "string" ? bruta.trim() : "";
}

function ordenarCategorias(a: Categoria, b: Categoria): number {
  const posA = ORDEM_DAS_CATEGORIAS.indexOf(a.tipo);
  const posB = ORDEM_DAS_CATEGORIAS.indexOf(b.tipo);
  if (posA !== -1 && posB !== -1) return posA - posB;
  if (posA !== -1) return -1;
  if (posB !== -1) return 1;
  return a.tipo.localeCompare(b.tipo, "pt-BR");
}

/**
 * Passo 1 do fluxo: identifica o usuário pela matrícula e já devolve o
 * inventário agrupado por categoria, para a tela seguinte abrir sem espera.
 */
export async function identificarUsuario(
  matriculaBruta: string,
): Promise<
  Resultado<{ usuario: UsuarioIdentificado; categorias: Categoria[] }>
> {
  const matricula = limparMatricula(matriculaBruta);

  if (matricula.length === 0) {
    return falha("MATRICULA_VAZIA", "Digite a sua matrícula para continuar.");
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { matricula } });

    if (!usuario) {
      return falha(
        "MATRICULA_NAO_ENCONTRADA",
        `Matrícula ${matricula} não encontrada.`,
        "Confira os números digitados. Se estiver certo, procure a secretaria.",
      );
    }

    return { ok: true, dados: { usuario, categorias: await listarCategorias() } };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Categorias do inventário com a contagem de unidades livres.
 *
 * Categorias sem nenhuma unidade livre continuam aparecendo (desabilitadas):
 * "Notebooks — nenhum disponível" informa; a categoria sumir da tela confunde.
 */
async function listarCategorias(): Promise<Categoria[]> {
  const [todos, livres] = await Promise.all([
    prisma.equipamento.groupBy({ by: ["tipo"], _count: { _all: true } }),
    prisma.equipamento.groupBy({
      by: ["tipo"],
      where: { status: STATUS_EQUIPAMENTO.disponivel },
      _count: { _all: true },
    }),
  ]);

  const disponiveisPorTipo = new Map(
    livres.map((grupo) => [grupo.tipo, grupo._count._all]),
  );

  return todos
    .map((grupo) => ({
      tipo: grupo.tipo,
      total: grupo._count._all,
      disponiveis: disponiveisPorTipo.get(grupo.tipo) ?? 0,
    }))
    .sort(ordenarCategorias);
}

/**
 * Passo 3 do fluxo: equipamentos livres de uma categoria.
 *
 * Relê o banco a cada abertura de categoria em vez de reaproveitar a contagem
 * do login — entre um toque e outro a secretaria pode ter posto um item em
 * manutenção.
 */
export async function listarDisponiveis(
  tipo: string,
): Promise<Resultado<EquipamentoDisponivel[]>> {
  try {
    const equipamentos = await prisma.equipamento.findMany({
      where: { tipo, status: STATUS_EQUIPAMENTO.disponivel },
      select: { id: true, tipo: true },
      orderBy: { id: "asc" },
    });

    return { ok: true, dados: equipamentos };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Passo 5 do fluxo: confirma a retirada.
 *
 * Tudo dentro de uma transação: ou os N equipamentos ficam EMPRESTADO e os N
 * empréstimos nascem ATIVO, ou nada acontece. Cada item vira um registro
 * separado em Emprestimo — é o que permite devolver um notebook e ficar com a
 * extensão.
 *
 * A corrida real aqui é dois tablets (ou um duplo-toque) pegando o mesmo item.
 * O `updateMany` filtra por `status: DISPONIVEL` e conta quantas linhas mudou:
 * se mudou menos do que o pedido, alguém chegou antes e a transação inteira
 * volta atrás.
 */
export async function confirmarRetirada(
  matriculaBruta: string,
  equipamentosBrutos: string[],
): Promise<Resultado<RetiradaConfirmada>> {
  const matricula = limparMatricula(matriculaBruta);

  if (matricula.length === 0) {
    return falha("MATRICULA_VAZIA", "Sessão perdida. Informe a matrícula novamente.");
  }

  const ids = Array.from(
    new Set(
      (Array.isArray(equipamentosBrutos) ? equipamentosBrutos : [])
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  );

  if (ids.length === 0) {
    return falha("SELECAO_VAZIA", "Selecione pelo menos um equipamento.");
  }

  if (ids.length > MAXIMO_ITENS_POR_RETIRADA) {
    return falha(
      "SELECAO_EXCEDIDA",
      `São no máximo ${MAXIMO_ITENS_POR_RETIRADA} itens por retirada.`,
      "Para levar mais, fale com a secretaria.",
    );
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { matricula } });

    if (!usuario) {
      return falha(
        "MATRICULA_NAO_ENCONTRADA",
        `Matrícula ${matricula} não encontrada.`,
        "Comece de novo pela tela inicial.",
      );
    }

    const retirada = await prisma.$transaction(async (tx) => {
      const itens = await tx.equipamento.findMany({
        where: { id: { in: ids }, status: STATUS_EQUIPAMENTO.disponivel },
        select: { id: true, tipo: true },
        orderBy: { id: "asc" },
      });

      const alterados = await tx.equipamento.updateMany({
        where: { id: { in: ids }, status: STATUS_EQUIPAMENTO.disponivel },
        data: { status: STATUS_EQUIPAMENTO.emprestado },
      });

      if (alterados.count !== ids.length) {
        const indisponiveis = ids.filter(
          (id) => !itens.some((item) => item.id === id),
        );
        // Aborta a transação: o updateMany acima é desfeito junto.
        throw new EquipamentoIndisponivelError(indisponiveis);
      }

      const criados = await tx.emprestimo.createMany({
        data: ids.map((equipId) => ({
          usuario_id: usuario.matricula,
          equip_id: equipId,
          status: STATUS_EMPRESTIMO.ativo,
        })),
      });

      return { itens, registrados: criados.count };
    });

    return {
      ok: true,
      dados: {
        usuario,
        itens: retirada.itens,
        registrados: retirada.registrados,
      },
    };
  } catch (erro) {
    if (erro instanceof EquipamentoIndisponivelError) {
      const lista = erro.ids.join(", ");
      return falha(
        "EQUIPAMENTO_INDISPONIVEL",
        lista.length > 0
          ? `O equipamento ${lista} acabou de sair.`
          : "Um dos equipamentos selecionados acabou de sair.",
        "Nada foi registrado. Removemos o item da sua lista — confira e confirme de novo.",
        erro.ids,
      );
    }

    return falhaInterna(erro);
  }
}

/** Erro interno da transação, usado só para abortar e voltar atrás. */
class EquipamentoIndisponivelError extends Error {
  constructor(readonly ids: string[]) {
    super("Equipamento indisponível");
    this.name = "EquipamentoIndisponivelError";
  }
}

/**
 * Falha não prevista (banco fora do ar, arquivo .db travado). O aluno vê uma
 * frase que ele pode agir sobre; o detalhe técnico fica no terminal da
 * secretaria, onde alguém pode usá-lo.
 */
function falhaInterna(erro: unknown): Resultado<never> {
  console.error("[retirada] falha inesperada:", erro);

  return falha(
    "FALHA_INTERNA",
    "Não foi possível falar com o sistema agora.",
    "Tente de novo em alguns segundos. Se continuar, avise a secretaria.",
  );
}
