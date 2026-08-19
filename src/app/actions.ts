"use server";

import { prisma } from "@/lib/prisma";
import {
  MAXIMO_ITENS_POR_RETIRADA,
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  STATUS_USUARIO,
  type Categoria,
  type DevolucaoConfirmada,
  type DevolucaoEmLoteConfirmada,
  type EmprestimoAtivo,
  type EquipamentoDisponivel,
  type MotivoDeFalha,
  type Resultado,
  type RetiradaConfirmada,
  type UsuarioIdentificado,
} from "@/lib/tipos";

/**
 * Server Actions do portal do tablet — Fluxos 1 e 2 da spec (seção 4).
 *
 * Toda action é um endpoint POST público: qualquer um na rede local pode
 * chamá-la sem passar pela interface. Por isso nenhuma delas confia no que
 * chega do cliente — matrícula, etiquetas e número de empréstimo são sempre
 * reconferidos no banco antes de virar escrita. O MVP não tem autenticação no
 * tablet (decisão da spec: a barreira é física, o tablet fica na bancada da
 * secretaria), então a matrícula é a única identidade que existe: toda escrita
 * filtra por ela, e nunca só pelo id que veio da tela.
 */

function falha(
  motivo: MotivoDeFalha,
  mensagem: string,
  detalhe?: string,
  indisponiveis?: string[],
): Resultado<never> {
  return { ok: false, motivo, mensagem, detalhe, indisponiveis };
}

/** Normaliza a matrícula sem tocar em zeros à esquerda (são significativos). */
function limparMatricula(bruta: unknown): string {
  return typeof bruta === "string" ? bruta.trim() : "";
}

/**
 * Passo 1 dos dois fluxos: identifica o usuário pela matrícula.
 *
 * Devolve de uma vez o inventário por categoria (Fluxo 1) e o que já está com
 * a pessoa (Fluxo 2). Uma chamada só porque a tela seguinte mostra as duas
 * coisas lado a lado: buscar em duas etapas faria metade da tela chegar
 * atrasada, e quem veio só devolver esperaria sem motivo.
 */
export async function identificarUsuario(matriculaBruta: string): Promise<
  Resultado<{
    usuario: UsuarioIdentificado;
    categorias: Categoria[];
    emprestimos: EmprestimoAtivo[];
  }>
> {
  const matricula = limparMatricula(matriculaBruta);

  if (matricula.length === 0) {
    return falha("MATRICULA_VAZIA", "Digite a sua matrícula para continuar.");
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { matricula },
      // `select` explícito, e não o registro inteiro: o que sai daqui desce
      // para o navegador, e a próxima coluna que alguém adicionar ao `Usuario`
      // não deve virar dado público por acidente.
      select: {
        matricula: true,
        nome: true,
        perfil: true,
        cursos: true,
        status: true,
      },
    });

    if (!usuario) {
      return falha(
        "MATRICULA_NAO_ENCONTRADA",
        `Matrícula ${matricula} não encontrada.`,
        "Confira os números digitados. Se estiver certo, procure a secretaria.",
      );
    }

    /*
      Cadastro `INATIVO` **entra**. A recusa é só da retirada, e ela mora em
      `confirmarRetirada`.

      Se a barreira fosse aqui, a pessoa inativada não conseguiria nem devolver
      o que está com ela — e é justamente quem foi inativado (saiu da
      faculdade, trancou a matrícula) que costuma ter um aparelho na mochila.
      Bloquear os dois lados transformaria a inativação na garantia de que o
      equipamento nunca volta. A tela usa o `status` para trocar a grade de
      categorias por uma explicação, mantendo "Meus equipamentos" no lugar.
    */

    const [categorias, emprestimos] = await Promise.all([
      listarCategorias(),
      buscarEmprestimosAtivos(matricula),
    ]);

    return { ok: true, dados: { usuario, categorias, emprestimos } };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Categorias do inventário com a contagem de unidades livres.
 *
 * Categorias sem nenhuma unidade **livre** continuam aparecendo
 * (desabilitadas): "Notebooks — nenhum disponível" informa; a categoria sumir
 * da tela confunde. Categoria sem nenhum equipamento **nenhum** é outra coisa,
 * e some: desde a Tarefa 6 dá para criar uma categoria vazia no painel, e um
 * cartão que nunca teve aparelho não informa nada — só ocupa um alvo de toque.
 *
 * Equipamento `INATIVO` não entra em conta alguma, nem no total. Para quem está
 * no tablet, um aparelho aposentado não existe: "2 de 12 disponíveis" com
 * quatro itens fora de circulação manda a pessoa procurar o que não está lá.
 *
 * A ordem é a do `Categoria.id` — a de criação. Era uma lista fixa no código
 * até a Tarefa 6; a migration semeou Notebook, Tablet e Extensão como 1, 2 e 3,
 * então a tela continua na mesma ordem sem a lista existir.
 */
