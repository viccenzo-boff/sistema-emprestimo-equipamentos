import { BotaoBaixarXlsx } from "@/components/admin/BotaoBaixarXlsx";
import { CartaoDeResumo } from "@/components/admin/CartaoDeResumo";
import { GraficoDeSerie } from "@/components/admin/graficos/Graficos";
import { SeloDeEstoque } from "@/components/admin/SeloStatus";
import { CABECALHO, CELULA } from "@/components/ui/Campo";
import { plural } from "@/lib/texto";
import type { AbaDeExportacao, OcupacaoDeCategoria, RelatorioDeOcupacao as Dados } from "@/lib/tipos";

/**
 * Ocupação e picos de uso — o primeiro relatório do painel (Tarefa 13).
 *
 * A pergunta que ele existe para responder não é do secretário: é da
 * coordenação, na hora de decidir se compra mais aparelho. Por isso o que a
 * tela mostra é **esgotamento**, e não movimento — quantas prateleiras estão
 * no fim, e não quantos empréstimos aconteceram.
 *
 * Não é ilha de cliente: nada aqui responde a clique, exceto as duas ilhas
 * que já são de cliente por conta própria (o gráfico e o botão de baixar).
 * Quem precisa de estado é a barra de abas ao redor, e ela é outro componente
 * de propósito — assim este continua sendo renderizado no servidor, junto com
 * a consulta.
 *
 * Desde a Tarefa 16 o primeiro cartão obedece ao período da URL, e entrou a
 * série "Retiradas por dia" — o rótulo da aba prometia "picos de uso" e ela
 * não tinha série temporal nenhuma. A ocupação por categoria continua sendo
 * a fotografia do agora, e a linha acima da lista diz isso.
 */
