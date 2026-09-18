import "dotenv/config";

import { existsSync } from "node:fs";
import { join } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";
import { normalizarCursos, normalizarNome } from "../src/lib/sanitizacao";
import { diaLocal, inicioDoDia } from "../src/lib/texto";
import {
  CHAVE_URL_FORMULARIO,
  PERFIL,
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  STATUS_PESSOA,
} from "../src/lib/tipos";

/**
 * Estado de demonstração para as capturas de tela da wiki — Tarefa D01.
 *
 * `npm run db:demo`
 *
 * ## Por que isto não é o seed
 *
 * O `prisma/seed.ts` é ferramenta de produção do secretário: ele deixa o banco
 * **utilizável**, e por isso nunca cria um `Emprestimo` — todo equipamento
 * nasce `DISPONIVEL`. A consequência para a wiki é que metade das telas não tem
 * como ser fotografada: a Fila de Devoluções nasce vazia, "Meus equipamentos"
 * nasce vazio, e não existe item em manutenção nem aposentado para mostrar.
 *
 * Este script acrescenta **por cima** do seed o que falta para fotografar. Ele
 * é separado de propósito: a §1 da especificacoes/spec-wiki.md diz que decisão que serve só ao
 * portfólio e piora o produto não entra, e enfiar empréstimos fictícios no seed
 * pioraria o produto.
 *
 * ## Como usar
 *
 * A receita completa está no CONTRIBUTING.md, seção "Documentação". Em resumo:
 * `db:reset` (que **não** semeia sozinho neste Prisma 7 — conferido), `db:seed`,
 * e então `db:demo`.
 *
 * ## Sobre a idempotência
 *
 * Rodar duas vezes não duplica nada, e ao contrário do seed este script
 * **restaura** o que encontrar mexido. A inversão é deliberada: o seed preserva
 * a edição do secretário porque os dados são dele; aqui os dados são cenário de
 * captura, e o valor está em voltar ao mesmo enquadramento depois de você ter
 * clicado nos botões testando a tela.
 *
 * Os três marcadores temporais são recalculados a partir do instante da
 * execução, e por isso "o mesmo estado" quer dizer a mesma estrutura — as mesmas
 * pessoas, os mesmos vínculos, os mesmos status —, não os mesmos milissegundos.
 * É o comportamento que a wiki precisa: a fila tem que dizer "há 3 h" na captura
 * tirada hoje e na tirada em novembro, e não "há 87 dias".
 */

/* ------------------------------------------------------------------------- *
 * A trava contra rodar isto em cima de dado real
 * ------------------------------------------------------------------------- */

/**
 * A planilha real da coordenação, nos dois nomes que o seed aceita.
 *
 * `usuarios.csv` é o nome legado, e está aqui porque o seed **ainda o aceita**
 * (ver `caminhoDoCsv` em [seed.ts](seed.ts)): uma máquina que nunca renomeou o
 * arquivo tem dado real e nenhum `pessoas.csv`.
 */
const PLANILHAS_REAIS = ["pessoas.csv", "usuarios.csv"];

/**
 * Quantos cadastros desconhecidos o banco pode ter e ainda ser considerado um
 * banco de desenvolvimento.
 *
 * Quatro é o tamanho do `PESSOAS_EXEMPLO` do seed. É um **número**, e não uma
 * cópia das quatro matrículas: cópia de dado diverge em silêncio, número não
 * tem como divergir em valor. Se o conjunto de exemplo crescer, este script
 * recusa e diz o que fazer — falha barulhenta, que é o que se quer aqui.
 *
 * A trava de arquivo acima cobre a porta antiga (o CSV no disco). Esta cobre a
 * porta que virou principal na Tarefa 8: a importação de .xlsx pelo
 * `/admin/pessoas`, que não deixa arquivo nenhum para trás. Sem ela, uma
 * máquina cujos cadastros vieram por ali passaria na trava de arquivo e
 * receberia gente fictícia e empréstimos falsos por cima da produção.
 */
const MAXIMO_DE_PESSOAS_NAO_RECONHECIDAS = 4;

