"use server";

import { revalidatePath } from "next/cache";

import {
  MAXIMO_DE_BYTES,
  PlanilhaInvalidaError,
  lerPlanilha,
  montarPlano,
  type OperacaoDaLinha,
  type UsuarioExistente,
} from "@/lib/planilha-usuarios";
import { prisma } from "@/lib/prisma";
import { temSessaoAdmin } from "@/lib/sessao-admin";
import {
  PERFIL,
  STATUS_EMPRESTIMO,
  STATUS_USUARIO,
  type ImportacaoConcluida,
  type MotivoDeFalha,
  type PreviaDaImportacao,
  type Resultado,
  type UsuarioDoPainel,
} from "@/lib/tipos";

/**
 * Server Actions da Gestão de Usuários — Tarefa 8.
 *
 * Mora em arquivo próprio, e não no [actions.ts](src/app/admin/actions.ts) do
 * painel, por tamanho: aquele já passa de 900 linhas com a fila, o inventário e
 * as categorias. A regra de sempre continua valendo aqui, e é a que importa —
 * **toda action começa por `temSessaoAdmin()`**, porque cada uma é um endpoint
 * POST público que qualquer um na rede local alcança sem passar pela tela. E é
 * aqui que ela mais estraga: a importação escreve na tabela inteira de uma vez.
 */

const RAIZ_DO_PAINEL = "/admin";

function falha(
  motivo: MotivoDeFalha,
  mensagem: string,
  detalhe?: string,
): Resultado<never> {
  return { ok: false, motivo, mensagem, detalhe };
}

function semSessao(): Resultado<never> {
  return falha(
    "SEM_SESSAO",
    "Sessão encerrada.",
    "Atualize a página e informe a senha novamente.",
  );
}

function falhaInterna(erro: unknown): Resultado<never> {
  console.error("[admin/usuarios] falha inesperada:", erro);

  return falha(
    "FALHA_INTERNA",
    "Não foi possível concluir a operação.",
    "Tente de novo. Se continuar, confira se o banco de dados está acessível.",
  );
}

function codigoDoPrisma(erro: unknown): string | null {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    const { code } = erro as { code?: unknown };
    return typeof code === "string" ? code : null;
  }

  return null;
}

/* ------------------------------------------------------------------------- *
 * Importação de planilha (.xlsx)
 * ------------------------------------------------------------------------- */

/**
 * Lê a planilha, confronta com o banco e devolve **o que aconteceria** — sem
 * escrever nada.
 *
 * A prévia existe porque a importação não tem desfazer. Um arquivo errado
 * sobrescreve centenas de cadastros, e um relatório depois do fato só conta o
 * estrago. Foi levantado como conflito de reversibilidade antes de existir
 * código, e a resposta foi esta etapa: a secretaria vê a lista do que vai
 * mudar, campo a campo, e só então confirma.
 */
export async function analisarPlanilha(
  formulario: FormData,
): Promise<Resultado<PreviaDaImportacao>> {
  if (!(await temSessaoAdmin())) return semSessao();

  try {
    const arquivo = await extrairArquivo(formulario);
    if (!arquivo.ok) return arquivo;

    const { bytes, nome } = arquivo.dados;
    const lida = lerPlanilha(bytes, nome);
    const existentes = await carregarExistentes();
    const { previa } = montarPlano(lida.linhas, existentes);

    return {
      ok: true,
      dados: {
        arquivo: nome,
        colunas: lida.colunas,
        linhas: previa,
        totais: contar(previa),
      },
    };
  } catch (erro) {
    if (erro instanceof PlanilhaInvalidaError) {
      return falha(erro.motivo, erro.message, erro.detalhe);
    }

    return falhaInterna(erro);
  }
}

/**
 * Grava o que a prévia mostrou.
 *
 * **A planilha é lida de novo e o plano é refeito aqui**, em vez de a tela
 * mandar as operações que já calculou. Dois motivos, e os dois são o mesmo
 * motivo do resto do projeto: esta é uma action pública, então uma lista de
 * "atualize a matrícula X para o perfil Y" vinda do cliente seria escrita direta
 * no banco sem passar por nenhuma regra; e o banco pode ter mudado entre a
 * prévia e o clique — alguém cadastrando pela tela em outra aba —, caso em que
 * o que vale é o estado de agora, não o do render.
 *
 * **Uma transação só, e não linha a linha.** Ao contrário da baixa em lote da
 * fila (que é melhor-esforço porque o gesto físico já aconteceu), aqui a
 * secretaria conferiu uma lista e clicou uma vez: aplicar metade dela deixaria
 * a base em um estado que ninguém revisou. Ou entra tudo, ou não entra nada.
 */
