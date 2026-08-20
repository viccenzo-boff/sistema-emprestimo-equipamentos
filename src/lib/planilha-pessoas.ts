import * as XLSX from "xlsx";

import { semAcento } from "@/lib/texto";
import {
  PERFIL,
  STATUS_PESSOA,
  type AcaoDaLinha,
  type LinhaDaImportacao,
  type MudancaDeCampo,
} from "@/lib/tipos";

/**
 * Leitura da planilha de pessoas (.xlsx) e a conta do que ela vai provocar
 * (Tarefa 8, itens 2 e 3).
 *
 * Módulo puro de propósito: lê bytes, devolve um plano, e **não escreve nada**.
 * É o que permite a mesma função servir à prévia (que só mostra) e à
 * confirmação (que grava) — e é o que garante que as duas concordem, porque a
 * confirmação relê o arquivo e refaz esta conta em vez de confiar no que a tela
 * calculou.
 *
 * Não leva "use server": um arquivo com essa diretiva só exporta função
 * assíncrona, e aqui tudo é síncrono. Quem o chama são as actions do painel.
 */

/**
 * Teto de linhas por importação.
 *
 * A planilha real da coordenação tem centenas de linhas, não centenas de
 * milhares. O número existe para que um arquivo mal formado — ou um POST
 * forjado — não vire uma varredura do banco inteiro em uma requisição só.
 */
export const MAXIMO_DE_LINHAS = 5000;

/** Tamanho máximo do arquivo aceito, casado com o limite do Server Action. */
export const MAXIMO_DE_BYTES = 3 * 1024 * 1024;

/**
 * Uma linha da planilha depois de lida, antes de encontrar o banco.
 *
 * O `undefined` aqui é a regra de negócio inteira, e por isso é um tipo e não
 * uma string vazia: **`undefined` significa "a planilha não disse nada sobre
 * este campo"** — coluna ausente do arquivo ou célula vazia na linha. Campo que
 * a planilha não menciona é campo que o banco preserva. Confundir "não disse"
 * com "disse vazio" é o que apagaria o nome de 200 pessoas porque a coordenação
 * mandou só a coluna de status.
 */
export type LinhaLida = {
  /** Número da linha **no arquivo**, contando o cabeçalho — é o que o Excel mostra. */
  linha: number;
  matricula: string;
  nome?: string;
  perfil?: string;
  cursos?: string;
  status?: string;
  /** Preenchido quando a própria leitura já reprovou a linha. */
  erro?: string;
};

export type PlanilhaLida = {
  /** Cabeçalhos reconhecidos, na grafia canônica. */
  colunas: string[];
  linhas: LinhaLida[];
};

/** Erro de leitura que impede qualquer linha de ser processada. */
export class PlanilhaInvalidaError extends Error {
  constructor(
    readonly motivo:
      | "ARQUIVO_INVALIDO"
      | "PLANILHA_VAZIA"
      | "PLANILHA_SEM_MATRICULA"
      | "PLANILHA_EXCEDIDA",
    mensagem: string,
    readonly detalhe?: string,
  ) {
    super(mensagem);
    this.name = "PlanilhaInvalidaError";
  }
}

/** As colunas que a tarefa define, e os apelidos que uma planilha real usa. */
const COLUNAS: Record<string, readonly string[]> = {
  matricula: ["matricula", "matrícula", "ra", "registro"],
  nome: ["nome", "nome completo", "aluno", "estudante"],
  perfil: ["perfil", "tipo", "vinculo", "vínculo"],
  cursos: ["cursos", "curso"],
  status: ["status", "situacao", "situação"],
};

/**
 * Os nomes canônicos das colunas, na ordem em que a planilha modelo os escreve
 * (Tarefa 9).
 *
 * Sai das chaves de `COLUNAS` de propósito, em vez de ser uma segunda lista com
 * o mesmo conteúdo: quem escreve o modelo é o **leitor**, e não um vizinho que
 * concorda com ele hoje. Duas listas divergiriam no dia em que uma coluna
 * mudasse de nome — o modelo passaria a gerar um arquivo que este próprio
 * módulo recusa, e nem o verificador de tipos nem o lint teriam o que dizer.
 * Mesmo argumento que tirou `semAcento` das actions na Tarefa 7.
 */
export const COLUNAS_CANONICAS: readonly string[] = Object.keys(COLUNAS);

