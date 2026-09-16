import type { LinhaDeAvaliacao } from "@/lib/tipos";

/**
 * O CSV da aba Satisfação (Tarefa 14, item 5): `dia,nota`, uma linha por vez
 * que os rostos apareceram, nota vazia quando ninguém respondeu.
 *
 * Módulo puro, como a planilha modelo da Tarefa 9: monta texto e devolve.
 * Não fala com o banco nem com o DOM, e por isso o mesmo arquivo serve ao
 * navegador (que baixa) e a um script de verificação em Node. É carregado por
 * `import()` no clique, pela mesma regra daquela tarefa — aqui o módulo é
 * minúsculo e o que pesa são as linhas, que já descem no render; o `import()`
 * fica pela paridade com o único outro download do painel, para os dois
 * botões terem a mesma forma.
 *
 * O formato é o RFC 4180: vírgula, quebra `\r\n`, sem aspas (nenhum campo
 * tem vírgula, aspas nem quebra — são uma data e um dígito). O Excel em
 * português abre CSV de vírgula em uma coluna só ao clicar duas vezes; o
 * caminho é **Dados → De Texto/CSV**, que reconhece a vírgula sozinho, e a
 * página da wiki diz isso.
 */

/** O nome que chega à pasta de downloads. O dia entra para duas exportações não se sobrescreverem. */
export function nomeDoCsvDeAvaliacoes(dia: string): string {
  return `avaliacoes-${dia}.csv`;
}

/** O tipo MIME, com a codificação explícita. */
export const TIPO_CSV = "text/csv;charset=utf-8";

/** O cabeçalho, escrito uma vez só — é o que a wiki cita. */
export const CABECALHO_DO_CSV = "dia,nota";

export function gerarCsvDeAvaliacoes(linhas: readonly LinhaDeAvaliacao[]): string {
  const corpo = linhas.map((linha) => `${linha.dia},${linha.nota ?? ""}`);
  return [CABECALHO_DO_CSV, ...corpo].join("\r\n") + "\r\n";
}