async function listarCategorias(): Promise<Categoria[]> {
  const [categorias, grupos] = await Promise.all([
    prisma.categoria.findMany({
      select: { id: true, nome: true },
      orderBy: { id: "asc" },
    }),
    prisma.equipamento.groupBy({
      by: ["categoria_id", "status"],
      where: { status: { not: STATUS_EQUIPAMENTO.inativo } },
      _count: { _all: true },
    }),
  ]);

  const totalPorCategoria = new Map<number, number>();
  const livresPorCategoria = new Map<number, number>();

  for (const grupo of grupos) {
    const quantos = grupo._count._all;

    totalPorCategoria.set(
      grupo.categoria_id,
      (totalPorCategoria.get(grupo.categoria_id) ?? 0) + quantos,
    );

    if (grupo.status === STATUS_EQUIPAMENTO.disponivel) {
      livresPorCategoria.set(grupo.categoria_id, quantos);
    }
  }

  return categorias
    .map((categoria) => ({
      tipo: categoria.nome,
      total: totalPorCategoria.get(categoria.id) ?? 0,
      disponiveis: livresPorCategoria.get(categoria.id) ?? 0,
    }))
    .filter((categoria) => categoria.total > 0);
}

/**
 * Passo 3 do fluxo: equipamentos livres de uma categoria.
 *
 * Relê o banco a cada abertura de categoria em vez de reaproveitar a contagem
 * do login — entre um toque e outro a secretaria pode ter posto um item em
 * manutenção.
 */
export async function listarDisponiveis(
  tipo: string,
): Promise<Resultado<EquipamentoDisponivel[]>> {
  try {
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        categoria: { nome: tipo },
        status: STATUS_EQUIPAMENTO.disponivel,
      },
      select: { id: true, categoria: { select: { nome: true } } },
      orderBy: { id: "asc" },
    });

    return {
      ok: true,
      dados: equipamentos.map(({ id, categoria }) => ({
        id,
        tipo: categoria.nome,
      })),
    };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Passo 5 do fluxo: confirma a retirada.
 *
 * Tudo dentro de uma transação: ou os N equipamentos ficam EMPRESTADO e os N
 * empréstimos nascem ATIVO, ou nada acontece. Cada item vira um registro
 * separado em Emprestimo — é o que permite devolver um notebook e ficar com a
 * extensão.
 *
 * A corrida real aqui é dois tablets (ou um duplo-toque) pegando o mesmo item.
 * O `updateMany` filtra por `status: DISPONIVEL` e conta quantas linhas mudou:
 * se mudou menos do que o pedido, alguém chegou antes e a transação inteira
 * volta atrás.
 */
