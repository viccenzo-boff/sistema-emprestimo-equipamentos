import { prisma } from "@/lib/prisma";
import { dataHora, haQuantoTempo } from "@/lib/texto";
import {
  PERFIL,
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  STATUS_PESSOA,
  type CategoriaDoPainel,
  type EmprestimoEmCurso,
  type ItemDaFila,
  type ItemDeInventario,
  type OpcaoDeCategoria,
  type ResumoDePessoas,
  type ResumoDoInventario,
  type PessoaDoPainel,
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

/**
 * A fila que a secretaria trabalha: a pessoa declarou a devolução no tablet e
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
      pessoa: { select: { nome: true, matricula: true, perfil: true } },
      equipamento: { select: { categoria: { select: { nome: true } } } },
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
      tipo: registro.equipamento.categoria.nome,
      nome: registro.pessoa.nome,
      matricula: registro.pessoa.matricula,
      perfil: registro.pessoa.perfil,
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
      pessoa: { select: { nome: true, matricula: true, perfil: true } },
      equipamento: { select: { categoria: { select: { nome: true } } } },
    },
    orderBy: { data_retirada: "asc" },
  });

  return registros.map((registro) => ({
    id: registro.id,
    equip_id: registro.equip_id,
    tipo: registro.equipamento.categoria.nome,
    nome: registro.pessoa.nome,
    matricula: registro.pessoa.matricula,
    perfil: registro.pessoa.perfil,
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
      categoria: { select: { id: true, nome: true } },
      status: true,
      emprestimos: {
        where: {
          status: {
            in: [STATUS_EMPRESTIMO.ativo, STATUS_EMPRESTIMO.aguardandoBaixa],
          },
        },
        select: {
          status: true,
          pessoa: { select: { nome: true, matricula: true } },
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
        // `ordem` é a posição da categoria (o id dela) e existe só para o
        // `sort` abaixo — some no `map` final, antes de a linha virar tela.
        ordem: equipamento.categoria.id,
        id: equipamento.id,
        tipo: equipamento.categoria.nome,
        status: equipamento.status,
        responsavel: aberto
          ? {
              nome: aberto.pessoa.nome,
              matricula: aberto.pessoa.matricula,
              status: aberto.status,
            }
          : null,
      };
    })
    .sort(ordenarInventario)
    // `ordem` sai aqui: serviu ao `sort` e não tem o que fazer na tela.
    .map(({ id, tipo, status, responsavel }) => ({
      id,
      tipo,
      status,
      responsavel,
    }));
}

/**
 * Agrupa por categoria na ordem do tablet e, dentro dela, pela etiqueta.
 *
 * A ordem das categorias é a do `Categoria.id` — a de criação. Antes da Tarefa
 * 6 era uma lista fixa no código, que precisava ser editada à mão a cada
 * categoria nova e ainda assim não sabia onde encaixar as que não conhecia. A
 * migration semeou justamente aquelas três como 1, 2 e 3: a tela não mudou, e a
 * lista de exceções deixou de existir.
 *
 * A etiqueta é comparada com `numeric: true`: sem isso "NOTE-10" vem antes de
 * "NOTE-2", e a lista deixa de bater com a prateleira.
 */
function ordenarInventario(
  a: ItemDeInventario & { ordem: number },
  b: ItemDeInventario & { ordem: number },
): number {
  if (a.ordem !== b.ordem) return a.ordem - b.ordem;

  return a.id.localeCompare(b.id, "pt-BR", { numeric: true });
}

/** Contagem por status, para o resumo do topo da tela de inventário. */
export async function resumirInventario(): Promise<ResumoDoInventario> {
  const grupos = await prisma.equipamento.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const por = new Map(grupos.map((grupo) => [grupo.status, grupo._count._all]));

  // O total é somado dos grupos, e não das quatro contagens nomeadas: um status
  // que não seja nenhum dos quatro sumiria da conta, mas o equipamento continua
  // existindo — e o total tem que dizer isso.
  const total = grupos.reduce((soma, grupo) => soma + grupo._count._all, 0);

  return {
    disponiveis: por.get(STATUS_EQUIPAMENTO.disponivel) ?? 0,
    emprestados: por.get(STATUS_EQUIPAMENTO.emprestado) ?? 0,
    manutencao: por.get(STATUS_EQUIPAMENTO.manutencao) ?? 0,
    inativos: por.get(STATUS_EQUIPAMENTO.inativo) ?? 0,
    total,
  };
}

/**
 * As categorias para a tela `/admin/categorias`, com quantos equipamentos cada
 * uma tem.
 *
 * Ordenadas por `id` — a mesma ordem do inventário e do tablet. Alfabética
 * seria mais bonita e menos útil: quem administra procura a categoria no lugar
 * em que ela aparece nas outras telas.
 */
export async function listarCategoriasDoPainel(): Promise<CategoriaDoPainel[]> {
  const categorias = await prisma.categoria.findMany({
    select: {
      id: true,
      nome: true,
      _count: { select: { equipamentos: true } },
    },
    orderBy: { id: "asc" },
  });

  return categorias.map((categoria) => ({
    id: categoria.id,
    nome: categoria.nome,
    equipamentos: categoria._count.equipamentos,
  }));
}

/**
 * As opções do `<select>` de categoria no cadastro de equipamento.
 *
 * Consulta própria, e não um `map` sobre o inventário já carregado: desde a
 * Tarefa 6 existe categoria sem nenhum equipamento — recém-criada, ou esvaziada
 * — e derivar as opções da lista de itens esconderia justamente a categoria que
 * a pessoa acabou de criar para usar agora.
 */
export async function listarOpcoesDeCategoria(): Promise<OpcaoDeCategoria[]> {
  return prisma.categoria.findMany({
    select: { id: true, nome: true },
    orderBy: { id: "asc" },
  });
}

/* ------------------------------------------------------------------------- *
 * Gestão de Pessoas (Tarefa 8)
 * ------------------------------------------------------------------------- */

/**
 * Todos os cadastros, com o que cada pessoa está devendo agora.
 *
 * O empréstimo aberto (`ATIVO` ou `AGUARDANDO_BAIXA`) vem junto porque é o que
 * a inativação precisa dizer antes de acontecer: a secretaria **pode** inativar
 * quem ainda está com equipamento — é o caso comum, alguém que saiu da
 * faculdade — mas o modal mostra o que a pessoa tem, e não pergunta às cegas.
 *
 * Ordem: ativos primeiro, e dentro de cada grupo por nome. Não é alfabética
 * pura de propósito — quem varre esta lista está procurando gente em
 * circulação, e o cadastro aposentado é ruído até a hora em que não é.
 * `sort` no Node, e não `orderBy` no banco, porque a ordenação por nome
 * precisa de `localeCompare` em pt-BR: o SQLite compara byte a byte e jogaria
 * "Ávila" depois de "Zamboni".
 */
export async function listarPessoasDoPainel(): Promise<PessoaDoPainel[]> {
  const pessoas = await prisma.pessoa.findMany({
    select: {
      matricula: true,
      nome: true,
      perfil: true,
      cursos: true,
      status: true,
      emprestimos: {
        where: {
          status: {
            in: [STATUS_EMPRESTIMO.ativo, STATUS_EMPRESTIMO.aguardandoBaixa],
          },
        },
        select: { equip_id: true },
        orderBy: { data_retirada: "asc" },
      },
    },
  });

  return pessoas
    .map((pessoa) => ({
      matricula: pessoa.matricula,
      nome: pessoa.nome,
      perfil: pessoa.perfil,
      cursos: pessoa.cursos,
      status: pessoa.status,
      emprestimosAbertos: pessoa.emprestimos.length,
      equipamentosEmMaos: pessoa.emprestimos.map((emprestimo) => emprestimo.equip_id),
    }))
    .sort((a, b) => {
      const aAtivo = a.status === STATUS_PESSOA.ativo;
      const bAtivo = b.status === STATUS_PESSOA.ativo;
      if (aAtivo !== bAtivo) return aAtivo ? -1 : 1;

      return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
    });
}

/**
 * As contagens do topo da tela de pessoas.
 *
 * Uma consulta agrupada por status e outra por perfil, em vez de carregar a
 * tabela inteira para contar no Node: a planilha da coordenação traz o curso
 * inteiro, e a lista cresce por semestre enquanto o resumo continua sendo
 * cinco números.
 */
export async function resumirPessoas(): Promise<ResumoDePessoas> {
  const [porStatus, porPerfil] = await Promise.all([
    prisma.pessoa.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.pessoa.groupBy({ by: ["perfil"], _count: { _all: true } }),
  ]);

  const status = new Map(porStatus.map((grupo) => [grupo.status, grupo._count._all]));
  const perfil = new Map(porPerfil.map((grupo) => [grupo.perfil, grupo._count._all]));

  // O total sai da soma dos grupos, e não das contagens nomeadas: um status
  // fora dos dois conhecidos sumiria da conta, e a pessoa continua cadastrada.
  const total = porStatus.reduce((soma, grupo) => soma + grupo._count._all, 0);

  return {
    ativos: status.get(STATUS_PESSOA.ativo) ?? 0,
    inativos: status.get(STATUS_PESSOA.inativo) ?? 0,
    alunos: perfil.get(PERFIL.aluno) ?? 0,
    professores: perfil.get(PERFIL.professor) ?? 0,
    total,
  };
}
