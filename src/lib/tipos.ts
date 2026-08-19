/**
 * Tipos compartilhados entre as Server Actions e os componentes de interface.
 *
 * Este arquivo existe separado de `src/app/actions.ts` de propósito: um módulo
 * marcado com "use server" só pode exportar funções assíncronas. Tipos são
 * apagados na compilação, mas manter tudo em um arquivo neutro evita esbarrar
 * nessa regra quando aparecer uma constante compartilhada.
 */

/** Status possíveis de um equipamento (spec, seção 3; `INATIVO` veio na Tarefa 6). */
export const STATUS_EQUIPAMENTO = {
  disponivel: "DISPONIVEL",
  emprestado: "EMPRESTADO",
  manutencao: "MANUTENCAO",
  /**
   * Aposentado: sai de circulação sem sair do banco.
   *
   * Existe porque apagar um equipamento levaria junto o histórico de
   * empréstimos que aponta para ele — o `Emprestimo` do semestre passado
   * deixaria de saber qual aparelho foi. `INATIVO` é o "deletar" que a
   * secretaria quer, com o histórico intacto.
   */
  inativo: "INATIVO",
} as const;

/** Status possíveis de um empréstimo (spec, seção 3). */
export const STATUS_EMPRESTIMO = {
  ativo: "ATIVO",
  aguardandoBaixa: "AGUARDANDO_BAIXA",
  concluido: "CONCLUIDO",
} as const;

/**
 * Status possíveis de um cadastro de usuário (Tarefa 8).
 *
 * `INATIVO` **bloqueia a retirada e permite a devolução**. A assimetria é a
 * regra inteira: quem sai da faculdade costuma estar com um aparelho na
 * mochila, e travar também a devolução transformaria o cadastro inativado na
 * garantia de que o equipamento nunca volta. Quem devolve não está pedindo
 * nada ao sistema — está entregando.
 */
export const STATUS_USUARIO = {
  ativo: "ATIVO",
  inativo: "INATIVO",
} as const;

/** Teto de itens por retirada. Segura tanto o dedo escorregando quanto POST malicioso. */
export const MAXIMO_ITENS_POR_RETIRADA = 10;

/**
 * Dados do usuário expostos ao tablet. Só o que a tela realmente mostra.
 *
 * `status` entrou na Tarefa 8 porque a tela precisa dele: um cadastro `INATIVO`
 * continua entrando (para poder devolver) e a grade de categorias dá lugar a
 * uma explicação. Sem o campo aqui, o tablet mostraria o inventário inteiro
 * para alguém que não pode retirar nada, e a recusa só apareceria no fim.
 */
export type UsuarioIdentificado = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
  status: string;
};

/**
 * Uma categoria do inventário e quantas unidades dela estão livres agora.
 *
 * `tipo` é o `nome` da `Categoria` no banco. O nome do campo ficou como estava
 * de propósito: é o vocabulário que o tablet inteiro usa ("tipo de
 * equipamento"), e trocá-lo aqui renomearia meia dúzia de componentes sem mudar
 * uma linha do que aparece na tela.
 *
 * `total` **não conta os inativos**: para quem está no tablet, um equipamento
 * aposentado não existe — dizer "2 de 12 disponíveis" com 4 itens fora de
 * circulação faria a pessoa procurar aparelho que não está na prateleira.
 */
export type Categoria = {
  tipo: string;
  disponiveis: number;
  total: number;
};

/** Um equipamento livre para retirada. */
export type EquipamentoDisponivel = {
  id: string;
  tipo: string;
};

/**
 * Um item que está com o usuário agora (empréstimo `ATIVO`).
 *
 * `id` é o do empréstimo, não o da etiqueta: como cada item vira um registro
 * separado em `Emprestimo`, é o número do registro que a devolução precisa
 * endereçar. A etiqueta vem junto porque é o que a pessoa lê no aparelho.
 */
export type EmprestimoAtivo = {
  id: number;
  equip_id: string;
  tipo: string;
  data_retirada: Date;
};

