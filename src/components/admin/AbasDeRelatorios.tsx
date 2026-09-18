"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ABA_DE_RELATORIO, type AbaDeRelatorio } from "@/lib/tipos";

/**
 * A barra de abas do `/admin/relatorios` (Tarefa 13, item 1).
 *
 * O conteúdo de cada aba chega pronto do servidor, como `children` tipado.
 * Fosse a página inteira um componente de cliente, a consulta ao banco teria
 * de virar chamada de ação — e o painel lê o banco no render, nunca por ação
 * (ver o cabeçalho de [consultas-admin.ts](src/lib/consultas-admin.ts)).
 *
 * **A aba viva entra na URL (`?aba=consumo`) desde a Tarefa 16**, revertendo
 * a decisão da Tarefa 13. O motivo é o período: ele mora nos `searchParams`
 * e trocá-lo é uma navegação — sem a aba na URL, cada troca de período
 * voltaria para a primeira aba. Agora há motivo real, e sai link
 * compartilhável de graça (F5 mantém aba e período).
 *
 * **Trocar de aba continua não indo ao servidor.** A URL muda por
 * `window.history.replaceState`, que o App Router integra ao roteador (o
 * `useSearchParams` de quem estiver ouvindo é atualizado) **sem buscar RSC**
 * — medido: zero requisições na troca de aba, uma na troca de período. Os
 * quatro painéis continuam no DOM, escondidos por `hidden`. A aba inicial vem
 * da URL, lida no servidor; `aba` inválida cai na primeira. Este componente
 * deixou de ser o dono do estado: ele o inicializa e o espelha.
 *
 * O padrão de teclado é o de abas de verdade, e não o de uma fileira de botões:
 * `Tab` entra e sai da barra inteira (um só ponto de parada, pelo `tabIndex`
 * rotativo), e as setas trocam de aba. Sem isso, quatro abas custariam quatro
 * paradas de `Tab` antes de chegar ao conteúdo.
 */

const ABAS: { id: AbaDeRelatorio; rotulo: string }[] = [
  /*
    Os três rótulos da Tarefa 13 são os do enunciado dela, letra por letra —
    caixa inclusive, e ela não é uniforme entre os três. Uniformizar é tentador e
    sairia caro: a página da wiki cita rótulo de tela literalmente, e o
    enunciado é quem nomeia estas abas. Se um dia a caixa for acertada, é uma
    decisão de produto e as duas páginas mudam junto.
  */
  { id: ABA_DE_RELATORIO.ocupacao, rotulo: "Ocupação e picos de uso" },
  // A Tarefa 14 acrescentou esta, em segundo — ver `ABA_DE_RELATORIO`.
  { id: ABA_DE_RELATORIO.satisfacao, rotulo: "Satisfação" },
  // A Tarefa 16 construiu esta e a 17 a de baixo: nenhuma aba está vazia.
  { id: ABA_DE_RELATORIO.consumo, rotulo: "Ranking de Consumo" },
  { id: ABA_DE_RELATORIO.manutencao, rotulo: "Índice de Manutenção" },
];

export function AbasDeRelatorios({
  abaInicial,
  ocupacao,
  satisfacao,
  consumo,
  manutencao,
}: {
  abaInicial: AbaDeRelatorio;
  ocupacao: ReactNode;
  satisfacao: ReactNode;
  consumo: ReactNode;
  manutencao: ReactNode;
}) {
  const [ativa, setAtiva] = useState<AbaDeRelatorio>(abaInicial);
  const barra = useRef<HTMLDivElement>(null);

  /**
   * `replaceState`, e não `pushState`: trocar de aba não é um passo que o
   * Voltar do navegador deva desfazer — o período é (ele usa `router.push`).
   * Os outros parâmetros (`de`/`ate`) ficam como estão.
   */
  function ativar(aba: AbaDeRelatorio) {
    setAtiva(aba);

    const url = new URL(window.location.href);
    url.searchParams.set("aba", aba);
    window.history.replaceState(null, "", url.toString());
  }

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
    ativar(ABAS[destino].id);

    /*
      O foco acompanha a seta — é o que a seta significa em uma barra de abas.
      Procurado pelo `id` dentro da barra, e não guardado em um mapa de `ref`:
      o botão de destino já existe no DOM (as quatro abas são sempre
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
                transforma a barra em um controle, em vez de quatro controles.
              */
              tabIndex={viva ? 0 : -1}
              onClick={() => ativar(id)}
              /*
                Entre `lg` e `xl` a aba encolhe (corpo 14 px, recuo 10 px), e
                só aí: é a única faixa em que a coluna lateral já ocupa a tela
                E a largura ainda é pequena. Medido com a quarta aba, em 1024:
                a barra tem 656 px e as quatro abas no tamanho normal somam
                756 — a última descia para uma segunda linha. Abaixo de `lg` a
                barra lateral vira faixa e o conteúdo ganha a largura toda; de
                `xl` para cima sobra espaço. Refaça a medida se entrar uma
                quinta aba, ou se um rótulo crescer.
              */
              className={[
                "-mb-px min-h-12 rounded-t-xl border-b-2 px-4 py-2.5 lg:px-2.5 xl:px-4",
                "text-base font-semibold transition-colors duration-150 lg:text-sm xl:text-base",
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
          Os quatro painéis ficam no DOM e o `hidden` esconde os três inativos —
          é o que permite ao `aria-controls` de cada aba apontar para um
          elemento que existe de verdade.

          Nenhuma classe de `display` neste elemento, e isso é load-bearing: no
          Tailwind, `flex` ou `grid` aqui venceriam o atributo `hidden` e os
          quatro painéis apareceriam empilhados. Quem precisa de layout é o
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
          {id === ABA_DE_RELATORIO.ocupacao ? (
            ocupacao
          ) : id === ABA_DE_RELATORIO.satisfacao ? (
            satisfacao
          ) : id === ABA_DE_RELATORIO.consumo ? (
            consumo
          ) : (
            manutencao
          )}
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
