"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { alterarStatusEquipamento, cadastrarEquipamento } from "@/app/admin/actions";
import { SeloStatus } from "@/components/admin/SeloStatus";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeCategoria, IconeCheck, IconeFerramenta, IconeMais } from "@/components/ui/icones";
import { Notificacao } from "@/components/ui/Notificacao";
import {
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  type ItemDeInventario,
} from "@/lib/tipos";

/**
 * Gestão de Inventário (spec, seção 4, Fluxo 3, item 2): cadastrar equipamento
 * e tirá-lo de circulação — ou trazê-lo de volta.
 *
 * A tela oferece só a alternância `DISPONIVEL` <-> `MANUTENCAO`. `EMPRESTADO`
 * não é um botão porque não é uma decisão da secretaria: quem coloca é a
 * retirada no tablet, quem tira é a confirmação de recebimento. Uma linha com
 * empréstimo aberto mostra o nome de quem está com o item, em vez de um botão
 * apagado sem explicação — a pergunta seguinte de quem olha é sempre "com
 * quem?", e a resposta já está ali.
 *
 * A mesma regra vale no servidor, onde ela realmente vale
 * ([actions](src/app/admin/actions.ts)): esta tela é conveniência, não barreira.
 */

type Props = {
  itens: ItemDeInventario[];
  /** Categorias já existentes, para o campo sugerir em vez de exigir memória. */
  categorias: string[];
};

type Falha = { id: string; mensagem: string; detalhe?: string };

