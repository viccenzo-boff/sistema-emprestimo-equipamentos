"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type SelectHTMLAttributes,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  alterarStatusEquipamento,
  cadastrarEquipamento,
  renomearEtiqueta,
} from "@/app/admin/actions";
import { SeloStatus } from "@/components/admin/SeloStatus";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import {
  IconeBloquear,
  IconeCaixa,
  IconeCategoria,
  IconeCheck,
  IconeChevron,
  IconeFerramenta,
  IconeLapis,
  IconeLupa,
  IconeMais,
  IconeRestaurar,
} from "@/components/ui/icones";
import { Modal } from "@/components/ui/Modal";
import { Notificacao } from "@/components/ui/Notificacao";
import { semAcento } from "@/lib/texto";
import {
  STATUS_EMPRESTIMO,
  STATUS_EQUIPAMENTO,
  type ItemDeInventario,
  type OpcaoDeCategoria,
} from "@/lib/tipos";

/**
 * Gestão de Inventário (spec, seção 4, Fluxo 3, item 2; ampliada na Tarefa 6):
 * cadastrar equipamento, trocar a etiqueta, tirar de circulação e aposentar.
 *
 * A tela oferece três destinos — `DISPONIVEL`, `MANUTENCAO` e `INATIVO`.
 * `EMPRESTADO` não é um botão porque não é uma decisão da secretaria: quem
 * coloca é a retirada no tablet, quem tira é a confirmação de recebimento. Uma
 * linha com empréstimo aberto mostra o nome de quem está com o item, em vez de
 * um botão apagado sem explicação — a pergunta seguinte de quem olha é sempre
 * "com quem?", e a resposta já está ali.
 *
 * As mesmas regras valem no servidor, onde elas realmente valem
 * ([actions](src/app/admin/actions.ts)): esta tela é conveniência, não barreira.
 * Aqui a tabela de transições aparece só como "quais botões esta linha tem".
 */

type Props = {
  itens: ItemDeInventario[];
  /** Categorias cadastradas, para o `<select>` do formulário. */
  categorias: OpcaoDeCategoria[];
};

type Falha = { id: string; mensagem: string; detalhe?: string };

/**
 * O que está em voo agora.
 *
 * É um objeto, e não um `id` solto, porque a linha passou a ter mais de um
 * botão: sem saber *qual* ação está rodando, o spinner apareceria no botão
 * errado da linha certa.
 */
type EmAndamento = { id: string; acao: "situacao" | "etiqueta" } | null;

