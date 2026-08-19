"use client";

import { useActionState } from "react";

import Image from "next/image";

import { entrarNoAdmin } from "@/app/admin/actions";
import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeAlerta, IconeCadeado } from "@/components/ui/icones";

/**
 * A porta do painel: um campo de senha e nada mais.
 *
 * Nada do painel é renderizado aqui atrás — a página decide entre esta tela e o
 * conteúdo, então quem não entrou não recebe nem a lista, nem os nomes, nem a
 * marcação do menu no HTML.
 *
 * O erro vem do servidor pelo `useActionState`: a senha nunca é conferida no
 * navegador, então não existe caminho em que a tela "sabe" a senha certa.
 *
 * **A logo fica no cabeçalho da página, fora do cartão.** Dentro dele ela
 * estava em um `flex flex-col`, cujo `align-items: stretch` esticava a imagem
 * até a largura do cartão enquanto a altura seguia presa em `h-11` — a distorção
 * relatada. Fora do cartão, em uma faixa `flex` horizontal com o mesmo `h-11
 * sm:h-12` e o mesmo `px-4 py-5 sm:px-8` do
 * [cabeçalho do portal](src/components/portal/CabecalhoPortal.tsx), a proporção
 * nativa volta e as duas frentes do sistema abrem com a mesma marca no mesmo
 * lugar. Sem o `mx-auto max-w-5xl` do portal, porque aqui não há nada à direita
 * para equilibrar: a logo é o canto superior esquerdo da tela.
 *
 * **O erro é inline, não um cartão de `Alerta`.** Formulário de um campo só
 * pede a mensagem colada no campo — e, medido, a caixa do `Alerta` custava
 * ~125px de altura, o suficiente para empurrar o "Entrar" para fora da tela em
 * um notebook de 768px. O `Alerta` continua onde ele é de fato uma mensagem de
 * página: o aviso de instalação incompleta.
 */

type Props = {
  /** Falso quando ADMIN_PASSWORD não está no .env — problema de instalação. */
  configurado: boolean;
};

export function TelaSenha({ configurado }: Props) {
  const [erro, entrar, pendente] = useActionState(entrarNoAdmin, null);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Mesma marca, mesmo tamanho e mesmo respiro do cabeçalho do portal. */}
      <header className="flex w-full items-center px-4 py-5 sm:px-8">
        <Image
          src={logoUnoesc}
          alt="Unoesc"
          className="h-11 w-auto sm:h-12"
          priority
        />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pt-2 pb-10">
        <div className="animate-surgir w-full max-w-sm">
          <div className="flex flex-col gap-6 rounded-3xl border border-borda bg-superficie p-7 shadow-sm">
            <div>
              <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-marca-azul-tenue text-marca-azul">
                <IconeCadeado className="size-6" />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-balance text-marca-azul">
                Painel Administrativo
              </h1>
              <p className="mt-1.5 text-base leading-snug text-tinta-suave">
                Informe a senha mestre para continuar.
              </p>
            </div>

            {configurado ? null : (
              <Alerta
                tom="aviso"
                mensagem="O painel ainda não foi configurado."
                detalhe="Defina ADMIN_PASSWORD no .env do servidor e reinicie o sistema."
              />
            )}

            <form action={entrar} className="flex flex-col gap-4">
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
                  aria-invalid={erro ? true : undefined}
                  className={[
                    "min-h-14 w-full rounded-2xl border-2 bg-superficie-2 px-4",
                    "text-lg text-tinta placeholder:text-tinta-tenue",
                    "transition-colors duration-150",
                    "hover:border-borda-forte focus:bg-superficie",
                    "disabled:opacity-50",
                    erro
                      ? "border-erro-borda focus:border-erro"
                      : "border-borda focus:border-marca-azul",
                  ].join(" ")}
                  placeholder="digite a senha"
                />
              </div>

              {erro ? (
                <p
                  id="erro-senha"
                  role="alert"
                  className="animate-surgir-curto flex items-start gap-2 text-erro"
                >
                  <IconeAlerta className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <span className="block text-base leading-snug font-semibold">
                      {erro.mensagem}
                    </span>
                    {erro.detalhe ? (
                      <span className="mt-0.5 block text-sm leading-snug text-erro/85">
                        {erro.detalhe}
                      </span>
                    ) : null}
                  </span>
                </p>
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

          <p className="mt-5 text-center text-sm text-tinta-tenue">
            Retirada e devolução de equipamentos ficam no tablet da bancada.
          </p>
        </div>
      </main>
    </div>
  );
}