/**
 * Lê o arquivo .xlsx e devolve as linhas com os campos que **estavam
 * preenchidos**.
 *
 * `raw: false` não é detalhe: manda a biblioteca devolver o texto **formatado**
 * da célula, e é o que salva os zeros à esquerda da matrícula. Uma matrícula
 * digitada como número no Excel com formato "0000000" vale 12345 por dentro e
 * mostra "0012345" na tela — com `raw: true` chegaria aqui como `12345` e o
 * cadastro certo nunca seria encontrado. (Se a coordenação digitou a matrícula
 * como número puro, sem formato, os zeros já se perderam dentro do arquivo e
 * nada aqui os recupera: por isso a prévia existe.)
 *
 * `header: 1` faz a leitura vir como matriz de linhas, e não como objetos: é o
 * que permite numerar as linhas do jeito que o Excel numera e distinguir "a
 * coluna não existe no arquivo" de "a célula está vazia".
 */
export function lerPlanilha(bytes: ArrayBuffer, nomeDoArquivo: string): PlanilhaLida {
  if (bytes.byteLength === 0) {
    throw new PlanilhaInvalidaError("ARQUIVO_INVALIDO", "O arquivo está vazio.");
  }

  if (bytes.byteLength > MAXIMO_DE_BYTES) {
    throw new PlanilhaInvalidaError(
      "PLANILHA_EXCEDIDA",
      "O arquivo é grande demais.",
      `O limite é de ${Math.floor(MAXIMO_DE_BYTES / (1024 * 1024))} MB. Divida a planilha em partes.`,
    );
  }

  /*
    Um .xlsx é um ZIP, e é pelos bytes que isso se confere — não pela extensão.

    Isto não é rigor decorativo: **a biblioteca não recusa sozinha**. Medido na
    verificação desta tarefa, um arquivo de texto puro renomeado para `.xlsx`
    passa por `XLSX.read` sem lançar nada — o SheetJS cai no interpretador de
    CSV e devolve uma planilha de uma linha, com o texto quebrado nas vírgulas.
    Sem esta guarda, quem exportasse a planilha em CSV e trocasse a extensão à
    mão veria a importação "funcionar" e gravar lixo, ou — no melhor caso — um
    erro sobre coluna faltando que não tem nada a ver com o problema real.

    "PK\\x03\\x04" é a assinatura de todo arquivo ZIP, e portanto de todo .xlsx
    gravado pelo Excel.
  */
  const assinatura = new Uint8Array(bytes.slice(0, 4));
  const ehZip =
    assinatura[0] === 0x50 &&
    assinatura[1] === 0x4b &&
    assinatura[2] === 0x03 &&
    assinatura[3] === 0x04;

  if (!ehZip) {
    throw new PlanilhaInvalidaError(
      "ARQUIVO_INVALIDO",
      `${nomeDoArquivo} não é uma planilha do Excel por dentro.`,
      "O arquivo tem a extensão .xlsx mas o conteúdo é outro (texto ou CSV renomeado, por exemplo). Abra no Excel e use Salvar como → Pasta de Trabalho do Excel (.xlsx).",
    );
  }

  let pasta: XLSX.WorkBook;

  try {
    pasta = XLSX.read(bytes, {
      type: "array",
      // Não avaliamos fórmulas nem estilos: só interessa o valor exibido.
      cellFormula: false,
      cellHTML: false,
    });
  } catch {
    throw new PlanilhaInvalidaError(
      "ARQUIVO_INVALIDO",
      `Não foi possível ler ${nomeDoArquivo}.`,
      "O arquivo parece uma planilha, mas está corrompido ou protegido por senha.",
    );
  }

  // A primeira aba, e não uma chamada "pessoas": a planilha da coordenação
  // vem com o nome que o Excel deu ("Planilha1", "Sheet1", o nome do curso).
  const nomeDaAba = pasta.SheetNames[0];
  const aba = nomeDaAba ? pasta.Sheets[nomeDaAba] : undefined;

  if (!aba) {
    throw new PlanilhaInvalidaError(
      "PLANILHA_VAZIA",
      `${nomeDoArquivo} não tem nenhuma aba com dados.`,
    );
  }

  /*
    `blankrows: true` é obrigatório, por mais que as linhas em branco não
    interessem: descartá-las aqui **desalinha a numeração** com a que o Excel
    mostra. Uma planilha com título na linha 1, branco na 2 e cabeçalho na 3
    reportaria o primeiro aluno como "linha 3" em vez de 4, e quem fosse
    corrigir o arquivo abriria a linha errada. As linhas vazias são descartadas
    mais abaixo, depois de já terem contado para o número.
  */
  const grade = XLSX.utils.sheet_to_json<string[]>(aba, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });

  /*
    O cabeçalho é a primeira linha que contém a coluna de matrícula — e não a
    primeira linha preenchida.

    A diferença apareceu na verificação, não na escrita: planilha de coordenação
    vem com "Relatório de alunos — 2026/2" e uma linha em branco em cima da
    tabela, e a primeira-linha-preenchida elegia o título como cabeçalho. O
    arquivo inteiro era recusado por "não tem a coluna matricula" — sendo que
    ela estava lá, duas linhas abaixo.
  */
  const apelidosDeMatricula = COLUNAS.matricula.map(semAcento);

  const cabecalhoPossivel = (linha: string[]) =>
    linha.some((celula) => apelidosDeMatricula.includes(semAcento(texto(celula))));

  let indiceDoCabecalho = grade.findIndex(cabecalhoPossivel);

  if (indiceDoCabecalho === -1) {
    // Sem coluna de matrícula em lugar nenhum: cai na primeira linha preenchida
    // só para a mensagem de erro poder dizer quais cabeçalhos ela achou.
    indiceDoCabecalho = grade.findIndex((linha) =>
      linha.some((celula) => texto(celula).length > 0),
    );
  }

  if (indiceDoCabecalho === -1) {
    throw new PlanilhaInvalidaError(
      "PLANILHA_VAZIA",
      `${nomeDoArquivo} não tem nenhuma linha preenchida.`,
    );
  }

  const cabecalho = grade[indiceDoCabecalho].map((celula) => semAcento(texto(celula)));

  /** Em qual coluna do arquivo está cada campo conhecido. */
  const posicao = new Map<string, number>();

  for (const [campo, apelidos] of Object.entries(COLUNAS)) {
    const aceitos = apelidos.map(semAcento);
    const indice = cabecalho.findIndex((titulo) => aceitos.includes(titulo));
    // A primeira ocorrência vence: uma planilha com duas colunas "nome" usa a
    // da esquerda, em vez de a leitura depender da ordem do objeto.
    if (indice !== -1 && !posicao.has(campo)) posicao.set(campo, indice);
  }

  if (!posicao.has("matricula")) {
    throw new PlanilhaInvalidaError(
      "PLANILHA_SEM_MATRICULA",
      "A planilha não tem a coluna matricula.",
      `A matrícula é a chave de toda a importação. Cabeçalhos lidos: ${
        cabecalho.filter((titulo) => titulo.length > 0).join(", ") || "nenhum"
      }.`,
    );
  }

  const corpo = grade.slice(indiceDoCabecalho + 1);

  if (corpo.length > MAXIMO_DE_LINHAS) {
    throw new PlanilhaInvalidaError(
      "PLANILHA_EXCEDIDA",
      `A planilha tem ${corpo.length} linhas.`,
      `São no máximo ${MAXIMO_DE_LINHAS} por importação. Divida o arquivo em partes.`,
    );
  }

  const linhas: LinhaLida[] = [];
  /** Para pegar a mesma matrícula repetida dentro do próprio arquivo. */
  const jaVistas = new Map<string, number>();

  corpo.forEach((celulas, deslocamento) => {
    // +2: uma para o cabeçalho, outra porque o Excel conta a partir de 1.
    const numero = indiceDoCabecalho + deslocamento + 2;

    const valor = (campo: string): string | undefined => {
      const indice = posicao.get(campo);
      if (indice === undefined) return undefined;
      const conteudo = texto(celulas[indice]);
      return conteudo.length > 0 ? conteudo : undefined;
    };

    const matricula = valor("matricula");

    // Linha completamente vazia é o rodapé que o Excel arrasta junto — some sem
    // virar erro. Linha com dados mas sem matrícula é erro de verdade: tem
    // alguém ali que a importação não sabe endereçar.
    if (!matricula) {
      const temAlgo = celulas.some((celula) => texto(celula).length > 0);
      if (temAlgo) {
        linhas.push({
          linha: numero,
          matricula: "",
          erro: "Linha sem matrícula — a importação não tem como saber de quem é.",
        });
      }
      return;
    }

    /*
      A matrícula tem que ser digitável no tablet, e o tablet só aceita dígito.

      A regra é a mesma da edição manual, e existe pelo mesmo motivo medido: o
      campo da [TelaMatricula](src/components/portal/TelaMatricula.tsx) descarta
      não-dígitos e corta em 15. Sem esta guarda, uma planilha com "SIS-0012"
      criaria cadastros que aparecem no painel e que ninguém consegue digitar no
      portal — e o erro só apareceria com o aluno parado na frente do tablet.

      A recusa é **por linha**, não do arquivo inteiro: uma célula mal formatada
      no meio de trezentas não pode derrubar a importação das outras 299.
    */
    if (!/^\d{1,15}$/.test(matricula)) {
      linhas.push({
        linha: numero,
        matricula,
        erro: `Matrícula "${matricula}" não é válida — use somente números, até 15 dígitos (é o que o teclado do tablet aceita).`,
      });
      return;
    }

    const repetida = jaVistas.get(matricula);

    if (repetida !== undefined) {
      linhas.push({
        linha: numero,
        matricula,
        erro: `Matrícula repetida na planilha (já aparece na linha ${repetida}).`,
      });
      return;
    }

    jaVistas.set(matricula, numero);

    linhas.push({
      linha: numero,
      matricula,
      nome: valor("nome"),
      perfil: valor("perfil"),
      cursos: valor("cursos"),
      status: valor("status"),
    });
  });

  return {
    colunas: [...posicao.keys()],
    linhas,
  };
}

