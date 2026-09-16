"use client";

import { useActionState } from "react";

import { salvarUrlDoFormulario } from "@/app/admin/actions";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { CAMPO } from "@/components/ui/Campo";
import { ImagemQr } from "@/components/ui/ImagemQr";
import type { QrDoFormulario } from "@/lib/tipos";

/**
 * O cartão "Formulário de sugestões" da aba Satisfação (Tarefa 14, item 6):
 * o campo da URL, o **Salvar**, e a prévia do QR que o tablet vai mostrar.
 *
 * É a única configuração do sistema, e mora aqui em vez de numa tela de
 * configurações própria — uma tela para um campo é um item de menu que
 * ninguém abre. Fica ao lado do relatório que o formulário alimenta.
 *
 * O `<input>` é não-controlado, como todo campo de `<form action>` do painel
 * (Tarefa 5): o React 19 limpa o formulário sozinho quando a action termina,
 * e o valor volta ao `defaultValue` — que é a URL que o servidor acabou de
 * gravar, porque a action revalida a rota e a resposta traz a árvore nova. A
 * `key` amarra o formulário à URL gravada: quando ela muda, o campo remonta
 * com o valor certo em vez de depender da ordem entre a limpeza e a
 * re-renderização.
 */
export function FormularioDeSugestoes({
  formulario,
}: {
  formulario: { url: string; qr: QrDoFormulario } | null;
}) {
  const [estado, salvar, pendente] = useActionState(salvarUrlDoFormulario, {
    fase: "inicial" as const,
  });

  return (
    <section
      aria-labelledby="formulario-de-sugestoes"
      className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5"
    >
      <div>
        <h2
          id="formulario-de-sugestoes"
          className="text-xl font-semibold tracking-tight text-marca-azul"
        >
          Formulário de sugestões
        </h2>
        <p className="mt-1 text-base text-tinta-suave">
          O link que o QR code da tela de retirada abre — um formulário do
          Google numa conta institucional do setor, para quem quiser relatar um
          problema em texto. Deixe em branco para o QR não aparecer.
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <form
          key={formulario?.url ?? ""}
          action={salvar}
          className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="url-do-formulario" className="text-base font-semibold text-tinta">
              Endereço do formulário
            </label>
            <input
              id="url-do-formulario"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://forms.gle/..."
              defaultValue={formulario?.url ?? ""}
              className={CAMPO}
            />
          </div>

          <Botao type="submit" carregando={pendente} className="sm:shrink-0">
            Salvar
          </Botao>
        </form>

        {formulario ? (
          <div className="flex shrink-0 flex-col items-center gap-2">
            <span className="rounded-2xl border border-borda bg-white p-2">
              <ImagemQr
                svg={formulario.qr.svg}
                alt={`Prévia do QR code que abre ${formulario.url}`}
                className="size-32"
              />
            </span>
            <p className="text-sm text-tinta-tenue">Como aparece no tablet</p>
          </div>
        ) : null}
      </div>

      {estado.fase === "erro" ? (
        <Alerta tom="erro" mensagem={estado.mensagem} detalhe={estado.detalhe} />
      ) : null}

      {estado.fase === "sucesso" ? (
        <Alerta tom="sucesso" mensagem={estado.mensagem} />
      ) : null}
    </section>
  );
}
