import { PERFIL, STATUS_PESSOA } from "@/lib/tipos";
import { semAcento } from "@/lib/texto";

/**
 * Sanitização dos campos de `Pessoa` — Tarefa 8.1.
 *
 * O problema que este módulo existe para resolver é que a planilha da
 * coordenação é digitada por gente, e gente escreve "ANA MARIA DE SOUZA",
 * "ana maria de souza" e "Ana Maria de Souza" para a mesma pessoa — e "SI",
 * "Sistema de Informação" e "sistemas de informacao" para o mesmo curso. Sem
 * uma passagem de limpeza, cada grafia vira um valor diferente no banco, a
 * busca do painel encontra uma e perde a outra, e o filtro de perfil passa a
 * ter tantas opções quanto variantes já foram digitadas.
 *
 * **Módulo neutro de propósito**: não importa `next/headers`, nem o Prisma, nem
 * nada do servidor. É o mesmo motivo de [senha.ts](src/lib/senha.ts) — assim as
 * mesmas regras são lidas pelo servidor (importação e edição manual), pelo
 * `tsx` no terminal (o seed e o `db:sanear`) e pelo navegador, se um dia a tela
 * quiser prever o resultado antes de enviar. Uma segunda implementação em
 * qualquer um desses lugares divergiria em silêncio, que é o argumento que já
 * tirou `semAcento` das actions na Tarefa 7 e `CUSTO_BCRYPT` do seed na 11.
 */

/* ------------------------------------------------------------------------- *
 * Regra 1 — Nomes em Title Case
 * ------------------------------------------------------------------------- */

/**
 * As palavras que **não** recebem maiúscula no meio de um nome.
 *
 * O enunciado escreveu o exemplo como "Nome Do Aluno", capitalizando a
 * partícula, mas isso valeria para todo nome importado — e "Ana Maria De
 * Souza" não é como o cartório escreve nem como a secretaria lê o nome na fila
 * de devoluções. Decisão tomada com o dono do repositório antes de existir
 * código: partícula fica minúscula.
 *
 * A primeira palavra é sempre capitalizada, mesmo sendo partícula: uma planilha
 * exportada com o sobrenome à frente ("de souza ana") começaria com letra
 * minúscula, e aí o defeito pareceria ser da limpeza.
 */
const PARTICULAS = new Set([
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  // Sobrenomes de origem italiana e alemã aparecem no oeste catarinense com
  // frequência suficiente para valer a pena ("Di Domenico", "Von Mühlen").
  "di",
  "du",
  "del",
  "della",
  "van",
  "von",
  "y",
]);

/**
 * "d'ávila" -> "D'Ávila", "souza" -> "Souza".
 *
 * O apóstrofo abre uma parte nova da mesma palavra, e por isso a letra depois
 * dele também sobe. Sem esse tratamento sairia "D'ávila", que é o tipo de erro
 * que ninguém revisa porque parece quase certo.
 */
function capitalizarPalavra(palavra: string): string {
  return palavra
    .split("'")
    .map((parte) =>
      parte.length === 0
        ? parte
        : parte[0].toLocaleUpperCase("pt-BR") + parte.slice(1).toLocaleLowerCase("pt-BR"),
    )
    .join("'");
}

/**
 * Title Case do português: cada palavra com maiúscula, exceto as partículas
 * fora da primeira posição.
 *
 * Serve ao nome da pessoa e ao curso que não está no mapa oficial ("engenharia
 * de software" -> "Engenharia de Software"), e é por atender os dois que mora
 * separada de `normalizarNome`: a limpeza de caracteres é regra de nome, a
 * capitalização não.
 */
export function emTitleCase(bruto: string): string {
  return bruto
    .trim()
    .split(/\s+/)
    .filter((palavra) => palavra.length > 0)
    .map((palavra, indice) => {
      // A chave descarta acento e pontuação para "De." e "DA" caírem na mesma
      // partícula que "de" e "da".
      const chave = semAcento(palavra).replace(/[^a-z]/g, "");

      if (indice > 0 && PARTICULAS.has(chave)) {
        return palavra.toLocaleLowerCase("pt-BR");
      }

      return capitalizarPalavra(palavra);
    })
    .join(" ");
}

/**
 * "  ANA   MARIA-DE-SOUZA 123 " -> "Ana Maria de Souza".
 *
 * Descarta o que não é letra, espaço, ponto ou apóstrofo — dígitos e os `@`,
 * `#`, `$` que o enunciado cita entram nessa conta. Hífen e sublinhado viram
 * espaço em vez de sumir, porque "nome-do-aluno" é uma frase colada, não uma
 * palavra só.
 *
 * **O ponto fica, e é uma exceção deliberada ao "apenas letras e espaços" do
 * enunciado.** [primeiroNome()](src/lib/texto.ts) trata o primeiro token
 * terminado em ponto como tratamento e devolve "Prof. Daniel"; sem o ponto, a
 * mesma função devolve só "Prof", e a saudação do tablet passa a cumprimentar
 * um título. O seed do projeto tem exatamente esse caso ("Prof. Daniel Rocha").
 *
 * O apóstrofo fica pelo mesmo tipo de motivo: "D'Ávila" e "Sant'Ana" são nomes
 * reais, e removê-lo os grudaria em "Dávila" e "Santana" — outro sobrenome.
 *
 * Devolve `""` quando não sobra nenhuma letra. Quem chama **não** pode
 * confundir isso com "a planilha não trouxe o nome": a célula trouxe alguma
 * coisa, e essa coisa era lixo inteiro. A importação reprova a linha.
 */