/* ------------------------------------------------------------------------- *
 * O elenco
 * ------------------------------------------------------------------------- */

type PessoaDemo = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
  status: string;
};

/**
 * Pessoas fictícias, escolhidas para a tela de Gestão de Pessoas ter o que
 * demonstrar: busca com resultado, filtro de perfil com os dois lados, filtro
 * de situação com inativos de verdade.
 *
 * Nomes inventados. Nenhum nome de pessoa real, nem de colega — é o motivo de
 * este arquivo existir (especificacoes/spec-wiki.md §2: matrícula e nome de estudante real em
 * captura pública é LGPD).
 *
 * Três casos estão aqui de propósito, e não por variedade:
 *
 * - **"João Pedro de Almeida"** exercita a partícula minúscula do
 *   `normalizarNome` (Tarefa 8.1) numa captura real, em vez de só no teste.
 * - **"Direito" e "Administração"** são cursos fora do `CURSOS_OFICIAIS`, e
 *   aparecem no fim da string, em ordem alfabética — a regra "curso fora do mapa
 *   é mantido, não descartado" fica visível na tela.
 * - **Duas pessoas `INATIVO` com empréstimo em aberto** (Larissa e Gabriela) são
 *   o cenário que a página do Processo 5 precisa fotografar: a inativação trava
 *   a retirada e libera a devolução.
 */
const PESSOAS: PessoaDemo[] = [
  {
    matricula: "0045678",
    nome: "Beatriz Nogueira",
    perfil: PERFIL.estudante,
    cursos: "Sistemas de Informação",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "0056789",
    nome: "Diego Fontana",
    perfil: PERFIL.estudante,
    cursos: "Ciência da Computação",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "0067890",
    nome: "Eduarda Prado",
    perfil: PERFIL.estudante,
    cursos: "Engenharia da Computação",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "0078901",
    nome: "Felipe Andrade",
    perfil: PERFIL.estudante,
    cursos: "Sistemas de Informação, Direito",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "0089012",
    nome: "Gabriela Torres",
    perfil: PERFIL.estudante,
    cursos: "Ciência da Computação",
    status: STATUS_PESSOA.inativo,
  },
  {
    matricula: "0090123",
    nome: "Henrique Vasques",
    perfil: PERFIL.estudante,
    cursos: "Sistemas de Informação",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "0101234",
    nome: "Isabela Moraes",
    perfil: PERFIL.estudante,
    cursos: "Administração",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "0112345",
    nome: "João Pedro de Almeida",
    perfil: PERFIL.estudante,
    cursos: "Engenharia da Computação, Sistemas de Informação",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "0123456",
    nome: "Larissa Coutinho",
    perfil: PERFIL.estudante,
    cursos: "Ciência da Computação",
    status: STATUS_PESSOA.inativo,
  },
  {
    matricula: "9002",
    nome: "Prof. Marina Bastos",
    perfil: PERFIL.professor,
    cursos: "Sistemas de Informação",
    status: STATUS_PESSOA.ativo,
  },
  {
    matricula: "9003",
    nome: "Prof. Otávio Lemes",
    perfil: PERFIL.professor,
    cursos: "Engenharia da Computação, Ciência da Computação",
    status: STATUS_PESSOA.ativo,
  },
];

/**
 * Faixa de ids reservada aos empréstimos de demonstração.
 *
 * O `Emprestimo` não tem chave natural — duas retiradas do mesmo item pela
 * mesma pessoa são dois registros legítimos —, então a idempotência precisa de
 * um id estável para o `upsert` endereçar. Id explícito em PK autoincrement foi
 * conferido nesta máquina antes de virar desenho, junto com o efeito colateral:
 * a sequência do SQLite passa a contar a partir daqui, e o próximo empréstimo
 * criado pela tela nasce depois do último id do cenário (os dez fixos mais o
 * histórico da Tarefa 16 — o console diz a faixa). Em banco de captura isso
 * não aparece em lugar nenhum — nenhuma tela exibe o id do empréstimo.
 *
 * A faixa é alta de propósito: não colide com o que a tela criar enquanto
 * alguém testa antes de fotografar.
 */
