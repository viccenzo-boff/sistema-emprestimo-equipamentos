"use client";

import { MeusEquipamentos } from "@/components/portal/MeusEquipamentos";
import { TelaCategorias } from "@/components/portal/TelaCategorias";
import { primeiroNome } from "@/lib/texto";
import type { Categoria, EmprestimoAtivo } from "@/lib/tipos";

/**
 * A tela que aparece logo depois da matrícula. É o encontro dos dois fluxos:
 * daqui a pessoa retira (Fluxo 1) ou devolve (Fluxo 2).
 *
 * Layout: empilhado em retrato, duas colunas em paisagem — a mesma solução da
 * [TelaMatricula](src/components/portal/TelaMatricula.tsx), pelo mesmo motivo
 * medido. Empilhado nos dois casos, três empréstimos já empurravam a grade de
 * categorias para fora da tela em um tablet deitado (1280x800): quem vinha
 * retirar via três caixas de ícone sem rótulo. Em duas colunas as duas tarefas
 * cabem inteiras, e a lista pode crescer sem empurrar nada.
 *
 * "Meus equipamentos" fica na coluna da esquerda e primeiro no HTML: em retrato
 * é o que aparece antes, e quem chega com um notebook na mão veio devolver —
 * a tarefa mais curta das duas. Ordem visual e ordem de leitura são a mesma,
 * então o foco pelo teclado segue o que o olho vê.
 *
 * Sem nenhum empréstimo ativo, a seção some inteira e a tela volta a ser
 * exatamente a do Fluxo 1 — nada de "você não tem equipamentos", que é ocupar
 * a tela para não dizer nada.
 */

type Props = {
  nome: string;
  categorias: Categoria[];
  selecionadosPorTipo: Record<string, number>;
  onEscolher: (tipo: string) => void;
  tipoCarregando: string | null;
  emprestimos: EmprestimoAtivo[];
  onDevolver: (emprestimo: EmprestimoAtivo) => void;
  onDevolverTudo: () => void;
  erroDevolucao: { mensagem: string; detalhe?: string } | null;
};

export function TelaInicio({
  nome,
  categorias,
  selecionadosPorTipo,
  onEscolher,
  tipoCarregando,
  emprestimos,
  onDevolver,
  onDevolverTudo,
  erroDevolucao,
}: Props) {
  const temEmprestimos = emprestimos.length > 0;

  return (
    <div className="animate-surgir flex flex-col gap-8">
      <div>
        <p className="text-lg text-tinta-suave">
          Olá, <span className="font-semibold text-tinta">{primeiroNome(nome)}</span>.
        </p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-balance text-marca-azul">
          {temEmprestimos ? "O que você quer fazer?" : "O que você vai levar?"}
        </h1>
      </div>

      <div
        className={
          temEmprestimos
            ? "grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-x-10"
            : ""
        }
      >
        {temEmprestimos ? (
          <MeusEquipamentos
            emprestimos={emprestimos}
            onDevolver={onDevolver}
            onDevolverTudo={onDevolverTudo}
            erro={erroDevolucao}
          />
        ) : null}

        <TelaCategorias
          categorias={categorias}
          selecionadosPorTipo={selecionadosPorTipo}
          onEscolher={onEscolher}
          tipoCarregando={tipoCarregando}
          titulo={temEmprestimos ? "Retirar equipamento" : undefined}
          colunas={temEmprestimos ? 2 : 3}
        />
      </div>
    </div>
  );
}
