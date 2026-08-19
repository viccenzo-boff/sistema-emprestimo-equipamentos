"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { confirmarRecebimento } from "@/app/admin/actions";
import { SeloStatus } from "@/components/admin/SeloStatus";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeCategoria, IconeCheck } from "@/components/ui/icones";
import { Notificacao } from "@/components/ui/Notificacao";
import { STATUS_EQUIPAMENTO, type ItemDaFila } from "@/lib/tipos";

/**
 * Fila de Devoluções — a ação crítica do painel (spec, seção 4, Fluxo 3).
 *
 * Cada linha é uma tarefa física: pegar o aparelho na bancada, conferir a
 * etiqueta contra o adesivo e dar baixa. Por isso não é tabela densa — é uma
 * lista de cartões, com a etiqueta grande e em monoespaçada, do jeito que ela
 * está colada no equipamento.
 *
 * A confirmação roda dentro de `useTransition`: o botão só para de girar quando
 * a árvore revalidada chega e a linha some da lista. Sem isso, haveria um
 * intervalo em que a linha aparece pronta para ser confirmada de novo.
 */

type Props = {
  itens: ItemDaFila[];
};

type Falha = { id: number; mensagem: string; detalhe?: string };

export function FilaDeDevolucoes({ itens }: Props) {
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function confirmar(item: ItemDaFila) {
    if (confirmandoId !== null) return;

    setConfirmandoId(item.id);
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await confirmarRecebimento(item.id);

      if (!resultado.ok) {
        setFalha({
          id: item.id,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });

        // A linha saiu da fila por outra via (outra aba da secretaria). Manter
        // o cartão na tela convidaria a clicar de novo no que já não existe.
        if (resultado.motivo === "EMPRESTIMO_NAO_ENCONTRADO") router.refresh();

        setConfirmandoId(null);
        return;
      }

      setAviso(
        resultado.dados.liberado
          ? `${resultado.dados.equip_id} recebido e disponível para retirada.`
          : `${resultado.dados.equip_id} recebido. Continua em manutenção.`,
      );

      setConfirmandoId(null);
    });
  }

  // A fila vazia não pode sair por cima com `return` antecipado: o aviso de
  // sucesso vive neste componente, e o último item confirmado é justamente o que
  // esvazia a lista. Com o retorno antecipado, a confirmação que mais importa —
  // a da última baixa — desapareceria junto com a linha.
  if (itens.length === 0) {
    return (
      <>
        <section className="flex flex-col items-center gap-4 rounded-3xl border border-borda bg-superficie px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-sucesso-fundo text-marca-verde-forte">
            <IconeCheck className="size-8" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-tinta">
              Nenhuma devolução esperando
            </h2>
            <p className="mt-2 text-lg text-tinta-suave">
              Quando alguém devolver um equipamento no tablet, ele aparece aqui para
              conferência.
            </p>
          </div>
        </section>

        <Notificacao mensagem={aviso} onFechar={() => setAviso(null)} />
      </>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <ul className="flex flex-col gap-4">
          {itens.map((item) => (
            <li
              key={item.id}
              className="rounded-3xl border border-borda bg-superficie p-5 shadow-sm lg:p-6"
            >
              <div className="grid items-center gap-x-6 gap-y-5 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-marca-azul-tenue text-marca-azul">
                  <IconeCategoria tipo={item.tipo} className="size-8" />
                </span>

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-2xl font-bold tracking-tight text-tinta">
                      {item.equip_id}
                    </span>
                    <span className="text-base text-tinta-suave">{item.tipo}</span>
                  </div>

                  <p className="text-lg leading-snug font-semibold text-tinta">
                    {item.nome}
                  </p>

                  <p className="numeros-tabulares text-base text-tinta-suave">
                    {item.perfil === "PROFESSOR" ? "Professor" : "Aluno"} ·{" "}
                    {item.matricula}
                  </p>

                  <p className="mt-1 text-base text-tinta-tenue">
                    Devolução informada em {item.declaradoEm}{" "}
                    <span className="font-semibold text-aviso">
                      ({item.esperandoHa})
                    </span>
                    <span className="sr-only">
                      . Retirado em {item.retiradoEm}.
                    </span>
                  </p>
                </div>

                <Botao
                  variante="sucesso"
                  tamanho="grande"
                  onClick={() => confirmar(item)}
                  carregando={confirmandoId === item.id}
                  disabled={confirmandoId !== null && confirmandoId !== item.id}
                  className="w-full lg:w-auto"
                  aria-label={`Confirmar recebimento físico de ${item.equip_id}, devolvido por ${item.nome}`}
                >
                  <IconeCheck className="size-6" />
                  Confirmar Recebimento Físico
                </Botao>
              </div>

              {falha?.id === item.id ? (
                <Alerta
                  tom="erro"
                  mensagem={falha.mensagem}
                  detalhe={falha.detalhe}
                  className="mt-5"
                />
              ) : null}
            </li>
          ))}
        </ul>

        {/*
          O que a confirmação faz, escrito onde a decisão acontece. É a única
          regra do sistema que não dá para inferir da tela: até este clique, o
          equipamento continua fora do inventário do tablet.
        */}
        <p className="flex flex-wrap items-center gap-2 px-1 text-base text-tinta-tenue">
          Ao confirmar, o equipamento volta para
          <SeloStatus status={STATUS_EQUIPAMENTO.disponivel} />e aparece de novo no
          tablet.
        </p>
      </section>

      <Notificacao mensagem={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}
