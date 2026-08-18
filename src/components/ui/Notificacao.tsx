"use client";

import { useEffect } from "react";

import { IconeCheck } from "@/components/ui/icones";

/**
 * Aviso passageiro ("toast") no topo da tela.
 *
 * Diferente do `Alerta`, que fica no fluxo do texto e explica um estado, este
 * confirma um ato que já terminou e depois some. Fica flutuando no topo porque
 * é onde o olho vai depois que um item desaparece da lista — e porque o rodapé
 * já é da barra de seleção.
 *
 * `aria-live="polite"` no lugar de `alert`: é uma confirmação, não uma
 * emergência; o leitor de tela anuncia sem cortar o que estiver falando.
 */

type Props = {
  mensagem: string | null;
  onFechar: () => void;
  /** Tempo até sumir sozinho. Longo o bastante para ler em pé, na bancada. */
  duracaoMs?: number;
};

export function Notificacao({ mensagem, onFechar, duracaoMs = 6000 }: Props) {
  useEffect(() => {
    if (!mensagem) return;

    const temporizador = window.setTimeout(onFechar, duracaoMs);
    return () => window.clearTimeout(temporizador);
    // A mensagem entra na lista de dependências para que uma devolução seguida
    // de outra reinicie a contagem, em vez de herdar o resto da anterior.
  }, [mensagem, duracaoMs, onFechar]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      {mensagem ? (
        <div
          className={[
            "animate-surgir-curto pointer-events-auto flex items-center gap-4",
            "rounded-2xl border border-sucesso-borda bg-superficie px-5 py-4 shadow-lg",
          ].join(" ")}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-marca-verde-forte text-white">
            <IconeCheck className="size-6" />
          </span>

          <p className="text-lg leading-snug font-semibold text-balance text-tinta">
            {mensagem}
          </p>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar aviso"
            className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-xl text-tinta-tenue transition-colors duration-150 hover:bg-superficie-2 hover:text-tinta"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
