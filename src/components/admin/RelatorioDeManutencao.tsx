import type { ReactNode } from "react";

import { BotaoBaixarXlsx } from "@/components/admin/BotaoBaixarXlsx";
import { CartaoDeResumo } from "@/components/admin/CartaoDeResumo";
import { GraficoDeSerie } from "@/components/admin/graficos/Graficos";
import { SeloStatus } from "@/components/admin/SeloStatus";
import { CABECALHO, CELULA } from "@/components/ui/Campo";
import {
  ROTULO_DO_STATUS_DE_EQUIPAMENTO,
  STATUS_EQUIPAMENTO,
  type AbaDeExportacao,
  type RelatorioDeManutencao as Dados,
} from "@/lib/tipos";

/**
 * Índice de Manutenção — o quarto e último relatório declarado do painel
 * (Tarefa 17, §3).
 *
 * As duas perguntas da coordenação são diferentes, e por isso são dois
 * números: **quantas vezes quebra** (as entradas, pela regra de evento) e
 * **quanto do estoque fica parado** (o índice, pela regra de tempo). As duas
 * regras estão escritas em `RelatorioDeManutencao`, em
 * [tipos.ts](src/lib/tipos.ts) — este componente só desenha o que a consulta
 * calculou, com as durações e as datas já formatadas no servidor.
 *
 * Quatro cartões, o gráfico de entradas no tempo, a tabela por equipamento
 * (só quem teve manutenção — aqui zero é a norma), a tabela por categoria
 * (todas, com o índice em barra) e o **Histórico**: toda transição do
 * período, inclusive inativar e reativar, com quem fez. É a única tabela do
 * painel que responde "quem inativou o NOTE-10".
 *
 * Não é ilha de cliente: nada aqui responde a clique, exceto as duas ilhas que
 * já são de cliente por conta própria (o gráfico e o botão de baixar).
 */