export async function importarPlanilha(
  formulario: FormData,
): Promise<Resultado<ImportacaoConcluida>> {
  if (!(await temSessaoAdmin())) return semSessao();

  try {
    const arquivo = await extrairArquivo(formulario);
    if (!arquivo.ok) return arquivo;

    const { bytes, nome } = arquivo.dados;
    const lida = lerPlanilha(bytes, nome);
    const existentes = await carregarExistentes();
    const { operacoes } = montarPlano(lida.linhas, existentes);

    const resultado = await gravar(operacoes);

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return { ok: true, dados: resultado };
  } catch (erro) {
    if (erro instanceof PlanilhaInvalidaError) {
      return falha(erro.motivo, erro.message, erro.detalhe);
    }

    return falhaInterna(erro);
  }
}

/**
 * A escrita propriamente dita.
 *
 * O `timeout` é esticado porque o padrão do Prisma para transação interativa é
 * de 5 segundos, e uma planilha de curso inteiro passa disso sem ser um
 * problema — abortar no meio por relógio seria o pior dos dois mundos: nada
 * gravado depois de a secretaria confirmar.
 */
async function gravar(operacoes: OperacaoDaLinha[]): Promise<ImportacaoConcluida> {
  const resultado: ImportacaoConcluida = {
    criados: 0,
    atualizados: 0,
    inalterados: 0,
    erros: 0,
  };

  await prisma.$transaction(
    async (tx) => {
      for (const operacao of operacoes) {
        if (operacao.tipo === "erro") {
          resultado.erros += 1;
          continue;
        }

        if (operacao.tipo === "inalterada") {
          resultado.inalterados += 1;
          continue;
        }

        if (operacao.tipo === "criar") {
          await tx.usuario.create({ data: operacao.dados });
          resultado.criados += 1;
          continue;
        }

        await tx.usuario.update({
          where: { matricula: operacao.matricula },
          data: operacao.campos,
        });
        resultado.atualizados += 1;
      }
    },
    { timeout: 120_000, maxWait: 10_000 },
  );

  return resultado;
}

/** O banco inteiro em memória, para o plano poder comparar campo a campo. */
async function carregarExistentes(): Promise<Map<string, UsuarioExistente>> {
  const usuarios = await prisma.usuario.findMany({
    select: {
      matricula: true,
      nome: true,
      perfil: true,
      cursos: true,
      status: true,
    },
  });

  return new Map(usuarios.map((usuario) => [usuario.matricula, usuario]));
}

/**
 * Tira o arquivo do formulário e recusa o que não é planilha do Excel.
 *
 * A extensão é conferida além do tipo MIME porque o navegador informa o tipo a
 * partir do registro do sistema operacional, e em máquina de secretaria ele vem
 * vazio com frequência. Quem decide de verdade é a biblioteca de leitura, logo
 * depois: um `.xlsx` que não seja um `.xlsx` por dentro cai no `catch` dela.
 */
async function extrairArquivo(
  formulario: FormData,
): Promise<Resultado<{ bytes: ArrayBuffer; nome: string }>> {
  const enviado = formulario.get("planilha");

  if (!(enviado instanceof File) || enviado.size === 0) {
    return falha(
      "ARQUIVO_INVALIDO",
      "Nenhum arquivo foi enviado.",
      "Escolha a planilha .xlsx exportada pela coordenação.",
    );
  }

  if (!enviado.name.toLowerCase().endsWith(".xlsx")) {
    return falha(
      "ARQUIVO_INVALIDO",
      `${enviado.name} não é uma planilha .xlsx.`,
      "Se o arquivo estiver em .xls ou .csv, abra no Excel e use Salvar como → Pasta de Trabalho do Excel (.xlsx).",
    );
  }

  if (enviado.size > MAXIMO_DE_BYTES) {
    return falha(
      "PLANILHA_EXCEDIDA",
      "O arquivo é grande demais.",
      `O limite é de ${Math.floor(MAXIMO_DE_BYTES / (1024 * 1024))} MB. Divida a planilha em partes.`,
    );
  }

  return { ok: true, dados: { bytes: await enviado.arrayBuffer(), nome: enviado.name } };
}

function contar(linhas: PreviaDaImportacao["linhas"]): PreviaDaImportacao["totais"] {
  return {
    criar: linhas.filter((linha) => linha.acao === "criar").length,
    atualizar: linhas.filter((linha) => linha.acao === "atualizar").length,
    inalteradas: linhas.filter((linha) => linha.acao === "inalterada").length,
    erros: linhas.filter((linha) => linha.acao === "erro").length,
  };
}

/* ------------------------------------------------------------------------- *
 * Ações de linha da tabela
 * ------------------------------------------------------------------------- */

