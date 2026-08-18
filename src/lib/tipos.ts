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
  | "MATRICULA_VAZIA"
  | "MATRICULA_NAO_ENCONTRADA"
  | "SELECAO_VAZIA"
  | "SELECAO_EXCEDIDA"
  | "EQUIPAMENTO_INDISPONIVEL"
  | "FALHA_INTERNA";

export type RetiradaConfirmada = {
  usuario: UsuarioIdentificado;
  itens: EquipamentoDisponivel[];
  registrados: number;
};