const PRIMEIRO_ID = 9001;

const HORA = 60 * 60 * 1000;

type EmprestimoDemo = {
  pessoa: string;
  equipamento: string;
  status: string;
  /** Horas atrás em que o item saiu (Fluxo 1). */
  retiradaHa: number;
  /** Horas atrás em que a pessoa declarou a devolução no tablet (Fluxo 2). */
  devolucaoHa?: number;
  /** Horas atrás em que o secretário conferiu fisicamente (Fluxo 3). */
  baixaHa?: number;
};

/**
 * Os empréstimos do cenário, cobrindo os três status de `Emprestimo`.
 *
 * A ordem dos `AGUARDANDO_BAIXA` importa para a captura: a Fila de Devoluções
 * ordena por `data_devolucao` crescente (mais antigo primeiro), então os quatro
 * aparecem espalhados em "há 5 h", "há 3 h", "há 2 h" e "há 1 h" — uma fila que
 * parece uma fila, e não quatro linhas com o mesmo carimbo.
 *
 * Ana Souza leva **dois** itens em `ATIVO` porque tanto o "Devolver tudo" do
 * tablet quanto o "Confirmar Todas as Devoluções" do painel só aparecem a partir
 * de dois (Tarefa 5) — com um item só, as duas telas não teriam o botão que a
 * wiki precisa fotografar. Pelo mesmo motivo a fila tem quatro linhas, e não uma.
 *
 * Nos três `CONCLUIDO` a `data_baixa` fica deliberadamente longe da
 * `data_devolucao` — 6 h, 20 h e 48 h de prateleira. Se as duas coincidissem, o
 * tempo de prateleira daria zero e a página do Processo 3 não teria como
 * mostrar a métrica que a Tarefa 12 criou.
 */
const EMPRESTIMOS: EmprestimoDemo[] = [
  // ATIVO — o que está na mão das pessoas agora.
  { pessoa: "0012345", equipamento: "NOTE-01", status: STATUS_EMPRESTIMO.ativo, retiradaHa: 3 },
  { pessoa: "0012345", equipamento: "TAB-01", status: STATUS_EMPRESTIMO.ativo, retiradaHa: 3 },
  { pessoa: "0045678", equipamento: "NOTE-02", status: STATUS_EMPRESTIMO.ativo, retiradaHa: 26 },

  // AGUARDANDO_BAIXA — declarado no tablet, esperando a conferência física.
  {
    pessoa: "0056789",
    equipamento: "NOTE-03",
    status: STATUS_EMPRESTIMO.aguardandoBaixa,
    retiradaHa: 50,
    devolucaoHa: 5,
  },
  {
    pessoa: "0067890",
    equipamento: "TAB-02",
    status: STATUS_EMPRESTIMO.aguardandoBaixa,
    retiradaHa: 30,
    devolucaoHa: 3,
  },
  {
    pessoa: "0123456",
    equipamento: "EXT-01",
    status: STATUS_EMPRESTIMO.aguardandoBaixa,
    retiradaHa: 100,
    devolucaoHa: 2,
  },
  {
    pessoa: "9002",
    equipamento: "NOTE-04",
    status: STATUS_EMPRESTIMO.aguardandoBaixa,
    retiradaHa: 8,
    devolucaoHa: 1,
  },

  // CONCLUIDO — ciclo fechado, com tempo de prateleira mensurável.
  {
    pessoa: "0089012",
    equipamento: "NOTE-05",
    status: STATUS_EMPRESTIMO.concluido,
    retiradaHa: 170,
    devolucaoHa: 120,
    baixaHa: 114,
  },
  {
    pessoa: "0090123",
    equipamento: "TAB-03",
    status: STATUS_EMPRESTIMO.concluido,
    retiradaHa: 200,
    devolucaoHa: 150,
    baixaHa: 130,
  },
  {
    pessoa: "9001",
    equipamento: "EXT-02",
    status: STATUS_EMPRESTIMO.concluido,
    retiradaHa: 300,
    devolucaoHa: 260,
    baixaHa: 212,
  },
];

