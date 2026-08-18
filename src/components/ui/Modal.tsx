"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Diálogo modal do portal.
 *
 * Usa o `<dialog>` nativo com `showModal()` em vez de uma `<div>` com
 * `position: fixed`. Três coisas vêm de graça e são difíceis de acertar na mão:
 * a trava de foco, o `inert` no resto da página (o dedo não alcança o que está
 * atrás) e o *top layer* — que resolve a briga de `z-index` com a barra de
 * seleção, sticky no rodapé.
 *
 * `bloqueado` fecha as saídas enquanto a ação está em voo: nada de sumir com o
 * modal no meio de uma escrita no banco e deixar a pessoa sem saber o que
 * aconteceu.
 */

type Props = {
  aberto: boolean;
  titulo: string;
  children: ReactNode;
  /** Linha de botões. Fica no rodapé, sempre no mesmo lugar da tela. */
  acoes: ReactNode;
  onFechar: () => void;
  bloqueado?: boolean;
};

export function Modal({
  aberto,
  titulo,
  children,
  acoes,
  onFechar,
  bloqueado = false,
}: Props) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;

    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  // O `<dialog>` nativo não trava a rolagem do documento; em um tablet isso
  // faz a página deslizar por baixo do modal ao arrastar o dedo.
  useEffect(() => {
    if (!aberto) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={tituloId}
      // Esc dispara `cancel`. Cancelamos o fechamento nativo e avisamos quem
      // controla o estado — senão o React continuaria achando que está aberto.
      onCancel={(evento) => {
        evento.preventDefault();
        if (!bloqueado) onFechar();
      }}
      // Clique no fundo escuro: o alvo do evento é o próprio <dialog>, porque
      // o conteúdo mora no <div> interno.
      onClick={(evento) => {
        if (evento.target === dialogoRef.current && !bloqueado) onFechar();
      }}
      className={[
        "m-auto w-[calc(100%-2rem)] max-w-xl rounded-3xl border-0 bg-transparent p-0",
        "backdrop:bg-tinta/55 backdrop:backdrop-blur-[2px]",
      ].join(" ")}
    >
      <div className="animate-surgir-curto flex flex-col gap-6 rounded-3xl bg-superficie p-7 shadow-2xl sm:p-9">
        <h2
          id={tituloId}
          className="text-3xl font-semibold tracking-tight text-balance text-marca-azul"
        >
          {titulo}
        </h2>

        <div className="text-lg leading-relaxed text-tinta-suave">{children}</div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {acoes}
        </div>
      </div>
    </dialog>
  );
}
