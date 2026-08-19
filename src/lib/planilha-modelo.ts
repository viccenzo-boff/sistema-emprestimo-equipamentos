import * as XLSX from "xlsx";

import { COLUNAS_CANONICAS } from "@/lib/planilha-usuarios";

/**
 * Geração da planilha modelo da importação de usuários (Tarefa 9).
 *
 * Módulo puro: monta bytes e devolve. Não escreve em disco, não fala com o
 * banco e não depende de nada do servidor — por isso o mesmo arquivo serve ao
 * navegador (que baixa o modelo) e a um script de verificação em Node.
 *
 * **É carregado por `import()` dinâmico**, e isso não é preferência de estilo:
 * o SheetJS tem cerca de 1 MB, e um `import` estático em componente de cliente
 * o colocaria no pacote inicial de `/admin/usuarios` — que carrega a cada visita
 * à tela, para um botão que a secretaria clica uma vez por semestre. Com o
 * `import()` dentro do clique, o pacote vai pela rede só quando alguém pede o
 * modelo. A tela continua sem recarregar, que é o que o enunciado exige.
 */

/** O nome do arquivo que chega na pasta de downloads, como o enunciado pede. */
export const NOME_DA_PLANILHA_MODELO = "modelo_importacao_usuarios.xlsx";

/** O tipo MIME de .xlsx, para o navegador saber o que está recebendo. */
export const TIPO_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Um .xlsx com uma aba, uma linha, e nada mais: os cinco cabeçalhos.
 *
 * Os nomes das colunas **não são escritos aqui** — vêm de `COLUNAS_CANONICAS`,
 * a mesma lista que o leitor usa para reconhecê-las. Uma segunda cópia da lista
 * pareceria idêntica hoje e divergiria no dia em que uma coluna mudasse de
 * nome: o modelo geraria um arquivo que o próprio importador recusa, e o
 * defeito não apareceria em nenhuma das duas telas isoladamente.
 *
 * Sem linha de exemplo abaixo do cabeçalho, também por decisão: exemplo em
 * planilha modelo é dado que alguém esquece de apagar, e "Ana Souza" viraria um
 * cadastro real na primeira importação distraída.
 *
 * **O retorno de `XLSX.write` com `type: "array"` é um `ArrayBuffer`, não um
 * `Uint8Array`** — conferido nesta sessão, e os tipos do pacote dizem `any`,
 * então nada acusa a diferença. A primeira versão da prova desta tarefa leu
 * `undefined` nos quatro primeiros bytes por causa disso, e um `Blob` montado
 * sobre o valor errado chegaria vazio na pasta de downloads.
 *
 * É `ArrayBuffer` que sai daqui, e não uma visão `Uint8Array` por cima dele,
 * porque é exatamente o que os dois consumidores pedem: o `Blob` do download e
 * o `lerPlanilha` do importador. Sem conversão no meio não há conversão para
 * errar.
 */
export function gerarPlanilhaModelo(): ArrayBuffer {
  const aba = XLSX.utils.aoa_to_sheet([[...COLUNAS_CANONICAS]]);

  // Largura só para o cabeçalho não sair cortado ao abrir. É o único enfeite
  // que a versão comunitária do SheetJS escreve de verdade: estilo de coluna
  // (cor, formato de célula) é recurso pago e sairia do arquivo em silêncio.
  aba["!cols"] = COLUNAS_CANONICAS.map(() => ({ wch: 18 }));

  const pasta = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(pasta, aba, "usuarios");

  return XLSX.write(pasta, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}
