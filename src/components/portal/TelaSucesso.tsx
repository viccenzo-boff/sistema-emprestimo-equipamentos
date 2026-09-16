"use client";

import { useEffect, useState } from "react";

import { AvaliacaoDaRetirada } from "@/components/portal/AvaliacaoDaRetirada";
import { Botao } from "@/components/ui/Botao";
import { IconeCheck } from "@/components/ui/icones";
import { ImagemQr } from "@/components/ui/ImagemQr";
import type { AvaliacaoPedida, EquipamentoDisponivel, QrDoFormulario } from "@/lib/tipos";

/**
 * Fim do Fluxo 1.
 *
 * A tela se fecha sozinha depois de alguns segundos porque o tablet é
 * compartilhado: se ficasse parada, o próximo aluno encontraria o nome e a
 * retirada de outra pessoa na tela.
 *
 * Desde a Tarefa 14 ela também é onde a pesquisa de satisfação mora — os
 * quatro rostos entram entre o "Pode retirar da bancada" e o **Concluir**, e o
 * QR do formulário de sugestões ao lado deles. Os dois chegam por props: quem
 * decide se os rostos aparecem é o servidor, e a tela só recebe
 * `avaliacao: { id } | null`. Pôr a pesquisa **aqui**, e não numa etapa nova,
 * é o que faz o custo do pedido cair a quase zero: o **Concluir** já é o
 * "pular", e o auto-fechamento já é o "ignorar".
 */

type Props = {
  nome: string;
  itens: EquipamentoDisponivel[];
  avaliacao: AvaliacaoPedida | null;
  qr: QrDoFormulario | null;
  onConcluir: () => void;
};

const SEGUNDOS_ATE_REINICIAR = 15;

export function TelaSucesso({ nome, itens, avaliacao, qr, onConcluir }: Props) {
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

  const temPesquisa = avaliacao !== null || qr !== null;

  return (
    <div className="animate-surgir mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      {/*
        Ícone e título lado a lado, e não empilhados como eram até a Tarefa 14:
        com os rostos e o QR no meio da tela, a coluna inteira precisa caber em
        800 px de altura no tablet deitado, e é a linha do ícone que devolve a
        altura que falta (medida abaixo, no comentário do bloco da pesquisa).
        Nada se encolheu: o alvo de toque dos rostos e o tamanho do QR são os
        do enunciado.
      */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5 sm:text-left">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-marca-verde-forte text-white">
          <IconeCheck className="size-9" />
        </span>

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-marca-azul">
            Retirada confirmada
          </h1>
          <p className="mt-1 text-lg text-tinta-suave">
            {itens.length === 1
              ? "O equipamento abaixo está registrado no seu nome."
              : "Os equipamentos abaixo estão registrados no seu nome."}
          </p>
        </div>
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

      {temPesquisa ? (
        /*
          Rostos e QR lado a lado no tablet deitado, empilhados no tablet em
          pé — a mesma divisão que a tela inicial já faz. (Medidas nas duas
          orientações: ver o registro da Tarefa 14 no AGENTS.md.)
        */
        <div className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row sm:items-start sm:gap-10">
          {avaliacao ? (
            <AvaliacaoDaRetirada avaliacaoId={avaliacao.id} onEncerrar={onConcluir} />
          ) : null}

          {qr ? (
            <div className="flex flex-col items-center gap-2">
              <span className="rounded-2xl border border-borda bg-white p-2">
                <ImagemQr
                  svg={qr.svg}
                  alt={`QR code que abre o formulário de sugestões em ${qr.url}`}
                  className="size-40"
                />
              </span>
              <p className="max-w-52 text-sm text-tinta-suave">
                Sugestão ou problema? Aponte a câmera do celular.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <Botao tamanho="grande" onClick={onConcluir} larguraTotal className="max-w-xl">
        Concluir
      </Botao>

      <p aria-live="polite" className="numeros-tabulares text-sm text-tinta-tenue">
        A tela volta ao início em {Math.max(restam, 0)}s
      </p>
    </div>
  );
}
