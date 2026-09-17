import type { ReactNode } from "react";

import { BotaoBaixarXlsx } from "@/components/admin/BotaoBaixarXlsx";
import { CartaoDeResumo } from "@/components/admin/CartaoDeResumo";
import { GraficoDeComposicao } from "@/components/admin/graficos/Graficos";
import { SeloPerfil, SeloStatus } from "@/components/admin/SeloStatus";
import { CABECALHO, CELULA } from "@/components/ui/Campo";
import { ROTULO_DO_STATUS_DE_EQUIPAMENTO, type AbaDeExportacao, type RelatorioDeConsumo as Dados } from "@/lib/tipos";

/**
 * Ranking de Consumo — o terceiro relatório do painel (Tarefa 16, §2).
 *
 * A pergunta que ele responde é de compra e de política: **o que sai, quem
 * leva, e por quanto tempo**. Quatro cartões no topo, um gráfico de
 * composição (retiradas por categoria) e três rankings — equipamento,
 * categoria e pessoa —, cada um uma tabela com a barra em linha da Tarefa 13,
 * proporcional ao maior da tabela.
 *
 * **O ranking por pessoa é exposição deliberada**, decidida pela coordenação
 * em 2026-09-17: o dono prometeu essa informação na entrega do MVP. Não
 * altera a promessa de anonimato da avaliação, que é outra tabela sem
 * matrícula — as duas regras ficam lado a lado na wiki para ninguém achar
 * que uma contradiz a outra.
 *
 * Não é ilha de cliente: nada aqui responde a clique, exceto os dois
 * componentes que já são ilhas por conta própria (o gráfico e o botão de
 * baixar). O resto chega pronto do servidor, com as durações já formatadas.
 */
