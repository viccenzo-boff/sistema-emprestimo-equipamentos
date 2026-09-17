"use client";

import { COR_DA_GRADE_DO_GRAFICO, COR_DO_TEXTO_DO_GRAFICO } from "@/lib/cores-de-grafico";

/**
 * O que os dois gráficos compartilham: o tooltip, o estilo dos eixos e a
 * leitura de `prefers-reduced-motion`. Este arquivo **não** importa o
 * Recharts — é o vocabulário visual, e o mesmo pedaço serve ao gráfico de
 * série e ao de composição sem os dois divergirem no tamanho da fonte.
 */

export type TipoDeSerie = "barras" | "linha";
export type TipoDeComposicao = "barras" | "pizza";

/** Texto em `tinta-suave` e linha em `borda`: o eixo nunca usa a cor da série. */
export const EIXO = {
  tick: { fill: COR_DO_TEXTO_DO_GRAFICO, fontSize: 12 },
  linha: { stroke: COR_DA_GRADE_DO_GRAFICO },
} as const;

/**
 * `prefers-reduced-motion` desliga a animação de entrada. Lido na hora do
 * render, e não num efeito: os dois gráficos só existem no cliente
 * (`ssr: false`), então `window` está sempre lá — e a primeira pintura já sai
 * sem movimento, em vez de animar uma vez e obedecer da segunda em diante.
 */
export function reduzirMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const NUMERO = new Intl.NumberFormat("pt-BR");

/**
 * O tooltip dos dois gráficos: **o valor em destaque, o nome da grandeza
 * depois**, e o título por extenso em cima ("3 de setembro de 2026", ou o
 * nome da categoria). O Recharts o mostra em hover **e** em foco de teclado
 * (`accessibilityLayer`, ligado por padrão na versão 3) — o tooltip enriquece,
 * mas nunca é o único caminho até o número: a tabela gêmea está ao lado.
 *
 * É HTML, não SVG (o Recharts o desenha num portal fora do `<svg>`), então
 * pode usar as classes do tema.
 */
export function DicaDoGrafico({
  ativo,
  titulo,
  valor,
  grandeza,
  complemento,
}: {
  ativo: boolean | undefined;
  titulo: string | number | undefined;
  valor: number | string | undefined;
  grandeza: string;
  /** Uma segunda linha, opcional: "25% do total". */
  complemento?: string;
}) {
  if (!ativo || valor === undefined) return null;

  const numero = typeof valor === "number" ? NUMERO.format(valor) : valor;
  const unidade = typeof valor === "number" && valor === 1 ? grandeza.replace(/s$/, "") : grandeza;

  return (
    <div
      role="presentation"
      className="rounded-xl border border-borda bg-superficie px-3 py-2 text-sm shadow-lg shadow-tinta/10"
    >
      {titulo !== undefined ? <p className="text-tinta-suave">{titulo}</p> : null}
      <p className="text-tinta">
        <strong className="numeros-tabulares text-base font-semibold">{numero}</strong> {unidade}
      </p>
      {complemento ? <p className="text-tinta-tenue">{complemento}</p> : null}
    </div>
  );
}
