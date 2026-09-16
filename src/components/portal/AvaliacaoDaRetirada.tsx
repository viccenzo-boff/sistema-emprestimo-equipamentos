"use client";

import { useEffect, useState } from "react";

import { registrarAvaliacao } from "@/app/actions";
import { COR_DO_ROSTO, IconeRosto } from "@/components/ui/icones";
import { NOTAS_DE_AVALIACAO } from "@/lib/tipos";

/**
 * Os quatro rostos no fim da retirada (Tarefa 14, item 1).
 *
 * Uma pergunta, quatro toques possíveis, nenhum botão de enviar: tocar grava
 * e encerra. Quem decide se este bloco aparece é o servidor (`confirmarRetirada`
 * devolve `avaliacao: { id } | null`); aqui só existe o que a tela precisa —
 * o `id` da linha que o toque vai preencher.
 *
 * Depois do toque, os rostos dão lugar a um "Obrigado!" curto e a tela volta
 * ao início por `onEncerrar`. O aviso é mostrado **antes** de a resposta
 * chegar, e uma falha da action não aparece na tela: é uma pesquisa opcional
 * numa tela que dura um segundo, e "não foi possível registrar a sua opinião"
 * seria mais ruído do que informação para quem já está saindo com o aparelho
 * na mão. A falha vai para o console do servidor, onde alguém pode lê-la.
 */

type Props = {
  avaliacaoId: number;
  /** Chamado ~1 s depois do toque, para a tela voltar ao início. */
  onEncerrar: () => void;
};

/** Quanto tempo o "Obrigado!" fica na tela antes de ela voltar ao início. */
const OBRIGADO_MS = 1100;

export function AvaliacaoDaRetirada({ avaliacaoId, onEncerrar }: Props) {
  const [respondida, setRespondida] = useState(false);

  useEffect(() => {
    if (!respondida) return;

    const relogio = window.setTimeout(onEncerrar, OBRIGADO_MS);
    return () => window.clearTimeout(relogio);
  }, [respondida, onEncerrar]);

  function tocar(nota: number) {
    if (respondida) return;

    // Primeiro a tela, depois o servidor: o toque é o gesto inteiro, e ele
    // não pode ficar esperando a rede para dizer obrigado.
    setRespondida(true);

    void registrarAvaliacao(avaliacaoId, nota).then((resultado) => {
      if (!resultado.ok) {
        console.error("[avaliação] não registrada:", resultado.mensagem);
      }
    });
  }

  return (
    <section
      aria-labelledby="pergunta-da-avaliacao"
      className="flex flex-col items-center gap-4"
    >
      <h2
        id="pergunta-da-avaliacao"
        className="text-xl font-semibold tracking-tight text-tinta"
      >
        Como foi a retirada?
      </h2>

      {respondida ? (
        <p
          role="status"
          className="animate-surgir-curto flex min-h-22 items-center text-2xl font-semibold text-marca-verde-forte"
        >
          Obrigado!
        </p>
      ) : (
        <div className="flex gap-4">
          {[...NOTAS_DE_AVALIACAO].map(([nota, rotulo]) => (
            /*
              88 px de alvo (`size-22`), acima dos 64 px mínimos do projeto:
              é um toque de passagem, feito de pé, com o aparelho já na outra
              mão. O rótulo é só para leitor de tela — na tela, a boca fala.
            */
            <button
              key={nota}
              type="button"
              onClick={() => tocar(nota)}
              className={[
                "flex size-22 items-center justify-center rounded-full",
                "transition-transform duration-150 ease-out active:scale-90",
                COR_DO_ROSTO.get(nota) ?? "text-tinta",
              ].join(" ")}
            >
              <IconeRosto nota={nota} className="size-20" />
              <span className="sr-only">{rotulo}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
