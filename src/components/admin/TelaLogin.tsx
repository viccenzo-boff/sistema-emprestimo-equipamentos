"use client";

import { useActionState } from "react";

import Image from "next/image";

import { entrarNoAdmin } from "@/app/admin/actions";
import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { campoComErro } from "@/components/ui/Campo";
import { IconeAlerta, IconeCadeado } from "@/components/ui/icones";

/**
 * A porta do painel: usuário, senha, e nada mais (Tarefa 10).
 *
 * Chamava-se `TelaSenha` enquanto havia uma senha mestre só. Agora cada
 * administrador tem conta própria — o nome do arquivo acompanhou, porque um
 * componente chamado "tela de senha" com dois campos manda a próxima pessoa
 * procurar o campo que falta.
 *
 * Nada do painel é renderizado aqui atrás — a página decide entre esta tela e o
 * conteúdo, então quem não entrou não recebe nem a lista, nem os nomes, nem a
 * marcação do menu no HTML.
 *
 * O erro vem do servidor pelo `useActionState`: a senha nunca é conferida no
 * navegador, então não existe caminho em que a tela "sabe" a senha certa. Nem
 * saberia: o que existe no banco é um hash bcrypt.
 *
 * **A logo fica no cabeçalho da página, fora do cartão.** Dentro dele ela
 * estava em um `flex flex-col`, cujo `align-items: stretch` esticava a imagem
 * até a largura do cartão enquanto a altura seguia presa em `h-11` — a distorção
 * relatada na Tarefa 5. Fora do cartão, em uma faixa `flex` horizontal com o
 * mesmo `h-11 sm:h-12` e o mesmo `px-4 py-5 sm:px-8` do
 * [cabeçalho do portal](src/components/portal/CabecalhoPortal.tsx), a proporção
 * nativa volta e as duas frentes do sistema abrem com a mesma marca no mesmo
 * lugar. Sem o `mx-auto max-w-5xl` do portal, porque aqui não há nada à direita
 * para equilibrar: a logo é o canto superior esquerdo da tela.
 *
 * **O erro é inline, não um cartão de `Alerta`.** Medido na Tarefa 5: a caixa
 * do `Alerta` custava ~125px de altura, o suficiente para empurrar o "Entrar"
 * para fora da tela em um notebook de 768px — e agora há um campo a mais
 * disputando a mesma altura. O `Alerta` continua onde ele é de fato uma
 * mensagem de página: o aviso de instalação incompleta.
 */

type Props = {
  /**
   * Falso quando a tabela `Administrador` está vazia — problema de instalação,
   * não de credencial. Substituiu o antigo "ADMIN_PASSWORD não está no .env".
   */
  temContas: boolean;
};

export function TelaLogin({ temContas }: Props) {
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
                Entre com seu usuário e senha para continuar.
              </p>
            </div>

            {temContas ? null : (
              <Alerta
                tom="aviso"
                mensagem="Nenhum administrador cadastrado."
                detalhe="Rode `npm run db:seed` no servidor para criar as contas do painel."
              />
            )}

            {/*
              Um `<form>` só, com os dois campos: é o que faz o gerenciador de
              senhas do navegador reconhecer o par e oferecer o preenchimento.
              Os `autoComplete` são os nomes que ele espera — "username" e
              "current-password" —, e não rótulos livres.
            */}
            <form action={entrar} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="usuario"
                  className="text-base font-semibold text-tinta"
                >
                  Usuário
                </label>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  disabled={!temContas}
                  aria-describedby={erro ? "erro-login" : undefined}
                  aria-invalid={erro ? true : undefined}
                  className={campoComErro(Boolean(erro))}
                  placeholder="ex: secretaria"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="senha"
                  className="text-base font-semibold text-tinta"
                >
                  Senha
                </label>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  disabled={!temContas}
                  aria-describedby={erro ? "erro-login" : undefined}
                  aria-invalid={erro ? true : undefined}
                  className={campoComErro(Boolean(erro))}
                  placeholder="digite a senha"
                />
              </div>

              {erro ? (
                <p
                  id="erro-login"
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
                disabled={!temContas}
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
