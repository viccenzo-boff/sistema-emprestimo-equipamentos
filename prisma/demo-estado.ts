import "dotenv/config";

import { existsSync } from "node:fs";
import { join } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";
import { normalizarCursos, normalizarNome } from "../src/lib/sanitizacao";
import { PERFIL, STATUS_EMPRESTIMO, STATUS_EQUIPAMENTO, STATUS_PESSOA } from "../src/lib/tipos";

/**
 * Estado de demonstração para as capturas de tela da wiki — Tarefa D01.
 *
 * `npm run db:demo`
 *
 * ## Por que isto não é o seed
 *
 * O `prisma/seed.ts` é ferramenta de produção da secretaria: ele deixa o banco
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
 * a edição da secretaria porque os dados são dela; aqui os dados são cenário de
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
 * criado pela tela nasce com id 9011 em diante. Em banco de captura isso não
 * aparece em lugar nenhum — nenhuma tela exibe o id do empréstimo.
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
  /** Horas atrás em que a secretaria conferiu fisicamente (Fluxo 3). */
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
      };

      await prisma.pessoa.upsert({
        where: { matricula: pessoa.matricula },
        // O `status` **é** atualizado, ao contrário do seed. Lá ele é preservado
        // porque a inativação é decisão da secretaria; aqui ele é cenário, e
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
    console.log(`Empréstimos: ${EMPRESTIMOS.length} nos três status.`);

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

    const [pessoas, emprestimos, fila] = await Promise.all([
      prisma.pessoa.count(),
      prisma.emprestimo.count(),
      prisma.emprestimo.count({ where: { status: STATUS_EMPRESTIMO.aguardandoBaixa } }),
    ]);

    console.log(
      `\nBanco de demonstração: ${pessoas} pessoas, ${emprestimos} empréstimos ` +
        `(${fila} na fila de devoluções).\n` +
        `Capturas do painel: entre como "secretaria" — ver o CONTRIBUTING.md.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error("\nFalha no estado de demonstração:", erro);
  process.exit(1);
});
