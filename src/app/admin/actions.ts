"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  conferirSenha,
  criarSessao,
  encerrarSessao,
  segundosDeBloqueio,
  temSessaoAdmin,
} from "@/lib/sessao-admin";
import {
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  type EstadoDoCadastro,
  type EstadoDoLogin,
  type MotivoDeFalha,
  type RecebimentoConfirmado,
  type Resultado,
} from "@/lib/tipos";

/**
 * Server Actions do Painel Administrativo — Fluxo 3 da spec (seção 4).
 *
 * Toda action aqui é um endpoint POST público, exatamente como as do tablet. A
 * diferença é o que está do outro lado: no tablet a pior consequência de um
 * POST forjado é registrar um empréstimo errado; aqui é devolver ao inventário
 * um equipamento que ninguém entregou, ou esvaziar a prateleira mandando tudo
 * para manutenção.
 *
 * Por isso **todas** as actions de escrita começam pela mesma pergunta —
 * `temSessaoAdmin()` — e não pela confiança em quem renderizou a tela. Layout
 * escondendo o botão não protege endpoint (é o que o guia de autenticação do
 * Next diz, e é o caso clássico do App Router: cada rota é uma porta).
 */

/** Todas as telas do painel vivem sob /admin; uma invalidação cobre as três. */
const RAIZ_DO_PAINEL = "/admin";

function falha(
  motivo: MotivoDeFalha,
  mensagem: string,
  detalhe?: string,
): Resultado<never> {
  return { ok: false, motivo, mensagem, detalhe };
}

/** A recusa padrão quando a sessão caiu no meio do trabalho. */
function semSessao(): Resultado<never> {
  return falha(
    "SEM_SESSAO",
    "Sessão encerrada.",
    "Atualize a página e informe a senha novamente.",
  );
}

function falhaInterna(erro: unknown): Resultado<never> {
  console.error("[admin] falha inesperada:", erro);

  return falha(
    "FALHA_INTERNA",
    "Não foi possível concluir a operação.",
    "Tente de novo. Se continuar, confira se o banco de dados está acessível.",
  );
}

/** Código de erro do Prisma sem depender do formato da classe gerada. */
function codigoDoPrisma(erro: unknown): string | null {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    const { code } = erro as { code?: unknown };
    return typeof code === "string" ? code : null;
  }

  return null;
}

/* ------------------------------------------------------------------------- *
 * Entrada e saída do painel
 * ------------------------------------------------------------------------- */

/**
 * Confere a senha mestre e abre a sessão.
 *
 * A assinatura é a do `useActionState` (estado anterior, formulário). O sucesso
 * não devolve estado: emite `redirect` para o próprio /admin, que agora
 * renderiza o painel porque o cookie já foi para a resposta.
 *
 * As mensagens de erro são deliberadamente vagas quanto ao motivo — "senha
 * incorreta" e nada mais. A exceção é a senha não configurada, que é problema
 * de instalação e precisa dizer o nome da variável para alguém poder resolver.
 */
export async function entrarNoAdmin(
  _estadoAnterior: EstadoDoLogin,
  formulario: FormData,
): Promise<EstadoDoLogin> {
  const conferencia = conferirSenha(formulario.get("senha"));

  if (conferencia === "nao-configurada") {
    return {
      mensagem: "O painel não está configurado.",
      detalhe:
        "Defina ADMIN_PASSWORD no arquivo .env do servidor e reinicie o sistema.",
    };
  }

  if (conferencia === "bloqueado") {
    return {
      mensagem: "Muitas tentativas seguidas.",
      detalhe: `Aguarde ${segundosDeBloqueio()} segundos antes de tentar de novo.`,
    };
  }

  if (conferencia === "vazia") {
    return { mensagem: "Digite a senha do painel." };
  }

  if (conferencia === "incorreta") {
    return {
      mensagem: "Senha incorreta.",
      detalhe: "Confira o teclado e tente novamente.",
    };
  }

  await criarSessao();

  // Fora de try/catch de propósito: `redirect` sinaliza por exceção, e um
  // catch por perto engoliria a navegação.
  redirect(RAIZ_DO_PAINEL);
}

