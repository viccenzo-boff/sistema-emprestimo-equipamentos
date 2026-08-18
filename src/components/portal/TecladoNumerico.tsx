"use client";

import { IconeApagar } from "@/components/ui/icones";

/**
 * Teclado numérico da tela de matrícula.
 *
 * A spec pede "sem teclados virtuais desnecessários": o teclado do sistema
 * cobre metade da tela do tablet, aparece e some empurrando o layout, e tem
 * teclas do tamanho errado para quem está em pé. Este aqui fica sempre no mesmo
 * lugar, com teclas de 80px.
 */

type Props = {
  onDigito: (digito: string) => void;
  onApagar: () => void;
  onLimpar: () => void;
  desabilitado?: boolean;
};

const DIGITOS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const TECLA = [
  "flex min-h-20 items-center justify-center rounded-2xl border-2 border-borda",
  "bg-superficie text-3xl font-semibold text-tinta numeros-tabulares",
  "transition-[background-color,border-color,transform] duration-100 ease-out",
  "hover:border-marca-azul-claro hover:bg-marca-azul-tenue",
  "active:scale-[0.96] active:bg-marca-azul-tenue",
  "disabled:pointer-events-none disabled:opacity-40",
].join(" ");

const TECLA_AUXILIAR = [
  "flex min-h-20 items-center justify-center gap-2 rounded-2xl border-2 border-transparent",
  "bg-superficie-2 text-lg font-semibold text-tinta-suave",
  "transition-[background-color,color,transform] duration-100 ease-out",
  "hover:bg-marca-azul-tenue hover:text-marca-azul",
  "active:scale-[0.96]",
  "disabled:pointer-events-none disabled:opacity-40",
].join(" ");

export function TecladoNumerico({
  onDigito,
  onApagar,
  onLimpar,
  desabilitado = false,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {DIGITOS.map((digito) => (
        <button
          key={digito}
          type="button"
          className={TECLA}
          disabled={desabilitado}
          onClick={() => onDigito(digito)}
        >
          {digito}
        </button>
      ))}

      <button
        type="button"
        className={TECLA_AUXILIAR}
        disabled={desabilitado}
        onClick={onLimpar}
      >
        Limpar
      </button>

      <button
        type="button"
        className={TECLA}
        disabled={desabilitado}
        onClick={() => onDigito("0")}
      >
        0
      </button>

      <button
        type="button"
        className={TECLA_AUXILIAR}
        disabled={desabilitado}
        onClick={onApagar}
        aria-label="Apagar último número"
      >
        <IconeApagar className="size-7" />
      </button>
    </div>
  );
}
