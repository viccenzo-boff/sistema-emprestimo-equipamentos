"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { alterarStatusEquipamento, cadastrarEquipamento } from "@/app/admin/actions";
import { SeloStatus } from "@/components/admin/SeloStatus";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import {
  IconeCategoria,
  IconeCheck,
  IconeChevron,
  IconeFerramenta,
  IconeMais,
} from "@/components/ui/icones";
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

/** Valor de escape do `<select>`: abre o campo de texto para categoria nova. */
const NOVA_CATEGORIA = "__nova__";

/**
 * Cadastro de equipamento novo.
 *
 * O foco volta para a etiqueta depois de cada cadastro: quem chega com uma
 * caixa de dez notebooks digita dez vezes seguidas, e tirar a mão do teclado
 * para clicar no campo dez vezes é a diferença entre usar e não usar a tela.
 *
 * **A categoria é um `<select>`, não um campo de texto com `datalist`.** O
 * `datalist` parece um combo mas é um campo de texto com sugestões: depois de
 * escolher "Notebook", a lista só reabre quando o texto volta a casar com algo
 * — na prática, apagando a palavra à mão para trocar para "Tablet". Com o
 * `<select>`, um clique sempre abre as opções e um segundo troca.
 *
 * O `<select>` sozinho, porém, fecharia a porta para a categoria que ainda não
 * existe — e o servidor aceita categoria nova de propósito (é ele quem escolhe
 * a grafia). Por isso a última opção é "Nova categoria...", que troca o campo
 * por um `<input>` de texto com o mesmo `name`. Um `name` só: `FormData.get`
 * devolve o primeiro campo homônimo, então dois ao mesmo tempo mandariam o
 * valor errado sem avisar.
 */
function FormularioDeCadastro({ categorias }: { categorias: string[] }) {
  const [estado, cadastrar, pendente] = useActionState(cadastrarEquipamento, {
    fase: "inicial" as const,
  });

  const etiquetaRef = useRef<HTMLInputElement>(null);
  const categoriaNovaRef = useRef<HTMLInputElement>(null);

  // Inventário vazio não tem lista para escolher — o primeiro cadastro já
  // começa no campo de texto.
  const [digitandoCategoria, setDigitandoCategoria] = useState(
    categorias.length === 0,
  );
  const pediuCategoriaNova = useRef(false);

  /*
    O `<select>` é **não-controlado** de propósito.

    O React 19 limpa o formulário sozinho quando a action termina. Com um
    `<select>` controlado isso desencontra os dois lados: o DOM volta para o
    `defaultValue` e o React, que só reescreve o campo quando a prop muda,
    continua achando que o valor escolhido está lá. O próximo envio mandaria a
    categoria vazia — e o `FormData` lê o DOM, não o estado. Medido no
    navegador: depois de cadastrar TAB-99 com "Tablet" escolhido, o campo já
    aparecia em branco.

    Nada aqui precisa do valor em estado: o sentinela da categoria nova chega
    pelo próprio evento, e a volta para a lista remonta o `<select>`, que
    renasce no `defaultValue`.
  */
  useEffect(() => {
    if (estado.fase !== "sucesso") return;

    etiquetaRef.current?.focus();
  }, [estado]);

  // Só rouba o foco quando foi a secretaria que pediu o campo de texto — no
  // inventário vazio a tela abre nele por padrão, e aí o foco é da etiqueta.
  useEffect(() => {
    if (!digitandoCategoria || !pediuCategoriaNova.current) return;

    pediuCategoriaNova.current = false;
    categoriaNovaRef.current?.focus();
  }, [digitandoCategoria]);

  function escolherCategoria(valor: string) {
    if (valor !== NOVA_CATEGORIA) return;

    pediuCategoriaNova.current = true;
    setDigitandoCategoria(true);
  }

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
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="tipo" className="text-base font-semibold text-tinta">
              Categoria
            </label>

            {digitandoCategoria && categorias.length > 0 ? (
              <button
                type="button"
                onClick={() => setDigitandoCategoria(false)}
                className="rounded-lg text-sm font-semibold text-marca-azul underline decoration-marca-azul-claro underline-offset-4 hover:text-marca-azul-escuro"
              >
                Escolher da lista
              </button>
            ) : null}
          </div>

          {digitandoCategoria ? (
            <input
              ref={categoriaNovaRef}
              id="tipo"
              name="tipo"
              required
              maxLength={30}
              autoComplete="off"
              placeholder="Ex.: Projetor"
              className={CAMPO}
            />
          ) : (
            /*
              `appearance-none` apaga a seta nativa junto com o estilo do
              sistema, então ela volta desenhada aqui — e com `pointer-events-none`,
              para o clique atravessar e abrir a lista mesmo em cima do ícone.
            */
            <div className="relative">
              <select
                id="tipo"
                name="tipo"
                required
                defaultValue=""
                onChange={(evento) => escolherCategoria(evento.target.value)}
                className={`${CAMPO} cursor-pointer appearance-none pr-12`}
              >
                <option value="" disabled>
                  Selecione a categoria
                </option>

                {categorias.map((existente) => (
                  <option key={existente} value={existente}>
                    {existente}
                  </option>
                ))}

                <option value={NOVA_CATEGORIA}>Nova categoria...</option>
              </select>

              <IconeChevron className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-tinta-tenue" />
            </div>
          )}
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