/** Fecha a sessão. O painel volta a ser a tela de senha. */
export async function sairDoAdmin(): Promise<void> {
  await encerrarSessao();
  redirect(RAIZ_DO_PAINEL);
}

/* ------------------------------------------------------------------------- *
 * Fila de Devoluções — a ação crítica do fluxo
 * ------------------------------------------------------------------------- */

/**
 * "Confirmar Recebimento Físico": a secretaria pegou o equipamento na bancada.
 *
 * É aqui — e só aqui — que o ciclo fecha:
 * - `Emprestimo`: `AGUARDANDO_BAIXA` -> `CONCLUIDO`.
 * - `Equipamento`: `EMPRESTADO` -> `DISPONIVEL`, voltando à vista do tablet.
 *
 * Os dois na mesma transação, porque metade disso é pior que nada: empréstimo
 * concluído com equipamento preso em `EMPRESTADO` some do inventário para
 * sempre; equipamento liberado com empréstimo aberto é oferecido no tablet e
 * some da fila da secretaria.
 *
 * O `updateMany` filtrando por `status: AGUARDANDO_BAIXA` é o que segura o
 * duplo-clique e as duas abas abertas na secretaria: a segunda chamada muda
 * zero linhas e a transação inteira volta atrás.
 *
 * Equipamento em `MANUTENCAO` é o único caso em que o empréstimo fecha sem
 * liberar o item — alguém marcou o defeito antes da baixa, e desfazer isso na
 * surdina jogaria um aparelho quebrado de volta na prateleira.
 */
export async function confirmarRecebimento(
  emprestimoIdBruto: number,
): Promise<Resultado<RecebimentoConfirmado>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const emprestimoId = Number(emprestimoIdBruto);

  if (!Number.isInteger(emprestimoId) || emprestimoId <= 0) {
    return falha(
      "EMPRESTIMO_NAO_ENCONTRADO",
      "Registro inválido.",
      "Atualize a página e tente de novo.",
    );
  }

  try {
    const confirmado = await prisma.$transaction(async (tx) => {
      const emprestimo = await tx.emprestimo.findFirst({
        where: {
          id: emprestimoId,
          status: STATUS_EMPRESTIMO.aguardandoBaixa,
        },
        select: {
          id: true,
          equip_id: true,
          usuario: { select: { nome: true } },
          equipamento: { select: { tipo: true, status: true } },
        },
      });

      if (!emprestimo) throw new ForaDaFilaError();

      const baixados = await tx.emprestimo.updateMany({
        where: { id: emprestimoId, status: STATUS_EMPRESTIMO.aguardandoBaixa },
        data: {
          status: STATUS_EMPRESTIMO.concluido,
          // A data que interessa para o inventário é a da conferência física,
          // não a da declaração no tablet: é quando o equipamento voltou.
          data_devolucao: new Date(),
        },
      });

      if (baixados.count !== 1) throw new ForaDaFilaError();

      const liberados = await tx.equipamento.updateMany({
        where: {
          id: emprestimo.equip_id,
          status: STATUS_EQUIPAMENTO.emprestado,
        },
        data: { status: STATUS_EQUIPAMENTO.disponivel },
      });

      return {
        equip_id: emprestimo.equip_id,
        tipo: emprestimo.equipamento.tipo,
        nome: emprestimo.usuario.nome,
        liberado: liberados.count === 1,
      };
    });

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return { ok: true, dados: confirmado };
  } catch (erro) {
    if (erro instanceof ForaDaFilaError) {
      return falha(
        "EMPRESTIMO_NAO_ENCONTRADO",
        "Esse item já saiu da fila.",
        "Outra pessoa pode ter confirmado o recebimento. A lista foi atualizada.",
      );
    }

    return falhaInterna(erro);
  }
}

/** Erro interno da transação da baixa, usado só para abortar e voltar atrás. */
class ForaDaFilaError extends Error {
  constructor() {
    super("Empréstimo não está aguardando baixa");
    this.name = "ForaDaFilaError";
  }
}

/* ------------------------------------------------------------------------- *
 * Gestão de Inventário
 * ------------------------------------------------------------------------- */

