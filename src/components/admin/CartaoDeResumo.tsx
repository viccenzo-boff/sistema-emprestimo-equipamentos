import type { ReactNode } from "react";

/**
 * Um número grande com o seu rótulo embaixo — o cartão que abre três telas do
 * painel.
 *
 * Existe como componente desde a Tarefa 13, e o motivo é o mesmo que criou o
 * [Campo.tsx](src/components/ui/Campo.tsx) na Tarefa 8: as classes estavam
 * copiadas em [ResumoInventario](src/components/admin/ResumoInventario.tsx) e
 * em [ResumoPessoas](src/components/admin/ResumoPessoas.tsx), e o relatório de
 * ocupação seria a terceira cópia. Duas cópias divergem na primeira correção
 * que só uma delas receber; três, mais depressa.
 *
 * O número vem **antes** do rótulo, e é isso que o `<dd>` antes do `<dt>`
 * dentro do `<div>` faz. Não é descuido de semântica: quem varre o topo de uma
 * dessas telas está procurando a quantidade, e o rótulo é a confirmação do que
 * ela conta. O agrupamento por `<div>` dentro do `<dl>` é o que torna a ordem
 * invertida válida.
 *
 * O rótulo é `children` e não um `string` de propósito: nas duas telas antigas
 * ele é um selo colorido, e no relatório é um rótulo de texto com uma linha de
 * detalhe embaixo. Quem monta o rótulo é a tela; o cartão só empresta a
 * moldura.
 */
export function CartaoDeResumo({
  valor,
  children,
}: {
  valor: number;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5">
      <dd className="numeros-tabulares text-4xl font-semibold tracking-tight text-marca-azul">
        {valor}
      </dd>
      <dt>{children}</dt>
    </div>
  );
}
