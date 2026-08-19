"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { cadastrarCategoria, excluirCategoria } from "@/app/admin/actions";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeApagar, IconeCategoria, IconeMais } from "@/components/ui/icones";
import { Modal } from "@/components/ui/Modal";
import { Notificacao } from "@/components/ui/Notificacao";
import { plural } from "@/lib/texto";
import type { CategoriaDoPainel } from "@/lib/tipos";

/**
 * Gestão de Categorias (Tarefa 6).
 *
 * A tela existe para um problema concreto: enquanto a categoria era texto
 * digitado no cadastro de equipamento, "notebook", "Notebook" e "NOTEBOOK"
 * viravam três prateleiras no tablet, com um aparelho em cada. Com a tabela
 * `Categoria`, a grafia é decidida uma vez, aqui.
 *
 * **Categoria com equipamento não é excluída** — e quem recusa é o banco, pela
 * relação `onDelete: Restrict`. A contagem ao lado do nome antecipa a recusa
 * para a tela não oferecer um botão que só existiria para dar erro, mas a trava
 * de verdade está uma camada abaixo, onde ela não depende de a página estar
 * atualizada.
 */

type Props = {
  categorias: CategoriaDoPainel[];
};

export function GestaoCategorias({ categorias }: Props) {
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState<CategoriaDoPainel | null>(null);
  const [falha, setFalha] = useState<{ id: number; mensagem: string; detalhe?: string } | null>(
    null,
  );
  const [aviso, setAviso] = useState<string | null>(null);

  function excluir(categoria: CategoriaDoPainel) {
    if (excluindoId !== null) return;

    setExcluindoId(categoria.id);
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await excluirCategoria(categoria.id);

      if (!resultado.ok) {
        setFalha({
          id: categoria.id,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });

        // A linha na tela não corresponde mais ao banco: em vez de deixar a
        // secretaria clicando de novo, relê a lista com a contagem atual.
        router.refresh();
        setExcluindoId(null);
        return;
      }

      setAviso(`Categoria ${resultado.dados.nome} excluída.`);
      setConfirmando(null);
      setExcluindoId(null);
    });
  }

  return (
    <>
      <FormularioDeCategoria />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Categorias cadastradas
        </h2>

        {categorias.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-borda-forte bg-superficie p-8 text-center text-lg text-tinta-suave">
            Nenhuma categoria ainda. Cadastre a primeira acima — sem categoria não
            há como cadastrar equipamento.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-borda bg-superficie">
            <table className="w-full min-w-2xl border-collapse text-left">
              <caption className="sr-only">
                Categorias do inventário, na ordem em que aparecem no tablet
              </caption>

              <thead>
                <tr className="border-b border-borda">
                  <th scope="col" className={CABECALHO}>
                    Categoria
                  </th>
                  <th scope="col" className={CABECALHO}>
                    Equipamentos
                  </th>
                  <th scope="col" className={`${CABECALHO} text-right`}>
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {categorias.map((categoria) => {
                  const vazia = categoria.equipamentos === 0;

                  return (
                    <tr
                      key={categoria.id}
                      className="border-b border-borda last:border-b-0 hover:bg-superficie-2"
                    >
                      <td className={CELULA}>
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-marca-azul-tenue text-marca-azul">
                            <IconeCategoria
                              tipo={categoria.nome}
                              className="size-6"
                            />
                          </span>
                          <span>
                            <span className="block text-lg font-semibold text-tinta">
                              {categoria.nome}
                            </span>
                            <span className="block text-sm text-tinta-tenue">
                              No tablet: {plural(categoria.nome)}
                            </span>
                          </span>
                        </div>
                      </td>

                      <td className={CELULA}>
                        <span className="numeros-tabulares text-lg font-semibold text-tinta">
                          {categoria.equipamentos}
                        </span>
                        {vazia ? (
                          <span className="mt-1 block text-sm text-tinta-tenue">
                            Não aparece no tablet enquanto estiver vazia
                          </span>
                        ) : null}
                      </td>

                      <td className={`${CELULA} text-right`}>
                        {vazia ? (
                          <Botao
                            variante="fantasma"
                            tamanho="pequeno"
                            onClick={() => setConfirmando(categoria)}
                            disabled={
                              excluindoId !== null && excluindoId !== categoria.id
                            }
                            aria-label={`Excluir a categoria ${categoria.nome}`}
                          >
                            <IconeApagar className="size-5" />
                            Excluir
                          </Botao>
                        ) : (
                          /*
                            Não é um botão apagado: a pergunta de quem olha é
                            "por que não dá?", e a resposta cabe onde o botão
                            estaria. Mesmo padrão da linha travada do inventário.
                          */
                          <span className="text-sm text-tinta-tenue">
                            {categoria.equipamentos === 1
                              ? "1 equipamento vinculado"
                              : `${categoria.equipamentos} equipamentos vinculados`}
                          </span>
                        )}

                        {falha?.id === categoria.id ? (
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
        )}

        <p className="px-1 text-base text-tinta-tenue">
          A ordem desta lista é a ordem em que as categorias aparecem no tablet e
          no inventário. Só é possível excluir uma categoria sem nenhum equipamento vinculado à ela.
        </p>
      </section>

      <ModalDeExclusao
        categoria={confirmando}
        excluindo={excluindoId !== null}
        onCancelar={() => setConfirmando(null)}
        onConfirmar={excluir}
      />

      <Notificacao mensagem={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

/**
 * Confirmação de exclusão.
 *
 * A categoria está vazia — o banco não perde nada — mas o gesto ainda merece
 * uma pergunta: o botão fica na mesma linha do de outra categoria, e a lista é
 * varrida com o dedo em um notebook pequeno.
 */
function ModalDeExclusao({
  categoria,
  excluindo,
  onCancelar,
  onConfirmar,
}: {
  categoria: CategoriaDoPainel | null;
  excluindo: boolean;
  onCancelar: () => void;
  onConfirmar: (categoria: CategoriaDoPainel) => void;
}) {
  if (!categoria) return null;

  return (
    <Modal
      aberto
      titulo="Excluir categoria"
      bloqueado={excluindo}
      onFechar={onCancelar}
      acoes={
        <>
          <Botao
            variante="secundario"
            onClick={onCancelar}
            disabled={excluindo}
            className="sm:min-w-40"
          >
            Cancelar
          </Botao>
          <Botao
            onClick={() => onConfirmar(categoria)}
            carregando={excluindo}
            className="sm:min-w-40"
          >
            <IconeApagar className="size-5" />
            Excluir
          </Botao>
        </>
      }
    >
      <p>
        A categoria <strong className="text-tinta">{categoria.nome}</strong> será
        removida do sistema. Ela está vazia, então nenhum equipamento é afetado.
      </p>
    </Modal>
  );
}

/**
 * Cadastro de categoria: um campo e um botão, como pede a tarefa.
 *
 * O foco volta para o campo depois de cada cadastro, pelo mesmo motivo do
 * cadastro de equipamento: quem abre esta tela costuma criar duas ou três
 * categorias de uma vez, e não uma.
 */
function FormularioDeCategoria() {
  const [estado, cadastrar, pendente] = useActionState(cadastrarCategoria, {
    fase: "inicial" as const,
  });

  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.fase !== "sucesso") return;

    campoRef.current?.focus();
  }, [estado]);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-borda bg-superficie p-6 lg:p-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Cadastrar categoria
        </h2>
        <p className="mt-1 text-base text-tinta-suave">
          Escreva no singular, como aparece na linha do equipamento — o tablet põe o
          plural sozinho. Ex.: Projetor, Microfone...
        </p>
      </div>

      <form
        action={cadastrar}
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="nome" className="text-base font-semibold text-tinta">
            Nome
          </label>
          <input
            ref={campoRef}
            id="nome"
            name="nome"
            required
            maxLength={30}
            autoComplete="off"
            placeholder="Projetor"
            className={CAMPO}
          />
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
