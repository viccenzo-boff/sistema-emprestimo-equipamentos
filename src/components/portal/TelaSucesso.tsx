"use client";

import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { IconeCheck } from "@/components/ui/icones";
import type { EquipamentoDisponivel } from "@/lib/tipos";

/**
 * Fim do Fluxo 1.
 *
 * A tela se fecha sozinha depois de alguns segundos porque o tablet é
 * compartilhado: se ficasse parada, o próximo aluno encontraria o nome e a
 * retirada de outra pessoa na tela.
 */

type Props = {
  nome: string;
  itens: EquipamentoDisponivel[];
  onConcluir: () => void;
};

const SEGUNDOS_ATE_REINICIAR = 15;

export function TelaSucesso({ nome, itens, onConcluir }: Props) {
  const [restam, setRestam] = useState(SEGUNDOS_ATE_REINICIAR);

  useEffect(() => {
    const relogio = setInterval(() => {
      setRestam((atual) => atual - 1);
    }, 1000);

    return () => clearInterval(relogio);
  }, []);

  useEffect(() => {
    if (restam <= 0) onConcluir();
  }, [restam, onConcluir]);

  return (
    <div className="animate-surgir mx-auto flex w-full max-w-xl flex-col items-center gap-7 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-marca-verde-forte text-white">
        <IconeCheck className="size-11" />
      </span>

      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance text-marca-azul">
          Retirada confirmada
        </h1>
        <p className="mt-2 text-lg text-tinta-suave">
          {itens.length === 1
            ? "O equipamento abaixo está registrado no seu nome."
            : "Os equipamentos abaixo estão registrados no seu nome."}
        </p>
      </div>

      <ul className="flex flex-wrap justify-center gap-3">
        {itens.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border-2 border-sucesso-borda bg-sucesso-fundo px-5 py-3"
          >
            <span className="block font-mono text-xl font-bold text-marca-verde-forte">
              {item.id}
            </span>
            <span className="block text-sm text-tinta-suave">{item.tipo}</span>
          </li>
        ))}
      </ul>

      <p className="max-w-prose text-base text-tinta-suave">
        Pode retirar da bancada, <span className="font-semibold text-tinta">{nome}</span>.
        Para devolver, é só voltar aqui e informar a matrícula.
      </p>

      <Botao tamanho="grande" onClick={onConcluir} larguraTotal>
        Concluir
      </Botao>

      <p aria-live="polite" className="numeros-tabulares text-sm text-tinta-tenue">
        A tela volta ao início em {Math.max(restam, 0)}s
      </p>
    </div>
  );
}
