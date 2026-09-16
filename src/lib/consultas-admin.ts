import { gerarQrDoFormulario, lerUrlDoFormulario } from "@/lib/formulario-feedback";
import { prisma } from "@/lib/prisma";
import { dataHora, diaLocal, haQuantoTempo, inicioDoDia } from "@/lib/texto";
import {
  NOTAS_DE_AVALIACAO,
  PERFIL,
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  STATUS_PESSOA,
  type CategoriaDoPainel,
  type EmprestimoEmCurso,
  type ItemDaFila,
  type ItemDeInventario,
  type NivelDeEstoque,
  type OcupacaoDeCategoria,
  type OpcaoDeCategoria,
  type RecorteDeSatisfacao,
  type RelatorioDeOcupacao,
  type RelatorioDeSatisfacao,
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
    estudantes: perfil.get(PERFIL.estudante) ?? 0,
    professores: perfil.get(PERFIL.professor) ?? 0,
    total,
  };
}

/* ------------------------------------------------------------------------- *
 * Relatórios (Tarefa 13)
 * ------------------------------------------------------------------------- */

const MES_POR_EXTENSO = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

/**
 * Acima deste número de unidades livres a categoria não pede nada de ninguém.
 * Com 1 ou 2 ela é "Estoque Crítico"; com 0, "Estoque Esgotado".
 *
 * O número é do enunciado da Tarefa 13 ("apenas 1 ou 2 disponíveis"), e está
 * aqui como constante porque é ele que a página da wiki cita: mudá-lo sem
 * mudar a página faz o manual descrever um amarelo que a tela não acende.
 */
const LIMITE_DE_ESTOQUE_CRITICO = 2;

/**
 * O relatório de Ocupação e picos de uso (Tarefa 13, item 2).
 *
 * **Não é uma Server Action, de propósito.** O enunciado pede
 * "`/admin/relatorios/actions.ts` ou similar", mas o painel lê o banco no
 * render das páginas, e não por chamada de ação — é a regra registrada no
 * cabeçalho deste arquivo. Uma action aqui seria um endpoint POST público
 * criado para uma leitura que nunca precisa de um.
 *
 * Quatro consultas em paralelo, e nenhuma delas carrega tabela para contar no
 * Node: o inventário cresce por semestre e o relatório continua sendo uma
 * dúzia de números.
 */
export async function montarRelatorioDeOcupacao(): Promise<RelatorioDeOcupacao> {
  const agora = new Date();
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const [emprestimosNoMes, abertos, categorias, porCategoria] = await Promise.all([
    /*
      A comparação é feita pelo Prisma com um `Date`, e isso foi conferido
      nesta máquina contra o banco real, na fronteira exata do mês: o
      empréstimo do primeiro instante entra e o do último instante do mês
      anterior fica de fora.

      Não troque por SQL cru sem refazer a prova. O SQLite guarda `DateTime`
      como TEXTO ISO-8601 com o sufixo `+00:00`, e as duas formas óbvias de
      escrever isto à mão devolvem um número plausível e errado: comparar com
      o epoch conta a tabela inteira (pela regra de afinidade de tipos,
      INTEGER é sempre menor que TEXT), e comparar com `toISOString()` perde
      justamente a linha da fronteira (o `+` vem antes do `Z` na ordem de
      caracteres). Medido nas duas direções.
    */
    prisma.emprestimo.count({ where: { data_retirada: { gte: inicioDoMes } } }),

    /*
      "Equipamentos na rua" contado pelos EMPRÉSTIMOS, e não pelo status do
      equipamento. O enunciado pede "`EMPRESTADO` ou `AGUARDANDO_BAIXA`", e o
      segundo não é status de `Equipamento`: enquanto a devolução espera
      conferência, o aparelho continua `EMPRESTADO`. Ao pé da letra, o segundo
      termo não casaria nada e o cartão responderia calado uma pergunta
      diferente da que anuncia.

      O efeito colateral é o que a tarefa queria: o número se abre em "com as
      pessoas" e "na bancada", que é a distinção que a Tarefa 12 existe para
      tornar visível. E cobre o caso raro em que o equipamento saiu de
      `EMPRESTADO` sem o empréstimo fechar (o ramo `liberado: false` do
      `darBaixa`): o aparelho continua fora da prateleira, e continua contado.
    */
    prisma.emprestimo.groupBy({
      by: ["status"],
      where: {
        status: {
          in: [STATUS_EMPRESTIMO.ativo, STATUS_EMPRESTIMO.aguardandoBaixa],
        },
      },
      _count: { _all: true },
    }),

    prisma.categoria.findMany({
      select: { id: true, nome: true },
      orderBy: { id: "asc" },
    }),

    prisma.equipamento.groupBy({
      by: ["categoria_id", "status"],
      _count: { _all: true },
    }),
  ]);

  const abertoPor = new Map(abertos.map((grupo) => [grupo.status, grupo._count._all]));
  const comPessoas = abertoPor.get(STATUS_EMPRESTIMO.ativo) ?? 0;
  const naBancada = abertoPor.get(STATUS_EMPRESTIMO.aguardandoBaixa) ?? 0;

  /*
    A lista de categorias vem da tabela `Categoria`, e não dos grupos do
    inventário. Conferido: o `groupBy` **não** devolve linha nenhuma para uma
    categoria sem equipamento — derivar dali a faria sumir da tela sem erro
    algum, que é justamente o caso que o nível `vazio` existe para mostrar.
  */
  const contagem = new Map<number, Map<string, number>>();
  for (const grupo of porCategoria) {
    const porStatus = contagem.get(grupo.categoria_id) ?? new Map<string, number>();
    porStatus.set(grupo.status, grupo._count._all);
    contagem.set(grupo.categoria_id, porStatus);
  }

  return {
    emprestimosNoMes,
    mes: MES_POR_EXTENSO.format(agora),
    naRua: { total: comPessoas + naBancada, comPessoas, naBancada },
    categorias: categorias.map((categoria) =>
      medirOcupacao(categoria, contagem.get(categoria.id)),
    ),
  };
}

