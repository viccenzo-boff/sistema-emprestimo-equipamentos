"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { alterarSenhaDoAdmin, sairDoAdmin } from "@/app/admin/actions";
import { Botao } from "@/components/ui/Botao";
import { campoComErro } from "@/components/ui/Campo";
import { Modal } from "@/components/ui/Modal";
import { Notificacao } from "@/components/ui/Notificacao";
import { IconeAlerta, IconeCadeado, IconeSair } from "@/components/ui/icones";
import { MINIMO_DE_CARACTERES } from "@/lib/senha";
import type { SessaoAdmin } from "@/lib/sessao-admin";

/**
 * O rodapé da barra lateral: quem está logado e o que dá para fazer com essa
 * conta (Tarefa 11).
 *
 * **Identidade e ação moram juntas.** Até a Tarefa 10 o nome ficava embaixo da
 * marca, no topo, e o "Sair" no pé da barra — as duas pontas da coluna. Com a
 * chegada do segundo botão de conta, o nome desceu: a pergunta que a sprint
 * existe para responder é "quem está logado neste computador, e como eu troco
 * isso?", e ela se responde melhor com as três coisas no mesmo bloco. É também
 * o que a spec pede ao pé da letra ("botão de Sair acompanhado do nome do
 * administrador logado").
 *
 * É ilha de cliente porque o modal precisa de estado, e é **uma** ilha, montada
 * uma vez: duas cópias do bloco (uma para a barra em coluna, outra para a faixa
 * horizontal do notebook) dariam dois `<dialog>` no documento, e um
 * `showModal()` no elemento errado abre um diálogo vazio. Quem se adapta é o
 * `flex`, não a quantidade de componentes.
 *
 * O "Sair" continua sendo um `<form action={sairDoAdmin}>`, e não um `onClick`:
 * assim ele funciona mesmo se o JavaScript falhar, que é o que se quer do botão
 * cuja função é fechar a sessão.
 */

type Props = {
  admin: SessaoAdmin;
};

type Falha = {
  mensagem: string;
  detalhe?: string;
};

