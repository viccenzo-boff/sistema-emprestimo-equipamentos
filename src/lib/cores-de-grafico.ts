/**
 * As cores dos gráficos (Tarefa 16, §4).
 *
 * **Hex, e não `var(--color-…)`, porque o Recharts escreve a cor no atributo
 * `fill` do SVG** — e atributo de apresentação não é declaração de CSS: o
 * `var()` não resolve ali e a fatia sai preta. Os dois primeiros tons e o
 * quarto são tokens do tema ([globals.css](../app/globals.css)): `marca-azul`,
 * `ambar` e `marca-verde-forte`. **Os hex daqui têm que bater com os `oklch`
 * de lá** — quem mudar um token muda o hex ao lado, senão a barra do
 * relatório e o selo da mesma categoria saem de cores diferentes.
 *
 * **Cor segue a entidade.** Cada categoria recebe a cor pela posição dela na
 * lista ordenada por `Categoria.id` — a ordem do tablet e do inventário —, e
 * não pela posição entre as categorias que apareceram no período. É o que
 * faz "Tablet" ser roxo no relatório de agosto e no de setembro, mesmo que em
 * agosto ninguém tenha retirado notebook. Uma categoria a menos no período
 * não repinta as outras.
 *
 * **Validado por cálculo, não a olho** (script descartável da Tarefa 16,
 * matrizes de Machado 2009 para os três tipos de daltonismo):
 *
 * | tom   | hex       | vs branco | rótulo | menor ΔE com o vizinho sob CVD |
 * | ----- | --------- | --------- | ------ | ------------------------------ |
 * | azul  | `#023770` | 11,8:1    | branco | 22,4                           |
 * | âmbar | `#cd6600` | 3,8:1     | tinta  | 26,7                           |
 * | roxo  | `#622c91` | 9,2:1     | branco | 16,3                           |
 * | verde | `#1f7a1b` | 5,4:1     | branco | 10,6                           |
 * | vinho | `#850e2c` | 10,0:1    | branco | 10,6                           |
 * | ciano | `#1c7d86` | 4,9:1     | branco | 15,7                           |
 *
 * Todos acima de 3:1 sobre `superficie` (o mínimo para objeto gráfico) e cada
 * um com uma cor de rótulo a 4,5:1 ou mais. A separação mínima entre
 * vizinhos (ΔE em OKLab × 100) é 10,6, contra 8 exigido — o par verde/vinho
 * sob deuteranopia. A alternância de luminosidade entre vizinhos é o que
 * garante isso: matiz colapsa sob daltonismo, luminosidade não. **Refaça o
 * cálculo se trocar um tom ou a ordem** — a separação é entre vizinhos, e
 * trocar a ordem muda quem é vizinho de quem.
 */

export type TomDeGrafico = {
  /** O hex que o `fill` do SVG recebe. */
  cor: string;
  /** A cor do texto escrito por cima da fatia: `#ffffff` ou a `tinta` do tema. */
  corDoRotulo: string;
};

/** A `tinta` do tema (`oklch(22% 0.03 258)`) em hex, para o rótulo sobre o âmbar. */
const TINTA = "#121b28";
const BRANCO = "#ffffff";

/** Os seis tons, na ordem em que são atribuídos. Ver o cabeçalho. */
export const TONS_DE_GRAFICO: readonly TomDeGrafico[] = [
  { cor: "#023770", corDoRotulo: BRANCO }, // = marca-azul
  { cor: "#cd6600", corDoRotulo: TINTA }, // = ambar (Tarefa 14)
  { cor: "#622c91", corDoRotulo: BRANCO },
  { cor: "#1f7a1b", corDoRotulo: BRANCO }, // = marca-verde-forte
  { cor: "#850e2c", corDoRotulo: BRANCO },
  { cor: "#1c7d86", corDoRotulo: BRANCO },
];

/**
 * A cor da entidade na posição `indice` (0 = a primeira categoria por `id`).
 * Da sétima em diante os tons repetem — e a pizza nunca chega lá, porque
 * acima de seis fatias as menores viram "Outras".
 */
export function tomDaPosicao(indice: number): TomDeGrafico {
  return TONS_DE_GRAFICO[indice % TONS_DE_GRAFICO.length];
}

/**
 * "Outras", na pizza: a `tinta-tenue` do tema (`oklch(56.5% 0.025 257)`),
 * 4,5:1 sobre o branco. Cinza de propósito — não é uma categoria, é o resto.
 */
export const TOM_DE_OUTRAS: TomDeGrafico = { cor: "#6d7785", corDoRotulo: BRANCO };

/** A série de uma cor só ("Retiradas por dia"): o azul da marca. */
export const COR_DA_SERIE_UNICA = TONS_DE_GRAFICO[0].cor;

/**
 * O que não é série: texto dos eixos e da legenda em `tinta-suave`
 * (`oklch(46% 0.03 257)`, 7,1:1), grade e eixos em `borda`
 * (`oklch(90% 0.012 255.2)`). Texto **nunca** usa a cor da série — o eixo de
 * um gráfico azul é cinza, como o de qualquer outro.
 */
export const COR_DO_TEXTO_DO_GRAFICO = "#4e5969";
export const COR_DA_GRADE_DO_GRAFICO = "#d9dfe6";
