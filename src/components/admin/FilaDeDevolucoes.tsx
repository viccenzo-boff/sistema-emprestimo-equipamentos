"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  confirmarRecebimento,
  confirmarTodosOsRecebimentos,
} from "@/app/admin/actions";
import { SeloStatus } from "@/components/admin/SeloStatus";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeCategoria, IconeCheck } from "@/components/ui/icones";
import { Notificacao } from "@/components/ui/Notificacao";
import {
  STATUS_EQUIPAMENTO,
  type ItemDaFila,
  type RecebimentoEmLote,
} from "@/lib/tipos";

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

/** Espelha o teto do servidor (ver `MAXIMO_DE_BAIXAS_EM_LOTE` nas actions). */
const MAXIMO_POR_RODADA = 50;

type Falha = { id: number; mensagem: string; detalhe?: string };

export function FilaDeDevolucoes({ itens }: Props) {
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [confirmandoTudo, setConfirmandoTudo] = useState(false);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [falhaDoLote, setFalhaDoLote] = useState<Omit<Falha, "id"> | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ocupada = confirmandoId !== null || confirmandoTudo;

  function confirmar(item: ItemDaFila) {
    if (ocupada) return;

    setConfirmandoId(item.id);
    setFalha(null);
    setFalhaDoLote(null);

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

  /**
   * "Confirmar Todas as Devoluções": a bancada inteira de uma vez.
   *
   * Manda os ids que estão nesta tela, e não um "tudo que estiver na fila": um
   * aluno pode ter declarado uma devolução depois deste render, com o aparelho
   * ainda na mochila. O botão confirma o que a secretaria tem diante dos olhos.
   */
  function confirmarTudo() {
    if (ocupada || itens.length === 0) return;

    setConfirmandoTudo(true);
    setFalha(null);
    setFalhaDoLote(null);

    iniciarTransicao(async () => {
      // O servidor recusa lotes acima do teto dele. Enviar uma rodada de cada
      // vez faz a fila gigante encolher a cada clique, em vez de devolver o
      // mesmo erro para sempre — o botão nunca fica sem saída.
      const resultado = await confirmarTodosOsRecebimentos(
        itens.slice(0, MAXIMO_POR_RODADA).map((item) => item.id),
      );

      if (!resultado.ok) {
        setFalhaDoLote({
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });

        if (resultado.motivo === "EMPRESTIMO_NAO_ENCONTRADO") router.refresh();

        setConfirmandoTudo(false);
        return;
      }

      setAviso(resumirLote(resultado.dados));
      setConfirmandoTudo(false);
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
        {/*
          A barra do lote só aparece com dois ou mais itens: com um só, ela
          duplicaria em verde o botão que já está na linha logo abaixo — dois
          gestos idênticos para a mesma tarefa, e a dúvida de qual dos dois faz
          o quê.
        */}
        {itens.length > 1 ? (
          <div className="flex flex-col gap-4 rounded-3xl border border-borda bg-superficie p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div className="min-w-0">
              <p className="numeros-tabulares text-lg leading-snug font-semibold text-tinta">
                {itens.length} equipamentos aguardando conferência
              </p>
              <p className="mt-1 text-base leading-snug text-tinta-suave">
                Confira as etiquetas na bancada antes de dar baixa em todos de uma
                vez.
              </p>
            </div>

            <Botao
              variante="sucesso"
              tamanho="grande"
              onClick={confirmarTudo}
              carregando={confirmandoTudo}
              disabled={confirmandoId !== null}
              className="w-full lg:w-auto lg:shrink-0"
              aria-label={`Confirmar o recebimento físico de todos os ${itens.length} equipamentos da fila`}
            >
              <IconeCheck className="size-6" />
              Confirmar Todas as Devoluções
            </Botao>
          </div>
        ) : null}

        {falhaDoLote ? (
          <Alerta
            tom="erro"
            mensagem={falhaDoLote.mensagem}
            detalhe={falhaDoLote.detalhe}
          />
        ) : null}

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
                  disabled={ocupada && confirmandoId !== item.id}
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

/**
 * Uma frase que conta o lote inteiro, incluindo o que não deu certo.
 *
 * O lote é melhor-esforço no servidor, então "5 recebidos" pode esconder duas
 * linhas que ficaram para trás. Omitir isso faria a secretaria fechar a tela
 * achando que a bancada está limpa.
 */
function resumirLote({
  confirmados,
  presas,
  foraDaFila,
  comFalha,
}: RecebimentoEmLote): string {
  const partes = [
    confirmados.length === 1
      ? "1 equipamento recebido."
      : `${confirmados.length} equipamentos recebidos.`,
  ];

  if (presas.length > 0) {
    partes.push(
      presas.length === 1
        ? `${presas[0]} continua em manutenção.`
        : `${presas.length} continuam em manutenção.`,
    );
  }

  if (foraDaFila > 0) {
    partes.push(
      foraDaFila === 1
        ? "1 já tinha saído da fila."
        : `${foraDaFila} já tinham saído da fila.`,
    );
  }

  if (comFalha > 0) {
    partes.push(
      comFalha === 1
        ? "1 não pôde ser confirmado — tente de novo."
        : `${comFalha} não puderam ser confirmados — tente de novo.`,
    );
  }

  return partes.join(" ");
}
