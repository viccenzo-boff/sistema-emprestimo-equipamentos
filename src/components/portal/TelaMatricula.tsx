"use client";

import { useRef } from "react";

import { TecladoNumerico } from "@/components/portal/TecladoNumerico";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";

/**
 * Passo 1 do Fluxo 1: identificação.
 *
 * O campo é um <input> de verdade (leitor de tela e teclado físico funcionam),
 * mas com inputMode="none" para o tablet não abrir o teclado do sistema por
 * cima do teclado desenhado logo abaixo.
 *
 * Layout: empilhado em retrato, duas colunas em paisagem. Empilhado nos dois
 * casos, a coluna passava de 800px de altura e o botão "Continuar" ficava
 * abaixo da dobra em um tablet deitado — o aluno via um teclado sem saída.
 */

type Props = {
  matricula: string;
  onMatriculaChange: (valor: string) => void;
  onEnviar: () => void;
  carregando: boolean;
  erro: { mensagem: string; detalhe?: string } | null;
};

/** A matrícula é String no banco (zeros à esquerda contam), mas só tem dígitos. */
const SOMENTE_DIGITOS = /\D/g;

export function TelaMatricula({
  matricula,
  onMatriculaChange,
  onEnviar,
  carregando,
  erro,
}: Props) {
  const campoRef = useRef<HTMLInputElement>(null);

  function digitar(digito: string) {
    onMatriculaChange((matricula + digito).slice(0, 15));
    campoRef.current?.focus();
  }

  return (
    <form
      className="animate-surgir mx-auto grid w-full max-w-md gap-6 lg:max-w-4xl lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-x-14"
      onSubmit={(evento) => {
        evento.preventDefault();
        onEnviar();
      }}
    >
      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-marca-azul">
            Retirada de equipamentos
          </h1>
          <p className="mt-2 text-lg text-tinta-suave">
            Digite a sua matrícula para começar.
          </p>
        </div>

        <div>
          <label
            htmlFor="matricula"
            className="mb-2 block text-sm font-semibold tracking-wide text-tinta-suave uppercase"
          >
            Matrícula
          </label>
          <input
            id="matricula"
            ref={campoRef}
            value={matricula}
            onChange={(evento) =>
              onMatriculaChange(
                evento.target.value.replace(SOMENTE_DIGITOS, "").slice(0, 15),
              )
            }
            inputMode="none"
            autoComplete="off"
            autoFocus
            disabled={carregando}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? "matricula-erro" : undefined}
            className={[
              // Sem placeholder de propósito: "0000000" em corpo 48px é
              // indistinguível de um valor já digitado. O rótulo acima e o
              // teclado ao lado já dizem o que fazer.
              "numeros-tabulares h-24 w-full rounded-2xl border-2 bg-superficie text-center",
              "text-5xl font-semibold tracking-[0.18em] text-tinta",
              "transition-colors duration-150 ease-out",
              "disabled:opacity-60",
              erro ? "border-erro-borda" : "border-borda-forte focus:border-marca-azul",
            ].join(" ")}
          />
        </div>

        {erro ? (
          <div id="matricula-erro">
            <Alerta tom="erro" mensagem={erro.mensagem} detalhe={erro.detalhe} />
          </div>
        ) : null}
      </div>

      {/*
        Em retrato o teclado vem antes do "Continuar" (a mão desce, digita e
        confirma); em paisagem ele ocupa a coluna da direita inteira, ao lado do
        campo, como em um terminal de balcão.
      */}
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <TecladoNumerico
          onDigito={digitar}
          onApagar={() => onMatriculaChange(matricula.slice(0, -1))}
          onLimpar={() => onMatriculaChange("")}
          desabilitado={carregando}
        />
      </div>

      <Botao
        type="submit"
        tamanho="grande"
        larguraTotal
        carregando={carregando}
        disabled={matricula.length === 0}
        className="lg:col-start-1 lg:row-start-2"
      >
        Continuar
      </Botao>
    </form>
  );
}
