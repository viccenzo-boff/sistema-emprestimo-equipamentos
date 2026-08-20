import type { SelectHTMLAttributes } from "react";

import { IconeChevron } from "@/components/ui/icones";

/**
 * Os campos de formulário do painel, em um lugar só.
 *
 * Nasceu na Tarefa 8, de uma divergência já consumada: a mesma constante
 * `CAMPO` existia copiada em `GestaoInventario` e em `GestaoCategorias`, e as
 * duas **já não eram iguais** — a cópia de Categorias tinha perdido o estado
 * `disabled` pelo caminho, então um campo desabilitado ali continuava com
 * aparência de campo editável. Com a terceira tela (Pessoas) precisando das
 * mesmas classes, copiar de novo era garantir a próxima divergência.
 *
 * É o mesmo argumento que já tirou `semAcento` das actions na Tarefa 7: uma
 * regra com dois donos vira duas regras sem ninguém perceber.
 */

/*
  O campo **sem** o recuo lateral, para quem precisa de outro.

  A separação não é preciosismo: `px-4` e `pl-12` são utilidades concorrentes, e
  no Tailwind 4 quem vence é a ordem no CSS gerado, não a ordem no atributo — a
  mesma armadilha já registrada para os tamanhos do `Botao`. O `<select>` daqui
  vinha somando `pr-12` por cima do `px-4` e só funcionava por sorte da ordem;
  a busca, que precisa de espaço para a lupa à esquerda, teria a mesma sorte a
  cada build. Quem quer recuo diferente compõe a partir daqui e não sobrepõe
  nada.
*/
export const CAMPO_SEM_LADOS = [
  "min-h-14 w-full rounded-2xl border-2 border-borda bg-superficie-2",
  "text-lg text-tinta placeholder:text-tinta-tenue",
  "transition-colors duration-150",
  "hover:border-borda-forte focus:border-marca-azul focus:bg-superficie",
  "disabled:cursor-not-allowed disabled:opacity-55",
].join(" ");

/** O campo comum, com o recuo dos dois lados. */
export const CAMPO = `${CAMPO_SEM_LADOS} px-4`;

/**
 * `<select>` com a seta desenhada por nós.
 *
 * `appearance-none` apaga a seta nativa junto com o estilo do sistema, então
 * ela volta aqui — e com `pointer-events-none`, para o clique atravessar e
 * abrir a lista mesmo em cima do ícone.
 */
export function Selecao({
  className = "",
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${CAMPO_SEM_LADOS} cursor-pointer appearance-none pr-12 pl-4 ${className}`}
        {...resto}
      />

      <IconeChevron className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-tinta-tenue" />
    </div>
  );
}

/** O cabeçalho e a célula das tabelas do painel — as três usam os mesmos. */
export const CABECALHO =
  "px-5 py-4 text-sm font-semibold tracking-wide text-tinta-tenue uppercase";

export const CELULA = "px-5 py-4 align-middle";