export function RelatorioDeManutencao({ dados, de, ate }: { dados: Dados; de: string; ate: string }) {
  const semEntrada = dados.entradas === 0;
  const fraseDeVazio = `Nenhuma entrada em manutenção em ${dados.periodo}.`;

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Indicadores do período" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <p className="max-w-3xl text-base text-tinta-suave">
            Manutenção em <strong className="font-semibold text-tinta">{dados.periodo}</strong>.
            Uma <strong className="font-semibold">entrada</strong> conta no período em que
            aconteceu; o <strong className="font-semibold">tempo parado</strong> conta pela
            parte da estadia que cai dentro do período, até hoje. O histórico começa na
            instalação desta versão: o que já estava em conserto antes aparece sem &ldquo;desde&rdquo;.
          </p>
          <BotaoBaixarXlsx abas={abasDaManutencao(dados)} prefixo="manutencao" de={de} ate={ate} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CartaoDeResumo valor={dados.emManutencaoAgora}>
            <span className="text-base font-semibold text-tinta">Em manutenção agora</span>
            {/*
              A frase da Ocupação, pelo mesmo motivo: este cartão é fotografia,
              e sem a frase o leitor o lê como se fosse do mês escolhido.
            */}
            <p className="mt-1 text-sm text-tinta-tenue">
              de <span className="numeros-tabulares">{dados.emCirculacao}</span> em circulação.
              Situação atual; o período acima não muda este número.
            </p>
          </CartaoDeResumo>
          <CartaoDeResumo valor={dados.entradas}>
            <span className="text-base font-semibold text-tinta">Entradas em manutenção</span>
            <p className="mt-1 text-sm text-tinta-tenue">
              Vezes em que um aparelho foi mandado para o conserto em {dados.periodo}.
            </p>
          </CartaoDeResumo>
          {/*
            "—" e não "0" sem amostra: uma mediana de zero diria que os
            consertos foram instantâneos, e o que aconteceu é que nenhuma
            estadia iniciada no período terminou — ou nenhuma começou.
          */}
          <CartaoDeResumo valor={dados.tempoMediano ?? "—"}>
            <span className="text-base font-semibold text-tinta">Tempo em manutenção (mediana)</span>
            <p className="mt-1 text-sm text-tinta-tenue">
              Da entrada à volta, nas estadias que começaram no período e já terminaram.
              As que ainda estão abertas ficam fora.
            </p>
          </CartaoDeResumo>
          <CartaoDeResumo valor={dados.indice === null ? "—" : `${dados.indice}%`}>
            <span className="text-base font-semibold text-tinta">Índice de manutenção</span>
            <p className="mt-1 text-sm text-tinta-tenue">
              <span className="numeros-tabulares">{formatarDias(dados.diasParados)}</span> dias-equipamento
              parados sobre os <span className="numeros-tabulares">{dados.emCirculacao}</span> equipamentos
              em circulação hoje, nos{" "}
              <span className="numeros-tabulares">{formatarDias(dados.diasDoPeriodo)}</span> dias do período
              até hoje. Aposentados ficam fora.
            </p>
          </CartaoDeResumo>
        </dl>
      </section>

      <section aria-labelledby="entradas-no-tempo" className="flex flex-col gap-4">
        <div>
          <h2 id="entradas-no-tempo" className="text-xl font-semibold tracking-tight text-marca-azul">
            Entradas em manutenção
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Quantos aparelhos foram para o conserto em cada dia do período — por
            semana acima de 31 dias, por mês acima de 182. Um dia sem entrada
            aparece com zero.
          </p>
        </div>

        {semEntrada ? (
          <Vazio>{fraseDeVazio}</Vazio>
        ) : (
          <GraficoDeSerie
            chave="entradas-em-manutencao"
            titulo={dados.serie.titulo}
            pontos={dados.serie.pontos}
            grandeza="entradas"
            tabela={<TabelaDaSerie serie={dados.serie} />}
          />
        )}
      </section>

      <section aria-labelledby="manutencao-por-equipamento" className="flex flex-col gap-4">
        <div>
          <h2 id="manutencao-por-equipamento" className="text-xl font-semibold tracking-tight text-marca-azul">
            Por equipamento
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Só quem foi para o conserto no período ou está em manutenção agora. Um
            aparelho em manutenção sem &ldquo;desde&rdquo; já estava no conserto antes de
            o histórico existir; os dias dele não contam.
          </p>
        </div>

        {/*
          Sem entrada no período a tabela pode continuar: os aparelhos em
          manutenção agora aparecem mesmo assim. A frase entra em cima para
          ninguém procurar um filtro que não existe.
        */}
        {semEntrada ? <Vazio>{fraseDeVazio}</Vazio> : null}

        {dados.equipamentos.length === 0 ? null : (
          <Tabela legenda="Equipamentos com manutenção no período, os em manutenção agora primeiro">
            <thead>
              <tr className="border-b border-borda">
                <th scope="col" className={CABECALHO}>Etiqueta</th>
                <th scope="col" className={CABECALHO}>Categoria</th>
                <th scope="col" className={CABECALHO}>Situação atual</th>
                <th scope="col" className={`${CABECALHO} text-right`}>Entradas</th>
                <th scope="col" className={`${CABECALHO} text-right whitespace-nowrap`}>Dias parado</th>
                <th scope="col" className={`${CABECALHO} whitespace-nowrap`}>Última entrada</th>
                <th scope="col" className={CABECALHO}>Quem</th>
              </tr>
            </thead>
            <tbody>
              {dados.equipamentos.map((equipamento) => (
                <tr key={equipamento.id} className={linha(equipamento.status)}>
                  {/*
                    Etiqueta em monoespaçada, inteira: precisa bater caractere a
                    caractere com o adesivo do aparelho — a regra desde a Tarefa 2.
                  */}
                  <td className={`${CELULA} font-mono text-lg font-bold tracking-tight`}>{equipamento.id}</td>
                  <td className={`${CELULA} text-base`}>{equipamento.categoria}</td>
                  <td className={CELULA}>
                    <SeloStatus status={equipamento.status} />
                  </td>
                  <td className={`${CELULA} numeros-tabulares text-right text-base font-semibold`}>
                    {equipamento.entradas}
                  </td>
                  <td className={`${CELULA} numeros-tabulares text-right text-base`}>{equipamento.diasTexto}</td>
                  <td className={`${CELULA} text-base whitespace-nowrap`}>
                    {equipamento.status === STATUS_EQUIPAMENTO.manutencao
                      ? `desde ${equipamento.ultimaEntrada ?? "—"}`
                      : (equipamento.ultimaEntrada ?? "—")}
                  </td>
                  <td className={`${CELULA} text-base`}>{equipamento.quem ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}

        {/*
          O rodapé é o que faz a soma fechar com o cartão "Em manutenção agora":
          as linhas em circulação da tabela mais este número dão o "de M".
        */}
        <p className="text-base text-tinta-tenue">
          <span className="numeros-tabulares">{dados.semManutencao}</span>{" "}
          {dados.semManutencao === 1 ? "equipamento" : "equipamentos"} sem manutenção no período.
        </p>
      </section>

      <section aria-labelledby="manutencao-por-categoria" className="flex flex-col gap-4">
        <div>
          <h2 id="manutencao-por-categoria" className="text-xl font-semibold tracking-tight text-marca-azul">
            Por categoria
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Todas as categorias, inclusive as sem manutenção. O índice é a parte do
            estoque em circulação que passou o período parada — é a coluna que
            responde &ldquo;qual prateleira mais para&rdquo;.
          </p>
        </div>

        {semEntrada ? <Vazio>{fraseDeVazio}</Vazio> : null}

        <Tabela legenda="Manutenção por categoria, da que mais para para a que menos" larguraMinima="min-w-[40rem]">
          <thead>
            <tr className="border-b border-borda">
              <th scope="col" className={CABECALHO}>Categoria</th>
              <th scope="col" className={`${CABECALHO} text-right whitespace-nowrap`}>Em circulação</th>
              <th scope="col" className={`${CABECALHO} text-right`}>Entradas</th>
              <th scope="col" className={`${CABECALHO} text-right whitespace-nowrap`}>Dias parado</th>
              <th scope="col" className={`${CABECALHO} text-right`}>Índice</th>
              <th scope="col" className={`${CABECALHO} w-1/4`}>
                <span className="sr-only">Proporção</span>
              </th>
              <th scope="col" className={`${CABECALHO} text-right whitespace-nowrap`}>Tempo mediano</th>
            </tr>
          </thead>
          <tbody>
            {dados.categorias.map((categoria) => (
              <tr key={categoria.id} className={linhaDeCategoria(categoria.indice)}>
                <td className={`${CELULA} text-base font-semibold text-tinta`}>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: categoria.cor }}
                    />
                    {categoria.nome}
                  </span>
                </td>
                <td className={`${CELULA} numeros-tabulares text-right text-base text-tinta-suave`}>
                  {categoria.emCirculacao}
                </td>
                <td className={`${CELULA} numeros-tabulares text-right text-base font-semibold text-tinta`}>
                  {categoria.entradas}
                </td>
                <td className={`${CELULA} numeros-tabulares text-right text-base`}>{categoria.diasTexto}</td>
                <td className={`${CELULA} numeros-tabulares text-right text-base font-semibold text-tinta`}>
                  {categoria.indice === null ? "—" : `${categoria.indice}%`}
                </td>
                <td className={CELULA}>
                  <Barra largura={categoria.barra} cor={categoria.cor} />
                </td>
                <td className={`${CELULA} numeros-tabulares text-right text-base whitespace-nowrap text-tinta-suave`}>
                  {categoria.tempoMediano ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </section>

      <section aria-labelledby="historico-de-situacao" className="flex flex-col gap-4">
        <div>
          <h2 id="historico-de-situacao" className="text-xl font-semibold tracking-tight text-marca-azul">
            Histórico
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Toda mudança de situação feita no painel dentro do período — manutenção,
            aposentadoria e reativação —, com quem fez. Mais recente primeiro.
          </p>
        </div>

        {dados.historico.length === 0 ? (
          <Vazio>Nenhuma mudança de situação em {dados.periodo}.</Vazio>
        ) : (
          <Tabela legenda="Histórico de mudanças de situação no período, da mais recente para a mais antiga">
            <thead>
              <tr className="border-b border-borda">
                <th scope="col" className={`${CABECALHO} whitespace-nowrap`}>Data e hora</th>
                <th scope="col" className={CABECALHO}>Etiqueta</th>
                <th scope="col" className={CABECALHO}>Categoria</th>
                <th scope="col" className={CABECALHO}>Mudança</th>
                <th scope="col" className={CABECALHO}>Quem</th>
              </tr>
            </thead>
            <tbody>
              {dados.historico.map((mudanca) => (
                <tr key={mudanca.id} className="border-b border-borda text-tinta last:border-b-0 hover:bg-superficie-2">
                  <td className={`${CELULA} numeros-tabulares text-base whitespace-nowrap`}>{mudanca.em}</td>
                  <td className={`${CELULA} font-mono text-lg font-bold tracking-tight`}>{mudanca.etiqueta}</td>
                  <td className={`${CELULA} text-base`}>{mudanca.categoria}</td>
                  <td className={`${CELULA} text-base whitespace-nowrap`}>
                    <span className="text-tinta-suave">{mudanca.de}</span>
                    <span aria-hidden="true"> → </span>
                    <span className="sr-only"> para </span>
                    <span className="font-semibold">{mudanca.para}</span>
                  </td>
                  <td className={`${CELULA} text-base`}>{mudanca.quem}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </section>
    </div>
  );
}

const DIAS_COM_UMA_CASA = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** "17,0", "3,5" — o mesmo formato das colunas de dias, no servidor. */
function formatarDias(dias: number): string {
  return DIAS_COM_UMA_CASA.format(dias);
}

/** A linha do aposentado pesa menos, como no inventário e no Consumo. */
function linha(status: string): string {
  return [
    "border-b border-borda last:border-b-0 hover:bg-superficie-2",
    status === STATUS_EQUIPAMENTO.inativo ? "text-tinta-tenue" : "text-tinta",
  ].join(" ");
}

/** Categoria sem denominador ou com índice zero pesa menos. */
function linhaDeCategoria(indice: number | null): string {
  return [
    "border-b border-borda last:border-b-0 hover:bg-superficie-2",
    indice ? "text-tinta" : "text-tinta-tenue",
  ].join(" ");
}

/*
  `Barra`, `Tabela`, `Vazio` e `TabelaDaSerie` são cópias das do Ranking de
  Consumo e da Ocupação, e não um módulo compartilhado — pela regra que criou o
  `CartaoDeResumo` na Tarefa 13: extrai-se na TERCEIRA cópia. Este é o último
  relatório declarado; se um quinto aparecer, ele extrai as quatro.
*/

/**
 * A barra em linha da Tarefa 13, proporcional ao maior índice da tabela (a
 * primeira versão usava o índice como largura absoluta, e 6% virava um
 * ponto — ver `CategoriaNaManutencao.barra`). Estilo em linha, e tem que
 * ser: `w-[${largura}%]` produziria uma classe que o Tailwind não gerou.
 */
function Barra({ largura, cor }: { largura: number; cor: string }) {
  return (
    <div aria-hidden="true" className="h-2.5 w-full min-w-24 overflow-hidden rounded-full bg-superficie-2">
      <div className="h-full rounded-full" style={{ width: `${largura}%`, backgroundColor: cor }} />
    </div>
  );
}

function Tabela({
  legenda,
  larguraMinima = "min-w-2xl",
  children,
}: {
  legenda: string;
  larguraMinima?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-borda bg-superficie">
      <table className={`w-full ${larguraMinima} border-collapse text-left`}>
        <caption className="sr-only">{legenda}</caption>
        {children}
      </table>
    </div>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-borda bg-superficie p-5 text-base text-tinta-suave">{children}</p>
  );
}

const ROTULO_DO_BALDE = { dia: "Dia", semana: "Semana de", mes: "Mês" } as const;

/** A tabela gêmea da série: um balde por linha, com o mesmo texto do tooltip. */
function TabelaDaSerie({ serie }: { serie: Dados["serie"] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-borda bg-superficie">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{serie.titulo}</caption>
        <thead>
          <tr className="border-b border-borda">
            <th scope="col" className={CABECALHO}>{ROTULO_DO_BALDE[serie.grao]}</th>
            <th scope="col" className={`${CABECALHO} text-right`}>Entradas</th>
          </tr>
        </thead>
        <tbody>
          {serie.pontos.map((ponto) => (
            <tr key={ponto.rotulo} className="border-b border-borda last:border-b-0">
              <td className={`${CELULA} text-base text-tinta`}>{ponto.detalhe}</td>
              <td className={`${CELULA} numeros-tabulares text-right text-base font-semibold text-tinta`}>
                {ponto.valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * As três abas da planilha: as duas tabelas da tela, coluna a coluna, e o
 * `Histórico` — o log cru do período. Número é número (ver
 * `exportar-xlsx.ts`): entradas como inteiro, dias com uma casa, índice de 0
 * a 100, a mediana em minutos. O "desde —" sai como célula vazia.
 */
function abasDaManutencao(dados: Dados): AbaDeExportacao[] {
  return [
    {
      titulo: "Equipamentos",
      cabecalho: ["Etiqueta", "Categoria", "Situação atual", "Entradas", "Dias em manutenção", "Última entrada", "Quem"],
      linhas: dados.equipamentos.map((e) => [
        e.id,
        e.categoria,
        ROTULO_DO_STATUS_DE_EQUIPAMENTO[e.status] ?? e.status,
        e.entradas,
        e.dias,
        e.ultimaEntradaPlanilha,
        e.quem,
      ]),
    },
    {
      titulo: "Categorias",
      cabecalho: ["Categoria", "Em circulação", "Entradas", "Dias em manutenção", "Índice (%)", "Tempo mediano (min)"],
      linhas: dados.categorias.map((c) => [
        c.nome,
        c.emCirculacao,
        c.entradas,
        c.dias,
        c.indice,
        c.tempoMedianoMin,
      ]),
    },
    {
      titulo: "Histórico",
      cabecalho: ["Data e hora", "Etiqueta", "Categoria", "De", "Para", "Quem"],
      linhas: dados.historico.map((m) => [m.emPlanilha, m.etiqueta, m.categoria, m.de, m.para, m.quem]),
    },
  ];
}