/** Uma célula vira texto aparado; qualquer coisa que não seja texto vira "". */
function texto(celula: unknown): string {
  if (typeof celula === "string") return celula.trim().replace(/\s+/g, " ");
  if (typeof celula === "number" || typeof celula === "boolean") {
    return String(celula).trim();
  }
  return "";
}

/** O cadastro como ele está no banco, para a comparação. */
export type PessoaExistente = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
  status: string;
};

/** O que a importação vai gravar em uma linha, já validado. */
export type OperacaoDaLinha =
  | { tipo: "criar"; dados: PessoaExistente }
  | {
      tipo: "atualizar";
      matricula: string;
      campos: Partial<Omit<PessoaExistente, "matricula">>;
    }
  | { tipo: "inalterada"; matricula: string }
  | { tipo: "erro"; matricula: string; erro: string };

/**
 * Confronta as linhas lidas com o banco e decide o que cada uma provoca.
 *
 * É aqui que moram os três cenários da tarefa, e eles saem de **uma** regra em
 * vez de três ramos:
 *
 * > Campo que a planilha preencheu é campo que a importação grava. Campo que a
 * > planilha não trouxe é campo que o banco preserva.
 *
 * - **Cenário A** (só matrícula + status "INATIVO"): nome, perfil e cursos não
 *   vieram, então não entram no `update` — o banco preserva os três sozinho.
 * - **Cenário B** (dados sim, status ausente ou vazio): `status` não entra no
 *   `update`, e o que a pessoa já tinha continua valendo.
 * - **Cenário C** (matrícula nova): a criação é o único caso que **exige**
 *   nome, perfil e cursos, porque não existe valor anterior para preservar. O
 *   status ausente vira `ATIVO` — o padrão da coluna.
 *
 * Escrever como três ramos separados foi tentado e descartado: os ramos
 * repetiam a validação de perfil e status, e a primeira divergência entre as
 * cópias seria silenciosa (uma aceitando "Ativo", outra não).
 */
