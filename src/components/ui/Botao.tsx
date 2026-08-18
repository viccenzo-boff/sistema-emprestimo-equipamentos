import type { ButtonHTMLAttributes } from "react";

/**
 * Botão único do portal.
 *
 * Existe um componente só porque a regra do tablet é "todo botão tem a mesma
 * forma": mesmo raio, mesma altura mínima, mesmo comportamento de toque. Altura
 * mínima de 64px (`min-h-16`) não é estética — é o alvo de toque confortável
 * para quem está em pé, de mochila nas costas.
 */

type Variante = "primario" | "secundario" | "fantasma" | "sucesso";
type Tamanho = "icone" | "pequeno" | "medio" | "grande";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  larguraTotal?: boolean;
};

const BASE = [
  "relative inline-flex items-center justify-center gap-3",
  "rounded-2xl font-semibold tracking-tight",
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
  "active:scale-[0.985]",
  "disabled:pointer-events-none disabled:opacity-45",
].join(" ");

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-marca-azul text-white shadow-sm shadow-marca-azul/25 hover:bg-marca-azul-escuro",
  sucesso:
    "bg-marca-verde-forte text-white shadow-sm shadow-marca-verde-forte/25 hover:brightness-95",
  secundario:
    "bg-superficie text-marca-azul border-2 border-borda hover:border-marca-azul-claro hover:bg-marca-azul-tenue",
  fantasma: "bg-transparent text-tinta-suave hover:bg-marca-azul-tenue hover:text-marca-azul",
};

/*
  Os tamanhos são variantes de verdade, e não classes soltas passadas por
  `className`: no Tailwind 4 duas utilidades concorrentes (min-h-16 e min-h-14)
  são resolvidas pela ordem no CSS gerado, não pela ordem no atributo — o
  "override" sairia aleatório.
*/
const TAMANHOS: Record<Tamanho, string> = {
  icone: "size-16 shrink-0 px-0",
  pequeno: "min-h-14 px-5 text-base",
  medio: "min-h-16 px-6 text-lg",
  grande: "min-h-20 px-8 text-xl",
};

export function Botao({
  variante = "primario",
  tamanho = "medio",
  carregando = false,
  larguraTotal = false,
  className = "",
  disabled,
  children,
  ...resto
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={[
        BASE,
        VARIANTES[variante],
        TAMANHOS[tamanho],
        larguraTotal ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...resto}
    >
      {/*
        O rótulo fica invisível (não removido) durante o carregamento: o botão
        mantém a largura e a linha de botões não pula de lugar.
      */}
      <span className={carregando ? "invisible contents" : "contents"}>
        {children}
      </span>
      {carregando ? <Girador /> : null}
    </button>
  );
}

function Girador() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="size-6 animate-spin" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeOpacity="0.25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Processando</span>
    </span>
  );
}
