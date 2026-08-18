"use client";

import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import type { EquipamentoDisponivel } from "@/lib/tipos";

/**
 * Barra fixa com o que já foi selecionado.
 *
 * Fica visível em todas as telas depois do login, não só na lista de itens: é o
 * que permite ao aluno atravessar categorias sem perder de vista o que já
 * escolheu — e é onde a retirada é confirmada, sempre no mesmo lugar da tela.
 */

type Props = {
  itens: EquipamentoDisponivel[];
  onRemover: (id: string) => void;
  onConfirmar: () => void;
  confirmando: boolean;
  erro: { mensagem: string; detalhe?: string } | null;
};

export function BarraSelecao({
  itens,
  onRemover,
  onConfirmar,
  confirmando,
  erro,
}: Props) {
  // A barra também segura o erro da confirmação: se sumisse junto com o último
  // item removido, o aluno perderia a explicação do que acabou de acontecer.
  if (itens.length === 0 && !erro) return null;

  return (
    <div className="sticky bottom-0 z-20 border-t border-borda bg-superficie/95 px-4 py-4 backdrop-blur-sm sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {erro ? (
          <Alerta tom="erro" mensagem={erro.mensagem} detalhe={erro.detalhe} />
        ) : null}

        {itens.length > 0 ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-semibold tracking-wide text-tinta-suave uppercase">
                {itens.length === 1
                  ? "1 item selecionado"
                  : `${itens.length} itens selecionados`}
              </p>
              <ul className="flex flex-wrap gap-2">
                {itens.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onRemover(item.id)}
                      disabled={confirmando}
                      aria-label={`Remover ${item.id} da seleção`}
                      className={[
                        "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-marca-verde-forte",
                        "bg-marca-verde-tenue py-1.5 pr-3 pl-4 font-mono text-base font-bold text-marca-verde-forte",
                        "transition-colors duration-150 ease-out hover:bg-marca-verde-forte hover:text-white",
                        "disabled:pointer-events-none disabled:opacity-50",
                      ].join(" ")}
                    >
                      {item.id}
                      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                        <path
                          d="M6 6l12 12M18 6 6 18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <Botao
              variante="sucesso"
              tamanho="grande"
              carregando={confirmando}
              onClick={onConfirmar}
              className="shrink-0 lg:min-w-72"
            >
              Confirmar retirada
            </Botao>
          </div>
        ) : null}
      </div>
    </div>
  );
}