export function GestaoInventario({ itens, categorias }: Props) {
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [emAndamento, setEmAndamento] = useState<EmAndamento>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [editando, setEditando] = useState<ItemDeInventario | null>(null);
  const [inativando, setInativando] = useState<ItemDeInventario | null>(null);

  // Os três filtros da Tarefa 7. String vazia é "sem filtro" nos três, para
  // "está filtrando?" ser uma pergunta só, e não três perguntas de tipos
  // diferentes.
  const [busca, setBusca] = useState("");
  const [categoriaFiltrada, setCategoriaFiltrada] = useState("");
  const [statusFiltrado, setStatusFiltrado] = useState("");

  const ocupado = emAndamento !== null;

  const termo = semAcento(busca.trim());
  const filtrando =
    termo !== "" || categoriaFiltrada !== "" || statusFiltrado !== "";

  function limparFiltros() {
    setBusca("");
    setCategoriaFiltrada("");
    setStatusFiltrado("");
  }

  /*
    A filtragem é no cliente, sobre os itens que já chegaram no render.

    A spec deixava a escolha entre isto e `searchParams` no servidor. O
    inventário inteiro cabe em um render (22 itens hoje, e a secretaria compra
    aparelho por caixa, não por milhar), a página já é `force-dynamic` e este
    componente já é ilha de cliente com a lista inteira na mão. Pelo servidor,
    cada tecla digitada custaria uma ida ao Next — no computador da própria
    secretaria, com o banco SQLite ao lado, mas ainda assim um render inteiro do
    Server Component por caractere, e a lista piscando enquanto se digita.

    A troca é que os filtros não sobrevivem ao F5 nem entram no histórico do
    navegador. Para uma tela operada de pé, em uma sessão, isso não é perda:
    ninguém compartilha link de inventário filtrado, e o `router.refresh()` que
    as ações disparam preserva o estado do cliente — o filtro continua lá depois
    de mandar um item para manutenção, que é justamente quando ele importa.
  */
  const visiveis = useMemo(() => {
    const comFalha = falha?.id ?? null;

    return itens.filter((item) => {
      /*
        A linha que está exibindo um erro nunca é escondida por filtro.

        O `Alerta` da falha mora dentro da própria linha, e `relerSeDesencontrou`
        relê o banco quando a tela e o banco discordam — a releitura pode trocar
        o status do item para um que o filtro exclui. Sem esta saída, o pedido
        falharia, a linha sumiria levando a explicação junto, e a secretaria
        veria o clique não fazer nada.
      */
      if (item.id === comFalha) return true;

      if (categoriaFiltrada !== "" && item.tipo !== categoriaFiltrada) return false;
      if (statusFiltrado !== "" && item.status !== statusFiltrado) return false;
      if (termo === "") return true;

      // Etiqueta e categoria, que é o que a spec pede — e é o que está escrito
      // na linha. `semAcento` nos dois lados: quem digita "extensao" com pressa
      // procura a mesma coisa que quem digita "Extensão".
      return (
        semAcento(item.id).includes(termo) || semAcento(item.tipo).includes(termo)
      );
    });
  }, [itens, termo, categoriaFiltrada, statusFiltrado, falha?.id]);

  /**
   * A linha na tela não corresponde mais ao banco: relê em vez de deixar a
   * secretaria clicando em um botão que não pode dar certo.
   */
  function relerSeDesencontrou(motivo: string) {
    if (
      motivo === "EQUIPAMENTO_EM_USO" ||
      motivo === "STATUS_INVALIDO" ||
      motivo === "EQUIPAMENTO_NAO_ENCONTRADO"
    ) {
      router.refresh();
    }
  }

  function moverPara(item: ItemDeInventario, destino: string) {
    if (ocupado) return;

    setEmAndamento({ id: item.id, acao: "situacao" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await alterarStatusEquipamento(item.id, destino);

      if (!resultado.ok) {
        setFalha({
          id: item.id,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        relerSeDesencontrou(resultado.motivo);
        setEmAndamento(null);
        return;
      }

      setAviso(avisoDaMudanca(item, destino));
      setInativando(null);
      setEmAndamento(null);
    });
  }

  function trocarEtiqueta(item: ItemDeInventario, nova: string) {
    if (ocupado) return;

    setEmAndamento({ id: item.id, acao: "etiqueta" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await renomearEtiqueta(item.id, nova);

      if (!resultado.ok) {
        setFalha({
          id: item.id,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        relerSeDesencontrou(resultado.motivo);
        setEmAndamento(null);
        return;
      }

      const { de, para } = resultado.dados;

      setAviso(
        de === para
          ? `${de} continua com a mesma etiqueta.`
          : `${de} agora é ${para}. O histórico de empréstimos foi junto.`,
      );
      setEditando(null);
      setEmAndamento(null);
    });
  }

  return (
    <>
      <FormularioDeCadastro categorias={categorias} />

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Equipamentos
        </h2>

        <BarraDeFiltros
          categorias={categorias}
          busca={busca}
          categoriaFiltrada={categoriaFiltrada}
          statusFiltrado={statusFiltrado}
          onBusca={setBusca}
          onCategoria={setCategoriaFiltrada}
          onStatus={setStatusFiltrado}
        />

        <div className="overflow-x-auto rounded-3xl border border-borda bg-superficie">
          <table className="w-full min-w-4xl border-collapse text-left">
            <caption className="sr-only">
              {filtrando
                ? "Equipamentos que correspondem à busca e aos filtros, agrupados por categoria"
                : "Inventário completo, agrupado por categoria"}
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
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {visiveis.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-16">
                    <EstadoVazio
                      inventarioVazio={itens.length === 0}
                      onLimpar={limparFiltros}
                    />
                  </td>
                </tr>
              ) : null}

              {visiveis.map((item) => {
                const emCiclo = item.responsavel !== null;
                const disponivel = item.status === STATUS_EQUIPAMENTO.disponivel;
                const emManutencao = item.status === STATUS_EQUIPAMENTO.manutencao;
                const inativo = item.status === STATUS_EQUIPAMENTO.inativo;

                // Um botão só fica preso quando *outra* linha está trabalhando:
                // na própria linha o spinner já diz o que está acontecendo.
                const travado = ocupado && emAndamento?.id !== item.id;

                return (
                  <tr
                    key={item.id}
                    className={[
                      "border-b border-borda last:border-b-0 hover:bg-superficie-2",
                      // Inativo pesa menos na varredura: continua legível, mas
                      // não disputa atenção com o que ainda circula.
                      inativo ? "bg-superficie-2/60" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <td className={CELULA}>
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "flex size-10 shrink-0 items-center justify-center rounded-xl",
                            inativo
                              ? "bg-superficie-2 text-tinta-tenue"
                              : "bg-marca-azul-tenue text-marca-azul",
                          ].join(" ")}
                        >
                          <IconeCategoria tipo={item.tipo} className="size-6" />
                        </span>
                        <span>
                          <span
                            className={[
                              "block font-mono text-lg font-bold tracking-tight",
                              inativo ? "text-tinta-suave" : "text-tinta",
                            ].join(" ")}
                          >
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
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {/*
                            Editar só em DISPONIVEL, e a regra é do negócio: o
                            adesivo é trocado com o aparelho na mão, na bancada.
                          */}
                          {disponivel ? (
                            <Botao
                              variante="secundario"
                              tamanho="pequeno"
                              onClick={() => setEditando(item)}
                              disabled={travado}
                              aria-label={`Trocar a etiqueta de ${item.id}`}
                            >
                              <IconeLapis className="size-5" />
                              Editar
                            </Botao>
                          ) : null}

                          {disponivel ? (
                            <Botao
                              variante="secundario"
                              tamanho="pequeno"
                              onClick={() =>
                                moverPara(item, STATUS_EQUIPAMENTO.manutencao)
                              }
                              carregando={
                                emAndamento?.id === item.id &&
                                emAndamento.acao === "situacao"
                              }
                              disabled={travado}
                              aria-label={`Enviar ${item.id} para manutenção`}
                            >
                              <IconeFerramenta className="size-5" />
                              Manutenção
                            </Botao>
                          ) : null}

                          {emManutencao ? (
                            <Botao
                              variante="secundario"
                              tamanho="pequeno"
                              onClick={() =>
                                moverPara(item, STATUS_EQUIPAMENTO.disponivel)
                              }
                              carregando={
                                emAndamento?.id === item.id &&
                                emAndamento.acao === "situacao"
                              }
                              disabled={travado}
                              aria-label={`Marcar ${item.id} como disponível`}
                            >
                              <IconeCheck className="size-5" />
                              Disponível
                            </Botao>
                          ) : null}

                          {disponivel || emManutencao ? (
                            <Botao
                              variante="fantasma"
                              tamanho="pequeno"
                              onClick={() => setInativando(item)}
                              disabled={travado}
                              aria-label={`Inativar ${item.id}`}
                            >
                              <IconeBloquear className="size-5" />
                              Inativar
                            </Botao>
                          ) : null}

                          {inativo ? (
                            <Botao
                              variante="secundario"
                              tamanho="pequeno"
                              onClick={() =>
                                moverPara(item, STATUS_EQUIPAMENTO.disponivel)
                              }
                              carregando={
                                emAndamento?.id === item.id &&
                                emAndamento.acao === "situacao"
                              }
                              disabled={travado}
                              aria-label={`Reativar ${item.id}`}
                            >
                              <IconeRestaurar className="size-5" />
                              Reativar
                            </Botao>
                          ) : null}
                        </div>
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

        {/*
          O resultado da busca é anunciado daqui, e não da linha visível abaixo:
          a região precisa já existir no DOM quando o texto muda, senão o leitor
          de tela não fala — e a linha visível some sempre que não há filtro. É
          `sr-only`, ou seja, posicionada em absoluto: não vira item do flex e
          não abre um vão entre a tabela e o texto de rodapé.
        */}
        <p role="status" className="sr-only">
          {filtrando
            ? `${visiveis.length} de ${itens.length} equipamentos correspondem aos filtros.`
            : ""}
        </p>

        <div className="flex flex-col gap-3 px-1">
          {/*
            A contagem existe por causa do cadastro: com um filtro ativo, um
            equipamento novo que não casa com ele é cadastrado de verdade e não
            aparece na tabela. O alerta verde diz "cadastrado", a tabela não
            mostra, e sem esta linha a conclusão razoável é que falhou. Com ela,
            o "de 22" cresce na mesma hora e explica onde o item foi parar.

            Fora de filtro a linha some: "Mostrando 22 de 22" é ruído, e o total
            já está dito nos cartões do topo.
          */}
          {filtrando && visiveis.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base text-tinta-suave">
                Mostrando{" "}
                <span className="numeros-tabulares font-semibold text-tinta">
                  {visiveis.length}
                </span>{" "}
                de <span className="numeros-tabulares">{itens.length}</span>{" "}
                {itens.length === 1 ? "equipamento" : "equipamentos"}.
              </p>

              <Botao variante="fantasma" tamanho="pequeno" onClick={limparFiltros}>
                Limpar filtros
              </Botao>
            </div>
          ) : null}

          <p className="text-base text-tinta-tenue">
            Equipamento em manutenção não aparece no tablet — é assim que um
            aparelho com defeito para de ser oferecido sem sair do inventário.
            Inativo é a aposentadoria: some do tablet para sempre, mas continua
            aqui para o histórico de empréstimos não ficar apontando para o vazio.
          </p>
        </div>
      </section>

      <ModalDeEtiqueta
        item={editando}
        salvando={emAndamento?.acao === "etiqueta"}
        onCancelar={() => setEditando(null)}
        onSalvar={trocarEtiqueta}
      />

      <ModalDeInativacao
        item={inativando}
        inativando={emAndamento?.acao === "situacao"}
        onCancelar={() => setInativando(null)}
        onConfirmar={(item) => moverPara(item, STATUS_EQUIPAMENTO.inativo)}
      />

      <Notificacao mensagem={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

/** O aviso do rodapé, que muda com o destino — e com de onde o item veio. */
function avisoDaMudanca(item: ItemDeInventario, destino: string): string {
  if (destino === STATUS_EQUIPAMENTO.manutencao) {
    return `${item.id} foi para manutenção e saiu da lista do tablet.`;
  }

  if (destino === STATUS_EQUIPAMENTO.inativo) {
    return `${item.id} foi inativado e não será mais oferecido para empréstimo.`;
  }

  // Mesmo destino, dois gestos diferentes: "voltou do conserto" e "voltou da
  // aposentadoria" não são a mesma notícia para quem clicou.
  return item.status === STATUS_EQUIPAMENTO.inativo
    ? `${item.id} voltou ao inventário e está disponível para retirada.`
    : `${item.id} está disponível para retirada.`;
}

/**
 * Busca e filtros da tabela (Tarefa 7).
 *
 * Fica **entre o `h2` e a tabela**, e não no topo da página junto dos cartões:
 * um controle que muda o que a tabela mostra pertence à tabela. Encostado no
 * resumo, ele pareceria filtrar também as contagens — que continuam sendo do
 * inventário inteiro, de propósito: a pergunta "sobra notebook para hoje?" não
 * pode mudar de resposta porque alguém deixou um filtro posto.
 *
 * Os três controles são **controlados** (`value` + `onChange`), ao contrário do
 * `<select>` do cadastro logo acima, que é não-controlado por obrigação. Não é
 * incoerência: aquele vive dentro de um `<form action>` que o React 19 limpa
 * sozinho quando a action termina, e o valor é lido do DOM pelo `FormData`.
 * Estes não são enviados a lugar nenhum — o estado deles *é* o filtro.
 */
function BarraDeFiltros({
  categorias,
  busca,
  categoriaFiltrada,
  statusFiltrado,
  onBusca,
  onCategoria,
  onStatus,
}: {
  categorias: OpcaoDeCategoria[];
  busca: string;
  categoriaFiltrada: string;
  statusFiltrado: string;
  onBusca: (valor: string) => void;
  onCategoria: (valor: string) => void;
  onStatus: (valor: string) => void;
}) {
  return (
    <div role="search" className="flex flex-col gap-3 lg:flex-row">
      <div className="relative lg:flex-1">
        <label htmlFor="busca-no-inventario" className="sr-only">
          Buscar equipamento por etiqueta ou categoria
        </label>

        <IconeLupa className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-tinta-tenue" />

        <input
          id="busca-no-inventario"
          type="search"
          value={busca}
          onChange={(evento) => onBusca(evento.target.value)}
          placeholder="Buscar por etiqueta ou categoria..."
          autoComplete="off"
          spellCheck={false}
          className={`${CAMPO_SEM_LADOS} pr-4 pl-12`}
        />
      </div>

      {/*
        A largura é medida, não estimada: com 26rem os dois seletores cortavam o
        próprio rótulo ("Todas as catego…"), porque cada um fica com metade da
        faixa menos os 48px que a seta ocupa à direita. Com 34rem, medido no
        navegador em 1440, 1280 e 1024px: 198px de espaço útil para "Todas as
        categorias", que ocupa 162px — 36px de folga, e a maior opção de
        situação ("Todas as situações", 156px) sobra 42px.
      */}
      <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem] lg:shrink-0">
        {/*
          As opções vêm da tabela `Categoria`, pela mesma consulta que alimenta o
          cadastro — não de um `map` sobre os itens já carregados. Derivar dos
          itens faria a categoria recém-criada, ainda sem equipamento, sumir da
          lista; e faria a opção desaparecer justamente quando o filtro anterior
          esvaziou a tabela, prendendo quem filtrou.

          O valor é o **nome**, e não o id, porque é o nome que a linha carrega
          (`ItemDeInventario.tipo`). Dá no mesmo: `Categoria.nome` é UNIQUE no
          banco — conferido no índice `Categoria_nome_key`, não só no schema.
        */}
        <Selecao
          aria-label="Filtrar por categoria"
          value={categoriaFiltrada}
          onChange={(evento) => onCategoria(evento.target.value)}
        >
          <option value="">Todas as categorias</option>

          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.nome}>
              {categoria.nome}
            </option>
          ))}
        </Selecao>

        <Selecao
          aria-label="Filtrar por situação"
          value={statusFiltrado}
          onChange={(evento) => onStatus(evento.target.value)}
        >
          <option value="">Todas as situações</option>

          {SITUACOES.map((situacao) => (
            <option key={situacao.valor} value={situacao.valor}>
              {situacao.rotulo}
            </option>
          ))}
        </Selecao>
      </div>
    </div>
  );
}

/**
 * As opções do filtro de situação, na ordem em que um equipamento as vive:
 * disponível, emprestado, em conserto, aposentado.
 *
 * `EMPRESTADO` entra aqui mesmo não sendo um botão de ação — filtrar não é
 * mudar. É a única forma de responder "o que está fora agora?" sem trocar de
 * aba, e a coluna Situação já distingue quem está com o item de quem só
 * declarou a devolução.
 */
const SITUACOES = [
  { valor: STATUS_EQUIPAMENTO.disponivel, rotulo: "Disponível" },
  { valor: STATUS_EQUIPAMENTO.emprestado, rotulo: "Emprestado" },
  { valor: STATUS_EQUIPAMENTO.manutencao, rotulo: "Manutenção" },
  { valor: STATUS_EQUIPAMENTO.inativo, rotulo: "Inativo" },
] as const;

/**
 * `<select>` com a seta desenhada por nós.
 *
 * `appearance-none` apaga a seta nativa junto com o estilo do sistema, então
 * ela volta aqui — e com `pointer-events-none`, para o clique atravessar e
 * abrir a lista mesmo em cima do ícone. Virou componente quando o terceiro
 * `<select>` da tela apareceu: três cópias do mesmo `<div className="relative">`
 * é onde uma delas começa a divergir das outras.
 */
function Selecao({ children, ...resto }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${CAMPO_SEM_LADOS} cursor-pointer appearance-none pr-12 pl-4`}
        {...resto}
      >
        {children}
      </select>

      <IconeChevron className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-tinta-tenue" />
    </div>
  );
}

/**
 * A tabela sem nenhuma linha para mostrar.
 *
 * São dois casos com a mesma aparência e conselhos opostos, e confundi-los é o
 * que faz uma tela parecer quebrada: **não há equipamento nenhum** (a resposta
 * é o formulário acima) e **os filtros não acharam nada** (a resposta é desfazer
 * os filtros). Sem o botão, a saída do segundo caso é lembrar quais dos três
 * controles estão postos e zerar um por um — e o filtro esquecido em outra aba
 * é exatamente o que faz alguém concluir que o inventário sumiu.
 */
function EstadoVazio({
  inventarioVazio,
  onLimpar,
}: {
  inventarioVazio: boolean;
  onLimpar: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-superficie-2 text-tinta-tenue">
        {inventarioVazio ? (
          <IconeCaixa className="size-8" />
        ) : (
          <IconeLupa className="size-8" />
        )}
      </span>

      <div>
        <p className="text-xl font-semibold tracking-tight text-tinta">
          {inventarioVazio
            ? "Nenhum equipamento cadastrado"
            : "Nenhum equipamento encontrado com estes filtros."}
        </p>
        <p className="mt-2 text-base text-tinta-suave">
          {inventarioVazio
            ? "Cadastre o primeiro no formulário acima — é ele que faz a categoria aparecer no tablet."
            : "Tente outra etiqueta ou categoria, ou volte a ver o inventário inteiro."}
        </p>
      </div>

      {inventarioVazio ? null : (
        <Botao variante="secundario" tamanho="pequeno" onClick={onLimpar}>
          Limpar filtros
        </Botao>
      )}
    </div>
  );
}

/**
 * Troca de etiqueta.
 *
 * O campo já vem com a etiqueta atual selecionada: quem abre este modal quase
 * sempre vai digitar um código inteiro novo, não emendar uma letra.
 *
 * O `<form>` existe para o Enter funcionar — é um campo só, e obrigar o mouse
 * até o botão em um formulário de um campo é a definição de atrito.
 */
function ModalDeEtiqueta({
  item,
  salvando,
  onCancelar,
  onSalvar,
}: {
  item: ItemDeInventario | null;
  salvando: boolean;
  onCancelar: () => void;
  onSalvar: (item: ItemDeInventario, nova: string) => void;
}) {
  const campoRef = useRef<HTMLInputElement>(null);

  /*
    O foco vem depois do `showModal()`, não antes.

    O <dialog> nativo move o foco para o primeiro elemento focável quando abre,
    e o `showModal()` roda no efeito do `Modal` — ou seja, depois dos efeitos
    dos filhos. Um `focus()` daqui seria desfeito um instante depois. O
    `requestAnimationFrame` cai no quadro seguinte, quando o diálogo já abriu, e
    aí o `select()` pega.
  */
  useEffect(() => {
    if (!item) return;

    const quadro = requestAnimationFrame(() => campoRef.current?.select());
    return () => cancelAnimationFrame(quadro);
  }, [item]);

  if (!item) return null;

  const idDoCampo = "nova-etiqueta";

  return (
    <Modal
      aberto
      titulo="Trocar a etiqueta"
      bloqueado={salvando}
      onFechar={onCancelar}
      acoes={
        <>
          <Botao
            variante="secundario"
            onClick={onCancelar}
            disabled={salvando}
            className="sm:min-w-40"
          >
            Cancelar
          </Botao>
          <Botao
            type="submit"
            form="formulario-da-etiqueta"
            carregando={salvando}
            className="sm:min-w-40"
          >
            Salvar
          </Botao>
        </>
      }
    >
      <form
        id="formulario-da-etiqueta"
        onSubmit={(evento) => {
          evento.preventDefault();
          const valor = new FormData(evento.currentTarget).get("nova_etiqueta");
          onSalvar(item, String(valor ?? ""));
        }}
        className="flex flex-col gap-4"
      >
        <p>
          O equipamento é o mesmo — muda só o código do adesivo. Todos os
          empréstimos dele, abertos e concluídos, acompanham a troca.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor={idDoCampo} className="text-base font-semibold text-tinta">
            Nova etiqueta
          </label>
          <input
            ref={campoRef}
            id={idDoCampo}
            name="nova_etiqueta"
            defaultValue={item.id}
            required
            maxLength={24}
            autoComplete="off"
            spellCheck={false}
            disabled={salvando}
            className={`${CAMPO} font-mono uppercase`}
          />
          <p className="text-base text-tinta-tenue">
            Etiqueta atual:{" "}
            <span className="font-mono font-semibold text-tinta-suave">
              {item.id}
            </span>
          </p>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Confirmação de inativação.
 *
 * A frase é a da especificação da tarefa, palavra por palavra — é ela que
 * explica por que este botão não é um "excluir". A etiqueta aparece acima, em
 * monoespaçada, porque "este equipamento" no meio de uma tabela de vinte linhas
 * não diz qual.
 */
function ModalDeInativacao({
  item,
  inativando,
  onCancelar,
  onConfirmar,
}: {
  item: ItemDeInventario | null;
  inativando: boolean;
  onCancelar: () => void;
  onConfirmar: (item: ItemDeInventario) => void;
}) {
  if (!item) return null;

  return (
    <Modal
      aberto
      titulo="Inativar equipamento"
      bloqueado={inativando}
      onFechar={onCancelar}
      acoes={
        <>
          <Botao
            variante="secundario"
            onClick={onCancelar}
            disabled={inativando}
            className="sm:min-w-40"
          >
            Cancelar
          </Botao>
          <Botao
            onClick={() => onConfirmar(item)}
            carregando={inativando}
            className="sm:min-w-40"
          >
            <IconeBloquear className="size-5" />
            Inativar
          </Botao>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie-2 p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-marca-azul-tenue text-marca-azul">
            <IconeCategoria tipo={item.tipo} className="size-6" />
          </span>
          <span>
            <span className="block font-mono text-lg font-bold tracking-tight text-tinta">
              {item.id}
            </span>
            <span className="block text-base text-tinta-suave">{item.tipo}</span>
          </span>
        </div>

        <p>
          Tem certeza que deseja inativar este equipamento? Ele não aparecerá
          mais para novos empréstimos.
        </p>

        <p className="text-base text-tinta-tenue">
          Ele continua na lista do inventário, marcado como inativo, e pode ser
          reativado depois.
        </p>
      </div>
    </Modal>
  );
}

/**
 * Cadastro de equipamento novo.
 *
 * O foco volta para a etiqueta depois de cada cadastro: quem chega com uma
 * caixa de dez notebooks digita dez vezes seguidas, e tirar a mão do teclado
 * para clicar no campo dez vezes é a diferença entre usar e não usar a tela.
 *
 * **A categoria é um `<select>` de opções vindas da tabela `Categoria`, e só.**
 * Até a Tarefa 5 este campo era um texto com sugestões (`datalist`), que parece
 * um combo mas não é: depois de escolher "Notebook", a lista só reabria
 * apagando a palavra à mão. A Tarefa 5 trocou por `<select>` com um escape
 * "Nova categoria..."; a Tarefa 6 tirou o escape, porque criar categoria virou
 * uma tela com dono (`/admin/categorias`) e dois lugares criando a mesma coisa
 * é como nasciam "notebook" e "Notebook" lado a lado. No lugar do escape ficou
 * um link — o caminho continua a um clique, mas passa por onde a categoria é
 * conferida.
 */
function FormularioDeCadastro({ categorias }: { categorias: OpcaoDeCategoria[] }) {
  const [estado, cadastrar, pendente] = useActionState(cadastrarEquipamento, {
    fase: "inicial" as const,
  });

  const etiquetaRef = useRef<HTMLInputElement>(null);
  const semCategorias = categorias.length === 0;

  /*
    O `<select>` é **não-controlado** de propósito.

    O React 19 limpa o formulário sozinho quando a action termina. Com um
    `<select>` controlado isso desencontra os dois lados: o DOM volta para o
    `defaultValue` e o React, que só reescreve o campo quando a prop muda,
    continua achando que o valor escolhido está lá. O próximo envio mandaria a
    categoria vazia — e o `FormData` lê o DOM, não o estado. Medido no
    navegador: depois de cadastrar TAB-99 com "Tablet" escolhido, o campo já
    aparecia em branco.
  */
  useEffect(() => {
    if (estado.fase !== "sucesso") return;

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

      {semCategorias ? (
        <Alerta
          tom="aviso"
          mensagem="Nenhuma categoria cadastrada."
          detalhe="Todo equipamento pertence a uma categoria — crie a primeira em Categorias, no menu ao lado."
        />
      ) : null}

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
            placeholder="exemplo: note-11"
            disabled={semCategorias}
            className={`${CAMPO} font-mono uppercase`}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="categoria_id"
              className="text-base font-semibold text-tinta"
            >
              Categoria
            </label>

            <Link
              href="/admin/categorias"
              className="rounded-lg text-sm font-semibold text-marca-azul underline decoration-marca-azul-claro underline-offset-4 hover:text-marca-azul-escuro"
            >
              Gerenciar
            </Link>
          </div>

          <Selecao
            id="categoria_id"
            name="categoria_id"
            required
            defaultValue=""
            disabled={semCategorias}
          >
            <option value="" disabled>
              Selecione a categoria
            </option>

            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </Selecao>
        </div>

        <Botao
          type="submit"
          carregando={pendente}
          disabled={semCategorias}
          className="sm:shrink-0"
        >
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

/*
  O campo sem o recuo lateral, para quem precisa de outro.

  A separação não é preciosismo: `px-4` e `pl-12` são utilidades concorrentes, e
  no Tailwind 4 quem vence é a ordem no CSS gerado, não a ordem no atributo — a
  mesma armadilha já registrada para os tamanhos do `Botao`. O `<select>` daqui
  vinha somando `pr-12` por cima do `px-4` e só funcionava por sorte da ordem;
  a busca, que precisa de espaço para a lupa à esquerda, teria a mesma sorte a
  cada build. Quem quer recuo diferente compõe a partir daqui e não sobrepõe
  nada.
*/
const CAMPO_SEM_LADOS = [
  "min-h-14 w-full rounded-2xl border-2 border-borda bg-superficie-2",
  "text-lg text-tinta placeholder:text-tinta-tenue",
  "transition-colors duration-150",
  "hover:border-borda-forte focus:border-marca-azul focus:bg-superficie",
  "disabled:cursor-not-allowed disabled:opacity-55",
].join(" ");

const CAMPO = `${CAMPO_SEM_LADOS} px-4`;