/** Itens fora de circulação, para o inventário ter os quatro status na tela. */
const EM_MANUTENCAO = ["NOTE-09", "EXT-05"];
const APOSENTADOS = ["NOTE-10", "TAB-05"];

/* ------------------------------------------------------------------------- *
 * O histórico de retiradas (Tarefa 16)
 * ------------------------------------------------------------------------- */

/** Quantos dias de calendário para trás o histórico cobre. */
const DIAS_DE_HISTORICO = 90;

/**
 * Quem concentra as retiradas — três estudantes e uma professora. O ranking
 * por pessoa precisa de um topo que se leia: com onze pessoas tirando uma
 * vez cada, a tabela seria uma lista de uns.
 */
const ASSIDUOS = ["0045678", "0056789", "0112345", "9002"];
const EVENTUAIS = ["0067890", "0078901", "0090123", "0101234", "9003", "0012345"];

/**
 * O que sai: notebooks muito mais que o resto, para a pizza ter uma fatia
 * grande e duas pequenas. O `NOTE-10` está aqui **de propósito**: ele é
 * aposentado hoje, e a regra da Tarefa 16 (aposentado entra no ranking se
 * tiver retirada no período) precisa de uma linha para aparecer na captura.
 */
const EQUIPAMENTOS_DO_HISTORICO = [
  "NOTE-01", "NOTE-02", "NOTE-03", "NOTE-04", "NOTE-05", "NOTE-06", "NOTE-07", "NOTE-08", "NOTE-10",
  "TAB-01", "TAB-02", "TAB-03",
  "EXT-01", "EXT-02", "EXT-03",
];

type EmprestimoDoHistorico = {
  pessoa: string;
  equipamento: string;
  retirada: Date;
  devolucao: Date;
  baixa: Date;
};

/**
 * Uns quarenta empréstimos concluídos nos últimos 90 dias, só em dias úteis,
 * com durações e prateleiras variadas — sem isso a captura do gráfico
 * "Retiradas por dia" seria uma barra só, e as medianas do Ranking de Consumo
 * não teriam amostra.
 *
 * Sorteio **determinístico** (mulberry32, semente fixa), como o das
 * avaliações: rodar duas vezes produz a mesma estrutura, e só as datas andam
 * com o calendário — a aba tem que mostrar "setembro" com dados dentro dele
 * na captura tirada hoje e na tirada em novembro.
 *
 * A forma do que sai: por dia útil, zero a dois empréstimos (média ~0,6, o
 * que dá ~40 em 65 dias úteis); 70% das retiradas com os quatro assíduos; uso
 * de 1 a 8 horas na maioria, um em cada seis atravessando a noite ou o fim
 * de semana (é o que a mediana existe para não deixar distorcer); prateleira
 * de 10 minutos a 2 dias.
 */