export async function confirmarRetirada(
  matriculaBruta: string,
  equipamentosBrutos: string[],
): Promise<Resultado<RetiradaConfirmada>> {
  const matricula = limparMatricula(matriculaBruta);

  if (matricula.length === 0) {
    return falha("MATRICULA_VAZIA", "Sessão perdida. Informe a matrícula novamente.");
  }

  const ids = Array.from(
    new Set(
      (Array.isArray(equipamentosBrutos) ? equipamentosBrutos : [])
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  );

  if (ids.length === 0) {
    return falha("SELECAO_VAZIA", "Selecione pelo menos um equipamento.");
  }

  if (ids.length > MAXIMO_ITENS_POR_RETIRADA) {
    return falha(
      "SELECAO_EXCEDIDA",
      `São no máximo ${MAXIMO_ITENS_POR_RETIRADA} itens por retirada.`,
      "Para levar mais, fale com a secretaria.",
    );
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { matricula },
      select: {
        matricula: true,
        nome: true,
        perfil: true,
        cursos: true,
        status: true,
      },
    });

    if (!usuario) {
      return falha(
        "MATRICULA_NAO_ENCONTRADA",
        `Matrícula ${matricula} não encontrada.`,
        "Comece de novo pela tela inicial.",
      );
    }

    /*
      A recusa da retirada para cadastro inativo (Tarefa 8).

      Está **no servidor** e não só na tela, pela razão de sempre: esta action é
      um endpoint POST público, e a tela que esconde a grade de categorias é
      conveniência, não barreira. Sem esta linha, um POST direto retiraria
      equipamento em nome de uma matrícula desligada.

      A devolução (`confirmarDevolucao`) não tem trava equivalente, e é
      deliberado: quem devolve não está pedindo nada ao sistema — está
      entregando um aparelho que a secretaria quer de volta.
    */
    if (usuario.status === STATUS_USUARIO.inativo) {
      return falha(
        "USUARIO_INATIVO",
        "Este cadastro está inativo.",
        "Procure a secretaria para reativar a sua matrícula. Se você está com algum equipamento, a devolução continua liberada.",
      );
    }

    const retirada = await prisma.$transaction(async (tx) => {
      const itens = await tx.equipamento.findMany({
        where: { id: { in: ids }, status: STATUS_EQUIPAMENTO.disponivel },
        select: { id: true, categoria: { select: { nome: true } } },
        orderBy: { id: "asc" },
      });

      const alterados = await tx.equipamento.updateMany({
        where: { id: { in: ids }, status: STATUS_EQUIPAMENTO.disponivel },
        data: { status: STATUS_EQUIPAMENTO.emprestado },
      });

      if (alterados.count !== ids.length) {
        const indisponiveis = ids.filter(
          (id) => !itens.some((item) => item.id === id),
        );
        // Aborta a transação: o updateMany acima é desfeito junto.
        throw new EquipamentoIndisponivelError(indisponiveis);
      }

      const criados = await tx.emprestimo.createMany({
        data: ids.map((equipId) => ({
          usuario_id: usuario.matricula,
          equip_id: equipId,
          status: STATUS_EMPRESTIMO.ativo,
        })),
      });

      return {
        // A etiqueta e o nome da categoria — é o que a tela de sucesso lista.
        itens: itens.map(({ id, categoria }) => ({ id, tipo: categoria.nome })),
        registrados: criados.count,
      };
    });

    return {
      ok: true,
      dados: {
        usuario,
        itens: retirada.itens,
        registrados: retirada.registrados,
      },
    };
  } catch (erro) {
    if (erro instanceof EquipamentoIndisponivelError) {
      const lista = erro.ids.join(", ");
      return falha(
        "EQUIPAMENTO_INDISPONIVEL",
        lista.length > 0
          ? `O equipamento ${lista} acabou de sair.`
          : "Um dos equipamentos selecionados acabou de sair.",
        "Nada foi registrado. Removemos o item da sua lista — confira e confirme de novo.",
        erro.ids,
      );
    }

    return falhaInterna(erro);
  }
}

/** Erro interno da transação, usado só para abortar e voltar atrás. */
class EquipamentoIndisponivelError extends Error {
  constructor(readonly ids: string[]) {
    super("Equipamento indisponível");
    this.name = "EquipamentoIndisponivelError";
  }
}

/* ------------------------------------------------------------------------- *
 * Fluxo 2 — Devolução pelo Usuário (spec, seção 4)
 * ------------------------------------------------------------------------- */

/**
 * Leitura crua dos empréstimos `ATIVO` de uma matrícula.
 *
 * Fica fora do "use server" exportado de propósito: é reaproveitada pela
 * identificação e pela devolução, e nenhuma das duas quer um endpoint a mais
 * exposto na rede.
 */
async function buscarEmprestimosAtivos(
  matricula: string,
): Promise<EmprestimoAtivo[]> {
  const emprestimos = await prisma.emprestimo.findMany({
    where: { usuario_id: matricula, status: STATUS_EMPRESTIMO.ativo },
    select: {
      id: true,
      equip_id: true,
      data_retirada: true,
      equipamento: { select: { categoria: { select: { nome: true } } } },
    },
    // Mais antigo primeiro: o que está com a pessoa há mais tempo é o que ela
    // provavelmente veio devolver.
    orderBy: { data_retirada: "asc" },
  });

  return emprestimos.map(({ equipamento, ...emprestimo }) => ({
    ...emprestimo,
    tipo: equipamento.categoria.nome,
  }));
}

