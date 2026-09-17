"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore, type ReactNode } from "react";

import type { FatiaDeComposicao, PontoDaSerie } from "@/lib/tipos";

import type { TipoDeComposicao, TipoDeSerie } from "./comum";

/**
 * Os dois gráficos como o resto do painel os vê (Tarefa 16, §4): o seletor de
 * visualização, o espaço reservado, e a montagem preguiçosa do Recharts.
 *
 * **Só os componentes de gráfico importam a biblioteca**, e eles entram aqui
 * por `next/dynamic` com `ssr: false` — o que exige que este invólucro seja
 * ilha de cliente (o guia instalado do Next 16 diz que `ssr: false` só
 * funciona dentro de Client Component). O espaço reservado tem **a mesma
 * altura** do gráfico, para a página não saltar quando o pedaço chega.
 *
 * **A altura inclui a faixa do eixo X.** O Recharts desenha os rótulos do
 * eixo dentro do `<svg>` de `height` dado; um contêiner de altura fixa menor
 * que isso ganha uma rolagem interna minúscula dentro do cartão.
 *
 * **O seletor de visualização é preferência, não consulta**: estado de
 * cliente, fora da URL, guardado em `localStorage` por gráfico dentro de
 * `try/catch` (o armazenamento pode estar bloqueado, e a página tem que
 * funcionar sem ele). Lido por `useSyncExternalStore` com um retrato de
 * servidor fixo no padrão — é o que evita a divergência de hidratação: o
 * servidor sempre pinta "Barras", e o cliente troca depois de hidratar, sem
 * aviso.
 */

const ALTURA_DA_SERIE = 260;
const ALTURA_DA_COMPOSICAO = 260;

const GraficoDeSerieInterno = dynamic(
  () => import("./GraficoDeSerie").then((modulo) => modulo.GraficoDeSerie),
  { ssr: false, loading: () => <EspacoReservado altura={ALTURA_DA_SERIE} /> },
);

const GraficoDeComposicaoInterno = dynamic(
  () => import("./GraficoDeComposicao").then((modulo) => modulo.GraficoDeComposicao),
  { ssr: false, loading: () => <EspacoReservado altura={ALTURA_DA_COMPOSICAO} /> },
);

/** "Retiradas por dia": barras ou linha. */
export function GraficoDeSerie({
  chave,
  titulo,
  pontos,
  grandeza,
  tabela,
}: {
  /** Identifica a preferência no `localStorage`: "retiradas-por-dia". */
  chave: string;
  titulo: string;
  pontos: readonly PontoDaSerie[];
  grandeza: string;
  /** A tabela gêmea, renderizada por quem tem os dados — vai num `<details>` abaixo. */
  tabela?: ReactNode;
}) {
  const [tipo, escolher] = usePreferenciaDeGrafico<TipoDeSerie>(chave, "barras", ["barras", "linha"]);

  return (
    <Moldura
      titulo={titulo}
      seletor={
        <SeletorDeVisualizacao
          rotulo={`Visualização de ${titulo}`}
          opcoes={[
            ["barras", "Barras"],
            ["linha", "Linha"],
          ]}
          ativo={tipo}
          aoEscolher={escolher}
        />
      }
      tabela={tabela}
    >
      <div style={{ height: ALTURA_DA_SERIE }}>
        <GraficoDeSerieInterno pontos={pontos} tipo={tipo} altura={ALTURA_DA_SERIE} grandeza={grandeza} />
      </div>
    </Moldura>
  );
}

/** "Retiradas por categoria": barras horizontais ou pizza. */
export function GraficoDeComposicao({
  chave,
  titulo,
  fatias,
  grandeza,
}: {
  chave: string;
  titulo: string;
  fatias: readonly FatiaDeComposicao[];
  grandeza: string;
}) {
  const [tipo, escolher] = usePreferenciaDeGrafico<TipoDeComposicao>(chave, "barras", ["barras", "pizza"]);

  return (
    <Moldura
      titulo={titulo}
      seletor={
        <SeletorDeVisualizacao
          rotulo={`Visualização de ${titulo}`}
          opcoes={[
            ["barras", "Barras"],
            ["pizza", "Pizza"],
          ]}
          ativo={tipo}
          aoEscolher={escolher}
        />
      }
    >
      <div style={{ height: ALTURA_DA_COMPOSICAO }}>
        <GraficoDeComposicaoInterno
          fatias={fatias}
          tipo={tipo}
          altura={ALTURA_DA_COMPOSICAO}
          grandeza={grandeza}
        />
      </div>
    </Moldura>
  );
}

