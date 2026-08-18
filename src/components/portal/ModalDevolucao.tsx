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
 */

type Props = {
  emprestimo: EmprestimoAtivo | null;
  onConfirmar: () => void;
  onCancelar: () => void;
  confirmando: boolean;
  erro: { mensagem: string; detalhe?: string } | null;
};

export function ModalDevolucao({
  emprestimo,
  onConfirmar,
  onCancelar,
  confirmando,
  erro,
}: Props) {
  return (
    <Modal
      aberto={emprestimo !== null}
      titulo="Devolver equipamento"
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
            Confirmar devolução
          </Botao>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {emprestimo ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border-2 border-borda bg-superficie-2 px-5 py-4">
            <span className="font-mono text-2xl font-bold tracking-tight text-tinta">
              {emprestimo.equip_id}
            </span>
            <span className="text-base text-tinta-suave">{emprestimo.tipo}</span>
          </div>
        ) : null}

        <div className="flex items-start gap-4 rounded-2xl border border-aviso-borda bg-aviso-fundo p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-aviso text-white">
            <IconeAlerta className="size-6" />
          </span>

          {/* Frase literal da spec (seção 4, Fluxo 2, passo 3). Não reescrever. */}
          <p className="pt-0.5 text-xl leading-relaxed font-medium text-balance text-tinta">
            <span className="font-bold text-aviso">Atenção:</span> Deixe o
            equipamento na bancada. Confirma a devolução?
          </p>
        </div>

        <p className="text-base leading-relaxed text-tinta-suave">
          A secretaria confere e dá baixa depois. Até lá o item continua
          registrado no seu nome.
        </p>

        {erro ? <Alerta tom="erro" mensagem={erro.mensagem} detalhe={erro.detalhe} /> : null}
      </div>
    </Modal>
  );
}