export function normalizarNome(bruto: string): string {
  const palavras = bruto
    // Aspas tipográficas viram o apóstrofo reto, para haver um caractere só.
    .replace(/[‘’ʼ]/g, "'")
    /*
      Duas classes, e a diferença entre elas é o defeito que a prova pegou.

      O que **separa** palavras vira espaço: hífen, sublinhado, barra e vírgula
      ficam entre dois nomes ("nome-do-aluno", "Souza, Ana"), e apagá-los
      grudaria as palavras ("SouzaAna").

      O que é **ruído dentro** da palavra é apagado sem deixar espaço: os `@`,
      `#`, `$` e os dígitos que o enunciado cita caem no meio de uma palavra só
      ("An@a"). A primeira versão trocava estes por espaço também, e "An@a#
      S$ouza" saía como "An A S Ouza" — quatro palavras onde havia duas.
    */
    .replace(/[-–—_/\\,;:|]+/g, " ")
    .replace(/[^\p{L}\s.']/gu, "")
    .split(/\s+/)
    // Token sem nenhuma letra é pontuação que sobrou sozinha depois da limpeza.
    .filter((palavra) => /\p{L}/u.test(palavra))
    // O ponto fecha abreviação; à esquerda da palavra ele é resto.
    .map((palavra) => palavra.replace(/^[.']+/, ""));

  return emTitleCase(palavras.join(" "));
}

/* ------------------------------------------------------------------------- *
 * Regra 2 — Perfil (Estudante / Professor)
 * ------------------------------------------------------------------------- */

/**
 * O reconhecimento é por **prefixo**, e não por lista de sinônimos exatos.
 *
 * O enunciado pede "Aluno, Alunos, Estudantes, estudante ou qualquer variação",
 * e uma lista exata tem que prever cada plural e cada gênero — "aluna",
 * "professoras", "Profª" — para errar justamente na variante que ninguém
 * lembrou. O prefixo resolve a família inteira de uma vez: "alun" cobre aluno,
 * aluna, alunos e alunas; "prof" cobre prof, profa, professor e professores.
 *
 * A comparação roda sobre o texto sem acento, sem pontuação e em minúsculas,
 * então "Profº." e "PROF." caem no mesmo "prof".
 */
const PREFIXOS_DE_ESTUDANTE = ["alun", "estud", "discen", "academ"];
const PREFIXOS_DE_PROFESSOR = ["prof", "docen"];

/**
 * "aluno", "ALUNOS", "Estudante", "discente" -> `"Estudante"`.
 * "prof", "Profª", "docentes", "PROFESSOR" -> `"Professor"`.
 * Qualquer outra coisa -> `null`.
 *
 * **`null` reprova a linha; não existe fallback.** O enunciado deixava escolher
 * entre um padrão seguro e a recusa, e a recusa já era a decisão da Tarefa 8
 * pelo motivo que continua valendo: perfil não é enfeite de tela — é quem pode
 * retirar equipamento. Um "Servidor" ou "Terceirizado" adivinhado como
 * estudante entra no banco sem deixar rastro, e a prévia da importação, que
 * existe justamente para mostrar o que vai acontecer, mostraria uma linha
 * correta. Reprovada, a linha aparece na prévia com o valor que veio e quem
 * corrige é a planilha.
 */
export function normalizarPerfil(bruto: string): string | null {
  const chave = semAcento(bruto)
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  if (chave.length === 0) return null;

  if (PREFIXOS_DE_ESTUDANTE.some((prefixo) => chave.startsWith(prefixo))) {
    return PERFIL.estudante;
  }

  if (PREFIXOS_DE_PROFESSOR.some((prefixo) => chave.startsWith(prefixo))) {
    return PERFIL.professor;
  }

  return null;
}

/**
 * O perfil como a tela deve escrevê-lo.
 *
 * Depois desta tarefa o banco guarda exatamente a forma exibida ("Estudante",
 * "Professor"), então isto é quase a identidade — e é de propósito que exista
 * assim, em vez de as telas escreverem `perfil === "PROFESSOR" ? ... : ...`
 * como faziam em três lugares. Aquela forma tinha o valor cravado na string e
 * transformava **qualquer** coisa diferente de "PROFESSOR" em "Aluno",
 * inclusive um valor novo que ninguém previu.
 *
 * O que ela ainda faz de útil é converter os valores antigos: uma linha que
 * escapou da migration com "ALUNO" gravado aparece como "Estudante" na tela, em
 * vez de gritar em caixa alta no meio da tabela.
 */
export function rotuloDePerfil(perfil: string): string {
  return normalizarPerfil(perfil) ?? perfil;
}

/** "inativo", "Inativo", "INATIVO" -> "INATIVO". Qualquer outra coisa -> `null`. */
export function normalizarStatusPessoa(bruto: string): string | null {
  const chave = semAcento(bruto).trim();

  if (chave === "ativo") return STATUS_PESSOA.ativo;
  if (chave === "inativo") return STATUS_PESSOA.inativo;

  return null;
}

/* ------------------------------------------------------------------------- *
 * Regra 3 — Cursos: nomenclatura oficial e ordem hierárquica
 * ------------------------------------------------------------------------- */

/**
 * Os cursos que o sistema conhece, **na ordem em que a string gravada precisa
 * sair**.
 *
 * A ordem é a posição nesta lista, e não uma tabela de prioridade ao lado: o
 * índice no array *é* a hierarquia que o enunciado exige ("Sistemas de
 * Informação, Ciência da Computação, Engenharia da Computação"). Assim
 * "EC, SI" e "SI, EC" gravam a mesma string, e a busca do painel deixa de
 * depender da ordem em que a coordenação digitou.
 *
 * **"Ciência da Computação" fica no singular.** O enunciado escreveu
 * "Ciências", mas é o singular que está no `dev.db`, no `pessoas.example.csv` e
 * no nome oficial do curso; adotar o plural faria toda pessoa já cadastrada
 * divergir do mapa na primeira importação. Confirmado com o dono do repositório
 * antes de virar código.
 *
 * `reconhece` roda sobre a chave normalizada (sem acento, sem pontuação, em
 * minúsculas, hífen já virado espaço), e por isso não precisa listar cada
 * grafia: `sistemas? (d[aeo] )?informa\w*` cobre "SI", "Sistema de Informação",
 * "sistemas de informacao" e "sistema-informação" de uma vez.
 */
export const CURSOS_OFICIAIS: readonly { nome: string; reconhece: RegExp }[] = [
  { nome: "Sistemas de Informação", reconhece: /^(si|sistemas? (d[aeo] )?informa\w*)$/ },
  { nome: "Ciência da Computação", reconhece: /^(cc|cienc\w* (d[aeo] )?comput\w*)$/ },
  { nome: "Engenharia da Computação", reconhece: /^(ec|engenharia (d[aeo] )?comput\w*)$/ },
];

/**
 * "EC, si , Direito, SI" -> "Sistemas de Informação, Engenharia da Computação,
 * Direito".
 *
 * Três coisas acontecem aqui, e a ordem entre elas importa: cada pedaço é
 * reconhecido, os repetidos somem, e o resultado sai na hierarquia da lista
 * oficial. O "SI" duplicado do exemplo acima é o caso comum de planilha que
 * ganhou uma coluna colada de outra.
 *
 * **Curso fora do mapa é mantido, não descartado.** O enunciado só nomeia três
 * cursos, mas a Unoesc tem dezenas — e o próprio modal de edição do painel
 * sugere "Ex.: Sistemas de Informação, Direito". Descartar seria perder dado
 * sem erro nenhum aparecer; reprovar a linha impediria importar qualquer pessoa
 * fora dos três cursos até alguém editar o mapa no código. Eles vão para o fim,
 * em ordem alfabética entre si, com o mesmo Title Case do nome: a hierarquia
 * pedida continua valendo para quem está nela, e o resto fica previsível.
 *
 * Devolve `""` quando não sobra nada. Como no nome, quem chama não pode
 * confundir isso com "a planilha não trouxe cursos".
 */
export function normalizarCursos(bruto: string): string {
  /** Índices de `CURSOS_OFICIAIS` que apareceram, sem repetição. */
  const oficiais = new Set<number>();
  /** Chave normalizada -> nome exibido, para o desconhecido não entrar duas vezes. */
  const outros = new Map<string, string>();

  // Vírgula é o separador do enunciado; os outros aparecem em planilha real
  // exportada de sistema acadêmico, e custam um caractere a mais na classe.
  for (const pedaco of bruto.split(/[,;/|\r\n]+/)) {
    const limpo = pedaco
      .replace(/[-–—_]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

    if (limpo.length === 0) continue;

    const chave = semAcento(limpo)
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    if (chave.length === 0) continue;

    const indice = CURSOS_OFICIAIS.findIndex((curso) => curso.reconhece.test(chave));

    if (indice !== -1) {
      oficiais.add(indice);
      continue;
    }

    if (!outros.has(chave)) outros.set(chave, emTitleCase(limpo));
  }

  const naHierarquia = CURSOS_OFICIAIS.filter((_, indice) => oficiais.has(indice)).map(
    (curso) => curso.nome,
  );

  const desconhecidos = [...outros.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return [...naHierarquia, ...desconhecidos].join(", ");
}
