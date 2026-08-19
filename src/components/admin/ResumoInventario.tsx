import { SeloStatus } from "@/components/admin/SeloStatus";
import { STATUS_EQUIPAMENTO } from "@/lib/tipos";

/**
 * As três contagens do inventário, no topo da tela.
 *
 * Serve para uma pergunta só, e é a que a coordenação faz de verdade: "sobra
 * notebook para hoje?". Por isso o número vem antes do rótulo e o selo repete
 * exatamente a cor e a palavra usadas na tabela abaixo — o olho liga os dois
 * sem legenda.
 */

type Props = {
  disponiveis: number;
  emprestados: number;
  manutencao: number;
  total: number;
};

export function ResumoInventario({
  disponiveis,
  emprestados,
  manutencao,
  total,
}: Props) {
  const cartoes = [
    { status: STATUS_EQUIPAMENTO.disponivel, valor: disponiveis },
    { status: STATUS_EQUIPAMENTO.emprestado, valor: emprestados },
    { status: STATUS_EQUIPAMENTO.manutencao, valor: manutencao },
  ];

  return (
    <section aria-label="Resumo do inventário" className="flex flex-col gap-3">
      <dl className="grid gap-4 sm:grid-cols-3">
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
        {total === 1 ? "1 equipamento" : `${total} equipamentos`} no inventário.
      </p>
    </section>
  );
}
