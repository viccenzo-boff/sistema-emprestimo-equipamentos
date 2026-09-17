import * as XLSX from "xlsx";

import type { AbaDeExportacao } from "@/lib/tipos";

/**
 * A exportação em .xlsx dos relatórios (Tarefa 16, §5).
 *
 * Módulo puro, como a planilha modelo da Tarefa 9: recebe abas já prontas
 * (título, cabeçalho, linhas) e devolve os bytes. Não fala com o banco nem
 * com o DOM, e por isso o mesmo arquivo serve ao navegador (que baixa) e a um
 * script de verificação em Node, que lê o resultado de volta pelo
 * `XLSX.read`.
 *
 * **É carregado por `import()` no clique**, pela mesma regra da Tarefa 9: o
 * SheetJS tem ~1 MB, e um `import` estático em componente de cliente o
 * colocaria no pacote inicial do painel por causa de um botão. O que desce no
 * render são as linhas, já formatadas no servidor; o que desce no clique é o
 * serializador.
 *
 * **Número é número.** Contagem e duração vão como número — a duração em
 * minutos, com o cabeçalho dizendo ("Uso mediano (min)") — porque a
 * coordenação vai somar e tirar média no Excel, e "2 h 15 min" como texto não
 * soma. Data vai como texto `AAAA-MM-DD HH:MM` no fuso da máquina: como
 * número de série do Excel ela chegaria certa e apareceria como 46000,3 até
 * alguém formatar a coluna.
 *
 * Largura de coluna sim; estilo de célula não — é recurso pago da SheetJS, e
 * sairia do arquivo em silêncio.
 */

/** O tipo MIME de .xlsx. Mudou de dono na Tarefa 16: a planilha modelo o importa daqui. */
export const TIPO_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** O que o formato aceita num nome de aba: até 31 caracteres, sem estes sete. */
const CARACTERES_PROIBIDOS_NO_TITULO = /[:\\/?*[\]]/;
const MAXIMO_DE_CARACTERES_NO_TITULO = 31;

/**
 * Recusa um título que o Excel não abre. A SheetJS também recusa (conferido:
 * "Sheet name cannot contain : \ / ? * [ ]" e "cannot exceed 31 chars"), mas
 * a mensagem dela fala do formato, e esta diz qual aba está errada — que é o
 * que quem for acrescentar uma aba na Tarefa 17 precisa ler.
 */
export function validarTituloDeAba(titulo: string): void {
  if (titulo.length === 0 || titulo.length > MAXIMO_DE_CARACTERES_NO_TITULO) {
    throw new Error(`Título de aba "${titulo}" precisa ter de 1 a ${MAXIMO_DE_CARACTERES_NO_TITULO} caracteres.`);
  }
  if (CARACTERES_PROIBIDOS_NO_TITULO.test(titulo)) {
    throw new Error(`Título de aba "${titulo}" não pode conter : \\ / ? * [ ]`);
  }
}

/**
 * Monta o .xlsx: uma aba por entrada, na ordem dada.
 *
 * **O retorno de `XLSX.write` com `type: "array"` é um `ArrayBuffer`**, e
 * não um `Uint8Array` — medido na Tarefa 9 e de novo aqui. Os tipos do pacote
 * dizem `any`, então nada acusa a diferença; um `Blob` montado sobre o valor
 * errado chegaria vazio na pasta de downloads. `ArrayBuffer` é o que o `Blob`
 * do download e o `XLSX.read` da verificação pedem, sem conversão no meio.
 */
export function gerarXlsx(abas: readonly AbaDeExportacao[]): ArrayBuffer {
  if (abas.length === 0) throw new Error("Uma planilha precisa de pelo menos uma aba.");

  const pasta = XLSX.utils.book_new();

  for (const aba of abas) {
    validarTituloDeAba(aba.titulo);

    const notas = (aba.notas ?? []).map((nota) => [nota]);
    const folha = XLSX.utils.aoa_to_sheet([...notas, aba.cabecalho, ...aba.linhas]);

    // Largura pelo cabeçalho, com um piso: é o único enfeite que a versão
    // comunitária escreve de verdade (ver a planilha modelo da Tarefa 9).
    folha["!cols"] = aba.cabecalho.map((titulo) => ({ wch: Math.max(14, titulo.length + 2) }));

    XLSX.utils.book_append_sheet(pasta, folha, aba.titulo);
  }

  return XLSX.write(pasta, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

/**
 * `consumo-2026-09-01-a-2026-09-30.xlsx` — o nome carrega o período, para
 * duas exportações de meses diferentes não se sobrescreverem na pasta de
 * downloads.
 */
export function nomeDoArquivoDeRelatorio(prefixo: string, de: string, ate: string): string {
  return `${prefixo}-${de}-a-${ate}.xlsx`;
}
