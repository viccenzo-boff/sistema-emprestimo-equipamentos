"use client";

import Image from "next/image";

import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";
import { Botao } from "@/components/ui/Botao";
import type { PessoaIdentificada } from "@/lib/tipos";

/**
 * Cabeçalho do portal.
 *
 * O "Sair" só aparece depois da identificação, e existe por um motivo prático:
 * quem digitou a matrícula errada, ou desistiu no meio, precisa de uma saída
 * óbvia — senão o próximo aluno continua a sessão de outra pessoa.
 */

type Props = {
  pessoa: PessoaIdentificada | null;
  onSair: () => void;
};

export function CabecalhoPortal({ pessoa, onSair }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
      {/* Import estático: largura e altura vêm do próprio arquivo. */}
      <Image
        src={logoUnoesc}
        alt="Unoesc"
        className="h-11 w-auto sm:h-12"
        priority
      />

      {pessoa ? (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-base leading-tight font-semibold text-tinta">
              {pessoa.nome}
            </p>
            <p className="numeros-tabulares text-sm text-tinta-suave">
              {pessoa.perfil === "PROFESSOR" ? "Professor" : "Aluno"} ·{" "}
              {pessoa.matricula}
            </p>
          </div>
          <Botao variante="fantasma" tamanho="pequeno" onClick={onSair}>
            Sair
          </Botao>
        </div>
      ) : (
        <p className="text-right text-sm leading-tight text-tinta-suave sm:text-base">
          Empréstimo de equipamentos
          <span className="block text-tinta-tenue">Secretaria</span>
        </p>
      )}
    </header>
  );
}
