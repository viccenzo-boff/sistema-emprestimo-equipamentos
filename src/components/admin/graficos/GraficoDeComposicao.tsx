"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  COR_DA_GRADE_DO_GRAFICO,
  COR_DO_TEXTO_DO_GRAFICO,
  TOM_DE_OUTRAS,
} from "@/lib/cores-de-grafico";
import type { FatiaDeComposicao } from "@/lib/tipos";

import { DicaDoGrafico, EIXO, reduzirMovimento, type TipoDeComposicao } from "./comum";

/**
 * Uma composição parte-do-todo — barras horizontais ou pizza (Tarefa 16, §4).
 *
 * É o gráfico de "Retiradas por categoria", a única composição parte-do-todo
 * da tela e a única onde pizza faz sentido. O seletor de visualização fica no
 * invólucro ([Graficos.tsx](Graficos.tsx)); aqui chega o tipo já escolhido.
 *
 * **Pizza com no máximo seis fatias.** Acima disso as menores viram "Outras",
 * em cinza: uma pizza de oito fatias de 4% não se lê, e a tabela ao lado tem
 * todas de qualquer jeito. O rótulo direto (o percentual) só entra nas fatias
 * que cabem — 8% ou mais —, e o resto fica na legenda e no tooltip. A cor do
 * texto sobre a fatia vem pronta de `cores-de-grafico.ts`, calculada por
 * contraste: branco em cinco tons, `tinta` sobre o âmbar.
 */

const MAXIMO_DE_FATIAS = 6;
const MENOR_FATIA_COM_ROTULO = 0.08;

type Props = {
  fatias: readonly FatiaDeComposicao[];
  tipo: TipoDeComposicao;
  altura: number;
  grandeza: string;
};

export function GraficoDeComposicao({ fatias, tipo, altura, grandeza }: Props) {
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);
  const semMovimento = reduzirMovimento();

  if (tipo === "pizza") {
    const dados = agruparAsMenores(fatias.filter((fatia) => fatia.valor > 0));

    return (
      <PieChart responsive width="100%" height={altura} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={dados}
          dataKey="valor"
          nameKey="nome"
          cx="50%"
          cy="50%"
          outerRadius="80%"
          stroke="#ffffff"
          strokeWidth={2}
          isAnimationActive={!semMovimento}
          labelLine={false}
          label={(props) => {
            const fatia = props.payload as FatiaDeComposicao | undefined;
            const percentual = props.percent ?? 0;
            if (!fatia || percentual < MENOR_FATIA_COM_ROTULO) return null;

            /*
              O `x`/`y` que o Recharts entrega ficam FORA da fatia (é a posição
              do rótulo externo padrão): branco ali some sobre o cartão. O
              rótulo direto vai dentro, a 60% do raio, calculado do centro e
              do ângulo médio — o padrão da própria documentação do Recharts.
            */
            const raio = Number(props.innerRadius ?? 0) + (Number(props.outerRadius ?? 0) - Number(props.innerRadius ?? 0)) * 0.6;
            const angulo = (-(props.midAngle ?? 0) * Math.PI) / 180;
            const x = Number(props.cx ?? 0) + raio * Math.cos(angulo);
            const y = Number(props.cy ?? 0) + raio * Math.sin(angulo);

            return (
              <text
                x={x}
                y={y}
                fill={fatia.corDoRotulo}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={600}
              >
                {Math.round(percentual * 100)}%
              </text>
            );
          }}
        >
          {dados.map((fatia) => (
            <Cell key={fatia.nome} fill={fatia.cor} />
          ))}
        </Pie>
        <Tooltip
          content={(props) => {
            const item = props.payload?.[0];
            const valor = typeof item?.value === "number" ? item.value : undefined;
            return (
              <DicaDoGrafico
                ativo={props.active}
                titulo={item?.name}
                valor={valor}
                grandeza={grandeza}
                complemento={
                  valor !== undefined && total > 0
                    ? `${Math.round((valor / total) * 100)}% do total`
                    : undefined
                }
              />
            );
          }}
        />
        {/*
          A legenda na ordem das fatias (a do ranking), e não alfabética, que
          é o padrão do `itemSorter`; e o texto em `tinta-suave` pelo
          `formatter`, porque o Recharts pinta cada item com a cor da série —
          e texto nunca usa a cor da série.
        */}
        <Legend
          iconType="circle"
          iconSize={10}
          itemSorter={(item) => dados.findIndex((fatia) => fatia.nome === item.value)}
          formatter={(valor) => <span style={{ color: COR_DO_TEXTO_DO_GRAFICO }}>{valor}</span>}
          wrapperStyle={{ fontSize: 13 }}
        />
      </PieChart>
    );
  }

  const maior = Math.max(0, ...fatias.map((fatia) => fatia.valor));
  const dados = fatias.map((fatia) => ({
    ...fatia,
    rotuloDireto: fatia.valor === maior && maior > 0 ? fatia.valor : null,
  }));

  return (
    <BarChart
      responsive
      width="100%"
      height={altura}
      data={dados}
      layout="vertical"
      margin={{ top: 4, right: 36, bottom: 4, left: 4 }}
      barCategoryGap="28%"
    >
      <CartesianGrid horizontal={false} stroke={COR_DA_GRADE_DO_GRAFICO} />
      <XAxis type="number" allowDecimals={false} tick={EIXO.tick} tickLine={false} axisLine={EIXO.linha} />
      <YAxis
        type="category"
        dataKey="nome"
        tick={EIXO.tick}
        tickLine={false}
        axisLine={false}
        width={92}
      />
      <Tooltip
        cursor={{ fill: COR_DA_GRADE_DO_GRAFICO, fillOpacity: 0.5 }}
        content={(props) => {
          const item = props.payload?.[0];
          const valor = typeof item?.value === "number" ? item.value : undefined;
          return (
            <DicaDoGrafico
              ativo={props.active}
              titulo={props.label}
              valor={valor}
              grandeza={grandeza}
              complemento={
                valor !== undefined && total > 0
                  ? `${Math.round((valor / total) * 100)}% do total`
                  : undefined
              }
            />
          );
        }}
      />
      <Bar dataKey="valor" name={grandeza} radius={[0, 4, 4, 0]} isAnimationActive={!semMovimento}>
        {dados.map((fatia) => (
          <Cell key={fatia.nome} fill={fatia.cor} />
        ))}
        <LabelList
          dataKey="rotuloDireto"
          position="right"
          offset={8}
          fill={COR_DO_TEXTO_DO_GRAFICO}
          fontSize={12}
          fontWeight={600}
        />
      </Bar>
    </BarChart>
  );
}

/**
 * Mantém as cinco maiores e soma o resto em "Outras". Só age acima de seis:
 * com seis exatas, a sexta é uma categoria de verdade, e não "o resto".
 */
function agruparAsMenores(fatias: readonly FatiaDeComposicao[]): FatiaDeComposicao[] {
  if (fatias.length <= MAXIMO_DE_FATIAS) return [...fatias];

  const ordenadas = [...fatias].sort((a, b) => b.valor - a.valor);
  const maiores = ordenadas.slice(0, MAXIMO_DE_FATIAS - 1);
  const resto = ordenadas.slice(MAXIMO_DE_FATIAS - 1);

  return [
    ...maiores,
    {
      nome: "Outras",
      valor: resto.reduce((soma, fatia) => soma + fatia.valor, 0),
      cor: TOM_DE_OUTRAS.cor,
      corDoRotulo: TOM_DE_OUTRAS.corDoRotulo,
    },
  ];
}