export function GestaoInventario({ itens, categorias }: Props) {
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [alterandoId, setAlterandoId] = useState<string | null>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function alternarSituacao(item: ItemDeInventario) {
    if (alterandoId !== null) return;

    const destino =
      item.status === STATUS_EQUIPAMENTO.disponivel
        ? STATUS_EQUIPAMENTO.manutencao
        : STATUS_EQUIPAMENTO.disponivel;

    setAlterandoId(item.id);
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await alterarStatusEquipamento(item.id, destino);

      if (!resultado.ok) {
        setFalha({
          id: item.id,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });

        // A linha na tela não corresponde mais ao banco: relê em vez de deixar
        // a secretaria clicando em um botão que não pode dar certo.
        if (
          resultado.motivo === "EQUIPAMENTO_EM_USO" ||
          resultado.motivo === "STATUS_INVALIDO" ||
          resultado.motivo === "EQUIPAMENTO_NAO_ENCONTRADO"
        ) {
          router.refresh();
        }

        setAlterandoId(null);
        return;
      }

      setAviso(
        destino === STATUS_EQUIPAMENTO.manutencao
          ? `${item.id} foi para manutenção e saiu da lista do tablet.`
          : `${item.id} está disponível para retirada.`,
      );

      setAlterandoId(null);
    });
  }

  return (
    <>
      <FormularioDeCadastro categorias={categorias} />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Equipamentos
        </h2>

        <div className="overflow-x-auto rounded-3xl border border-borda bg-superficie">
          <table className="w-full min-w-3xl border-collapse text-left">
            <caption className="sr-only">
              Inventário completo, agrupado por categoria
            </caption>

            <thead>
              <tr className="border-b border-borda">
                <th scope="col" className={CABECALHO}>
                  Equipamento
                </th>
                <th scope="col" className={CABECALHO}>
                  Situação
                </th>
                <th scope="col" className={`${CABECALHO} text-right`}>
                  Ação
                </th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item) => {
                const emCiclo = item.responsavel !== null;
                const disponivel = item.status === STATUS_EQUIPAMENTO.disponivel;

                return (
                  <tr
                    key={item.id}
                    className="border-b border-borda last:border-b-0 hover:bg-superficie-2"
                  >
                    <td className={CELULA}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-marca-azul-tenue text-marca-azul">
                          <IconeCategoria tipo={item.tipo} className="size-6" />
                        </span>
                        <span>
                          <span className="block font-mono text-lg font-bold tracking-tight text-tinta">
                            {item.id}
                          </span>
                          <span className="block text-sm text-tinta-suave">
                            {item.tipo}
                          </span>
                        </span>
                      </div>
                    </td>

                    <td className={CELULA}>
                      <SeloStatus status={item.status} />
                      {item.responsavel ? (
                        <span className="mt-1.5 block text-sm text-tinta-suave">
                          {item.responsavel.status === STATUS_EMPRESTIMO.aguardandoBaixa
                            ? `Devolução informada por ${item.responsavel.nome} — aguarda conferência`
                            : `Com ${item.responsavel.nome}`}
                        </span>
                      ) : null}
                    </td>

                    <td className={`${CELULA} text-right`}>
                      {emCiclo ? (
                        <span className="text-sm text-tinta-tenue">
                          Situação travada até a devolução
                        </span>
                      ) : (
                        <Botao
                          variante="secundario"
                          tamanho="pequeno"
                          onClick={() => alternarSituacao(item)}
                          carregando={alterandoId === item.id}
                          disabled={alterandoId !== null && alterandoId !== item.id}
                          aria-label={
                            disponivel
                              ? `Enviar ${item.id} para manutenção`
                              : `Marcar ${item.id} como disponível`
                          }
                        >
                          {disponivel ? (
                            <>
                              <IconeFerramenta className="size-5" />
                              Enviar para manutenção
                            </>
                          ) : (
                            <>
                              <IconeCheck className="size-5" />
                              Marcar como disponível
                            </>
                          )}
                        </Botao>
                      )}

                      {falha?.id === item.id ? (
                        <Alerta
                          tom="erro"
                          mensagem={falha.mensagem}
                          detalhe={falha.detalhe}
                          className="mt-3 text-left"
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="px-1 text-base text-tinta-tenue">
          Equipamento em manutenção não aparece no tablet — é assim que um aparelho
          com defeito para de ser oferecido sem sair do inventário.
        </p>
      </section>

      <Notificacao mensagem={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

/**
 * Cadastro de equipamento novo.
 *
 * O foco volta para a etiqueta depois de cada cadastro: quem chega com uma
 * caixa de dez notebooks digita dez vezes seguidas, e tirar a mão do teclado
 * para clicar no campo dez vezes é a diferença entre usar e não usar a tela.
 */
function FormularioDeCadastro({ categorias }: { categorias: string[] }) {
  const [estado, cadastrar, pendente] = useActionState(cadastrarEquipamento, {
    fase: "inicial" as const,
  });

  const formularioRef = useRef<HTMLFormElement>(null);
  const etiquetaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.fase !== "sucesso") return;

    formularioRef.current?.reset();
    etiquetaRef.current?.focus();
  }, [estado]);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-borda bg-superficie p-6 lg:p-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Cadastrar equipamento
        </h2>
        <p className="mt-1 text-base text-tinta-suave">
          A etiqueta é o número colado no aparelho e não se repete. O item entra
          como disponível.
        </p>
      </div>

      <form
        ref={formularioRef}
        action={cadastrar}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="etiqueta" className="text-base font-semibold text-tinta">
            Etiqueta
          </label>
          <input
            ref={etiquetaRef}
            id="etiqueta"
            name="etiqueta"
            required
            maxLength={24}
            autoComplete="off"
            spellCheck={false}
            placeholder="NOTE-11"
            className={`${CAMPO} font-mono uppercase`}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="tipo" className="text-base font-semibold text-tinta">
            Categoria
          </label>
          <input
            id="tipo"
            name="tipo"
            required
            maxLength={30}
            autoComplete="off"
            list="categorias-existentes"
            placeholder="Notebook"
            className={CAMPO}
          />
          <datalist id="categorias-existentes">
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria} />
            ))}
          </datalist>
        </div>

        <Botao type="submit" carregando={pendente} className="sm:shrink-0">
          <IconeMais className="size-5" />
          Cadastrar
        </Botao>
      </form>

      {estado.fase === "erro" ? (
        <Alerta tom="erro" mensagem={estado.mensagem} detalhe={estado.detalhe} />
      ) : null}

      {estado.fase === "sucesso" ? (
        <Alerta tom="sucesso" mensagem={estado.mensagem} />
      ) : null}
    </section>
  );
}

const CABECALHO =
  "px-5 py-4 text-sm font-semibold tracking-wide text-tinta-tenue uppercase";
const CELULA = "px-5 py-4 align-middle";
const CAMPO = [
  "min-h-14 w-full rounded-2xl border-2 border-borda bg-superficie-2 px-4",
  "text-lg text-tinta placeholder:text-tinta-tenue",
  "transition-colors duration-150",
  "hover:border-borda-forte focus:border-marca-azul focus:bg-superficie",
].join(" ");
