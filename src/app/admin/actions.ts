"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  alterarSenha,
  autenticar,
  criarSessao,
  encerrarSessao,
  sessaoAdmin,
  temSessaoAdmin,
} from "@/lib/sessao-admin";
import { semAcento } from "@/lib/texto";
import {
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  type EstadoDaCategoria,
  type EstadoDoCadastro,
  type EstadoDoLogin,
  type MotivoDeFalha,
  type RecebimentoConfirmado,
  type RecebimentoEmLote,
  type Resultado,
  type SenhaAlterada,
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

/**
 * Teto de baixas em uma chamada de "Confirmar Todas".
 *
 * A fila real da secretaria tem unidades, não centenas — o número existe para
 * que um POST forjado não vire uma varredura do banco inteiro em uma requisição
 * só. Se a fila passar disso, a tela pede duas rodadas.
 */
const MAXIMO_DE_BAIXAS_EM_LOTE = 50;

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
    "Atualize a página e entre de novo.",
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
 * Confere usuário e senha contra a tabela `Administrador` e abre a sessão
 * (Tarefa 10).
 *
 * A assinatura é a do `useActionState` (estado anterior, formulário). O sucesso
 * não devolve estado: emite `redirect` para o próprio /admin, que agora
 * renderiza o painel porque o cookie já foi para a resposta.
 *
 * **"Usuário ou senha inválidos" é uma mensagem só de propósito.** Distinguir
 * "esse login não existe" de "a senha está errada" entrega metade da
 * credencial a quem está tentando adivinhar — e a metade mais cara de
 * descobrir. O tempo de resposta também não distingue os dois casos; quem
 * garante isso é o `HASH_DE_ISCA` em [sessao-admin](src/lib/sessao-admin.ts).
 *
 * A exceção é "não há administrador cadastrado": esse é problema de
 * instalação, não tentativa de invasão, e precisa dizer o comando que resolve.
 * É o que sobrou do antigo aviso de `ADMIN_PASSWORD` ausente.
 */
export async function entrarNoAdmin(
  _estadoAnterior: EstadoDoLogin,
  formulario: FormData,
): Promise<EstadoDoLogin> {
  const autenticacao = await autenticar(
    formulario.get("usuario"),
    formulario.get("senha"),
  );

  if (autenticacao.resultado === "sem-contas") {
    return {
      mensagem: "Nenhum administrador cadastrado.",
      detalhe:
        "Rode `npm run db:seed` no servidor para criar as contas do painel.",
    };
  }

  if (autenticacao.resultado === "bloqueado") {
    return {
      mensagem: "Muitas tentativas seguidas.",
      detalhe: `Aguarde ${autenticacao.segundos} segundos antes de tentar de novo.`,
    };
  }

  if (autenticacao.resultado === "vazio") {
    return { mensagem: "Informe o usuário e a senha." };
  }

  if (autenticacao.resultado === "credenciais") {
    return {
      mensagem: "Usuário ou senha inválidos.",
      detalhe: "Confira o teclado e tente novamente.",
    };
  }

  await criarSessao(autenticacao.admin);

  // Fora de try/catch de propósito: `redirect` sinaliza por exceção, e um
  // catch por perto engoliria a navegação.
  redirect(RAIZ_DO_PAINEL);
}

/** Fecha a sessão. O painel volta a ser a tela de senha. */
export async function sairDoAdmin(): Promise<void> {
  await encerrarSessao();
  redirect(RAIZ_DO_PAINEL);
}

/**
 * "Alterar senha" da barra lateral (Tarefa 11, item 2).
 *
 * O alvo é **sempre quem está logado**, lido do cookie aqui dentro — a tela não
 * manda id nenhum e não teria como. É a mesma regra que faz a devolução do
 * tablet filtrar pela matrícula em vez de aceitar o id que veio da tela: Server
 * Action é endpoint POST público, e aceitar "de quem é a senha" como parâmetro
 * seria oferecer a troca de senha alheia a quem souber montar a chamada.
 *
 * O sucesso **não** redireciona, ao contrário do login e da saída: a spec pede
 * aviso de sucesso e fechar o modal, e a pessoa continua onde estava. Quem
 * mantém isso possível é o `criarSessao` de dentro de `alterarSenha` — sem ele
 * a próxima requisição desta aba já cairia na tela de login.
 *
 * Não há `revalidatePath`: nada do que as cinco telas mostram depende da senha.
 * O cookie novo vai na resposta desta própria chamada.
 */
export async function alterarSenhaDoAdmin(
  senhaAtual: string,
  senhaNova: string,
  confirmacao: string,
): Promise<Resultado<SenhaAlterada>> {
  try {
    const admin = await sessaoAdmin();
    if (!admin) return semSessao();

    const troca = await alterarSenha(admin, senhaAtual, senhaNova, confirmacao);

    switch (troca.resultado) {
      case "ok":
        return { ok: true, dados: { nome: admin.nome } };

      case "sem-sessao":
        return semSessao();

      case "vazio":
        return falha(
          "SENHA_VAZIA",
          "Preencha os três campos.",
          "A senha atual, a nova e a confirmação.",
        );

      case "nao-confere":
        return falha(
          "SENHA_NAO_CONFERE",
          "A confirmação não bate com a nova senha.",
          "Digite a nova senha igual nos dois campos de baixo.",
        );

      case "fraca":
        return falha("SENHA_FRACA", troca.motivo);

      case "igual-a-atual":
        return falha(
          "SENHA_IGUAL_A_ATUAL",
          "A nova senha é igual à atual.",
          "Escolha uma senha diferente da que você já usa.",
        );

      case "atual-incorreta":
        return falha(
          "SENHA_ATUAL_INCORRETA",
          "Senha atual incorreta.",
          "Confira o teclado e tente novamente.",
        );

      case "bloqueado":
        return falha(
          "MUITAS_TENTATIVAS",
          "Muitas tentativas seguidas.",
          `Aguarde ${troca.segundos} segundos antes de tentar de novo.`,
        );
    }
  } catch (erro) {
    return falhaInterna(erro);
  }
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
    const confirmado = await darBaixa(emprestimoId);

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

/**
 * A transação da baixa de **um** empréstimo, sem invalidação de cache e sem
 * tradução de erro — as duas coisas mudam entre a baixa avulsa e a do lote.
 *
 * Lança `ForaDaFilaError` quando a linha já não está em `AGUARDANDO_BAIXA`.
 */
async function darBaixa(emprestimoId: number): Promise<RecebimentoConfirmado> {
  return prisma.$transaction(async (tx) => {
    const emprestimo = await tx.emprestimo.findFirst({
      where: {
        id: emprestimoId,
        status: STATUS_EMPRESTIMO.aguardandoBaixa,
      },
      select: {
        id: true,
        equip_id: true,
        pessoa: { select: { nome: true } },
        equipamento: {
          select: { categoria: { select: { nome: true } }, status: true },
        },
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
      tipo: emprestimo.equipamento.categoria.nome,
      nome: emprestimo.pessoa.nome,
      liberado: liberados.count === 1,
    };
  });
}

/**
 * "Confirmar Todas as Devoluções": dá baixa em tudo o que está na fila.
 *
 * **Cada item é uma transação própria, e o lote é melhor-esforço.** Não é
 * descuido: o gesto físico já aconteceu — a secretaria recolheu a pilha da
 * bancada. Se a linha 3 saiu da fila porque a colega deu baixa nela em outra
 * aba, abortar o lote inteiro desfaria a conferência das outras quatro, que
 * estão na mão de quem clicou. O resumo diz o que fechou e o que não fechou.
 *
 * Os ids vêm da tela — e não de um "tudo que estiver em AGUARDANDO_BAIXA
 * agora" — de propósito: um aluno pode ter declarado uma devolução depois do
 * render, com o aparelho ainda na mochila. O botão confirma o que a secretaria
 * viu na lista, não o que apareceu depois.
 *
 * A sessão é conferida aqui, como em toda action do painel: este é um endpoint
 * POST público, e é o que mais estraga se for chamado sem sessão.
 */
export async function confirmarTodosOsRecebimentos(
  emprestimoIdsBrutos: number[],
): Promise<Resultado<RecebimentoEmLote>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const ids = Array.from(
    new Set(
      (Array.isArray(emprestimoIdsBrutos) ? emprestimoIdsBrutos : [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );

  if (ids.length === 0) {
    return falha(
      "EMPRESTIMO_NAO_ENCONTRADO",
      "Nada para confirmar.",
      "A fila está vazia ou a página está desatualizada.",
    );
  }

  if (ids.length > MAXIMO_DE_BAIXAS_EM_LOTE) {
    return falha(
      "SELECAO_EXCEDIDA",
      `São no máximo ${MAXIMO_DE_BAIXAS_EM_LOTE} baixas por vez.`,
      "Confirme em duas rodadas — a lista se atualiza sozinha entre elas.",
    );
  }

  const resumo: RecebimentoEmLote = {
    confirmados: [],
    presas: [],
    foraDaFila: 0,
    comFalha: 0,
  };

  // Sequencial, não `Promise.all`: são escritas no mesmo arquivo SQLite, e
  // dez transações concorrendo pelo mesmo lock só trocam paralelismo por
  // "database is locked".
  for (const id of ids) {
    try {
      const baixado = await darBaixa(id);

      resumo.confirmados.push(baixado.equip_id);
      if (!baixado.liberado) resumo.presas.push(baixado.equip_id);
    } catch (erro) {
      if (erro instanceof ForaDaFilaError) {
        resumo.foraDaFila += 1;
        continue;
      }

      console.error("[admin] falha ao dar baixa em lote:", erro);
      resumo.comFalha += 1;
    }
  }

  // Uma invalidação para o lote inteiro: a fila, os ativos e o inventário são
  // relidos uma vez só, e não uma vez por item.
  revalidatePath(RAIZ_DO_PAINEL, "layout");

  if (resumo.confirmados.length === 0) {
    return falha(
      "EMPRESTIMO_NAO_ENCONTRADO",
      "Nenhuma baixa foi registrada.",
      resumo.comFalha > 0
        ? "Tente de novo. Se continuar, confira se o banco de dados está acessível."
        : "A fila já tinha sido conferida em outra aba. A lista foi atualizada.",
    );
  }

  return { ok: true, dados: resumo };
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
 * De onde um equipamento pode vir, para cada destino que o painel oferece.
 *
 * É a regra de negócio inteira em uma tabela, e ela é lida **no servidor**: a
 * tela manda para onde quer levar o item, nunca de onde ele está saindo. Isso
 * fecha o conjunto de transições permitidas e ainda dá de graça a trava de
 * concorrência — o `updateMany` filtra pela origem e conta as linhas afetadas,
 * então duas abas clicando ao mesmo tempo mudam a linha uma vez só.
 *
 * `EMPRESTADO` não aparece nem como origem nem como destino. Esse status
 * pertence ao ciclo de empréstimo: quem o define é a retirada no tablet, quem o
 * desfaz é a confirmação de recebimento. Mudá-lo à mão deixaria um `Emprestimo`
 * aberto apontando para um equipamento "disponível" — o tablet ofereceria um
 * aparelho que está na mochila de alguém.
 *
 * `MANUTENCAO` também não é alcançável a partir de `INATIVO`: um aparelho
 * aposentado volta para a prateleira primeiro, e só então alguém decide que ele
 * precisa de conserto. Dois passos, e não um atalho que junta duas decisões
 * diferentes no mesmo clique.
 *
 * É um `Map`, e não um objeto: `ORIGENS[chave]` em um objeto responde a
 * `"constructor"` e `"toString"` com valores herdados do protótipo — e o que
 * chega aqui é o corpo de um POST público.
 */
const ORIGENS_PERMITIDAS = new Map<string, readonly string[]>([
  [
    STATUS_EQUIPAMENTO.disponivel,
    [STATUS_EQUIPAMENTO.manutencao, STATUS_EQUIPAMENTO.inativo],
  ],
  [STATUS_EQUIPAMENTO.manutencao, [STATUS_EQUIPAMENTO.disponivel]],
  [
    STATUS_EQUIPAMENTO.inativo,
    [STATUS_EQUIPAMENTO.disponivel, STATUS_EQUIPAMENTO.manutencao],
  ],
]);

/**
 * Move um equipamento entre as situações que o painel controla: `DISPONIVEL`,
 * `MANUTENCAO` e `INATIVO`.
 *
 * As transições válidas estão em `ORIGENS_PERMITIDAS`. Além delas, duas travas:
 *
 * - Com empréstimo aberto (`ATIVO` ou `AGUARDANDO_BAIXA`), nada muda mesmo que
 *   o status do equipamento esteja inconsistente. Primeiro fecha-se o ciclo.
 * - `EMPRESTADO` sem empréstimo aberto é inconsistência de dados, e a action
 *   recusa em vez de "consertar" — liberar um item que talvez esteja com
 *   alguém é pior do que uma mensagem pedindo para conferir o histórico.
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

  const destino = typeof novoStatusBruto === "string" ? novoStatusBruto : "";
  const origens = ORIGENS_PERMITIDAS.get(destino);

  if (!origens) {
    return falha(
      "STATUS_INVALIDO",
      "Situação inválida para um equipamento.",
      "O painel move o equipamento entre Disponível, Manutenção e Inativo.",
    );
  }

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
          select: { status: true, pessoa: { select: { nome: true } } },
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
      const comQuem = aberto.pessoa.nome;

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
      where: { id: equipId, status: { in: [...origens] } },
      data: { status: destino },
    });

    if (alterados.count !== 1) {
      return falha(
        "STATUS_INVALIDO",
        `${equipId} não pode ir de ${rotuloDeStatus(equipamento.status)} para ${rotuloDeStatus(destino)}.`,
        "A situação mudou em outra aba. A lista foi atualizada.",
      );
    }

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return { ok: true, dados: { id: equipId, status: destino } };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Formato da etiqueta, usado no cadastro e na renomeação.
 *
 * Sem espaço e sem acento porque a etiqueta é lida de um adesivo e digitada de
 * novo mais tarde: "NOTE 11" e "NOTE-11" seriam dois equipamentos, e "EXTENSÃO"
 * digitado sem o til seria um terceiro.
 */
const ETIQUETA_VALIDA = /^[A-Z0-9][A-Z0-9._-]{0,23}$/;

const AJUDA_DA_ETIQUETA =
  "Use letras, números, ponto, hífen ou sublinhado — sem espaços nem acentos. Ex.: NOTE-11.";

/**
 * Cadastra um equipamento novo (spec, seção 4, Fluxo 3, item 2).
 *
 * A etiqueta vira maiúscula: o id é comparado byte a byte no SQLite, então
 * "note-11" e "NOTE-11" conviveriam como dois equipamentos — dois adesivos
 * iguais no mesmo armário.
 *
 * **A categoria chega como id, não como texto.** Até a Tarefa 5 chegava
 * digitada, e esta action tinha que adivinhar se "notebook" era a mesma coisa
 * que "Notebook". Com a tabela `Categoria`, quem escolhe a grafia é a tela de
 * Categorias, uma vez só — aqui a única pergunta que sobra é se o id existe, e
 * quem responde é a chave estrangeira.
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
      detalhe: "Atualize a página e entre de novo.",
    };
  }

  const etiqueta = String(formulario.get("etiqueta") ?? "")
    .trim()
    .toUpperCase();
  const categoria_id = Number(formulario.get("categoria_id"));

  if (!ETIQUETA_VALIDA.test(etiqueta)) {
    return {
      fase: "erro",
      mensagem: "Etiqueta inválida.",
      detalhe: AJUDA_DA_ETIQUETA,
    };
  }

  if (!Number.isInteger(categoria_id) || categoria_id <= 0) {
    return {
      fase: "erro",
      mensagem: "Escolha a categoria do equipamento.",
      detalhe: "A lista vem da tela de Categorias, no menu ao lado.",
    };
  }

  try {
    const equipamento = await prisma.equipamento.create({
      data: { id: etiqueta, categoria_id, status: STATUS_EQUIPAMENTO.disponivel },
      select: { categoria: { select: { nome: true } } },
    });

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return {
      fase: "sucesso",
      mensagem: `${etiqueta} cadastrado em ${equipamento.categoria.nome} e disponível para retirada.`,
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

    // P2003 = chave estrangeira. A categoria escolhida foi excluída entre o
    // render da página e o envio do formulário.
    if (codigoDoPrisma(erro) === "P2003") {
      return {
        fase: "erro",
        mensagem: "Essa categoria não existe mais.",
        detalhe: "Atualize a página: alguém pode tê-la excluído em outra aba.",
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
 * Troca a etiqueta de um equipamento (Tarefa 6).
 *
 * A etiqueta é a **chave primária** do `Equipamento` e é para lá que o
 * histórico inteiro aponta (`Emprestimo.equip_id`). Renomear parece perigoso e
 * não é: a chave estrangeira foi declarada `onUpdate: Cascade` e o adapter do
 * SQLite roda com `PRAGMA foreign_keys = ON`, então o banco propaga a troca
 * para todos os empréstimos, ativos e concluídos, dentro da mesma instrução.
 * Foi conferido contra o `dev.db` antes de esta action existir.
 *
 * Só `DISPONIVEL` pode ser renomeado, e a regra é do negócio: um adesivo é
 * trocado com o aparelho na mão, na bancada. Enquanto o item está com alguém —
 * ou marcado como emprestado — a etiqueta na tela tem que continuar batendo com
 * a que o aluno vai devolver.
 *
 * A trava de concorrência é a de sempre: o `updateMany` filtra pelo status
 * esperado e conta as linhas: zero significa que o item saiu de `DISPONIVEL`
 * entre o render e o clique.
 */
export async function renomearEtiqueta(
  equipIdBruto: string,
  novaEtiquetaBruta: string,
): Promise<Resultado<{ de: string; para: string }>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const atual = typeof equipIdBruto === "string" ? equipIdBruto.trim() : "";
  const nova =
    typeof novaEtiquetaBruta === "string"
      ? novaEtiquetaBruta.trim().toUpperCase()
      : "";

  if (atual.length === 0) {
    return falha("EQUIPAMENTO_NAO_ENCONTRADO", "Equipamento não informado.");
  }

  if (!ETIQUETA_VALIDA.test(nova)) {
    return falha("ETIQUETA_INVALIDA", "Etiqueta inválida.", AJUDA_DA_ETIQUETA);
  }

  try {
    const equipamento = await prisma.equipamento.findUnique({
      where: { id: atual },
      select: { id: true, status: true },
    });

    if (!equipamento) {
      return falha(
        "EQUIPAMENTO_NAO_ENCONTRADO",
        `Equipamento ${atual} não existe.`,
        "Atualize a página: a lista pode estar desatualizada.",
      );
    }

    if (equipamento.status !== STATUS_EQUIPAMENTO.disponivel) {
      return falha(
        "STATUS_INVALIDO",
        `${atual} não está disponível.`,
        `A etiqueta só é trocada com o aparelho na bancada — este consta como ${rotuloDeStatus(equipamento.status)}.`,
      );
    }

    if (nova === atual) {
      return { ok: true, dados: { de: atual, para: atual } };
    }

    const alterados = await prisma.equipamento.updateMany({
      where: { id: atual, status: STATUS_EQUIPAMENTO.disponivel },
      data: { id: nova },
    });

    if (alterados.count !== 1) {
      return falha(
        "STATUS_INVALIDO",
        `${atual} deixou de estar disponível.`,
        "A situação mudou em outra aba. A lista foi atualizada.",
      );
    }

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return { ok: true, dados: { de: atual, para: nova } };
  } catch (erro) {
    if (codigoDoPrisma(erro) === "P2002") {
      return falha(
        "ETIQUETA_DUPLICADA",
        `A etiqueta ${nova} já existe.`,
        "Cada adesivo é único no inventário. Confira a lista abaixo.",
      );
    }

    return falhaInterna(erro);
  }
}

/* ------------------------------------------------------------------------- *
 * Gestão de Categorias
 * ------------------------------------------------------------------------- */

/**
 * Cadastra uma categoria (Tarefa 6).
 *
 * A recusa por equivalência é o ponto da tela: `nome` é único no banco, mas o
 * SQLite compara byte a byte — "notebook" e "Notebook" passariam as duas, e o
 * tablet mostraria dois cartões para a mesma prateleira. Aqui a comparação
 * ignora caixa e acento, então "extensao" esbarra em "Extensão" e a mensagem
 * diz qual é a grafia que já existe.
 */
export async function cadastrarCategoria(
  _estadoAnterior: EstadoDaCategoria,
  formulario: FormData,
): Promise<EstadoDaCategoria> {
  if (!(await temSessaoAdmin())) {
    return {
      fase: "erro",
      mensagem: "Sessão encerrada.",
      detalhe: "Atualize a página e entre de novo.",
    };
  }

  const digitado = String(formulario.get("nome") ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (digitado.length === 0 || digitado.length > 30) {
    return {
      fase: "erro",
      mensagem: "Informe o nome da categoria.",
      detalhe: "Até 30 caracteres. Ex.: Notebook, Tablet, Projetor.",
    };
  }

  try {
    const existentes = await prisma.categoria.findMany({ select: { nome: true } });
    const chave = semAcento(digitado);
    const equivalente = existentes.find((item) => semAcento(item.nome) === chave);

    if (equivalente) {
      return {
        fase: "erro",
        mensagem: `A categoria ${equivalente.nome} já existe.`,
        detalhe: "Duas grafias da mesma categoria virariam duas prateleiras no tablet.",
      };
    }

    // Nome no singular e com inicial maiúscula: é assim que ele aparece na
    // linha do inventário. O plural do tablet ("Notebooks") é calculado na
    // hora de exibir, e não guardado.
    const nome = digitado.charAt(0).toUpperCase() + digitado.slice(1);

    await prisma.categoria.create({ data: { nome } });

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return {
      fase: "sucesso",
      mensagem: `Categoria ${nome} criada. Já dá para cadastrar equipamentos nela.`,
    };
  } catch (erro) {
    if (codigoDoPrisma(erro) === "P2002") {
      return {
        fase: "erro",
        mensagem: `A categoria ${digitado} já existe.`,
        detalhe: "Ela pode ter sido criada em outra aba. Atualize a página.",
      };
    }

    console.error("[admin] falha ao cadastrar categoria:", erro);

    return {
      fase: "erro",
      mensagem: "Não foi possível criar a categoria.",
      detalhe: "Tente de novo. Se continuar, confira o banco de dados.",
    };
  }
}

/**
 * Exclui uma categoria — e só consegue se ela estiver vazia.
 *
 * **Quem recusa é o banco**, não esta função: a relação foi declarada
 * `onDelete: Restrict`, então um DELETE com equipamento vinculado volta P2003 e
 * a linha continua lá. A contagem lida antes existe para dar a mensagem certa
 * ("3 equipamentos vinculados") e para a tela não oferecer um botão que só
 * poderia dar erro — mas ela envelhece no mesmo instante em que é lida, e é o
 * `catch` do P2003 que segura o caso real: alguém cadastrando um equipamento
 * nessa categoria em outra aba enquanto a exclusão está em voo.
 *
 * Categoria não é histórico: nenhum `Emprestimo` aponta para ela, só
 * equipamentos. Por isso ela pode ser apagada de verdade, enquanto o
 * equipamento só pode ser inativado.
 */
export async function excluirCategoria(
  categoriaIdBruta: number,
): Promise<Resultado<{ id: number; nome: string }>> {
  if (!(await temSessaoAdmin())) return semSessao();

  const id = Number(categoriaIdBruta);

  if (!Number.isInteger(id) || id <= 0) {
    return falha(
      "CATEGORIA_NAO_ENCONTRADA",
      "Categoria inválida.",
      "Atualize a página e tente de novo.",
    );
  }

  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      select: { id: true, nome: true, _count: { select: { equipamentos: true } } },
    });

    if (!categoria) {
      return falha(
        "CATEGORIA_NAO_ENCONTRADA",
        "Essa categoria já não existe.",
        "Outra pessoa pode tê-la excluído. A lista foi atualizada.",
      );
    }

    if (categoria._count.equipamentos > 0) {
      return falha(
        "CATEGORIA_EM_USO",
        `${categoria.nome} ainda tem equipamentos.`,
        AJUDA_DA_CATEGORIA_EM_USO,
      );
    }

    await prisma.categoria.delete({ where: { id } });

    revalidatePath(RAIZ_DO_PAINEL, "layout");

    return { ok: true, dados: { id: categoria.id, nome: categoria.nome } };
  } catch (erro) {
    if (codigoDoPrisma(erro) === "P2003") {
      return falha(
        "CATEGORIA_EM_USO",
        "A categoria ainda tem equipamentos.",
        AJUDA_DA_CATEGORIA_EM_USO,
      );
    }

    return falhaInterna(erro);
  }
}

/**
 * O detalhe da recusa, dito igual nos dois caminhos: o da contagem lida antes e
 * o do P2003 que o banco devolve quando um equipamento entrou no meio.
 */
const AJUDA_DA_CATEGORIA_EM_USO =
  "Inative os equipamentos dessa categoria antes de excluí-la — apagá-la levaria junto o histórico de empréstimos deles.";

/** Rótulo em português de um status de equipamento, para mensagens de erro. */
function rotuloDeStatus(status: string): string {
  if (status === STATUS_EQUIPAMENTO.disponivel) return "disponível";
  if (status === STATUS_EQUIPAMENTO.emprestado) return "emprestado";
  if (status === STATUS_EQUIPAMENTO.inativo) return "inativo";
  return "em manutenção";
}
