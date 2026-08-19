import { prisma } from "@/lib/prisma";
import { dataHora, haQuantoTempo } from "@/lib/texto";
import {
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  type EmprestimoEmCurso,
  type ItemDaFila,
  type ItemDeInventario,
} from "@/lib/tipos";

/**
 * Leituras do Painel Administrativo (Fluxo 3 da spec).
 *
 * Ficam separadas das Server Actions de propósito: o /admin lê o banco no
 * render das páginas — não por chamada de ação, como o tablet. São Server
 * Components consultando o banco direto, e é por isso que estas funções não
 * são actions: elas nunca precisam existir como endpoint POST.
 *
 * Quem chama é responsável por conferir a sessão antes (ver
 * [sessao-admin](src/lib/sessao-admin.ts)). Estas funções não fazem a
 * verificação porque não têm como responder por ela — não redirecionam nem
 * renderizam nada.
 */

/** Ordem em que as categorias aparecem no inventário. Igual à do tablet. */
const ORDEM_DAS_CATEGORIAS = ["Notebook", "Tablet", "Extensão"];

/**
 * A fila que a secretaria trabalha: o usuário declarou a devolução no tablet e
 * o equipamento (em tese) está na bancada esperando conferência.
 *
 * Mais antigo primeiro: o que está esperando há mais tempo é o que corre risco
 * de sumir da bancada.
 */
export async function listarFilaDeDevolucoes(): Promise<ItemDaFila[]> {
  const registros = await prisma.emprestimo.findMany({
    where: { status: STATUS_EMPRESTIMO.aguardandoBaixa },
    select: {
      id: true,
      equip_id: true,
      data_retirada: true,
      data_devolucao: true,
      usuario: { select: { nome: true, matricula: true, perfil: true } },
      equipamento: { select: { tipo: true } },
    },
    orderBy: [{ data_devolucao: "asc" }, { id: "asc" }],
  });

  return registros.map((registro) => {
    // `data_devolucao` é preenchida junto com AGUARDANDO_BAIXA, mas o schema
    // permite nulo — se faltar, a retirada é a única âncora de tempo que sobra.
    const declarada = registro.data_devolucao ?? registro.data_retirada;

    return {
      id: registro.id,
      equip_id: registro.equip_id,
      tipo: registro.equipamento.tipo,
      nome: registro.usuario.nome,
      matricula: registro.usuario.matricula,
      perfil: registro.usuario.perfil,
      retiradoEm: dataHora(registro.data_retirada),
      declaradoEm: dataHora(declarada),
      esperandoHa: haQuantoTempo(declarada),
    };
  });
}

/** Só o número, para o aviso no menu. Contar é mais barato que listar. */
export async function contarFilaDeDevolucoes(): Promise<number> {
  return prisma.emprestimo.count({
    where: { status: STATUS_EMPRESTIMO.aguardandoBaixa },
  });
}

/**
 * Quem está com o quê agora (spec, seção 4, Fluxo 3, item 3).
 *
 * Somente `ATIVO`: o que já foi declarado como devolvido pertence à fila, não a
 * esta tela. Mais antigo primeiro — a lista é lida de cima para baixo quando
 * alguém pergunta "quem está com o notebook há mais tempo?".
 */
export async function listarEmprestimosEmCurso(): Promise<EmprestimoEmCurso[]> {
  const registros = await prisma.emprestimo.findMany({
    where: { status: STATUS_EMPRESTIMO.ativo },
    select: {
      id: true,
      equip_id: true,
      data_retirada: true,
      usuario: { select: { nome: true, matricula: true, perfil: true } },
      equipamento: { select: { tipo: true } },
    },
    orderBy: { data_retirada: "asc" },
  });

  return registros.map((registro) => ({
    id: registro.id,
    equip_id: registro.equip_id,
    tipo: registro.equipamento.tipo,
    nome: registro.usuario.nome,
    matricula: registro.usuario.matricula,
    perfil: registro.usuario.perfil,
    retiradoEm: dataHora(registro.data_retirada),
    ha: haQuantoTempo(registro.data_retirada),
  }));
}

/**
 * O inventário inteiro, com quem está de posse de cada item emprestado.
 *
 * O empréstimo aberto vem junto (`ATIVO` ou `AGUARDANDO_BAIXA`) porque é ele
 * que explica na tela por que a troca de status está travada. Sem o nome, o
 * botão desabilitado seria só um botão desabilitado.
 */
export async function listarInventario(): Promise<ItemDeInventario[]> {
  const equipamentos = await prisma.equipamento.findMany({
    select: {
      id: true,
      tipo: true,
      status: true,
      emprestimos: {
        where: {
          status: {
            in: [STATUS_EMPRESTIMO.ativo, STATUS_EMPRESTIMO.aguardandoBaixa],
          },
        },
        select: {
          status: true,
          usuario: { select: { nome: true, matricula: true } },
        },
        orderBy: { data_retirada: "desc" },
        take: 1,
      },
    },
    orderBy: { id: "asc" },
  });

  return equipamentos
    .map((equipamento) => {
      const aberto = equipamento.emprestimos[0];

      return {
        id: equipamento.id,
        tipo: equipamento.tipo,
        status: equipamento.status,
        responsavel: aberto
          ? {
              nome: aberto.usuario.nome,
              matricula: aberto.usuario.matricula,
              status: aberto.status,
            }
          : null,
      };
    })
    .sort(ordenarInventario);
}

/**
 * Agrupa por categoria na ordem do tablet e, dentro dela, pela etiqueta.
 *
 * A etiqueta é comparada com `numeric: true`: sem isso "NOTE-10" vem antes de
 * "NOTE-2", e a lista deixa de bater com a prateleira.
 */
function ordenarInventario(a: ItemDeInventario, b: ItemDeInventario): number {
  const posA = ORDEM_DAS_CATEGORIAS.indexOf(a.tipo);
  const posB = ORDEM_DAS_CATEGORIAS.indexOf(b.tipo);

  if (posA !== posB) {
    if (posA !== -1 && posB !== -1) return posA - posB;
    if (posA !== -1) return -1;
    if (posB !== -1) return 1;
  }

  const porTipo = a.tipo.localeCompare(b.tipo, "pt-BR");
  if (porTipo !== 0) return porTipo;

  return a.id.localeCompare(b.id, "pt-BR", { numeric: true });
}

/** Contagem por status, para o resumo do topo da tela de inventário. */
export async function resumirInventario(): Promise<{
  disponiveis: number;
  emprestados: number;
  manutencao: number;
  total: number;
}> {
  const grupos = await prisma.equipamento.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const por = new Map(grupos.map((grupo) => [grupo.status, grupo._count._all]));

  const disponiveis = por.get(STATUS_EQUIPAMENTO.disponivel) ?? 0;
  const emprestados = por.get(STATUS_EQUIPAMENTO.emprestado) ?? 0;
  const manutencao = por.get(STATUS_EQUIPAMENTO.manutencao) ?? 0;

  return {
    disponiveis,
    emprestados,
    manutencao,
    total: disponiveis + emprestados + manutencao,
  };
}
