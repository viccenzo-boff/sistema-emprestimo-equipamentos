"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  COR_DA_GRADE_DO_GRAFICO,
  COR_DA_SERIE_UNICA,
  COR_DO_TEXTO_DO_GRAFICO,
} from "@/lib/cores-de-grafico";
import type { PontoDaSerie } from "@/lib/tipos";

import { DicaDoGrafico, EIXO, reduzirMovimento, type TipoDeSerie } from "./comum";

/**
 * Uma série no tempo — barras ou linha, um eixo só (Tarefa 16, §4).
 *
 * **Este arquivo é o único, com o irmão `GraficoDeComposicao`, que importa o
 * Recharts.** Os dois entram na página por `next/dynamic` com `ssr: false`
 * (ver [Graficos.tsx](Graficos.tsx)): o pacote só desce em `/admin/relatorios`,
 * e nunca em `/admin/inventario` — medido.
 *
 * **Nunca eixo duplo.** Duas grandezas no mesmo gráfico com duas escalas é
 * a forma mais barata de fazer uma linha parecer que cruza a outra sem
 * cruzar nada. Quem precisar comparar duas séries usa dois gráficos.
 *
 * O rótulo direto aparece **só no extremo** (o maior valor); o resto fica no
 * tooltip e na tabela gêmea, que o componente que renderiza a série põe ao
 * lado (`<details>` "Ver como tabela"). Número em todo ponto vira ruído a
 * partir de uma dúzia de barras.
 */

type Props = {
  pontos: readonly PontoDaSerie[];
  tipo: TipoDeSerie;
  /** Altura do gráfico inteiro, eixo incluído — ver a nota em `Graficos.tsx`. */
  altura: number;
  /** O nome da grandeza, para o tooltip: "retiradas". */
  grandeza: string;
};

export function GraficoDeSerie({ pontos, tipo, altura, grandeza }: Props) {
  const maior = Math.max(0, ...pontos.map((ponto) => ponto.valor));
  const indiceDoMaior = pontos.findIndex((ponto) => ponto.valor === maior);

  // O rótulo direto vai num campo próprio, nulo em todo ponto menos o maior:
  // é o que faz o `LabelList` escrever um número só.
  const dados = pontos.map((ponto, i) => ({
    ...ponto,
    rotuloDireto: i === indiceDoMaior && maior > 0 ? ponto.valor : null,
  }));

  const semMovimento = reduzirMovimento();
  const eixos = (
    <>
      <CartesianGrid vertical={false} stroke={COR_DA_GRADE_DO_GRAFICO} />
      <XAxis
        dataKey="rotulo"
        tick={EIXO.tick}
        tickLine={false}
        axisLine={EIXO.linha}
        interval="preserveStartEnd"
        minTickGap={12}
      />
      <YAxis
        allowDecimals={false}
        tick={EIXO.tick}
        tickLine={false}
        axisLine={false}
        width={36}
      />
      <Tooltip
        cursor={{ fill: COR_DA_GRADE_DO_GRAFICO, fillOpacity: 0.5, stroke: COR_DA_GRADE_DO_GRAFICO }}
        content={(props) => {
          const item = props.payload?.[0];
          return (
            <DicaDoGrafico
              ativo={props.active}
              titulo={item?.payload?.detalhe}
              valor={typeof item?.value === "number" ? item.value : undefined}
              grandeza={grandeza}
            />
          );
        }}
      />
    </>
  );

  const margem = { top: 24, right: 12, bottom: 4, left: 0 };

  if (tipo === "linha") {
    return (
      <LineChart responsive width="100%" height={altura} data={dados} margin={margem}>
        {eixos}
        <Line
          type="monotone"
          dataKey="valor"
          name={grandeza}
          stroke={COR_DA_SERIE_UNICA}
          strokeWidth={2.5}
          dot={{ r: 3, fill: COR_DA_SERIE_UNICA, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive={!semMovimento}
        >
          <LabelList
            dataKey="rotuloDireto"
            position="top"
            offset={8}
            fill={COR_DO_TEXTO_DO_GRAFICO}
            fontSize={12}
            fontWeight={600}
          />
        </Line>
      </LineChart>
    );
  }

  return (
    <BarChart responsive width="100%" height={altura} data={dados} margin={margem} barCategoryGap="20%">
      {eixos}
      <Bar
        dataKey="valor"
        name={grandeza}
        fill={COR_DA_SERIE_UNICA}
        radius={[4, 4, 0, 0]}
        isAnimationActive={!semMovimento}
      >
        <LabelList
          dataKey="rotuloDireto"
          position="top"
          offset={6}
          fill={COR_DO_TEXTO_DO_GRAFICO}
          fontSize={12}
          fontWeight={600}
        />
      </Bar>
    </BarChart>
  );
}