/**
 * Passo 1 do Fluxo 2: o que está com a pessoa agora.
 *
 * Só empréstimos `ATIVO`. Os que já estão em `AGUARDANDO_BAIXA` ficam de fora
 * porque, para o usuário, aquele item já foi devolvido — mostrá-lo com um botão
 * "Devolver" convidaria a devolver duas vezes o mesmo aparelho.
 */
export async function listarEmprestimosAtivos(
  matriculaBruta: string,
): Promise<Resultado<EmprestimoAtivo[]>> {
  const matricula = limparMatricula(matriculaBruta);

  if (matricula.length === 0) {
    return falha("MATRICULA_VAZIA", "Sessão perdida. Informe a matrícula novamente.");
  }

  try {
    return { ok: true, dados: await buscarEmprestimosAtivos(matricula) };
  } catch (erro) {
    return falhaInterna(erro);
  }
}

/**
 * Passo 4 do Fluxo 2: o usuário confirmou no modal que deixou o item na bancada.
 *
 * O que muda e o que **não** muda:
 * - `Emprestimo.status`: `ATIVO` -> `AGUARDANDO_BAIXA`.
 * - `Emprestimo.data_devolucao`: recebe o instante da declaração.
 * - `Equipamento.status`: continua `EMPRESTADO`. Ele só volta a `DISPONIVEL`
 *   quando a secretaria confirmar o recebimento no /admin (Fluxo 3). Liberar
 *   aqui faria o tablet oferecer um aparelho que ainda está na bancada — é
 *   exatamente o buraco que o estado `AGUARDANDO_BAIXA` existe para tapar.
 *
 * A action recebe o número do empréstimo, mas o `where` filtra também por
 * matrícula e por status `ATIVO`. Sem isso, um POST direto no endpoint daria
 * baixa no empréstimo de qualquer pessoa só chutando um id sequencial.
 */
export async function confirmarDevolucao(
  matriculaBruta: string,
  emprestimoIdBruto: number,
): Promise<Resultado<DevolucaoConfirmada>> {
  const matricula = limparMatricula(matriculaBruta);

  if (matricula.length === 0) {
    return falha("MATRICULA_VAZIA", "Sessão perdida. Informe a matrícula novamente.");
  }

  const emprestimoId = Number(emprestimoIdBruto);

  if (!Number.isInteger(emprestimoId) || emprestimoId <= 0) {
    return falha(
      "EMPRESTIMO_NAO_ENCONTRADO",
      "Não encontramos esse empréstimo.",
      "Atualize a lista e tente de novo.",
    );
  }

  try {
    const devolvido = await prisma.$transaction(async (tx) => {
      const emprestimo = await tx.emprestimo.findFirst({
        where: {
          id: emprestimoId,
          usuario_id: matricula,
          status: STATUS_EMPRESTIMO.ativo,
        },
        select: {
          id: true,
          equip_id: true,
          data_retirada: true,
          equipamento: { select: { categoria: { select: { nome: true } } } },
        },
      });

      if (!emprestimo) throw new EmprestimoNaoAtivoError();

      // O mesmo filtro de novo, agora na escrita: entre a leitura acima e esta
      // linha, um duplo-toque (ou a secretaria dando baixa no /admin) pode ter
      // mudado o status. `updateMany` conta as linhas afetadas; zero significa
      // que alguém chegou antes, e aí a transação inteira volta atrás.
      const alterados = await tx.emprestimo.updateMany({
        where: {
          id: emprestimoId,
          usuario_id: matricula,
          status: STATUS_EMPRESTIMO.ativo,
        },
        data: {
          status: STATUS_EMPRESTIMO.aguardandoBaixa,
          data_devolucao: new Date(),
        },
      });

      if (alterados.count !== 1) throw new EmprestimoNaoAtivoError();

      const { equipamento, ...resto } = emprestimo;
      return { ...resto, tipo: equipamento.categoria.nome };
    });

    // Relê a lista em vez de deixar a tela filtrar o item na mão: se a
    // secretaria mexeu em outro empréstimo enquanto isso, o tablet já corrige.
    return {
      ok: true,
      dados: { devolvido, restantes: await buscarEmprestimosAtivos(matricula) },
    };
  } catch (erro) {
    if (erro instanceof EmprestimoNaoAtivoError) {
      return falha(
        "EMPRESTIMO_NAO_ENCONTRADO",
        "Esse item já não consta como emprestado para você.",
        "Talvez a devolução já tenha sido registrada. Confira a lista atualizada.",
      );
    }

    return falhaInterna(erro);
  }
}