function historicoDoCenario(hoje: Date): EmprestimoDoHistorico[] {
  let estado = 0x16c0d1;
  const sortear = () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entre = (a: number, b: number) => a + sortear() * (b - a);
  const escolher = <T,>(lista: readonly T[]) => lista[Math.floor(sortear() * lista.length)];

  const historico: EmprestimoDoHistorico[] = [];

  // Do mais antigo para o mais recente, e nunca hoje: hoje pertence aos dez
  // empréstimos fixos acima, que a fila e "Meus equipamentos" precisam.
  for (let atras = DIAS_DE_HISTORICO; atras >= 1; atras--) {
    const dia = inicioDoDia(hoje, atras);
    const diaDaSemana = dia.getDay();
    if (diaDaSemana === 0 || diaDaSemana === 6) continue;

    const s = sortear();
    const quantos = s < 0.45 ? 0 : s < 0.85 ? 1 : 2;

    for (let i = 0; i < quantos; i++) {
      const retirada = new Date(dia.getTime() + entre(8, 17) * HORA);
      const atravessaANoite = sortear() < 1 / 6;
      const uso = atravessaANoite ? entre(18, 70) * HORA : entre(1, 8) * HORA;
      const devolucao = new Date(retirada.getTime() + uso);
      const prateleira = sortear() < 0.5 ? entre(10, 90) * 60 * 1000 : entre(2, 48) * HORA;
      const baixa = new Date(devolucao.getTime() + prateleira);
      const pessoa = sortear() < 0.7 ? escolher(ASSIDUOS) : escolher(EVENTUAIS);
      const equipamento = escolher(EQUIPAMENTOS_DO_HISTORICO);

      // Um ciclo que terminaria hoje ou depois não entra: uma retirada de
      // ontem com uso de 70 h e prateleira de 48 h daria um CONCLUIDO com a
      // baixa no futuro — cenário impossível, e foi o que a aposentadoria do
      // NOTE-10 (Tarefa 17) pegou. Os sorteios acima já foram consumidos, de
      // propósito: pular aqui só tira este empréstimo, sem deslocar os outros.
      if (baixa.getTime() >= hoje.getTime()) continue;

      historico.push({ pessoa, equipamento, retirada, devolucao, baixa });
    }
  }

  return historico;
}

/* ------------------------------------------------------------------------- *
 * Avaliações (Tarefa 14)
 * ------------------------------------------------------------------------- */

/**
 * A URL de exemplo do formulário de sugestões, para o QR aparecer no tablet e
 * a prévia aparecer no painel. O domínio `.example` é reservado (RFC 2606):
 * quem apontar a câmera para a captura da wiki não cai em nenhum lugar real —
 * nem num 404 no domínio da instituição.
 */
const URL_DO_FORMULARIO_DE_EXEMPLO = "https://sugestoes.example/formulario";

/**
 * Faixa de ids reservada às avaliações de demonstração, pela mesma regra dos
 * empréstimos (9001+): é o que permite ao `upsert` endereçar cada linha e ao
 * script rodar duas vezes sem duplicar nada.
 *
 * Sequenciais aqui, ao contrário da produção (`idAleatorio()` em
 * `confirmarRetirada`), e isso não fere o anonimato: estas linhas não
 * correspondem a nenhuma retirada, então não há ordem de gravação a proteger.
 */
const PRIMEIRO_ID_DE_AVALIACAO = 9001;

/** Quantos dias para trás o cenário de avaliações cobre. */
const DIAS_DE_AVALIACOES = 60;

/**
 * As avaliações do cenário: uns 60 dias de linhas, dias úteis apenas, de zero
 * a três por dia, com uma parte sem resposta.
 *
 * Geradas por um sorteio **determinístico** (semente fixa), e não escritas uma
 * a uma: são umas oitenta linhas, e o que importa delas é a forma — média
 * plausível, taxa de resposta abaixo de 100%, as quatro notas presentes —, não
 * o valor de cada uma. Rodar duas vezes produz a mesma estrutura; só o `dia`
 * anda com o calendário, pela mesma regra dos carimbos dos empréstimos: a aba
 * tem que dizer "últimos 30 dias" com dados dentro deles na captura tirada
 * hoje e na tirada em novembro.
 *
 * A distribuição é a de um balcão que atende bem: metade "Muito bom", um
 * terço "Bom", e as duas notas baixas somando uns 15%. Um quarto das vezes
 * ninguém responde — é o que faz a taxa de resposta ser um número que se lê.
 */
function avaliacoesDoCenario(hoje: Date): { id: number; dia: string; nota: number | null }[] {
  // mulberry32: um gerador pequeno e reprodutível, suficiente para sortear
  // oitenta linhas. Não é para nada além deste cenário.
  let estado = 0x5eed17;
  const sortear = () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const linhas: { id: number; dia: string; nota: number | null }[] = [];
  let id = PRIMEIRO_ID_DE_AVALIACAO;

  for (let atras = DIAS_DE_AVALIACOES - 1; atras >= 0; atras--) {
    const dia = inicioDoDia(hoje, atras);
    const diaDaSemana = dia.getDay();
    if (diaDaSemana === 0 || diaDaSemana === 6) continue;

    const quantas = Math.floor(sortear() * 4); // 0 a 3 por dia útil
    for (let i = 0; i < quantas; i++) {
      const respondeu = sortear() >= 0.25;
      const s = sortear();
      const nota = !respondeu ? null : s < 0.05 ? 1 : s < 0.15 ? 2 : s < 0.5 ? 3 : 4;
      linhas.push({ id: id++, dia: diaLocal(dia), nota });
    }
  }

  return linhas;
}

