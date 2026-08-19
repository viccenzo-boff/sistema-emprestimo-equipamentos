import { STATUS_EQUIPAMENTO } from "@/lib/tipos";

/**
 * A situação de um equipamento, em uma palavra.
 *
 * Cor **e** palavra, nunca só a cor: a tabela de inventário é lida de relance,
 * e quem não distingue verde de âmbar precisaria adivinhar. O ponto colorido é
 * reforço, não a informação.
 *
 * Os três tons vêm dos papéis semânticos da paleta, não de escolha livre:
 * disponível é o estado bom (sucesso), manutenção é o estado que pede atenção
 * (aviso), emprestado é estado neutro de sistema (azul da marca) — não é
 * problema nenhum um equipamento estar na mão de alguém.
 */

type Props = {
  status: string;
  className?: string;
};

const SELOS: Record<string, { rotulo: string; caixa: string; ponto: string }> = {
  [STATUS_EQUIPAMENTO.disponivel]: {
    rotulo: "Disponível",
    caixa: "border-sucesso-borda bg-sucesso-fundo text-sucesso",
    ponto: "bg-marca-verde-forte",
  },
  [STATUS_EQUIPAMENTO.emprestado]: {
    rotulo: "Emprestado",
    caixa: "border-borda bg-marca-azul-tenue text-marca-azul",
    ponto: "bg-marca-azul-claro",
  },
  [STATUS_EQUIPAMENTO.manutencao]: {
    rotulo: "Manutenção",
    caixa: "border-aviso-borda bg-aviso-fundo text-aviso",
    ponto: "bg-aviso",
  },
};

export function SeloStatus({ status, className = "" }: Props) {
  const selo = SELOS[status] ?? {
    rotulo: status,
    caixa: "border-borda bg-superficie-2 text-tinta-suave",
    ponto: "bg-tinta-tenue",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1",
        "text-sm font-semibold whitespace-nowrap",
        selo.caixa,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={["size-2 rounded-full", selo.ponto].join(" ")} aria-hidden="true" />
      {selo.rotulo}
    </span>
  );
}