/** Erro interno da transação da devolução, usado só para abortar e voltar atrás. */
class EmprestimoNaoAtivoError extends Error {
  constructor() {
    super("Empréstimo não está ativo para esta matrícula");
    this.name = "EmprestimoNaoAtivoError";
  }
}

/**
 * "Devolver tudo": manda para `AGUARDANDO_BAIXA` todos os empréstimos `ATIVO`
 * da matrícula de uma vez só.
 *
 * Vale a mesma regra do item avulso — o `Equipamento` **não** muda de status.
 * Quem devolve ao inventário é a secretaria, no /admin.
 *
 * O alvo é decidido no servidor a partir da matrícula, e não por uma lista de
 * ids vinda da tela. Duas razões:
 *
 * - Segurança: é o mesmo motivo pelo qual a devolução avulsa filtra por
 *   matrícula. Aceitar ids soltos daria a um POST forjado a chance de dar baixa
 *   no empréstimo de outra pessoa.
 * - Correção: entre o render da lista e o toque no botão, um item pode ter
 *   saído (a secretaria deu baixa). "Todos os ativos agora" é exatamente o que
 *   o botão promete, e é o que o `updateMany` faz em uma linha.
 *
 * Tudo em uma transação só: os itens vão juntos para a bancada, então a
 * declaração é uma só. Devolver metade seria pior que não devolver nada — a
 * pessoa sai achando que entregou tudo.
 */
export async function devolverTudo(
  matriculaBruta: string,
): Promise<Resultado<DevolucaoEmLoteConfirmada>> {
  const matricula = limparMatricula(matriculaBruta);

  if (matricula.length === 0) {
    return falha("MATRICULA_VAZIA", "Sessão perdida. Informe a matrícula novamente.");
  }

  try {
    const devolvidos = await prisma.$transaction(async (tx) => {
      // Lê antes de escrever para saber *o que* foi devolvido: o `updateMany`
      // devolve só a contagem, e a tela precisa das etiquetas para o aviso.
      const ativos = await tx.emprestimo.findMany({
        where: { usuario_id: matricula, status: STATUS_EMPRESTIMO.ativo },
        select: {
          id: true,
          equip_id: true,
          data_retirada: true,
          equipamento: { select: { categoria: { select: { nome: true } } } },
        },
        orderBy: { data_retirada: "asc" },
      });

      if (ativos.length === 0) throw new EmprestimoNaoAtivoError();

      const alterados = await tx.emprestimo.updateMany({
        where: { usuario_id: matricula, status: STATUS_EMPRESTIMO.ativo },
        data: {
          status: STATUS_EMPRESTIMO.aguardandoBaixa,
          data_devolucao: new Date(),
        },
      });

      // Menos linhas do que foram lidas significa que alguém mexeu no meio do
      // caminho. A transação volta atrás inteira e a tela relê a lista.
      if (alterados.count !== ativos.length) throw new EmprestimoNaoAtivoError();

      return ativos.map(({ equipamento, ...emprestimo }) => ({
        ...emprestimo,
        tipo: equipamento.categoria.nome,
      }));
    });

    return {
      ok: true,
      dados: { devolvidos, restantes: await buscarEmprestimosAtivos(matricula) },
    };
  } catch (erro) {
    if (erro instanceof EmprestimoNaoAtivoError) {
      return falha(
        "EMPRESTIMO_NAO_ENCONTRADO",
        "Nenhum equipamento seu está pendente de devolução.",
        "A lista pode ter mudado enquanto o modal estava aberto. Confira a lista atualizada.",
      );
    }

    return falhaInterna(erro);
  }
}

/**
 * Falha não prevista (banco fora do ar, arquivo .db travado). O aluno vê uma
 * frase que ele pode agir sobre; o detalhe técnico fica no terminal da
 * secretaria, onde alguém pode usá-lo.
 */
function falhaInterna(erro: unknown): Resultado<never> {
  console.error("[retirada] falha inesperada:", erro);

  return falha(
    "FALHA_INTERNA",
    "Não foi possível falar com o sistema agora.",
    "Tente de novo em alguns segundos. Se continuar, avise a secretaria.",
  );
}
