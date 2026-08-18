"use client";

import { IconeCategoria } from "@/components/ui/icones";
import { plural } from "@/lib/texto";
import type { Categoria } from "@/lib/tipos";

/**
 * Passo 2 do Fluxo 1: escolha da categoria.
 *
 * Categorias sem unidade livre continuam na tela, desabilitadas e com o motivo
 * escrito. Sumir com a categoria faria o aluno procurar o que não está lá.
 *
 * O `titulo` é opcional porque a seção só ganha cabeçalho quando divide a tela
 * com "Meus equipamentos" (Fluxo 2). Sozinha, o h1 da tela já diz o que ela é —
 * e um h2 repetindo logo abaixo só ocuparia altura útil no tablet.
 *
 * `colunas` existe pelo mesmo motivo: dividindo a tela, a grade recebe pouco
 * mais da metade da largura e três ladrilhos ficariam estreitos demais para o
 * rótulo. Quem decide é a tela que compõe, porque as media queries do Tailwind
 * medem a janela, não a coluna.
 */

type Props = {
  categorias: Categoria[];
  selecionadosPorTipo: Record<string, number>;
  onEscolher: (tipo: string) => void;
  tipoCarregando: string | null;
  titulo?: string;
  colunas?: 2 | 3;
};

export function TelaCategorias({
  categorias,
  selecionadosPorTipo,
  onEscolher,
  tipoCarregando,
  titulo,
  colunas = 3,
}: Props) {
  return (
    <section className="flex flex-col gap-4">
      {titulo ? (
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">{titulo}</h2>
      ) : null}

      <div
        className={[
          "grid gap-4 sm:grid-cols-2",
          colunas === 3 ? "lg:grid-cols-3" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {categorias.map((categoria) => (
          <Ladrilho
            key={categoria.tipo}
            categoria={categoria}
            selecionados={selecionadosPorTipo[categoria.tipo] ?? 0}
            carregando={tipoCarregando === categoria.tipo}
            onEscolher={() => onEscolher(categoria.tipo)}
          />
        ))}
      </div>
    </section>
  );
}

function Ladrilho({
  categoria,
  selecionados,
  carregando,
  onEscolher,
}: {
  categoria: Categoria;
  selecionados: number;
  carregando: boolean;
  onEscolher: () => void;
}) {
  const esgotado = categoria.disponiveis === 0;

  return (
    <button
      type="button"
      disabled={esgotado || carregando}
      onClick={onEscolher}
      aria-busy={carregando || undefined}
      className={[
        "group relative flex min-h-44 flex-col items-start justify-between gap-6 rounded-3xl border-2 p-6 text-left",
        "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
        esgotado
          ? "cursor-not-allowed border-borda bg-superficie-2"
          : "border-borda bg-superficie shadow-sm hover:-translate-y-0.5 hover:border-marca-azul-claro hover:shadow-md active:translate-y-0 active:scale-[0.99]",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-14 items-center justify-center rounded-2xl transition-colors duration-200",
          esgotado
            ? "bg-superficie text-tinta-tenue"
            : "bg-marca-azul-tenue text-marca-azul group-hover:bg-marca-azul group-hover:text-white",
        ].join(" ")}
      >
        <IconeCategoria tipo={categoria.tipo} className="size-8" />
      </span>

      <span className="w-full">
        <span
          className={[
            "block text-2xl font-semibold tracking-tight",
            esgotado ? "text-tinta-tenue" : "text-tinta",
          ].join(" ")}
        >
          {plural(categoria.tipo)}
        </span>
        <span
          className={[
            "mt-0.5 block text-base",
            esgotado ? "text-tinta-tenue" : "text-tinta-suave",
          ].join(" ")}
        >
          {esgotado
            ? "Nenhum disponível agora"
            : `${categoria.disponiveis} de ${categoria.total} ${
                categoria.disponiveis === 1 ? "disponível" : "disponíveis"
              }`}
        </span>
      </span>

      {selecionados > 0 ? (
        <span className="absolute top-5 right-5 inline-flex min-w-8 items-center justify-center rounded-full bg-marca-verde-forte px-2.5 py-1 text-sm font-bold text-white">
          {selecionados}
          <span className="sr-only"> selecionado(s)</span>
        </span>
      ) : null}
    </button>
  );
}