export function montarPlano(
  linhas: LinhaLida[],
  existentes: Map<string, PessoaExistente>,
): { operacoes: OperacaoDaLinha[]; previa: LinhaDaImportacao[] } {
  const operacoes: OperacaoDaLinha[] = [];
  const previa: LinhaDaImportacao[] = [];

  for (const linha of linhas) {
    const registrar = (
      acao: AcaoDaLinha,
      nome: string,
      mudancas: MudancaDeCampo[],
      erro?: string,
    ) => {
      previa.push({ linha: linha.linha, matricula: linha.matricula, acao, nome, mudancas, erro });
    };

    if (linha.erro) {
      operacoes.push({ tipo: "erro", matricula: linha.matricula, erro: linha.erro });
      registrar("erro", "", [], linha.erro);
      continue;
    }

    const atual = existentes.get(linha.matricula);

    // Perfil e status são validados uma vez só, valham eles para criar ou para
    // atualizar. `null` = veio um valor e ele é inválido.
    const perfil = linha.perfil === undefined ? undefined : normalizarPerfil(linha.perfil);
    const status = linha.status === undefined ? undefined : normalizarStatus(linha.status);

    if (perfil === null) {
      const erro = `Perfil "${linha.perfil}" não é válido — use ALUNO ou PROFESSOR.`;
      operacoes.push({ tipo: "erro", matricula: linha.matricula, erro });
      registrar("erro", atual?.nome ?? linha.nome ?? "", [], erro);
      continue;
    }

    if (status === null) {
      const erro = `Status "${linha.status}" não é válido — use ATIVO ou INATIVO.`;
      operacoes.push({ tipo: "erro", matricula: linha.matricula, erro });
      registrar("erro", atual?.nome ?? linha.nome ?? "", [], erro);
      continue;
    }

    /* --------------------------- Cenário C: criar -------------------------- */
    if (!atual) {
      const faltando: string[] = [];
      if (!linha.nome) faltando.push("nome");
      if (!perfil) faltando.push("perfil");
      if (!linha.cursos) faltando.push("cursos");

      if (faltando.length > 0) {
        const erro = `Cadastro novo exige ${faltando.join(", ")} — a matrícula ${linha.matricula} ainda não existe no sistema.`;
        operacoes.push({ tipo: "erro", matricula: linha.matricula, erro });
        registrar("erro", linha.nome ?? "", [], erro);
        continue;
      }

      const novo: PessoaExistente = {
        matricula: linha.matricula,
        nome: linha.nome as string,
        perfil: perfil as string,
        cursos: linha.cursos as string,
        // Status ausente na criação assume o padrão da coluna; "INATIVO" na
        // planilha cadastra já inativo, como a tarefa pede.
        status: status ?? STATUS_PESSOA.ativo,
      };

      operacoes.push({ tipo: "criar", dados: novo });
      registrar("criar", novo.nome, [
        { campo: "nome", de: "", para: novo.nome },
        { campo: "perfil", de: "", para: novo.perfil },
        { campo: "cursos", de: "", para: novo.cursos },
        { campo: "status", de: "", para: novo.status },
      ]);
      continue;
    }

    /* ------------------ Cenários A e B: atualização parcial ---------------- */
    const campos: Partial<Omit<PessoaExistente, "matricula">> = {};
    const mudancas: MudancaDeCampo[] = [];

    /** Só entra no update o que veio preenchido **e** é diferente do que está lá. */
    const considerar = (
      campo: "nome" | "perfil" | "cursos" | "status",
      novo: string | undefined,
    ) => {
      if (novo === undefined) return;
      if (novo === atual[campo]) return;
      campos[campo] = novo;
      mudancas.push({ campo, de: atual[campo], para: novo });
    };

    considerar("nome", linha.nome);
    considerar("perfil", perfil);
    considerar("cursos", linha.cursos);
    considerar("status", status);

    if (mudancas.length === 0) {
      operacoes.push({ tipo: "inalterada", matricula: linha.matricula });
      registrar("inalterada", atual.nome, []);
      continue;
    }

    operacoes.push({ tipo: "atualizar", matricula: linha.matricula, campos });
    registrar("atualizar", atual.nome, mudancas);
  }

  return { operacoes, previa };
}

/**
 * "aluno", "Aluno", "ALUNO" -> "ALUNO". Qualquer outra coisa -> `null`.
 *
 * Deliberadamente estrito: "prof", "alunos" e "estudante" **não** passam. Um
 * perfil adivinhado errado muda quem pode o quê e não deixa rastro; a prévia
 * mostra a linha reprovada com o valor que veio, e quem corrige é a planilha.
 */
function normalizarPerfil(bruto: string): string | null {
  const chave = semAcento(bruto);
  if (chave === "aluno") return PERFIL.aluno;
  if (chave === "professor") return PERFIL.professor;
  return null;
}

/** "inativo", "Inativo", "INATIVO" -> "INATIVO". Qualquer outra coisa -> `null`. */
function normalizarStatus(bruto: string): string | null {
  const chave = semAcento(bruto);
  if (chave === "ativo") return STATUS_PESSOA.ativo;
  if (chave === "inativo") return STATUS_PESSOA.inativo;
  return null;
}