/**
 * Transforma as contagens por status de uma categoria na linha que a tela
 * desenha.
 *
 * Duas decisões moram aqui, e as duas existem para a barra e o alerta ao lado
 * dela nunca se contradizerem:
 *
 * 1. **Ocupado é tudo que não está disponível** — emprestado ou em manutenção.
 *    É o que faz `ocupacao === 100` querer dizer exatamente "nenhum item com
 *    status `DISPONIVEL`", que é como o enunciado define o vermelho.
 * 2. **O arredondamento nunca fecha nem zera o que não está fechado nem
 *    zerado.** Com uma unidade livre em 500, o arredondamento normal daria
 *    100% e a barra diria "cheia" ao lado de um alerta amarelo; com uma
 *    unidade ocupada em 500, daria 0% e a barra diria "vazia" com um aparelho
 *    fora. Os dois extremos ficam reservados para os casos exatos.
 */
function medirOcupacao(
  categoria: { id: number; nome: string },
  porStatus: Map<string, number> | undefined,
): OcupacaoDeCategoria {
  const de = (status: string) => porStatus?.get(status) ?? 0;

  const disponiveis = de(STATUS_EQUIPAMENTO.disponivel);
  const emprestados = de(STATUS_EQUIPAMENTO.emprestado);
  const manutencao = de(STATUS_EQUIPAMENTO.manutencao);
  const aposentados = de(STATUS_EQUIPAMENTO.inativo);

  /*
    O estoque em circulação é a soma dos grupos menos os aposentados, e não a
    soma dos três status nomeados: um status que não seja nenhum dos quatro
    sumiria da conta, e o equipamento continua existindo na prateleira. Mesma
    regra do total do `resumirInventario`.
  */
  const total = [...(porStatus?.values() ?? [])].reduce((soma, n) => soma + n, 0);
  const emCirculacao = total - aposentados;
  const ocupados = emCirculacao - disponiveis;

  return {
    id: categoria.id,
    nome: categoria.nome,
    emCirculacao,
    disponiveis,
    emprestados,
    manutencao,
    aposentados,
    ocupados,
    ocupacao: percentualDeOcupacao(ocupados, emCirculacao),
    nivel: nivelDeEstoque(emCirculacao, disponiveis),
  };
}

function percentualDeOcupacao(ocupados: number, emCirculacao: number): number {
  if (emCirculacao <= 0) return 0;

  const bruto = (ocupados / emCirculacao) * 100;
  const arredondado = Math.round(bruto);

  // 100 só quando não sobrou nada; 0 só quando não saiu nada.
  if (arredondado >= 100 && ocupados < emCirculacao) return 99;
  if (arredondado <= 0 && ocupados > 0) return 1;

  return arredondado;
}

function nivelDeEstoque(emCirculacao: number, disponiveis: number): NivelDeEstoque {
  // Antes de tudo: sem unidade em circulação não há estoque para esgotar. Uma
  // categoria recém-criada, ou com todos os aparelhos aposentados, tem zero
  // disponíveis sem estar esgotada — e o vermelho permanente diria a uma
  // secretaria que ela precisa comprar o que ninguém nunca pediu.
  if (emCirculacao <= 0) return "vazio";
  if (disponiveis <= 0) return "esgotado";
  if (disponiveis <= LIMITE_DE_ESTOQUE_CRITICO) return "critico";

  return "normal";
}