function Moldura({
  titulo,
  seletor,
  tabela,
  children,
}: {
  titulo: string;
  seletor: ReactNode;
  tabela?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <figcaption className="text-base font-semibold text-tinta">{titulo}</figcaption>
        {seletor}
      </div>

      {children}

      {tabela ? (
        /*
          Todo gráfico tem tabela gêmea: o tooltip enriquece, nunca é o único
          caminho até o número. Nasce fechada para não dobrar a altura da aba.
        */
        <details className="group text-base">
          <summary className="cursor-pointer text-marca-azul underline-offset-4 hover:underline">
            Ver como tabela
          </summary>
          <div className="mt-3">{tabela}</div>
        </details>
      ) : null}
    </figure>
  );
}

/** O espaço que o gráfico vai ocupar, enquanto o pedaço do Recharts desce. */
function EspacoReservado({ altura }: { altura: number }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl bg-superficie-2"
      style={{ height: altura }}
    />
  );
}

/**
 * O controle segmentado de tipo de gráfico: botões com `aria-pressed`, um
 * por opção. É um grupo de botões e não um `<select>`, porque a troca é
 * imediata e são duas opções — o leitor vê as duas e o estado de cada uma.
 */
function SeletorDeVisualizacao<T extends string>({
  rotulo,
  opcoes,
  ativo,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: readonly (readonly [T, string])[];
  ativo: T;
  aoEscolher: (tipo: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex rounded-xl border border-borda bg-superficie-2 p-1">
      {opcoes.map(([valor, texto]) => {
        const escolhido = valor === ativo;
        return (
          <button
            key={valor}
            type="button"
            aria-pressed={escolhido}
            onClick={() => aoEscolher(valor)}
            className={[
              "min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors duration-150",
              escolhido
                ? "bg-superficie text-marca-azul shadow-sm"
                : "text-tinta-suave hover:text-tinta",
            ].join(" ")}
          >
            {texto}
          </button>
        );
      })}
    </div>
  );
}

const PREFIXO_DA_PREFERENCIA = "grafico:";

/**
 * A escolha desta visita, por gráfico. Ganha do `localStorage` na leitura:
 * é a mais recente, e é o que faz o seletor responder mesmo quando o
 * armazenamento recusa a escrita — aí a escolha vale até a recarga, e só.
 */
const escolhasDestaVisita = new Map<string, string>();

/**
 * A preferência de visualização de um gráfico, lida e gravada no
 * `localStorage`. `useSyncExternalStore` com retrato de servidor no padrão:
 * o HTML do servidor e a primeira hidratação concordam ("Barras"), e o valor
 * guardado entra logo depois, sem divergência. O evento `storage` não dispara
 * na própria aba, então `escolher` o dispara à mão para o retrato ser relido.
 *
 * Qualquer falha do armazenamento (privado, cheio, bloqueado) cai no padrão
 * em silêncio: a escolha não persiste, e a tela continua funcionando.
 */
function usePreferenciaDeGrafico<T extends string>(
  chave: string,
  padrao: T,
  validos: readonly T[],
): [T, (tipo: T) => void] {
  const nome = `${PREFIXO_DA_PREFERENCIA}${chave}`;

  const valor = useSyncExternalStore(
    (aoMudar) => {
      window.addEventListener("storage", aoMudar);
      return () => window.removeEventListener("storage", aoMudar);
    },
    () => {
      const guardado = escolhasDestaVisita.get(nome) ?? lerDoArmazenamento(nome);
      return validos.includes(guardado as T) ? (guardado as T) : padrao;
    },
    () => padrao,
  );

  function escolher(tipo: T) {
    escolhasDestaVisita.set(nome, tipo);
    try {
      window.localStorage.setItem(nome, tipo);
    } catch {
      // Sem armazenamento a escolha não sobrevive à recarga — mas vale nesta
      // visita, pelo mapa acima.
    }
    window.dispatchEvent(new Event("storage"));
  }

  return [valor, escolher];
}

function lerDoArmazenamento(nome: string): string | null {
  try {
    return window.localStorage.getItem(nome);
  } catch {
    return null;
  }
}
