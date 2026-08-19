import { SeloStatus } from "@/components/admin/SeloStatus";
import { STATUS_EQUIPAMENTO, type ResumoDoInventario } from "@/lib/tipos";

/**
 * As contagens do inventário, no topo da tela.
 *
 * Serve para uma pergunta só, e é a que a coordenação faz de verdade: "sobra
 * notebook para hoje?". Por isso o número vem antes do rótulo e o selo repete
 * exatamente a cor e a palavra usadas na tabela abaixo — o olho liga os dois
 * sem legenda.
 *
 * O cartão de inativos só aparece quando existe algum. Um zero permanente na
 * quarta coluna roubaria um quarto da faixa para informar nada, e — pior —
 * quebraria a leitura de relance das três contagens que mudam todo dia.
 */

export function ResumoInventario({
  disponiveis,
  emprestados,
  manutencao,
  inativos,
  total,
}: ResumoDoInventario) {
  const cartoes = [
    { status: STATUS_EQUIPAMENTO.disponivel, valor: disponiveis },
    { status: STATUS_EQUIPAMENTO.emprestado, valor: emprestados },
    { status: STATUS_EQUIPAMENTO.manutencao, valor: manutencao },
    ...(inativos > 0
      ? [{ status: STATUS_EQUIPAMENTO.inativo, valor: inativos }]
      : []),
  ];

  return (
    <section aria-label="Resumo do inventário" className="flex flex-col gap-3">
      <dl
        className={[
          "grid gap-4",
          cartoes.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
        ].join(" ")}
      >
        {cartoes.map(({ status, valor }) => (
          <div
            key={status}
            className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5"
          >
            <dd className="numeros-tabulares text-4xl font-semibold tracking-tight text-marca-azul">
              {valor}
            </dd>
            <dt>
              <SeloStatus status={status} />
            </dt>
          </div>
        ))}
      </dl>

      <p className="px-1 text-base text-tinta-tenue">
        {total === 1 ? "1 equipamento" : `${total} equipamentos`} no inventário
        {inativos > 0 ? ", contando os inativos" : ""}.
      </p>
    </section>
  );
}