/**
 * De onde um cadastro pode vir, para cada destino que a tela oferece.
 *
 * Mesma forma da tabela de transições do inventário, e pelo mesmo motivo: **é o
 * destino que a tela manda, nunca a origem**. O servidor deriva de onde o
 * cadastro pode estar saindo e o `updateMany` filtra por isso — o que fecha o
 * conjunto de transições e dá de graça a trava de concorrência, porque duas
 * abas clicando ao mesmo tempo mudam a linha uma vez só.
 *
 * É um `Map` e não um objeto literal: `ORIGENS["constructor"]` em objeto
 * responde com valor herdado do protótipo, e a guarda `if (!origens)` deixaria
 * passar. O que chega aqui é o corpo de um POST público.
 */
const ORIGENS_PERMITIDAS = new Map<string, readonly string[]>([
  [STATUS_USUARIO.ativo, [STATUS_USUARIO.inativo]],
  [STATUS_USUARIO.inativo, [STATUS_USUARIO.ativo]],
]);

/**
 * O botão de um clique da linha: ativa ou inativa o cadastro.
 *
 * **Empréstimo aberto não bloqueia.** É diferente do equipamento, e de
 * propósito: inativa-se justamente quem saiu da faculdade, e essa pessoa quase
 * sempre ainda está com um aparelho. Travar aqui obrigaria a secretaria a
 * lembrar de voltar depois, e o cadastro ficaria ativo — ou seja, apto a
 * retirar mais — no intervalo. O empréstimo continua aberto e visível na aba
 * Empréstimos Ativos, que é onde a cobrança acontece.
 */
export async function alterarStatusUsuario(
  matriculaBruta: string,
  novoStatusBruto: string,
): Promise<Resultado<{ matricula: string; nome: string; status: string }>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const matricula = typeof matriculaBruta === "string" ? matriculaBruta.trim() : "";

  if (matricula.length === 0) {
    return falha("USUARIO_NAO_ENCONTRADO", "Usuário não informado.");
  }

  const destino = typeof novoStatusBruto === "string" ? novoStatusBruto : "";
  const origens = ORIGENS_PERMITIDAS.get(destino);

  if (!origens) {
    return falha(
      "STATUS_INVALIDO",
      "Situação inválida para um cadastro.",
      "O painel move o cadastro entre Ativo e Inativo.",
    );
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { matricula },
      select: { matricula: true, nome: true, status: true },
    });

    if (!usuario) {
      return falha(
        "USUARIO_NAO_ENCONTRADO",
        `A matrícula ${matricula} não existe.`,
        "Atualize a página: a lista pode estar desatualizada.",
      );
    }

    const alterados = await prisma.usuario.updateMany({
      where: { matricula, status: { in: [...origens] } },
      data: { status: destino },
    });

    if (alterados.count !== 1) {
      return falha(
        "STATUS_INVALIDO",
        `${usuario.nome} já está ${destino === STATUS_USUARIO.ativo ? "inativo" : "ativo"}... ou mudou em outra aba.`,
        "A lista foi atualizada.",
      );
    }

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return {
      ok: true,
      dados: { matricula, nome: usuario.nome, status: destino },
    };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Formato aceito para a matrícula: **só dígitos, até 15**.
 *
 * O limite não é preferência, é o teclado do tablet. A
 * [TelaMatricula](src/components/portal/TelaMatricula.tsx) tem um teclado
 * numérico e o `onChange` do campo descarta tudo que não é dígito, cortando em
 * 15 — de propósito, porque o portal é operado com o dedo, em pé.
 *
 * Uma validação mais frouxa aqui foi tentada e **reprovada na verificação**:
 * ela deixava a secretaria gravar "TROCADA-01" com sucesso, criando um cadastro
 * que existe no banco, aparece no painel, e que **ninguém consegue digitar no
 * tablet** — um usuário que nunca mais retira nem devolve nada. A regra do
 * campo mais restrito é que vale para o sistema inteiro; se um dia a
 * coordenação passar a usar prefixo de letra, quem muda primeiro é o teclado.
 *
 * **Não há transformação de caixa**, ao contrário da etiqueta do equipamento:
 * não há letra para transformar, e o zero à esquerda é significativo.
 */
const MATRICULA_VALIDA = /^\d{1,15}$/;

const AJUDA_DA_MATRICULA =
  "Use somente números, até 15 dígitos — é o que o teclado do tablet aceita. Os zeros à esquerda são significativos e devem ser digitados.";

/**
 * Edição manual completa, o modal da tabela.
 *
 * **A matrícula pode mudar**, e é o item 1 da tarefa que pede isso ("correções
 * ortográficas na matrícula não quebrem o histórico"). Ela é a chave primária e
 * o histórico inteiro aponta para ela, mas a chave estrangeira é
 * `onUpdate: Cascade` e o adapter roda com `PRAGMA foreign_keys = 1` — o banco
 * propaga a troca para todos os empréstimos, abertos e concluídos, dentro da
 * mesma instrução. Foi exercitado contra uma cópia do `dev.db` antes desta
 * action existir, e não lido na documentação.
 *
 * Ao contrário da importação, aqui **todos** os campos são obrigatórios: quem
 * abriu o modal está com o formulário inteiro preenchido na frente, e um campo
 * apagado é apagamento intencional, não omissão.
 */