export function RelatorioDeConsumo({ dados, de, ate }: { dados: Dados; de: string; ate: string }) {
  const vazio = dados.retiradas === 0;
  const fraseDeVazio = `Nenhuma retirada em ${dados.periodo}.`;

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Indicadores do período" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <p className="max-w-3xl text-base text-tinta-suave">
            Retiradas de <strong className="font-semibold text-tinta">{dados.periodo}</strong>.
            Um empréstimo pertence ao período em que foi <strong className="font-semibold">retirado</strong>;
            devolução fora do período não muda a conta. Os tempos são medianas — um
            notebook esquecido no fim de semana não distorce o número.
          </p>
          <BotaoBaixarXlsx abas={abasDoConsumo(dados)} prefixo="consumo" de={de} ate={ate} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CartaoDeResumo valor={dados.retiradas}>
            <span className="text-base font-semibold text-tinta">Retiradas no período</span>
            <p className="mt-1 text-sm text-tinta-tenue">Cada item retirado conta um.</p>
          </CartaoDeResumo>
          <CartaoDeResumo valor={dados.pessoasDistintas}>
            <span className="text-base font-semibold text-tinta">Pessoas distintas</span>
            <p className="mt-1 text-sm text-tinta-tenue">Quantas matrículas retiraram ao menos uma vez.</p>
          </CartaoDeResumo>
          {/*
            "—" e não "0" sem amostra: uma mediana de zero diria "ninguém ficou
            com o aparelho nem um minuto", e o que aconteceu é que ninguém
            devolveu ainda (ou ninguém retirou).
          */}
          <CartaoDeResumo valor={dados.usoMediano ?? "—"}>
            <span className="text-base font-semibold text-tinta">Tempo de uso (mediana)</span>
            <p className="mt-1 text-sm text-tinta-tenue">
              Da retirada até a devolução declarada no tablet. Empréstimos ainda em aberto ficam fora.
            </p>
          </CartaoDeResumo>
          <CartaoDeResumo valor={dados.prateleiraMediana ?? "—"}>
            <span className="text-base font-semibold text-tinta">Tempo de prateleira (mediana)</span>
            <p className="mt-1 text-sm text-tinta-tenue">
              Da devolução declarada até a baixa física — o tempo que o aparelho ficou na bancada.
            </p>
          </CartaoDeResumo>
        </dl>
      </section>

      {/*
        Gráfico e tabela lado a lado a partir de `xl`, com a tabela levando
        três quintos: cinco colunas com barra precisam de ~520 px, e uma
        divisão ao meio dos 1024 px do conteúdo deixava a última coluna
        rolando escondida. O `min-w-0` nos filhos é o que deixa a coluna
        encolher em vez de estourar a grade.
      */}
      <section
        aria-labelledby="retiradas-por-categoria"
        className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      >
        <div className="xl:col-span-2">
          <h2 id="retiradas-por-categoria" className="text-xl font-semibold tracking-tight text-marca-azul">
            Retiradas por categoria
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Todas as categorias, inclusive as que ninguém retirou. A fatia é a parte de
            cada uma no total do período.
          </p>
        </div>

        {vazio ? (
          <Vazio className="xl:col-span-2">{fraseDeVazio}</Vazio>
        ) : (
          <>
            <GraficoDeComposicao
              chave="retiradas-por-categoria"
              titulo="Retiradas por categoria"
              fatias={dados.categorias.map(({ nome, retiradas, cor, corDoRotulo }) => ({
                nome,
                valor: retiradas,
                cor,
                corDoRotulo,
              }))}
              grandeza="retiradas"
            />

            {/*
              Esta tabela divide a linha com o gráfico a partir de `xl`, então a
              largura mínima é a de meia coluna — as outras duas têm a linha
              inteira e rolam dentro do próprio contêiner em tela estreita.
            */}
            <Tabela legenda="Ranking por categoria, da mais retirada para a menos" larguraMinima="min-w-[30rem]">
              <thead>
                <tr className="border-b border-borda">
                  <th scope="col" className={CABECALHO}>Categoria</th>
                  <th scope="col" className={`${CABECALHO} text-right`}>Retiradas</th>
                  <th scope="col" className={`${CABECALHO} w-1/4`}>
                    <span className="sr-only">Proporção</span>
                  </th>
                  <th scope="col" className={`${CABECALHO} text-right`}>Fatia</th>
                  <th scope="col" className={`${CABECALHO} text-right whitespace-nowrap`}>Uso mediano</th>
                </tr>
              </thead>
              <tbody>
                {dados.categorias.map((categoria) => (
                  <tr key={categoria.id} className={linha(categoria.retiradas)}>
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
                    <td className={`${CELULA} numeros-tabulares text-right text-base font-semibold text-tinta`}>
                      {categoria.retiradas}
                    </td>
                    <td className={CELULA}>
                      <Barra largura={categoria.barra} cor={categoria.cor} />
                    </td>
                    <td className={`${CELULA} numeros-tabulares text-right text-base text-tinta-suave`}>
                      {categoria.fatia}%
                    </td>
                    <td className={`${CELULA} numeros-tabulares text-right text-base whitespace-nowrap text-tinta-suave`}>
                      {categoria.usoMediano ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabela>
          </>
        )}
      </section>

      <section aria-labelledby="ranking-por-equipamento" className="flex flex-col gap-4">
        <div>
          <h2 id="ranking-por-equipamento" className="text-xl font-semibold tracking-tight text-marca-azul">
            Por equipamento
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Todo aparelho em circulação entra, inclusive com zero — &ldquo;nunca sai
            da prateleira&rdquo; é argumento de compra tanto quanto &ldquo;está sempre
            fora&rdquo;. Um aparelho aposentado só aparece se tiver retirada no período.
          </p>
        </div>

        {/*
          No período vazio a tabela continua: os aparelhos em circulação
          aparecem com zero, que é informação ("ninguém retirou nada"). A
          frase entra em cima para ninguém procurar um filtro que não existe.
        */}
        {vazio ? <Vazio>{fraseDeVazio}</Vazio> : null}

        {dados.equipamentos.length === 0 ? null : (
          <Tabela legenda="Ranking por equipamento, do mais retirado para o menos">
            <thead>
              <tr className="border-b border-borda">
                <th scope="col" className={CABECALHO}>Etiqueta</th>
                <th scope="col" className={CABECALHO}>Categoria</th>
                <th scope="col" className={CABECALHO}>Situação atual</th>
                <th scope="col" className={`${CABECALHO} text-right`}>Retiradas</th>
                <th scope="col" className={`${CABECALHO} w-1/4`}>
                  <span className="sr-only">Proporção</span>
                </th>
                <th scope="col" className={`${CABECALHO} text-right`}>Uso mediano</th>
              </tr>
            </thead>
            <tbody>
              {dados.equipamentos.map((equipamento) => (
                <tr key={equipamento.id} className={linha(equipamento.retiradas)}>
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
                    {equipamento.retiradas}
                  </td>
                  <td className={CELULA}>
                    <Barra largura={equipamento.barra} />
                  </td>
                  <td className={`${CELULA} numeros-tabulares text-right text-base text-tinta-suave`}>
                    {equipamento.usoMediano ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </section>

      <section aria-labelledby="ranking-por-pessoa" className="flex flex-col gap-4">
        <div>
          <h2 id="ranking-por-pessoa" className="text-xl font-semibold tracking-tight text-marca-azul">
            Por pessoa
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Só quem retirou ao menos uma vez no período. O nome é o do cadastro de hoje.
          </p>
        </div>

        {dados.pessoas.length === 0 ? (
          <Vazio>{fraseDeVazio}</Vazio>
        ) : (
          <Tabela legenda="Ranking por pessoa, de quem mais retirou para quem menos">
            <thead>
              <tr className="border-b border-borda">
                <th scope="col" className={CABECALHO}>Nome</th>
                <th scope="col" className={CABECALHO}>Matrícula</th>
                <th scope="col" className={CABECALHO}>Perfil</th>
                <th scope="col" className={`${CABECALHO} text-right`}>Retiradas</th>
                <th scope="col" className={`${CABECALHO} w-1/4`}>
                  <span className="sr-only">Proporção</span>
                </th>
                <th scope="col" className={`${CABECALHO} text-right`}>Uso mediano</th>
              </tr>
            </thead>
            <tbody>
              {dados.pessoas.map((pessoa) => (
                <tr key={pessoa.matricula} className={linha(pessoa.retiradas)}>
                  <td className={`${CELULA} text-base font-semibold text-tinta`}>{pessoa.nome}</td>
                  <td className={`${CELULA} numeros-tabulares text-base text-tinta-suave`}>{pessoa.matricula}</td>
                  <td className={CELULA}>
                    <SeloPerfil perfil={pessoa.perfil} />
                  </td>
                  <td className={`${CELULA} numeros-tabulares text-right text-base font-semibold`}>
                    {pessoa.retiradas}
                  </td>
                  <td className={CELULA}>
                    <Barra largura={pessoa.barra} />
                  </td>
                  <td className={`${CELULA} numeros-tabulares text-right text-base text-tinta-suave`}>
                    {pessoa.usoMediano ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </section>
    </div>
  );
}

/** As linhas de zero vão ao fim (já vêm ordenadas) e pesam menos: `tinta-tenue`. */
function linha(retiradas: number): string {
  return [
    "border-b border-borda last:border-b-0 hover:bg-superficie-2",
    retiradas === 0 ? "text-tinta-tenue" : "text-tinta",
  ].join(" ");
}

/**
 * A barra em linha da Tarefa 13, proporcional ao maior da tabela. A largura
 * é estilo em linha, e tem que ser: `w-[${largura}%]` produziria uma classe
 * que o Tailwind não gerou. `aria-hidden` porque o número está na coluna ao
 * lado — anunciar a barra repetiria a mesma informação.
 */
function Barra({ largura, cor }: { largura: number; cor?: string }) {
  return (
    <div aria-hidden="true" className="h-2.5 w-full min-w-24 overflow-hidden rounded-full bg-superficie-2">
      <div
        className={["h-full rounded-full", cor ? "" : "bg-marca-azul"].join(" ")}
        style={{ width: `${largura}%`, ...(cor ? { backgroundColor: cor } : {}) }}
      />
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

function Vazio({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={["rounded-2xl border border-borda bg-superficie p-5 text-base text-tinta-suave", className].join(" ")}>
      {children}
    </p>
  );
}

/**
 * As quatro abas da planilha: as três tabelas da tela, coluna a coluna, e a
 * aba crua `Retiradas` — uma linha por empréstimo do período, **sem nome nem
 * matrícula**. Durações em minutos, como número; ver `exportar-xlsx.ts`.
 */
function abasDoConsumo(dados: Dados): AbaDeExportacao[] {
  return [
    {
      titulo: "Equipamentos",
      cabecalho: ["Etiqueta", "Categoria", "Situação atual", "Retiradas", "Uso mediano (min)"],
      linhas: dados.equipamentos.map((e) => [
        e.id,
        e.categoria,
        ROTULO_DO_STATUS_DE_EQUIPAMENTO[e.status] ?? e.status,
        e.retiradas,
        e.usoMedianoMin,
      ]),
    },
    {
      titulo: "Categorias",
      cabecalho: ["Categoria", "Retiradas", "Fatia (%)", "Uso mediano (min)"],
      linhas: dados.categorias.map((c) => [c.nome, c.retiradas, c.fatia, c.usoMedianoMin]),
    },
    {
      titulo: "Pessoas",
      cabecalho: ["Nome", "Matrícula", "Perfil", "Retiradas", "Uso mediano (min)"],
      linhas: dados.pessoas.map((p) => [p.nome, p.matricula, p.perfil, p.retiradas, p.usoMedianoMin]),
    },
    {
      titulo: "Retiradas",
      cabecalho: [
        "Etiqueta",
        "Categoria",
        "Retirada",
        "Devolução declarada",
        "Baixa",
        "Situação",
        "Uso (min)",
        "Prateleira (min)",
      ],
      linhas: dados.linhas.map((r) => [
        r.etiqueta,
        r.categoria,
        r.retirada,
        r.devolucao,
        r.baixa,
        r.situacao,
        r.usoMin,
        r.prateleiraMin,
      ]),
    },
  ];
}
