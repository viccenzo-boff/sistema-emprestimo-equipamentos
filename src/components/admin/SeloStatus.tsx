import { STATUS_EQUIPAMENTO } from "@/lib/tipos";

/**
 * A situação de um equipamento, em uma palavra.
 *
 * Cor **e** palavra, nunca só a cor: a tabela de inventário é lida de relance,
 * e quem não distingue verde de âmbar precisaria adivinhar. O ponto colorido é
 * reforço, não a informação.
 *
 * Os tons vêm dos papéis semânticos da paleta, não de escolha livre: disponível
 * é o estado bom (sucesso), manutenção é o estado que pede atenção (aviso),
 * emprestado é estado neutro de sistema (azul da marca) — não é problema nenhum
 * um equipamento estar na mão de alguém.
 *
 * Inativo é o único sem cor: cinza sobre cinza, o mesmo par que a tabela usa
 * para texto secundário. Não é um estado que peça ação nem que informe boa
 * notícia — é um item que saiu de cena, e a linha inteira deve pesar menos que
 * as vizinhas quando o olho varre a lista.
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
  [STATUS_EQUIPAMENTO.inativo]: {
    rotulo: "Inativo",
    caixa: "border-borda bg-superficie-2 text-tinta-tenue",
    ponto: "bg-tinta-tenue",
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