/**
 * Retorno padrão das actions.
 *
 * Erros esperados (matrícula inexistente, equipamento tomado no meio do
 * caminho) voltam como `ok: false` com mensagem pronta para a tela — não como
 * exceção. Exceção aqui viraria tela de erro do Next em cima do aluno.
 */
export type Resultado<T> =
  | { ok: true; dados: T }
  | {
      ok: false;
      motivo: MotivoDeFalha;
      mensagem: string;
      detalhe?: string;
      /** Etiquetas que causaram a falha, para a tela poder se corrigir sozinha. */
      indisponiveis?: string[];
    };

export type MotivoDeFalha =
  // Portal do tablet (Fluxos 1 e 2)
  | "MATRICULA_VAZIA"
  | "MATRICULA_NAO_ENCONTRADA"
  | "SELECAO_VAZIA"
  | "SELECAO_EXCEDIDA"
  | "EQUIPAMENTO_INDISPONIVEL"
  | "EMPRESTIMO_NAO_ENCONTRADO"
  // Painel administrativo (Fluxo 3)
  | "SEM_SESSAO"
  | "EQUIPAMENTO_NAO_ENCONTRADO"
  | "EQUIPAMENTO_EM_USO"
  | "ETIQUETA_DUPLICADA"
  | "ETIQUETA_INVALIDA"
  | "TIPO_INVALIDO"
  | "STATUS_INVALIDO"
  | "CATEGORIA_NAO_ENCONTRADA"
  | "CATEGORIA_DUPLICADA"
  | "CATEGORIA_EM_USO"
  // Portal do tablet — cadastro inativo (Tarefa 8)
  | "USUARIO_INATIVO"
  | "FALHA_INTERNA";

export type RetiradaConfirmada = {
  usuario: UsuarioIdentificado;
  itens: EquipamentoDisponivel[];
  registrados: number;
};

/** Resultado da devolução de um item: o que sumiu da lista e o que sobrou nela. */
export type DevolucaoConfirmada = {
  /** O empréstimo que acabou de ir para `AGUARDANDO_BAIXA`. */
  devolvido: EmprestimoAtivo;
  /** Lista relida do banco — a tela adota esta, em vez de remover item na mão. */
  restantes: EmprestimoAtivo[];
};

/**
 * Resultado do "Devolver tudo": os itens que foram para `AGUARDANDO_BAIXA` de
 * uma vez só.
 *
 * `restantes` continua existindo — e normalmente vem vazio — porque a lista da
 * tela é sempre a relida do banco, nunca a filtrada na mão. Se alguém retirou
 * um equipamento em outro tablet no meio do caminho, ele aparece aqui em vez de
 * sumir da tela sem explicação.
 */
export type DevolucaoEmLoteConfirmada = {
  devolvidos: EmprestimoAtivo[];
  restantes: EmprestimoAtivo[];
};

/* ------------------------------------------------------------------------- *
 * Fluxo 3 — Painel Administrativo (spec, seção 4)
 * ------------------------------------------------------------------------- */

/**
 * As três telas do painel são renderizadas no servidor, então as datas já
 * chegam formatadas nestes tipos, em vez de virem como `Date` para a tela
 * calcular.
 *
 * Motivo: as linhas com botão são ilhas de cliente, e uma data formatada no
 * servidor e re-formatada na hidratação diverge sempre que servidor e navegador
 * discordarem de fuso ou de minuto — o clássico erro de hidratação por texto de
 * tempo. Formatar uma vez, no servidor, elimina a classe inteira do problema.
 */

/** Uma linha da Fila de Devoluções: empréstimo em `AGUARDANDO_BAIXA`. */
export type ItemDaFila = {
  /** Id do empréstimo — é ele que a confirmação endereça. */
  id: number;
  equip_id: string;
  tipo: string;
  nome: string;
  matricula: string;
  perfil: string;
  /** "18/08/2026, 14:32" — quando o item saiu. */
  retiradoEm: string;
  /** Quando o usuário declarou a devolução no tablet. */
  declaradoEm: string;
  /** "há 2 horas" — o que diz se o item já devia estar na bancada. */
  esperandoHa: string;
};

