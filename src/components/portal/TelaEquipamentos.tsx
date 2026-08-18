"use client";

import type { EquipamentoDisponivel } from "@/lib/tipos";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeCategoria, IconeCheck, IconeSeta } from "@/components/ui/icones";
import { plural } from "@/lib/texto";

/**
 * Passos 3 e 4 do Fluxo 1: escolha dos itens.
 *
 * O botão mostra a etiqueta inteira e exatamente como está colada no
 * equipamento ("NOTE-01", não "Note 1"). Quem confere na bancada compara letra
 * por letra; qualquer "embelezamento" aqui vira divergência lá.
 *
 * A seleção é acumulativa e sobrevive à troca de categoria — dá para levar dois
 * notebooks e uma extensão em uma confirmação só.
 */

type Props = {
  tipo: string;
  equipamentos: EquipamentoDisponivel[];
  selecionados: string[];
  onAlternar: (id: string) => void;
  onVoltar: () => void;
  carregando: boolean;
  erro: { mensagem: string; detalhe?: string } | null;
};

export function TelaEquipamentos({
  tipo,
  equipamentos,
  selecionados,
  onAlternar,
  onVoltar,
  carregando,
  erro,
}: Props) {
  return (
    <div className="animate-surgir flex flex-col gap-7">
      <div className="flex items-center gap-4">
        <Botao
          variante="secundario"
          tamanho="icone"
          onClick={onVoltar}
          aria-label="Voltar para as categorias"
        >
          <IconeSeta className="size-7" />
        </Botao>

        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-marca-azul">
            {plural(tipo)}
          </h1>
          <p className="text-base text-tinta-suave">
            Toque em cada item que você vai levar.
          </p>
        </div>
      </div>

      {erro ? <Alerta tom="erro" mensagem={erro.mensagem} detalhe={erro.detalhe} /> : null}

      {carregando ? (
        <Esqueleto />
      ) : equipamentos.length === 0 ? (
        <Vazio tipo={tipo} />
      ) : (
        <div
          role="group"
          aria-label={`Equipamentos disponíveis: ${plural(tipo)}`}
          className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-4"
        >
          {equipamentos.map((equipamento) => {
            const marcado = selecionados.includes(equipamento.id);

            return (
              <button
                key={equipamento.id}
                type="button"
                aria-pressed={marcado}
                onClick={() => onAlternar(equipamento.id)}
                className={[
                  "relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4",
                  "transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out",
                  "active:scale-[0.97]",
                  marcado
                    ? "border-marca-verde-forte bg-marca-verde-tenue shadow-sm"
                    : "border-borda bg-superficie hover:border-marca-azul-claro hover:bg-marca-azul-tenue",
                ].join(" ")}
              >
                <IconeCategoria
                  tipo={tipo}
                  className={[
                    "size-7 transition-colors duration-150",
                    marcado ? "text-marca-verde-forte" : "text-tinta-tenue",
                  ].join(" ")}
                />
                <span
                  className={[
                    "font-mono text-xl font-bold tracking-tight",
                    marcado ? "text-marca-verde-forte" : "text-tinta",
                  ].join(" ")}
                >
                  {equipamento.id}
                </span>

                {marcado ? (
                  <span className="animate-surgir-curto absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-marca-verde-forte text-white">
                    <IconeCheck className="size-4" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Esqueleto() {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, indice) => (
        <div
          key={indice}
          className="min-h-32 animate-pulse rounded-2xl border-2 border-borda bg-superficie-2"
        />
      ))}
      <span className="sr-only">Carregando equipamentos</span>
    </div>
  );
}

function Vazio({ tipo }: { tipo: string }) {
  return (
    <Alerta
      tom="info"
      mensagem={`Nenhuma unidade de ${tipo} está livre agora.`}
      detalhe="Todas estão emprestadas ou em manutenção. Volte e escolha outra categoria, ou fale com a secretaria."
    />
  );
}
