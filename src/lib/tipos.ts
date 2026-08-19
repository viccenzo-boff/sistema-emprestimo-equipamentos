/**
 * Tipos compartilhados entre as Server Actions e os componentes de interface.
 *
 * Este arquivo existe separado de `src/app/actions.ts` de propósito: um módulo
 * marcado com "use server" só pode exportar funções assíncronas. Tipos são
 * apagados na compilação, mas manter tudo em um arquivo neutro evita esbarrar
 * nessa regra quando aparecer uma constante compartilhada.
 */

/** Status possíveis de um equipamento (spec, seção 3). */
export const STATUS_EQUIPAMENTO = {
  disponivel: "DISPONIVEL",
  emprestado: "EMPRESTADO",
  manutencao: "MANUTENCAO",
} as const;

/** Status possíveis de um empréstimo (spec, seção 3). */
export const STATUS_EMPRESTIMO = {
  ativo: "ATIVO",
  aguardandoBaixa: "AGUARDANDO_BAIXA",
  concluido: "CONCLUIDO",
} as const;

/** Teto de itens por retirada. Segura tanto o dedo escorregando quanto POST malicioso. */
export const MAXIMO_ITENS_POR_RETIRADA = 10;

/** Dados do usuário expostos ao tablet. Só o que a tela realmente mostra. */
export type UsuarioIdentificado = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
};

/** Uma categoria do inventário e quantas unidades dela estão livres agora. */
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

/** Uma linha da Gestão de Inventário. */
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
