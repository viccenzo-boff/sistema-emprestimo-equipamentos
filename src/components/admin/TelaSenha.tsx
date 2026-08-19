"use client";

import { useActionState } from "react";

import Image from "next/image";

import { entrarNoAdmin } from "@/app/admin/actions";
import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeCadeado } from "@/components/ui/icones";

/**
 * A porta do painel: um campo de senha e nada mais.
 *
 * Nada do painel é renderizado aqui atrás — a página decide entre esta tela e o
 * conteúdo, então quem não entrou não recebe nem a lista, nem os nomes, nem a
 * marcação do menu no HTML.
 *
 * O erro vem do servidor pelo `useActionState`: a senha nunca é conferida no
 * navegador, então não existe caminho em que a tela "sabe" a senha certa.
 */

type Props = {
  /** Falso quando ADMIN_PASSWORD não está no .env — problema de instalação. */
  configurado: boolean;
};

export function TelaSenha({ configurado }: Props) {
  const [erro, entrar, pendente] = useActionState(entrarNoAdmin, null);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="animate-surgir w-full max-w-md">
        <div className="flex flex-col gap-7 rounded-3xl border border-borda bg-superficie p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5">
            <Image src={logoUnoesc} alt="Unoesc" className="h-11 w-auto" priority />

            <div>
              <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-marca-azul-tenue text-marca-azul">
                <IconeCadeado className="size-7" />
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-balance text-marca-azul">
                Painel Administrativo
              </h1>
              <p className="mt-2 text-base leading-relaxed text-tinta-suave">
                Área da coordenação. Informe a senha mestre para continuar.
              </p>
            </div>
          </div>

          {configurado ? null : (
            <Alerta
              tom="aviso"
              mensagem="O painel ainda não foi configurado."
              detalhe="Defina ADMIN_PASSWORD no arquivo .env do servidor e reinicie o sistema."
            />
          )}

          <form action={entrar} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="senha" className="text-base font-semibold text-tinta">
                Senha do painel
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                autoFocus
                disabled={!configurado}
                aria-describedby={erro ? "erro-senha" : undefined}
                className={[
                  "min-h-14 w-full rounded-2xl border-2 border-borda bg-superficie-2 px-4",
                  "text-lg text-tinta placeholder:text-tinta-tenue",
                  "transition-colors duration-150",
                  "hover:border-borda-forte focus:border-marca-azul focus:bg-superficie",
                  "disabled:opacity-50",
                ].join(" ")}
                placeholder="••••••••"
              />
            </div>

            {erro ? (
              <div id="erro-senha">
                <Alerta tom="erro" mensagem={erro.mensagem} detalhe={erro.detalhe} />
              </div>
            ) : null}

            <Botao
              type="submit"
              larguraTotal
              carregando={pendente}
              disabled={!configurado}
            >
              Entrar
            </Botao>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-tinta-tenue">
          Retirada e devolução de equipamentos ficam no tablet da bancada.
        </p>
      </div>
    </main>
  );
}