/* ------------------------------------------------------------------------- *
 * Execução
 * ------------------------------------------------------------------------- */

function recusar(motivo: string, saida: string): never {
  console.error(`\nRecusado: ${motivo}\n\n${saida}\n`);
  process.exit(1);
}

async function main() {
  for (const planilha of PLANILHAS_REAIS) {
    const caminho = join(process.cwd(), "prisma", "data", planilha);

    if (existsSync(caminho)) {
      recusar(
        `${caminho} existe.`,
        `Esse arquivo é a planilha real da coordenação. Misturar dado de pessoa\n` +
          `real com dado de demonstração é exatamente o acidente que este script\n` +
          `existe para impedir.\n\n` +
          `Se este banco é mesmo descartável, mova a planilha para fora de\n` +
          `prisma/data/ antes de rodar.`,
      );
    }
  }

  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Estado de demonstração - Sistema de Empréstimo de Equipamentos\n");

    const conhecidas = PESSOAS.map((pessoa) => pessoa.matricula);
    const naoReconhecidas = await prisma.pessoa.count({
      where: { matricula: { notIn: conhecidas } },
    });

    if (naoReconhecidas > MAXIMO_DE_PESSOAS_NAO_RECONHECIDAS) {
      recusar(
        `o banco tem ${naoReconhecidas} cadastros que este script não reconhece.`,
        `Um banco de desenvolvimento tem no máximo ${MAXIMO_DE_PESSOAS_NAO_RECONHECIDAS} ` +
          `(os de exemplo do seed).\n` +
          `Este parece um banco com dado real — vindo da importação de .xlsx do\n` +
          `painel, que não deixa arquivo no disco para a trava acima enxergar.\n\n` +
          `Se este banco é mesmo descartável:\n` +
          `  npm run db:reset && npm run db:seed && npm run db:demo`,
      );
    }

    // 1. Pessoas.
    //
    // A sanitização é aplicada aqui pelo mesmo motivo que o seed a aplica: esta
    // é mais uma porta de entrada dos mesmos dados, e uma porta que escrevesse
    // sem passar pelas regras da Tarefa 8.1 reintroduziria no banco a sujeira
    // que o `db:sanear` tirou. Como o elenco já está escrito na forma canônica,
    // as funções não mudam nada hoje — e é justamente por isso que estão aqui:
    // no dia em que alguém acrescentar "MARIA DA SILVA" à lista, o banco
    // continua certo.
    for (const pessoa of PESSOAS) {
      const dados = {
        nome: normalizarNome(pessoa.nome),
        perfil: pessoa.perfil,
        cursos: normalizarCursos(pessoa.cursos),
        status: pessoa.status,
        // `null` explícito (Tarefa 14): uma retirada feita pela tela para
        // fotografar os rostos grava o dia aqui, e sem o reset a captura
        // seguinte não teria rostos para mostrar — a pessoa "já foi
        // perguntada". Mesma regra do `status` logo acima.
        avaliacao_pedida_em: null,
      };

      await prisma.pessoa.upsert({
        where: { matricula: pessoa.matricula },
        // O `status` **é** atualizado, ao contrário do seed. Lá ele é preservado
        // porque a inativação é decisão do secretário; aqui ele é cenário, e
        // reativar alguém pela tela enquanto se testa não pode desfazer o
        // enquadramento da captura seguinte.
        update: dados,
        create: { matricula: pessoa.matricula, ...dados },
      });
    }
    console.log(`Pessoas: ${PESSOAS.length} fictícias garantidas.`);

    // 2. Empréstimos.
    //
    // Falha em vez de inventar vínculo: se uma etiqueta do cenário não existir
    // no inventário (alguém renomeou NOTE-03 pelo painel), é melhor parar com o
    // banco intacto do que criar um empréstimo apontando para outra coisa. O
    // banco recusaria de qualquer jeito — `PRAGMA foreign_keys = 1`, conferido
    // —, mas a mensagem dele não diria qual linha do cenário está errada.
    const etiquetas = new Set(
      (await prisma.equipamento.findMany({ select: { id: true } })).map((e) => e.id),
    );

    const agora = Date.now();
    let id = PRIMEIRO_ID;

    for (const emprestimo of EMPRESTIMOS) {
      if (!etiquetas.has(emprestimo.equipamento)) {
        recusar(
          `o equipamento ${emprestimo.equipamento} não existe no inventário.`,
          `O cenário de demonstração espera o inventário que o seed cria.\n` +
            `Rode: npm run db:reset && npm run db:seed && npm run db:demo`,
        );
      }

      const dados = {
        pessoa_id: emprestimo.pessoa,
        equip_id: emprestimo.equipamento,
        status: emprestimo.status,
        data_retirada: new Date(agora - emprestimo.retiradaHa * HORA),
        // `null` explícito, e não `undefined`: em `update`, `undefined` quer
        // dizer "não mexe", e uma baixa dada pela tela deixaria a `data_baixa`
        // para trás num empréstimo que o cenário devolveu para AGUARDANDO_BAIXA.
        data_devolucao: emprestimo.devolucaoHa
          ? new Date(agora - emprestimo.devolucaoHa * HORA)
          : null,
        data_baixa: emprestimo.baixaHa ? new Date(agora - emprestimo.baixaHa * HORA) : null,
      };

      await prisma.emprestimo.upsert({
        where: { id },
        update: dados,
        create: { id, ...dados },
      });

      id++;
    }

    // 2b. O histórico (Tarefa 16): concluídos, na mesma faixa de ids, logo
    // depois dos dez fixos. Idempotente pelo mesmo `upsert`; o que a tela
    // criar nasce depois de todos eles (ver o CONTRIBUTING, que registra que
    // a sequência do SQLite avança junto).
    const historico = historicoDoCenario(inicioDoDia(new Date(agora)));
    for (const emprestimo of historico) {
      if (!etiquetas.has(emprestimo.equipamento)) {
        recusar(
          `o equipamento ${emprestimo.equipamento} não existe no inventário.`,
          `O histórico de demonstração espera o inventário que o seed cria.\n` +
            `Rode: npm run db:reset && npm run db:seed && npm run db:demo`,
        );
      }

      const dados = {
        pessoa_id: emprestimo.pessoa,
        equip_id: emprestimo.equipamento,
        status: STATUS_EMPRESTIMO.concluido,
        data_retirada: emprestimo.retirada,
        data_devolucao: emprestimo.devolucao,
        data_baixa: emprestimo.baixa,
      };

      await prisma.emprestimo.upsert({
        where: { id },
        update: dados,
        create: { id, ...dados },
      });

      id++;
    }
    console.log(
      `Empréstimos: ${EMPRESTIMOS.length} nos três status, mais ${historico.length} ` +
        `concluídos nos últimos ${DIAS_DE_HISTORICO} dias (ids ${PRIMEIRO_ID}–${id - 1}).`,
    );

    // 3. Equipamentos.
    //
    // O `EMPRESTADO` é **derivado** dos empréstimos acima, e não escrito numa
    // lista à parte. Duas listas discordariam no dia em que alguém mexesse numa
    // só — e o resultado seria um cenário impossível, com um empréstimo aberto
    // apontando para um item "disponível", fotografado e publicado na wiki como
    // se fosse o comportamento do sistema.
    const ocupados = new Set(
      EMPRESTIMOS.filter(
        (e) =>
          e.status === STATUS_EMPRESTIMO.ativo || e.status === STATUS_EMPRESTIMO.aguardandoBaixa,
      ).map((e) => e.equipamento),
    );

    for (const etiqueta of [...EM_MANUTENCAO, ...APOSENTADOS]) {
      if (ocupados.has(etiqueta)) {
        recusar(
          `${etiqueta} está em um empréstimo aberto e também na lista de fora de circulação.`,
          `O cenário se contradiz. Corrija EMPRESTIMOS, EM_MANUTENCAO ou APOSENTADOS.`,
        );
      }
    }

    const statusPorEtiqueta = new Map<string, string>();
    for (const etiqueta of etiquetas) statusPorEtiqueta.set(etiqueta, STATUS_EQUIPAMENTO.disponivel);
    for (const etiqueta of ocupados) statusPorEtiqueta.set(etiqueta, STATUS_EQUIPAMENTO.emprestado);
    for (const etiqueta of EM_MANUTENCAO) statusPorEtiqueta.set(etiqueta, STATUS_EQUIPAMENTO.manutencao);
    for (const etiqueta of APOSENTADOS) statusPorEtiqueta.set(etiqueta, STATUS_EQUIPAMENTO.inativo);

    for (const [etiqueta, status] of statusPorEtiqueta) {
      await prisma.equipamento.update({ where: { id: etiqueta }, data: { status } });
    }

    const porStatus = await prisma.equipamento.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    });
    console.log(`Equipamentos: ${porStatus.map((l) => `${l._count._all} ${l.status}`).join(", ")}.`);

    // 4. Avaliações (Tarefa 14).
    //
    // Ao contrário dos empréstimos, aqui o que a tela criou É apagado: uma
    // avaliação nascida de um toque de teste tem id fora da faixa reservada e
    // entraria na média da captura seguinte. O `Emprestimo` criado pela tela
    // fica (limitação registrada na D05); a `Avaliacao` não, porque o relatório
    // que ela alimenta precisa mostrar os mesmos números em toda captura.
    const avaliacoes = avaliacoesDoCenario(inicioDoDia(new Date(agora)));
    const idsDoCenario = avaliacoes.map((a) => a.id);

    for (const avaliacao of avaliacoes) {
      await prisma.avaliacao.upsert({
        where: { id: avaliacao.id },
        update: { dia: avaliacao.dia, nota: avaliacao.nota },
        create: avaliacao,
      });
    }
    const apagadas = await prisma.avaliacao.deleteMany({ where: { id: { notIn: idsDoCenario } } });

    const respondidas = avaliacoes.filter((a) => a.nota !== null).length;
    console.log(
      `Avaliações: ${avaliacoes.length} em ${DIAS_DE_AVALIACOES} dias ` +
        `(${respondidas} respondidas${apagadas.count > 0 ? `; ${apagadas.count} de fora do cenário apagadas` : ""}).`,
    );

    // 5. A URL do formulário de sugestões, para o QR aparecer nas capturas.
    await prisma.configuracao.upsert({
      where: { chave: CHAVE_URL_FORMULARIO },
      update: { valor: URL_DO_FORMULARIO_DE_EXEMPLO },
      create: { chave: CHAVE_URL_FORMULARIO, valor: URL_DO_FORMULARIO_DE_EXEMPLO },
    });
    console.log(`Formulário de sugestões: ${URL_DO_FORMULARIO_DE_EXEMPLO}.`);

    const [pessoas, emprestimos, fila] = await Promise.all([
      prisma.pessoa.count(),
      prisma.emprestimo.count(),
      prisma.emprestimo.count({ where: { status: STATUS_EMPRESTIMO.aguardandoBaixa } }),
    ]);

    console.log(
      `\nBanco de demonstração: ${pessoas} pessoas, ${emprestimos} empréstimos ` +
        `(${fila} na fila de devoluções), ${avaliacoes.length} avaliações.\n` +
        `Capturas do painel: entre como "secretario" — ver o CONTRIBUTING.md.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error("\nFalha no estado de demonstração:", erro);
  process.exit(1);
});