/* ------------------------------------------------------------------------- *
 * Satisfação (Tarefa 14)
 * ------------------------------------------------------------------------- */

/**
 * O recorte curto do relatório de satisfação: hoje mais os 29 dias anteriores.
 *
 * Vale o mesmo número de `INTERVALO_ENTRE_AVALIACOES_DIAS`, e **é
 * coincidência**, não a mesma regra: aquele diz de quanto em quanto tempo a
 * mesma pessoa é perguntada; este diz que janela a coordenação lê. Mudar um
 * não pede mudar o outro, e por isso são duas constantes.
 */
const JANELA_DO_RELATORIO_DIAS = 30;

const MEDIA_COM_UMA_CASA = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * O relatório de Satisfação (Tarefa 14, item 5).
 *
 * Dois `groupBy` por nota — um com o filtro de dia, outro sem —, e nenhum
 * deles carrega linha para contar no Node: o que vem são no máximo cinco
 * grupos por recorte (as quatro notas e a nula). As linhas do CSV vêm numa
 * terceira consulta, e vêm **ordenadas por dia e nota, nunca por id**: a
 * ordem de gravação é a única coisa que poderia parear pessoa e nota, e ela
 * não sai do banco.
 *
 * O filtro `dia >= "AAAA-MM-DD"` compara texto, e é por isso que o campo tem
 * esse formato: a ordem lexicográfica de AAAA-MM-DD é a cronológica. O limite
 * sai do mesmo `inicioDoDia` que a action do tablet usa, para os dois lados
 * nunca discordarem numa virada de meia-noite.
 */
export async function montarRelatorioDeSatisfacao(): Promise<RelatorioDeSatisfacao> {
  const hoje = inicioDoDia(new Date());
  const desde = diaLocal(inicioDoDia(hoje, JANELA_DO_RELATORIO_DIAS - 1));

  const [recentes, todas, linhas, url] = await Promise.all([
    prisma.avaliacao.groupBy({
      by: ["nota"],
      where: { dia: { gte: desde } },
      _count: { _all: true },
    }),
    prisma.avaliacao.groupBy({ by: ["nota"], _count: { _all: true } }),
    prisma.avaliacao.findMany({
      select: { dia: true, nota: true },
      orderBy: [{ dia: "asc" }, { nota: "asc" }],
    }),
    lerUrlDoFormulario(),
  ]);

  return {
    ultimos30Dias: resumirSatisfacao("Últimos 30 dias", recentes),
    desdeOInicio: resumirSatisfacao("Desde o início", todas),
    linhas,
    formulario: url ? { url, qr: await gerarQrDoFormulario(url) } : null,
  };
}

/**
 * Transforma os grupos por nota nos números do cartão.
 *
 * A média é calculada só sobre as respondidas (a nota nula é "não respondeu",
 * não é zero) e já sai formatada em pt-BR com uma casa — "3,4" —, pela mesma
 * regra de datas do painel: o texto pronto desce para a tela, e nada é
 * refeito na hidratação. `fatia` é a parte de cada nota entre as respondidas,
 * e é o que a barra desenha; `quantas` é o que o rótulo escreve.
 */
function resumirSatisfacao(
  rotulo: string,
  grupos: { nota: number | null; _count: { _all: number } }[],
): RecorteDeSatisfacao {
  const porNota = new Map(grupos.map((grupo) => [grupo.nota, grupo._count._all]));

  const pedidas = grupos.reduce((soma, grupo) => soma + grupo._count._all, 0);
  const respondidas = pedidas - (porNota.get(null) ?? 0);

  let somaDasNotas = 0;
  const distribuicao = [...NOTAS_DE_AVALIACAO].map(([nota, rotuloDaNota]) => {
    const quantas = porNota.get(nota) ?? 0;
    somaDasNotas += nota * quantas;

    return {
      nota,
      rotulo: rotuloDaNota,
      quantas,
      fatia: respondidas === 0 ? 0 : Math.round((quantas / respondidas) * 100),
    };
  });

  return {
    rotulo,
    pedidas,
    respondidas,
    taxaDeResposta: pedidas === 0 ? 0 : Math.round((respondidas / pedidas) * 100),
    media: respondidas === 0 ? null : MEDIA_COM_UMA_CASA.format(somaDasNotas / respondidas),
    distribuicao,
  };
}
