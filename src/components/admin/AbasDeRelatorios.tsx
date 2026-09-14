"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ABA_DE_RELATORIO, type AbaDeRelatorio } from "@/lib/tipos";

/**
 * A barra de abas do `/admin/relatorios` (Tarefa 13, item 1).
 *
 * É a única parte desta tela que precisa de estado, e por isso é a única ilha
 * de cliente aqui: o conteúdo de cada aba chega pronto do servidor, como
 * `children` tipado. Fosse a página inteira um componente de cliente, a
 * consulta ao banco teria de virar chamada de ação — e o painel lê o banco no
 * render, nunca por ação (ver o cabeçalho de
 * [consultas-admin.ts](src/lib/consultas-admin.ts)).
 *
 * **A aba viva não entra na URL**, e o preço é conhecido: recarregar a página
 * volta para a primeira. É a mesma escolha dos filtros do inventário na Tarefa
 * 7, e pelo mesmo motivo — o relatório inteiro já chega no render, e levar a
 * aba para `searchParams` custaria um render do Server Component a cada clique
 * para trocar de painel entre dados que já estão na mão. Ninguém compartilha
 * link de aba de relatório; quem precisa do número manda o número.
 *
 * O padrão de teclado é o de abas de verdade, e não o de uma fileira de botões:
 * `Tab` entra e sai da barra inteira (um só ponto de parada, pelo `tabIndex`
 * rotativo), e as setas trocam de aba. Sem isso, três abas custariam três
 * paradas de `Tab` antes de chegar ao conteúdo — e a quarta, quando o relatório
 * de consumo existir, custaria quatro.
 */

const ABAS: { id: AbaDeRelatorio; rotulo: string }[] = [
  /*
    Os três rótulos são os do enunciado da Tarefa 13, letra por letra — caixa
    inclusive, e ela não é uniforme entre os três. Uniformizar é tentador e
    sairia caro: a página da wiki cita rótulo de tela literalmente, e o
    enunciado é quem nomeia estas abas. Se um dia a caixa for acertada, é uma
    decisão de produto e as duas páginas mudam junto.
  */
  { id: ABA_DE_RELATORIO.ocupacao, rotulo: "Ocupação e picos de uso" },
  { id: ABA_DE_RELATORIO.consumo, rotulo: "Ranking de Consumo" },
  { id: ABA_DE_RELATORIO.manutencao, rotulo: "Índice de Manutenção" },
];

export function AbasDeRelatorios({ ocupacao }: { ocupacao: ReactNode }) {
  const [ativa, setAtiva] = useState<AbaDeRelatorio>(ABA_DE_RELATORIO.ocupacao);
  const barra = useRef<HTMLDivElement>(null);

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    const atual = ABAS.findIndex((aba) => aba.id === ativa);

    const destino =
      evento.key === "ArrowRight"
        ? (atual + 1) % ABAS.length
        : evento.key === "ArrowLeft"
          ? (atual - 1 + ABAS.length) % ABAS.length
          : evento.key === "Home"
            ? 0
            : evento.key === "End"
              ? ABAS.length - 1
              : -1;

    if (destino < 0) return;

    evento.preventDefault();
    setAtiva(ABAS[destino].id);

    /*
      O foco acompanha a seta — é o que a seta significa em uma barra de abas.
      Procurado pelo `id` dentro da barra, e não guardado em um mapa de `ref`:
      o botão de destino já existe no DOM (as três abas são sempre
      renderizadas), então não há o que esperar.
    */
    barra.current?.querySelector<HTMLButtonElement>(`#${idDaAba(ABAS[destino].id)}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        ref={barra}
        role="tablist"
        aria-label="Relatórios disponíveis"
        onKeyDown={aoTeclar}
        className="flex flex-wrap gap-2 border-b border-borda"
      >
        {ABAS.map(({ id, rotulo }) => {
          const viva = id === ativa;

          return (
            <button
              key={id}
              id={idDaAba(id)}
              type="button"
              role="tab"
              aria-selected={viva}
              aria-controls={idDoPainel(id)}
              /*
                Ponto de parada único: só a aba viva recebe `Tab`. É o que
                transforma a barra em um controle, em vez de três controles.
              */
              tabIndex={viva ? 0 : -1}
              onClick={() => setAtiva(id)}
              className={[
                "-mb-px min-h-12 rounded-t-xl border-b-2 px-4 py-2.5",
                "text-base font-semibold transition-colors duration-150",
                viva
                  ? "border-marca-azul text-marca-azul"
                  : "border-transparent text-tinta-suave hover:border-borda-forte hover:text-tinta",
              ].join(" ")}
            >
              {rotulo}
            </button>
          );
        })}
      </div>

      {ABAS.map(({ id }) => (
        /*
          Os três painéis ficam no DOM e o `hidden` esconde os dois inativos —
          é o que permite ao `aria-controls` de cada aba apontar para um
          elemento que existe de verdade.

          Nenhuma classe de `display` neste elemento, e isso é load-bearing: no
          Tailwind, `flex` ou `grid` aqui venceriam o atributo `hidden` e os
          três painéis apareceriam empilhados. Quem precisa de layout é o
          conteúdo, uma camada abaixo.
        */
        <div
          key={id}
          id={idDoPainel(id)}
          role="tabpanel"
          aria-labelledby={idDaAba(id)}
          hidden={id !== ativa}
          tabIndex={0}
        >
          {id === ABA_DE_RELATORIO.ocupacao ? ocupacao : <EmDesenvolvimento />}
        </div>
      ))}
    </div>
  );
}

function idDaAba(id: AbaDeRelatorio): string {
  return `aba-${id}`;
}

function idDoPainel(id: AbaDeRelatorio): string {
  return `painel-${id}`;
}

/**
 * O lugar reservado dos dois relatórios que ainda não existem.
 *
 * A primeira linha é a do enunciado, palavra por palavra. A segunda é o que
 * transforma um aviso em uma saída: sozinha, "Relatório em desenvolvimento"
 * dentro de um painel em branco é indistinguível de uma tela que falhou ao
 * carregar, e quem clicou fica olhando a mesma aba esperando.
 *
 * A borda tracejada diz a mesma coisa em silêncio — é a única superfície do
 * painel que não é uma caixa fechada, porque é a única que ainda não é nada.
 */
function EmDesenvolvimento() {
  return (
    <div className="rounded-2xl border border-dashed border-borda bg-superficie-2 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-tinta-suave">
        Relatório em desenvolvimento...
      </p>
      <p className="mt-2 text-base text-tinta-tenue">
        Esta aba ainda não tem dados. O relatório disponível é{" "}
        <strong className="font-semibold">Ocupação e picos de uso</strong>.
      </p>
    </div>
  );
}