export async function editarUsuario(
  matriculaAtualBruta: string,
  dadosBrutos: {
    matricula: string;
    nome: string;
    perfil: string;
    cursos: string;
    status: string;
  },
): Promise<Resultado<{ de: string; para: string; nome: string }>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const atual = typeof matriculaAtualBruta === "string" ? matriculaAtualBruta.trim() : "";

  if (atual.length === 0) {
    return falha("USUARIO_NAO_ENCONTRADO", "Usuário não informado.");
  }

  const dados = dadosBrutos ?? {};
  const texto = (valor: unknown) =>
    typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : "";

  const matricula = texto(dados.matricula);
  const nome = texto(dados.nome);
  const perfil = texto(dados.perfil).toUpperCase();
  const cursos = texto(dados.cursos);
  const status = texto(dados.status).toUpperCase();

  if (!MATRICULA_VALIDA.test(matricula)) {
    return falha("MATRICULA_INVALIDA", "Matrícula inválida.", AJUDA_DA_MATRICULA);
  }

  if (nome.length === 0 || nome.length > 120) {
    return falha(
      "NOME_INVALIDO",
      "Informe o nome completo.",
      "Até 120 caracteres. É o nome que a secretaria vê na fila de devoluções.",
    );
  }

  if (perfil !== PERFIL.aluno && perfil !== PERFIL.professor) {
    return falha(
      "PERFIL_INVALIDO",
      "Perfil inválido.",
      "Use Aluno ou Professor.",
    );
  }

  if (cursos.length === 0 || cursos.length > 200) {
    return falha(
      "CURSOS_INVALIDOS",
      "Informe pelo menos um curso.",
      "Separe vários por vírgula. Ex.: Sistemas de Informação, Direito.",
    );
  }

  if (status !== STATUS_USUARIO.ativo && status !== STATUS_USUARIO.inativo) {
    return falha("STATUS_INVALIDO", "Situação inválida.", "Use Ativo ou Inativo.");
  }

  try {
    const existente = await prisma.usuario.findUnique({
      where: { matricula: atual },
      select: { matricula: true },
    });

    if (!existente) {
      return falha(
        "USUARIO_NAO_ENCONTRADO",
        `A matrícula ${atual} não existe.`,
        "Atualize a página: alguém pode tê-la alterado em outra aba.",
      );
    }

    await prisma.usuario.update({
      where: { matricula: atual },
      data: { matricula, nome, perfil, cursos, status },
    });

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return { ok: true, dados: { de: atual, para: matricula, nome } };
  } catch (erro) {
    // P2002 = chave única. A matrícula nova já pertence a outra pessoa.
    if (codigoDoPrisma(erro) === "P2002") {
      return falha(
        "MATRICULA_DUPLICADA",
        `A matrícula ${matricula} já é de outro cadastro.`,
        "Cada matrícula é única. Confira o número antes de salvar.",
      );
    }

    return falhaInterna(erro);
  }
}

/**
 * Quantos empréstimos abertos a pessoa tem agora.
 *
 * A tabela já traz esse número no render, mas o modal de inativação relê antes
 * de perguntar: entre carregar a página e clicar em Inativar cabe uma retirada
 * inteira no tablet, e a frase "está com 2 equipamentos" tem que ser verdade no
 * momento em que é lida — é ela que a secretaria usa para decidir.
 */
export async function contarEmprestimosAbertos(
  matriculaBruta: string,
): Promise<Resultado<Pick<UsuarioDoPainel, "emprestimosAbertos" | "equipamentosEmMaos">>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const matricula = typeof matriculaBruta === "string" ? matriculaBruta.trim() : "";

  if (matricula.length === 0) {
    return falha("USUARIO_NAO_ENCONTRADO", "Usuário não informado.");
  }

  try {
    const abertos = await prisma.emprestimo.findMany({
      where: {
        usuario_id: matricula,
        status: {
          in: [STATUS_EMPRESTIMO.ativo, STATUS_EMPRESTIMO.aguardandoBaixa],
        },
      },
      select: { equip_id: true },
      orderBy: { data_retirada: "asc" },
    });

    return {
      ok: true,
      dados: {
        emprestimosAbertos: abertos.length,
        equipamentosEmMaos: abertos.map((emprestimo) => emprestimo.equip_id),
      },
    };
  } catch (erro) {
    return falhaInterna(erro);
  }
}
