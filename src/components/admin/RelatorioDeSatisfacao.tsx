import { BotaoBaixarAvaliacoes } from "@/components/admin/BotaoBaixarAvaliacoes";
import { FormularioDeSugestoes } from "@/components/admin/FormularioDeSugestoes";
import { COR_DO_ROSTO, IconeRosto } from "@/components/ui/icones";
import {
  INTERVALO_ENTRE_AVALIACOES_DIAS,
  type RecorteDeSatisfacao,
  type RelatorioDeSatisfacao as Dados,
} from "@/lib/tipos";

/**
 * Satisfação — o segundo relatório do painel (Tarefa 14, item 5).
 *
 * Média, respostas, taxa de resposta e a distribuição em quatro barras, em
 * dois recortes fixos. Sem filtro, por decisão: o dado é um inteiro de 1 a 4
 * por dia, e filtro é código para manter num sistema que vai ficar anos
 * parado — quem quer outro recorte baixa o CSV e faz o pivô no Excel.
 *
 * **Nunca mostra voto individual nem nada por pessoa**, e não teria como: o
 * banco não guarda quem votou. As únicas partes vivas são o botão de baixar
 * e o formulário da URL, cada um a sua ilha; o resto chega pronto do
 * servidor, como o relatório de ocupação ao lado.
 */
export function RelatorioDeSatisfacao({ ultimos30Dias, desdeOInicio, linhas, formulario }: Dados) {
  const semNenhumaLinha = desdeOInicio.pedidas === 0;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="satisfacao-com-a-retirada" className="flex flex-col gap-4">
        <div>
          <h2
            id="satisfacao-com-a-retirada"
            className="text-xl font-semibold tracking-tight text-marca-azul"
          >
            Satisfação com a retirada
          </h2>
          <p className="mt-1 text-base text-tinta-suave">
            Um toque num rosto no fim da retirada, de 1 (Muito ruim) a 4 (Muito
            bom). Anônimo: o sistema guarda a nota e o dia, e nada mais.
          </p>
        </div>

        {semNenhumaLinha ? (
          <p className="rounded-2xl border border-borda bg-superficie p-5 text-base text-tinta-suave">
            Nenhuma avaliação ainda. Os rostos aparecem no tablet ao fim da
            retirada, uma vez a cada {INTERVALO_ENTRE_AVALIACOES_DIAS} dias por
            pessoa.
          </p>
        ) : (
          <>
            <dl className="grid gap-4 lg:grid-cols-2">
              <Recorte {...ultimos30Dias} />
              <Recorte {...desdeOInicio} />
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p className="text-base text-tinta-suave">
                A planilha traz uma linha por vez que os rostos apareceram
                (<span className="font-mono">dia,nota</span>), com a nota em
                branco quando ninguém respondeu.
              </p>
              <BotaoBaixarAvaliacoes linhas={linhas} />
            </div>
          </>
        )}
      </section>

      <FormularioDeSugestoes formulario={formulario} />
    </div>
  );
}

/**
 * Um recorte: os três números e as quatro barras.
 *
 * A média é o número grande porque é a pergunta que a coordenação faz; a
 * taxa de resposta vem logo abaixo porque é a que denuncia fadiga — quando
 * ela cai, a média deixa de valer. As barras são a fatia de cada nota entre
 * as **respondidas**, e por isso somam 100%: a linha "de N pedidas" ao lado
 * é o que lembra que nem todo mundo respondeu.
 */
function Recorte({
  rotulo,
  pedidas,
  respondidas,
  taxaDeResposta,
  media,
  distribuicao,
}: RecorteDeSatisfacao) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5">
      <dt className="text-base font-semibold text-tinta">{rotulo}</dt>

      <dd className="flex flex-col gap-1">
        <p className="flex items-baseline gap-2">
          {/*
            "—" e não "0,0" sem resposta: uma média zero num intervalo de 1 a
            4 é um número que não existe, e o secretário leria "todo mundo
            odiou".
          */}
          <span className="numeros-tabulares text-4xl font-semibold tracking-tight text-marca-azul">
            {media ?? "—"}
          </span>
          <span className="text-base text-tinta-tenue">de 4</span>
        </p>
        <p className="text-base text-tinta-suave">
          <span className="numeros-tabulares">{respondidas}</span>{" "}
          {respondidas === 1 ? "resposta" : "respostas"} ·{" "}
          <span className="numeros-tabulares">{taxaDeResposta}%</span> de taxa de
          resposta{" "}
          <span className="numeros-tabulares whitespace-nowrap text-tinta-tenue">
            ({respondidas} de {pedidas} {pedidas === 1 ? "pedida" : "pedidas"})
          </span>
        </p>
      </dd>

      <dd>
        <ul className="flex flex-col gap-2" aria-label={`Distribuição das notas — ${rotulo}`}>
          {distribuicao.map(({ nota, rotulo: rotuloDaNota, quantas, fatia }) => (
            <li key={nota} className="flex items-center gap-3">
              <span className={["shrink-0", COR_DO_ROSTO.get(nota) ?? "text-tinta"].join(" ")}>
                <IconeRosto nota={nota} className="size-7" />
                <span className="sr-only">{rotuloDaNota}:</span>
              </span>

              {/*
                Largura em estilo em linha, e tem que ser: o Tailwind gera as
                classes varrendo o código-fonte, e `w-[${fatia}%]` produziria
                uma classe que não existe. A barra é redundante com o número ao
                lado, daí o `aria-hidden` — o leitor de tela ouve "Bom: 12".
              */}
              <span
                aria-hidden="true"
                className="h-3 flex-1 overflow-hidden rounded-full border border-borda bg-superficie-2"
              >
                <span
                  className="block h-full rounded-full bg-marca-azul"
                  style={{ width: `${fatia}%` }}
                />
              </span>

              <span className="numeros-tabulares w-10 shrink-0 text-right text-base font-semibold text-tinta">
                {quantas}
              </span>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