export function RelatorioDeOcupacao({
  dados,
  de,
  ate,
}: {
  dados: Dados;
  de: string;
  ate: string;
}) {
  const { retiradasNoPeriodo, periodo, serie, naRua, categorias } = dados;

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Indicadores do período" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <p className="max-w-3xl text-base text-tinta-suave">
            Retiradas de <strong className="font-semibold text-tinta">{periodo}</strong>. Os
            cartões e o gráfico obedecem ao período acima; a lista de categorias,
            no fim, é a situação do estoque agora.
          </p>
          <BotaoBaixarXlsx abas={abasDaOcupacao(dados)} prefixo="ocupacao" de={de} ate={ate} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <CartaoDeResumo valor={retiradasNoPeriodo}>
            <span className="text-base font-semibold text-tinta">Retiradas no período</span>
            <p className="mt-1 text-sm text-tinta-tenue">
              Retiradas registradas em {periodo}. É o volume de trabalho que
              passou pelo balcão.
            </p>
          </CartaoDeResumo>

          <CartaoDeResumo valor={naRua.total}>
            <span className="text-base font-semibold text-tinta">Equipamentos na Rua</span>
            {/*
              A quebra em duas parcelas não é enfeite: "na bancada" é o aparelho
              que a pessoa já declarou como devolvido e que o secretário ainda
              não recolheu. Ele não está com ninguém e também não está na
              prateleira — e é a única parcela deste número sobre a qual o
              painel pode agir hoje, pela Fila de Devoluções.
            */}
            <p className="mt-1 text-sm text-tinta-tenue">
              <span className="numeros-tabulares">{naRua.comPessoas}</span> com as
              pessoas ·{" "}
              <span className="numeros-tabulares">{naRua.naBancada}</span> na bancada
              aguardando conferência.
            </p>
          </CartaoDeResumo>
        </dl>
      </section>

      <section aria-labelledby="retiradas-no-tempo" className="flex flex-col gap-4">
        <div>
          <h2 id="retiradas-no-tempo" className="text-xl font-semibold tracking-tight text-marca-azul">
            Picos de uso
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Quantas retiradas houve em cada dia do período — por semana acima de
            31 dias, por mês acima de 182. Um dia sem retirada aparece com zero:
            o buraco também é informação.
          </p>
        </div>

        {retiradasNoPeriodo === 0 ? (
          <p className="rounded-2xl border border-borda bg-superficie p-5 text-base text-tinta-suave">
            Nenhuma retirada em {periodo}.
          </p>
        ) : (
          <GraficoDeSerie
            chave="retiradas-por-dia"
            titulo={serie.titulo}
            pontos={serie.pontos}
            grandeza="retiradas"
            tabela={<TabelaDaSerie serie={serie} />}
          />
        )}
      </section>

      <section aria-labelledby="esgotamento-por-categoria" className="flex flex-col gap-4">
        <div>
          <h2
            id="esgotamento-por-categoria"
            className="text-xl font-semibold tracking-tight text-marca-azul"
          >
            Esgotamento por categoria
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Ocupação é o quanto do estoque em circulação não está na prateleira
            agora — emprestado ou em manutenção. Equipamento aposentado fica
            fora da conta.
          </p>
          {/*
            Sem esta frase o leitor lê as barras como se fossem do período
            escolhido acima. Não existe "ocupação em 3 de agosto": o banco não
            guarda o status de cada dia, e esta lista é o agora.
          */}
          <p className="mt-1 text-base text-tinta-tenue">
            Situação atual do estoque; o período acima não muda esta lista.
          </p>
        </div>

        {categorias.length === 0 ? (
          <p className="rounded-2xl border border-borda bg-superficie p-5 text-base text-tinta-suave">
            Nenhuma categoria cadastrada ainda. Crie a primeira em{" "}
            <strong>Categorias</strong>.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <LinhaDeCategoria {...categoria} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** As cores da barra, por nível. Vermelho e âmbar são os mesmos do selo ao lado. */
const PREENCHIMENTO: Record<string, string> = {
  esgotado: "bg-erro",
  critico: "bg-aviso",
  // Azul da marca, e não verde: ocupação alta não é boa nem má notícia por si
  // — é o estado neutro de sistema, a mesma leitura que o selo "Emprestado" da
  // tabela de inventário já carrega.
  normal: "bg-marca-azul",
};

function LinhaDeCategoria({
  nome,
  emCirculacao,
  disponiveis,
  emprestados,
  manutencao,
  aposentados,
  ocupados,
  ocupacao,
  nivel,
}: OcupacaoDeCategoria) {
  const vazia = nivel === "vazio";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h3 className="text-lg font-semibold text-tinta">{plural(nome)}</h3>

        {vazia ? (
          <p className="text-base text-tinta-tenue">Sem unidades em circulação</p>
        ) : (
          <p className="text-base text-tinta-suave">
            <strong className="numeros-tabulares text-tinta">{ocupacao}%</strong> de
            ocupação{" "}
            <span className="numeros-tabulares whitespace-nowrap">
              ({ocupados} de {emCirculacao})
            </span>
          </p>
        )}
      </div>

      {vazia ? null : (
        /*
          A largura é estilo em linha, e tem que ser: o Tailwind gera as classes
          varrendo o código-fonte, então `w-[${ocupacao}%]` produziria uma classe
          que não existe no CSS — a barra ficaria com largura zero, sem erro em
          lugar nenhum.

          `aria-hidden` porque a barra é redundante de propósito: o número está
          escrito logo acima e a composição, logo abaixo. Anunciá-la de novo
          faria o leitor de tela repetir a mesma informação três vezes.
        */
        <div
          aria-hidden="true"
          className="h-3 w-full overflow-hidden rounded-full border border-borda bg-superficie-2"
        >
          <div
            className={["h-full rounded-full", PREENCHIMENTO[nivel] ?? "bg-marca-azul"].join(
              " ",
            )}
            style={{ width: `${ocupacao}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-base text-tinta-suave">
          {vazia ? (
            <>
              Nenhum aparelho desta categoria está em circulação
              {aposentados > 0 ? ` — ${contar(aposentados, "aposentado")}` : ""}.
            </>
          ) : (
            <>
              <span className="numeros-tabulares">{disponiveis}</span>{" "}
              {disponiveis === 1 ? "livre" : "livres"} ·{" "}
              <span className="numeros-tabulares">{emprestados}</span>{" "}
              {emprestados === 1 ? "emprestado" : "emprestados"}
              {manutencao > 0 ? (
                <>
                  {" "}
                  · <span className="numeros-tabulares">{manutencao}</span> em
                  manutenção
                </>
              ) : null}
              {/*
                O aposentado aparece fora da conta, e não some: sem esta parcela
                os números da linha não fecham com a tabela de inventário, e
                quem confere acha que o relatório perdeu um aparelho.
              */}
              {aposentados > 0 ? (
                <span className="text-tinta-tenue">
                  {" "}
                  (+ {contar(aposentados, "aposentado")}, fora da conta)
                </span>
              ) : null}
            </>
          )}
        </p>

        <SeloDeEstoque nivel={nivel} />
      </div>
    </article>
  );
}

function contar(quantos: number, palavra: string): string {
  return quantos === 1 ? `1 ${palavra}` : `${quantos} ${palavra}s`;
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
            <th scope="col" className={`${CABECALHO} text-right`}>Retiradas</th>
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
 * As duas abas da planilha: a fotografia do estoque (com a data e hora da
 * leitura na primeira linha, porque é o agora e não o período) e a série,
 * com o título do grão ("Retiradas por dia", "Retiradas por semana").
 */
function abasDaOcupacao(dados: Dados): AbaDeExportacao[] {
  return [
    {
      titulo: "Categorias",
      notas: [`Situação do estoque em ${dados.lidoEm}`],
      cabecalho: [
        "Categoria",
        "Em circulação",
        "Disponíveis",
        "Emprestados",
        "Em manutenção",
        "Aposentados",
        "Ocupados",
        "Ocupação (%)",
        "Nível",
      ],
      linhas: dados.categorias.map((c) => [
        c.nome,
        c.emCirculacao,
        c.disponiveis,
        c.emprestados,
        c.manutencao,
        c.aposentados,
        c.ocupados,
        c.ocupacao,
        c.nivel,
      ]),
    },
    {
      titulo: dados.serie.titulo,
      notas: [`Retiradas de ${dados.periodo}`],
      cabecalho: [ROTULO_DO_BALDE[dados.serie.grao], "Retiradas"],
      linhas: dados.serie.pontos.map((p) => [p.detalhe, p.valor]),
    },
  ];
}