export function ContaDoAdmin({ admin }: Props) {
  const [abrindoTroca, setAbrindoTroca] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <div
      className={[
        "flex flex-wrap items-center justify-between gap-3 border-t border-borda pt-5",
        "lg:flex-col lg:items-stretch lg:pt-6",
      ].join(" ")}
    >
      <p className="text-sm leading-tight break-words">
        <span className="block text-xs font-semibold tracking-wide text-tinta-tenue uppercase">
          Conectado como
        </span>
        {/*
          `break-words` porque o nome vem do banco e ninguém prometeu que cabe
          em 18rem: um nome comprido sem quebra empurraria a barra lateral
          inteira para fora do próprio recuo.
        */}
        <span className="font-semibold text-tinta">{admin.nome}</span>
      </p>

      <div className="flex gap-2 lg:flex-col">
        {/*
          Fantasma, e não secundário como o "Sair": trocar a senha é gesto de
          uma vez por semestre, e dois botões de mesmo peso empilhados fariam a
          saída — que é a ação do dia — disputar o olho com ele. A classe de
          largura vai por `className` porque não concorre com nada; os tamanhos,
          esses, continuam sendo propriedade do componente.
        */}
        <Botao
          variante="fantasma"
          tamanho="pequeno"
          onClick={() => setAbrindoTroca(true)}
          className="lg:w-full"
        >
          <IconeCadeado className="size-5" />
          Alterar senha
        </Botao>

        <form action={sairDoAdmin}>
          <Botao
            type="submit"
            variante="secundario"
            tamanho="pequeno"
            larguraTotal
          >
            <IconeSair className="size-5" />
            Sair do painel
          </Botao>
        </form>
      </div>

      {/*
        Montado só enquanto está aberto, e não sempre com um `aberto={false}`.

        Componente que devolve `null` **não** desmonta: ele continua na árvore,
        e o estado dele junto. Com o modal sempre montado, o "Senha atual
        incorreta" da tentativa de ontem estaria lá esperando na próxima
        abertura. Montar sob condição faz cada abertura começar limpa sem
        nenhum efeito de limpeza para manter — e leva embora, de quebra, os três
        campos de senha do documento.
      */}
      {abrindoTroca ? (
        <ModalDeSenha
          onFechar={() => setAbrindoTroca(false)}
          onTrocada={(nome) => {
            setAbrindoTroca(false);
            setAviso(`Senha da conta ${nome} alterada.`);
          }}
        />
      ) : null}

      <Notificacao mensagem={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
}

/**
 * O modal dos três campos (spec da Tarefa 11, item 2).
 *
 * **Os campos são não-controlados e o `<form>` não é um `action` de servidor.**
 * A action é chamada à mão dentro de uma transição, e não passada para o
 * `<form action>`, porque o React 19 limpa o formulário sozinho quando uma
 * action de formulário termina — inclusive quando ela termina em erro. Com
 * senha isso é cruel: quem errou a confirmação teria de redigitar os três
 * campos para tentar de novo. Assim o erro aparece com o que foi digitado ainda
 * na tela.
 *
 * Quem decide se ele existe é o pai: fechado, o componente é desmontado, e os
 * três campos saem do documento levando as senhas digitadas junto, em vez de
 * ficarem escondidos com valor.
 */
function ModalDeSenha({
  onFechar,
  onTrocada,
}: {
  onFechar: () => void;
  onTrocada: (nome: string) => void;
}) {
  const [salvando, iniciarTransicao] = useTransition();
  const [falha, setFalha] = useState<Falha | null>(null);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  /*
    O foco vem depois do `showModal()`, não antes: o `<dialog>` nativo move o
    foco para o primeiro focável ao abrir, e o `showModal()` roda no efeito do
    `Modal` — ou seja, depois dos efeitos dos filhos. Um `focus()` daqui seria
    desfeito um instante depois; o `requestAnimationFrame` cai no quadro
    seguinte, quando o diálogo já abriu.
  */
  useEffect(() => {
    const quadro = requestAnimationFrame(() => primeiroCampo.current?.focus());
    return () => cancelAnimationFrame(quadro);
  }, []);

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await alterarSenhaDoAdmin(
        String(dados.get("senha-atual") ?? ""),
        String(dados.get("senha-nova") ?? ""),
        String(dados.get("senha-confirmacao") ?? ""),
      );

      if (!resultado.ok) {
        setFalha({ mensagem: resultado.mensagem, detalhe: resultado.detalhe });
        return;
      }

      onTrocada(resultado.dados.nome);
    });
  }

  return (
    <Modal
      aberto
      titulo="Alterar senha"
      bloqueado={salvando}
      onFechar={onFechar}
      acoes={
        <>
          <Botao
            variante="secundario"
            onClick={onFechar}
            disabled={salvando}
            className="sm:min-w-40"
          >
            Cancelar
          </Botao>
          <Botao
            type="submit"
            form="formulario-da-senha"
            carregando={salvando}
            className="sm:min-w-40"
          >
            Salvar
          </Botao>
        </>
      }
    >
      <form
        id="formulario-da-senha"
        onSubmit={enviar}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <label
            htmlFor="senha-atual"
            className="text-base font-semibold text-tinta"
          >
            Senha atual
          </label>
          <input
            ref={primeiroCampo}
            id="senha-atual"
            name="senha-atual"
            type="password"
            autoComplete="current-password"
            required
            disabled={salvando}
            aria-describedby={falha ? "erro-da-senha" : undefined}
            aria-invalid={falha ? true : undefined}
            className={campoComErro(Boolean(falha))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="senha-nova"
            className="text-base font-semibold text-tinta"
          >
            Nova senha
          </label>
          <input
            id="senha-nova"
            name="senha-nova"
            type="password"
            autoComplete="new-password"
            required
            disabled={salvando}
            aria-describedby="regra-da-senha"
            className={campoComErro(Boolean(falha))}
          />
          {/*
            A dica sai da mesma constante que o servidor usa para recusar. Duas
            listas pareceriam iguais hoje e divergiriam no dia em que o mínimo
            mudasse — a tela prometendo um número e a action cobrando outro.

            Não há `maxLength` no campo, e é de propósito: o teto do bcrypt é de
            72 **bytes**, e `maxLength` conta caracteres. Quarenta letras
            acentuadas passam de 72 bytes e caberiam num `maxLength={72}` —
            gravando o hash do pedaço e deixando valer uma senha mais curta do
            que a escolhida, sem erro nenhum. Quem sabe contar bytes é o
            servidor, e é lá que a conta é feita.
          */}
          <p id="regra-da-senha" className="text-base text-tinta-tenue">
            Pelo menos {MINIMO_DE_CARACTERES} caracteres.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="senha-confirmacao"
            className="text-base font-semibold text-tinta"
          >
            Confirmar nova senha
          </label>
          <input
            id="senha-confirmacao"
            name="senha-confirmacao"
            type="password"
            autoComplete="new-password"
            required
            disabled={salvando}
            aria-describedby={falha ? "erro-da-senha" : undefined}
            aria-invalid={falha ? true : undefined}
            className={campoComErro(Boolean(falha))}
          />
        </div>

        {/*
          O erro é inline, e não um cartão de `Alerta`: é a mesma decisão da
          Tarefa 5 para o login, pelo mesmo motivo de altura — aqui o modal
          rola dentro de uma tela de notebook com três campos já ocupando
          espaço.
        */}
        {falha ? (
          <p
            id="erro-da-senha"
            role="alert"
            className="animate-surgir-curto flex items-start gap-2 text-erro"
          >
            <IconeAlerta className="mt-0.5 size-5 shrink-0" />
            <span>
              <span className="block text-base leading-snug font-semibold">
                {falha.mensagem}
              </span>
              {falha.detalhe ? (
                <span className="mt-0.5 block text-sm leading-snug text-erro/85">
                  {falha.detalhe}
                </span>
              ) : null}
            </span>
          </p>
        ) : null}

        {/*
          As duas consequências que ninguém deduz sozinho, ditas antes do
          clique e não depois.

          A primeira é mecânica: o cookie de sessão é assinado com o hash da
          senha, então gravar um hash novo derruba as sessões desta conta que
          estiverem abertas em outro lugar. É o cenário da sprint — a máquina do
          turno anterior deixada logada — e a frase transforma um efeito
          colateral em ferramenta.

          A segunda é a reversibilidade: não existe "esqueci minha senha" neste
          MVP, porque não há cadastro de administrador pela tela. Recuperar é ir
          ao servidor, apagar a linha no `npm run db:studio` e rodar
          `npm run db:seed`.
        */}
        <p className="text-base leading-snug text-tinta-tenue">
          Ao salvar, esta conta é desconectada nos outros computadores — aqui
          você continua trabalhando. Guarde a senha nova: não há recuperação
          pela tela.
        </p>
      </form>
    </Modal>
  );
}
