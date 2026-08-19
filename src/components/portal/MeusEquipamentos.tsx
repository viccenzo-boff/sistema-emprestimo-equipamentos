"use client";

import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeCategoria, IconeDevolver } from "@/components/ui/icones";
import { desdeQuando } from "@/lib/texto";
import type { EmprestimoAtivo } from "@/lib/tipos";

/**
 * Passos 1 e 2 do Fluxo 2: o que está com a pessoa, e o botão de devolver.
 *
 * Lista em linhas, não em ladrilhos como as categorias. A diferença é
 * proposital: categoria é escolha (grade, olho passeia), item emprestado é
 * inventário (linha, olho desce). E a linha deixa o "Devolver" sempre no mesmo
 * lugar, à direita — o polegar decora o caminho.
 *
 * A etiqueta aparece inteira e em monoespaçada ("NOTE-01"), igual ao adesivo
 * colado no aparelho: quem confere na bancada compara caractere a caractere.
 */

type Props = {
  emprestimos: EmprestimoAtivo[];
  onDevolver: (emprestimo: EmprestimoAtivo) => void;
  onDevolverTudo: () => void;
  erro: { mensagem: string; detalhe?: string } | null;
};

export function MeusEquipamentos({
  emprestimos,
  onDevolver,
  onDevolverTudo,
  erro,
}: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Meus equipamentos
        </h2>
        <p className="numeros-tabulares shrink-0 text-base text-tinta-suave">
          {emprestimos.length === 1 ? "1 item" : `${emprestimos.length} itens`}
        </p>
      </div>

      {erro ? <Alerta tom="erro" mensagem={erro.mensagem} detalhe={erro.detalhe} /> : null}

      {/*
        "Devolver tudo" só existe a partir de dois itens: com um só, ele seria o
        mesmo gesto do botão da linha logo abaixo, com outro nome. Fica em
        `secundario` e não em `sucesso` porque o atalho não é a ação principal —
        a decisão de verdade acontece no modal, e é lá que o verde aparece.
      */}
      {emprestimos.length > 1 ? (
        <Botao
          variante="secundario"
          onClick={onDevolverTudo}
          larguraTotal
          aria-label={`Devolver todos os ${emprestimos.length} equipamentos de uma vez`}
        >
          <IconeDevolver className="size-6" />
          Devolver tudo ({emprestimos.length})
        </Botao>
      ) : null}

      <ul className="flex flex-col gap-3">
        {emprestimos.map((emprestimo) => (
          <Linha
            key={emprestimo.id}
            emprestimo={emprestimo}
            onDevolver={() => onDevolver(emprestimo)}
          />
        ))}
      </ul>
    </section>
  );
}

/*
  Não há estado de "carregando" na linha: o toque em "Devolver" abre o modal e
  mais nada. Enquanto ele está aberto o `<dialog>` deixa o resto da página
  inerte, então qualquer spinner aqui atrás seria desenhado onde ninguém vê.
*/
function Linha({
  emprestimo,
  onDevolver,
}: {
  emprestimo: EmprestimoAtivo;
  onDevolver: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border-2 border-borda bg-superficie p-4 sm:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-marca-azul-tenue text-marca-azul">
        <IconeCategoria tipo={emprestimo.tipo} className="size-7" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xl font-bold tracking-tight text-tinta">
          {emprestimo.equip_id}
        </span>
        {/*
          "retirado" só para quem ouve a tela. Medido na coluna estreita do
          layout em paisagem: com a palavra visível a legenda passa de 256px em
          199px disponíveis e quebra em duas linhas. Ao lado da etiqueta, dentro
          de uma seção chamada "Meus equipamentos", a data se explica sozinha —
          fora do contexto visual, não.
        */}
        <span className="block text-base text-tinta-suave">
          {emprestimo.tipo} ·<span className="sr-only"> retirado</span>{" "}
          {desdeQuando(emprestimo.data_retirada)}
        </span>
      </span>

      <Botao
        variante="secundario"
        onClick={onDevolver}
        className="ml-auto shrink-0"
        aria-label={`Devolver ${emprestimo.equip_id}`}
      >
        <IconeDevolver className="size-6" />
        Devolver
      </Botao>
    </li>
  );
}
