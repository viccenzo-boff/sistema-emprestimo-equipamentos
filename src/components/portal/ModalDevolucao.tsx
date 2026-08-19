"use client";

import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { Modal } from "@/components/ui/Modal";
import { IconeAlerta } from "@/components/ui/icones";
import type { EmprestimoAtivo } from "@/lib/tipos";

/**
 * Passo 3 do Fluxo 2 — o alerta crítico da spec.
 *
 * A frase "Atenção: Deixe o equipamento na bancada. Confirma a devolução?" é
 * literal da especificação e fica em um parágrafo só, sem quebrar entre título e
 * corpo: é a única instrução física do sistema inteiro. Quem confirma aqui está
 * dizendo que largou o aparelho na bancada; se sair com ele na mochila, a
 * secretaria vai procurar um equipamento que não está lá.
 *
 * A etiqueta aparece em destaque acima do aviso porque o erro caro aqui é
 * devolver o item errado quando se está com três na mão.
 *
 * O mesmo modal atende ao "Devolver tudo": a lista chega com um item ou com
 * todos. No plural a frase vira "Deixe **os equipamentos** na bancada" — é a
 * mesma instrução, e mantê-la no singular quando a pessoa está com três na mão
 * seria dizer a coisa errada em nome da literalidade. As etiquetas continuam
 * todas na tela, uma por linha: é o que ela vai conferir contra a pilha.
 */

type Props = {
  /** `null` fecha o modal. Um item é a devolução avulsa; vários, o "Devolver tudo". */
  emprestimos: EmprestimoAtivo[] | null;
  onConfirmar: () => void;
  onCancelar: () => void;
  confirmando: boolean;
  erro: { mensagem: string; detalhe?: string } | null;
};

export function ModalDevolucao({
  emprestimos,
  onConfirmar,
  onCancelar,
  confirmando,
  erro,
}: Props) {
  const lista = emprestimos ?? [];
  const varios = lista.length > 1;

  return (
    <Modal
      aberto={emprestimos !== null}
      titulo={varios ? "Devolver todos os equipamentos" : "Devolver equipamento"}
      bloqueado={confirmando}
      onFechar={onCancelar}
      acoes={
        <>
          <Botao
            variante="secundario"
            tamanho="grande"
            onClick={onCancelar}
            disabled={confirmando}
            className="sm:min-w-40"
          >
            Cancelar
          </Botao>
          <Botao
            variante="sucesso"
            tamanho="grande"
            onClick={onConfirmar}
            carregando={confirmando}
            className="sm:min-w-64"
          >
            {varios ? `Confirmar devolução de ${lista.length} itens` : "Confirmar devolução"}
          </Botao>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {lista.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {lista.map((emprestimo) => (
              <li
                key={emprestimo.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border-2 border-borda bg-superficie-2 px-5 py-4"
              >
                <span className="font-mono text-2xl font-bold tracking-tight text-tinta">
                  {emprestimo.equip_id}
                </span>
                <span className="text-base text-tinta-suave">{emprestimo.tipo}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-start gap-4 rounded-2xl border border-aviso-borda bg-aviso-fundo p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-aviso text-white">
            <IconeAlerta className="size-6" />
          </span>

          {/* Frase literal da spec (seção 4, Fluxo 2, passo 3). Não reescrever. */}
          <p className="pt-0.5 text-xl leading-relaxed font-medium text-balance text-tinta">
            <span className="font-bold text-aviso">Atenção:</span>{" "}
            {varios
              ? "Deixe os equipamentos na bancada. Confirma a devolução?"
              : "Deixe o equipamento na bancada. Confirma a devolução?"}
          </p>
        </div>

        <p className="text-base leading-relaxed text-tinta-suave">
          A secretaria confere e dá baixa depois. Até lá{" "}
          {varios ? "os itens continuam registrados" : "o item continua registrado"} no
          seu nome.
        </p>

        {erro ? <Alerta tom="erro" mensagem={erro.mensagem} detalhe={erro.detalhe} /> : null}
      </div>
    </Modal>
  );
}