/**
 * Tira um equipamento de circulação (`MANUTENCAO`) ou devolve à vista do
 * tablet (`DISPONIVEL`).
 *
 * São as duas únicas transições que o painel oferece, e a restrição é de
 * negócio, não de tela:
 *
 * - `EMPRESTADO` não entra nem sai daqui. Esse status pertence ao ciclo de
 *   empréstimo: quem o define é a retirada no tablet, quem o desfaz é a
 *   confirmação de recebimento. Mudá-lo à mão deixaria um `Emprestimo` aberto
 *   apontando para um equipamento "disponível" — o tablet ofereceria um
 *   aparelho que está na mochila de alguém.
 * - Com empréstimo aberto (`ATIVO` ou `AGUARDANDO_BAIXA`), nada muda mesmo que
 *   o status do equipamento esteja inconsistente. Primeiro fecha-se o ciclo.
 *
 * O status esperado é derivado do destino (o inverso dele), nunca recebido da
 * tela: além de fechar o par permitido, dá de graça a trava de concorrência no
 * `updateMany` — duas abas clicando ao mesmo tempo, uma só muda a linha.
 */
export async function alterarStatusEquipamento(
  equipIdBruto: string,
  novoStatusBruto: string,
): Promise<Resultado<{ id: string; status: string }>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const equipId = typeof equipIdBruto === "string" ? equipIdBruto.trim() : "";

  if (equipId.length === 0) {
    return falha("EQUIPAMENTO_NAO_ENCONTRADO", "Equipamento não informado.");
  }

  const destino =
    novoStatusBruto === STATUS_EQUIPAMENTO.manutencao
      ? STATUS_EQUIPAMENTO.manutencao
      : novoStatusBruto === STATUS_EQUIPAMENTO.disponivel
        ? STATUS_EQUIPAMENTO.disponivel
        : null;

  if (!destino) {
    return falha(
      "STATUS_INVALIDO",
      "Situação inválida para um equipamento.",
      "O painel só alterna entre Disponível e Manutenção.",
    );
  }

  const origem =
    destino === STATUS_EQUIPAMENTO.manutencao
      ? STATUS_EQUIPAMENTO.disponivel
      : STATUS_EQUIPAMENTO.manutencao;

  try {
    const equipamento = await prisma.equipamento.findUnique({
      where: { id: equipId },
      select: {
        id: true,
        status: true,
        emprestimos: {
          where: {
            status: {
              in: [STATUS_EMPRESTIMO.ativo, STATUS_EMPRESTIMO.aguardandoBaixa],
            },
          },
          select: { status: true, usuario: { select: { nome: true } } },
          take: 1,
        },
      },
    });

    if (!equipamento) {
      return falha(
        "EQUIPAMENTO_NAO_ENCONTRADO",
        `Equipamento ${equipId} não existe.`,
        "Atualize a página: a lista pode estar desatualizada.",
      );
    }

    const aberto = equipamento.emprestimos[0];

    if (aberto) {
      const comQuem = aberto.usuario.nome;

      return falha(
        "EQUIPAMENTO_EM_USO",
        `${equipId} está em um empréstimo aberto.`,
        aberto.status === STATUS_EMPRESTIMO.aguardandoBaixa
          ? `Confirme o recebimento na Fila de Devoluções (${comQuem}) antes de mudar a situação.`
          : `Está com ${comQuem}. A situação só muda depois da devolução.`,
      );
    }

    if (equipamento.status === STATUS_EQUIPAMENTO.emprestado) {
      return falha(
        "EQUIPAMENTO_EM_USO",
        `${equipId} consta como emprestado.`,
        "Nenhum empréstimo aberto foi encontrado para ele. Verifique o histórico antes de liberar o item.",
      );
    }

    const alterados = await prisma.equipamento.updateMany({
      where: { id: equipId, status: origem },
      data: { status: destino },
    });

    if (alterados.count !== 1) {
      return falha(
        "STATUS_INVALIDO",
        `${equipId} já não estava como ${rotuloDeStatus(origem)}.`,
        "A lista foi atualizada com a situação atual.",
      );
    }

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return { ok: true, dados: { id: equipId, status: destino } };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Cadastra um equipamento novo (spec, seção 4, Fluxo 3, item 2).
 *
 * Duas normalizações que evitam problema de prateleira:
 *
 * - A etiqueta vira maiúscula. O id é comparado byte a byte no SQLite, então
 *   "note-11" e "NOTE-11" conviveriam como dois equipamentos — dois adesivos
 *   iguais no mesmo armário.
 * - A categoria adota a grafia já usada no banco quando existe uma equivalente
 *   ignorando maiúsculas e acentos. Sem isso, "notebook" abriria uma categoria
 *   nova no tablet, ao lado de "Notebook", com um item dentro.
 *
 * O item nasce `DISPONIVEL`: cadastrar é registrar o que chegou. Se veio com
 * defeito, o botão de manutenção está na linha seguinte da mesma tela.
 */
export async function cadastrarEquipamento(
  _estadoAnterior: EstadoDoCadastro,
  formulario: FormData,
): Promise<EstadoDoCadastro> {
  if (!(await temSessaoAdmin())) {
    return {
      fase: "erro",
      mensagem: "Sessão encerrada.",
      detalhe: "Atualize a página e informe a senha novamente.",
    };
  }

  const etiqueta = String(formulario.get("etiqueta") ?? "")
    .trim()
    .toUpperCase();
  const tipoDigitado = String(formulario.get("tipo") ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!/^[A-Z0-9][A-Z0-9._-]{0,23}$/.test(etiqueta)) {
    return {
      fase: "erro",
      mensagem: "Etiqueta inválida.",
      detalhe:
        "Use letras, números, ponto, hífen ou sublinhado — sem espaços nem acentos. Ex.: NOTE-11.",
    };
  }

  if (tipoDigitado.length === 0 || tipoDigitado.length > 30) {
    return {
      fase: "erro",
      mensagem: "Informe a categoria do equipamento.",
      detalhe: "Ex.: Notebook, Tablet, Extensão.",
    };
  }

  try {
    const tipo = await grafiaDaCategoria(tipoDigitado);

    await prisma.equipamento.create({
      data: { id: etiqueta, tipo, status: STATUS_EQUIPAMENTO.disponivel },
    });

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return {
      fase: "sucesso",
      mensagem: `${etiqueta} cadastrado em ${tipo} e disponível para retirada.`,
    };
  } catch (erro) {
    // P2002 = violação de chave única. Chega aqui quando duas pessoas cadastram
    // a mesma etiqueta ao mesmo tempo — o banco é quem decide, não uma leitura
    // anterior que já estaria velha.
    if (codigoDoPrisma(erro) === "P2002") {
      return {
        fase: "erro",
        mensagem: `A etiqueta ${etiqueta} já existe.`,
        detalhe: "Confira a lista abaixo: cada adesivo é único no inventário.",
      };
    }

    console.error("[admin] falha ao cadastrar equipamento:", erro);

    return {
      fase: "erro",
      mensagem: "Não foi possível cadastrar o equipamento.",
      detalhe: "Tente de novo. Se continuar, confira o banco de dados.",
    };
  }
}

/**
 * Devolve a grafia já usada no banco para a categoria digitada, comparando sem
 * acento e sem caixa. Se for categoria nova, devolve com a inicial maiúscula.
 */
async function grafiaDaCategoria(digitado: string): Promise<string> {
  const existentes = await prisma.equipamento.findMany({
    distinct: ["tipo"],
    select: { tipo: true },
  });

  const chave = semAcento(digitado);
  const conhecida = existentes.find((item) => semAcento(item.tipo) === chave);

  if (conhecida) return conhecida.tipo;

  return digitado.charAt(0).toUpperCase() + digitado.slice(1);
}

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Rótulo em português de um status de equipamento, para mensagens de erro. */
function rotuloDeStatus(status: string): string {
  if (status === STATUS_EQUIPAMENTO.disponivel) return "disponível";
  if (status === STATUS_EQUIPAMENTO.emprestado) return "emprestado";
  return "em manutenção";
}