/** Uma linha da visão de Empréstimos Ativos (somente leitura). */
export type EmprestimoEmCurso = {
  id: number;
  equip_id: string;
  tipo: string;
  nome: string;
  matricula: string;
  perfil: string;
  retiradoEm: string;
  /** "há 3 dias" — o dado que faz a secretaria cobrar ou não. */
  ha: string;
};

/** Uma linha da Gestão de Inventário. `tipo` é o `nome` da `Categoria`. */
export type ItemDeInventario = {
  id: string;
  tipo: string;
  status: string;
  /**
   * Quem está com o item agora, quando existe empréstimo aberto (`ATIVO` ou
   * `AGUARDANDO_BAIXA`). É o que explica na tela por que a troca de status está
   * travada, em vez de só desabilitar o botão sem dizer nada.
   */
  responsavel: { nome: string; matricula: string; status: string } | null;
};

/**
 * Estado do formulário de senha do /admin, para o `useActionState`.
 *
 * Não existe estado de "entrou": o sucesso é um `redirect` do servidor, e a
 * tela seguinte já é o painel. O que sobra para o formulário é o erro.
 */
export type EstadoDoLogin = {
  mensagem: string;
  detalhe?: string;
} | null;

/** Estado do formulário de cadastro de equipamento. */
export type EstadoDoCadastro =
  | { fase: "inicial" }
  | { fase: "erro"; mensagem: string; detalhe?: string }
  | { fase: "sucesso"; mensagem: string };

/** O que a Fila devolve depois de confirmar o recebimento físico. */
export type RecebimentoConfirmado = {
  equip_id: string;
  tipo: string;
  nome: string;
  /**
   * `false` quando o equipamento não voltou para `DISPONIVEL` porque estava em
   * `MANUTENCAO` — o empréstimo fecha do mesmo jeito, mas a tela precisa dizer
   * que o item continua fora do inventário.
   */
  liberado: boolean;
};

/**
 * O que a Fila devolve depois de "Confirmar Todas as Devoluções".
 *
 * O lote é conferido item a item, e não tudo-ou-nada: a secretaria está com uma
 * pilha de aparelhos na bancada, e uma linha que saiu da fila por outra aba não
 * pode desfazer a baixa das outras quatro que ela acabou de recolher. Por isso
 * o resultado é um resumo, e não um `ok` seco.
 */
export type RecebimentoEmLote = {
  /** Etiquetas que fecharam o ciclo agora. */
  confirmados: string[];
  /** Destas, as que continuam fora do inventário por estarem em `MANUTENCAO`. */
  presas: string[];
  /** Linhas que já não estavam na fila quando o lote rodou (outra aba chegou antes). */
  foraDaFila: number;
  /** Linhas que falharam por erro inesperado — o lote segue, mas a tela avisa. */
  comFalha: number;
};

/**
 * Uma linha da tela de Categorias.
 *
 * `equipamentos` vem junto porque é ele que decide se o botão de excluir pode
 * aparecer — e, quando não pode, é a explicação: "3 equipamentos vinculados".
 * A trava de verdade continua sendo do banco (`onDelete: Restrict`); esta
 * contagem é o que evita oferecer um botão que só existe para dar erro.
 */
export type CategoriaDoPainel = {
  id: number;
  nome: string;
  equipamentos: number;
};

/** Uma opção do `<select>` de categoria no cadastro de equipamento. */
export type OpcaoDeCategoria = {
  id: number;
  nome: string;
};

/** As contagens do topo da Gestão de Inventário. */
export type ResumoDoInventario = {
  disponiveis: number;
  emprestados: number;
  manutencao: number;
  inativos: number;
  /**
   * Todos os equipamentos cadastrados, inativos inclusive. Aqui — ao contrário
   * do tablet — o inativo conta: a secretaria está olhando o patrimônio, e o
   * aparelho aposentado continua sendo um aparelho que existe no armário.
   */
  total: number;
};

/** Estado do formulário de cadastro de categoria. Mesma forma do de equipamento. */
export type EstadoDaCategoria = EstadoDoCadastro;
