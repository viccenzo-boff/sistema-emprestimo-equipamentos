"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  alterarStatusPessoa,
  contarEmprestimosAbertos,
  editarPessoa,
} from "@/app/admin/pessoas/actions";
import { SeloPerfil, SeloStatusPessoa } from "@/components/admin/SeloStatus";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { CABECALHO, CAMPO, CAMPO_SEM_LADOS, CELULA, Selecao } from "@/components/ui/Campo";
import {
  IconeBloquear,
  IconeLapis,
  IconeLupa,
  IconePessoaCheck,
  IconePessoas,
} from "@/components/ui/icones";
import { Modal } from "@/components/ui/Modal";
import { Notificacao } from "@/components/ui/Notificacao";
import { semAcento } from "@/lib/texto";
import { PERFIL, STATUS_PESSOA, type PessoaDoPainel } from "@/lib/tipos";

/**
 * Gestão de Pessoas (Tarefa 8, item 4): a tabela de cadastros com busca,
 * filtros, edição por modal e o botão de ativar/inativar direto na linha.
 *
 * As regras de verdade estão no servidor
 * ([actions](src/app/admin/pessoas/actions.ts)); esta tela é conveniência, não
 * barreira — a mesma divisão do inventário. Aqui a tabela de transições aparece
 * só como "qual botão esta linha tem".
 *
 * **A filtragem é no cliente**, como na Tarefa 7 e pelos mesmos motivos: a
 * lista inteira já chega no render, a página é `force-dynamic`, e por
 * `searchParams` cada tecla custaria um render inteiro do Server Component. A
 * troca aceita é a mesma — os filtros não sobrevivem ao F5 — e o ganho também:
 * o `router.refresh()` das ações preserva o filtro, que é justamente quando ele
 * importa (inativar quinze pessoas de um curso filtrado).
 */

type Props = {
  pessoas: PessoaDoPainel[];
};

type Falha = { matricula: string; mensagem: string; detalhe?: string };

/** O que está em voo agora — a linha tem dois botões, então o `id` não basta. */
type EmAndamento = { matricula: string; acao: "situacao" | "edicao" } | null;

/** O alvo do modal de inativação, já com a contagem relida do servidor. */
type Inativando = {
  pessoa: PessoaDoPainel;
  emprestimosAbertos: number;
  equipamentosEmMaos: string[];
};

export function GestaoPessoas({ pessoas }: Props) {
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [emAndamento, setEmAndamento] = useState<EmAndamento>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [editando, setEditando] = useState<PessoaDoPainel | null>(null);
  const [inativando, setInativando] = useState<Inativando | null>(null);

  // String vazia é "sem filtro" nos três, para "está filtrando?" ser uma
  // pergunta só — a mesma convenção da tela de inventário.
  const [busca, setBusca] = useState("");
  const [perfilFiltrado, setPerfilFiltrado] = useState("");
  const [statusFiltrado, setStatusFiltrado] = useState("");

  const ocupado = emAndamento !== null;
  const termo = semAcento(busca.trim());
  const filtrando = termo !== "" || perfilFiltrado !== "" || statusFiltrado !== "";

  function limparFiltros() {
    setBusca("");
    setPerfilFiltrado("");
    setStatusFiltrado("");
  }

  const visiveis = useMemo(() => {
    const comFalha = falha?.matricula ?? null;

    return pessoas.filter((pessoa) => {
      /*
        A linha que está exibindo um erro nunca é escondida por filtro.

        Regra herdada da Tarefa 7, e ela vale ainda mais aqui: `relerSeDesencontrou`
        relê o banco quando tela e banco discordam, e a releitura pode trocar o
        status para um que o filtro exclui. Sem esta saída, o pedido falharia, a
        linha sumiria levando a explicação junto, e a secretaria veria o clique
        não fazer nada.
      */
      if (pessoa.matricula === comFalha) return true;

      if (perfilFiltrado !== "" && pessoa.perfil !== perfilFiltrado) return false;
      if (statusFiltrado !== "" && pessoa.status !== statusFiltrado) return false;
      if (termo === "") return true;

      // Nome e matrícula, que é o que a tarefa pede. Os cursos entram junto
      // porque estão na mesma célula da tabela: procurar "direito" e não achar
      // a linha que diz "Direito" na tela seria a busca mentindo.
      return (
        semAcento(pessoa.nome).includes(termo) ||
        semAcento(pessoa.matricula).includes(termo) ||
        semAcento(pessoa.cursos).includes(termo)
      );
    });
  }, [pessoas, termo, perfilFiltrado, statusFiltrado, falha?.matricula]);

  function relerSeDesencontrou(motivo: string) {
    if (
      motivo === "PESSOA_NAO_ENCONTRADA" ||
      motivo === "STATUS_INVALIDO" ||
      motivo === "MATRICULA_DUPLICADA"
    ) {
      router.refresh();
    }
  }

  function moverPara(pessoa: PessoaDoPainel, destino: string) {
    if (ocupado) return;

    setEmAndamento({ matricula: pessoa.matricula, acao: "situacao" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await alterarStatusPessoa(pessoa.matricula, destino);

      if (!resultado.ok) {
        setFalha({
          matricula: pessoa.matricula,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        relerSeDesencontrou(resultado.motivo);
        setEmAndamento(null);
        return;
      }

      setAviso(
        destino === STATUS_PESSOA.inativo
          ? `${resultado.dados.nome} foi inativado e não consegue mais retirar equipamento.`
          : `${resultado.dados.nome} está ativo e já pode retirar equipamento.`,
      );
      setInativando(null);
      setEmAndamento(null);
    });
  }

  /**
   * O clique do botão de inativar.
   *
   * **Sem empréstimo aberto, inativa direto** — é o que a tarefa pede
   * explicitamente ("1 clique, para evitar abertura de modais na manutenção do
   * dia a dia"), e é o caso da maioria das linhas.
   *
   * **Com empréstimo aberto, o modal aparece** e diz o que a pessoa está
   * levando embora. Inativar continua permitido — quem saiu da faculdade quase
   * sempre está com um aparelho, e travar aqui deixaria o cadastro ativo (ou
   * seja, apto a retirar mais) até alguém lembrar de voltar. Mas não às cegas.
   *
   * O ramo usa a contagem que veio no render, e o modal **relê do servidor**
   * antes de mostrar o número: entre carregar a página e clicar cabe uma
   * retirada inteira no tablet. Se a contagem do render estiver velha para
   * menos, o pior que acontece é o aviso não aparecer — e a inativação era
   * permitida de qualquer forma.
   */
  function pedirInativacao(pessoa: PessoaDoPainel) {
    if (ocupado) return;

    if (pessoa.emprestimosAbertos === 0) {
      moverPara(pessoa, STATUS_PESSOA.inativo);
      return;
    }

    setEmAndamento({ matricula: pessoa.matricula, acao: "situacao" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await contarEmprestimosAbertos(pessoa.matricula);
      setEmAndamento(null);

      if (!resultado.ok) {
        setFalha({
          matricula: pessoa.matricula,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        relerSeDesencontrou(resultado.motivo);
        return;
      }

      // Devolveu tudo entre o render e o clique: não há o que avisar.
      if (resultado.dados.emprestimosAbertos === 0) {
        moverPara(pessoa, STATUS_PESSOA.inativo);
        return;
      }

      setInativando({ pessoa, ...resultado.dados });
    });
  }

  function salvarEdicao(atual: PessoaDoPainel, dados: DadosEditados) {
    if (ocupado) return;

    setEmAndamento({ matricula: atual.matricula, acao: "edicao" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await editarPessoa(atual.matricula, dados);

      if (!resultado.ok) {
        setFalha({
          matricula: atual.matricula,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        relerSeDesencontrou(resultado.motivo);
        setEmAndamento(null);
        return;
      }

      const { de, para, nome } = resultado.dados;

      setAviso(
        de === para
          ? `Cadastro de ${nome} atualizado.`
          : `A matrícula ${de} agora é ${para}. O histórico de empréstimos foi junto.`,
      );
      setEditando(null);
      setEmAndamento(null);
    });
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Cadastros
        </h2>

        <BarraDeFiltros
          busca={busca}
          perfilFiltrado={perfilFiltrado}
          statusFiltrado={statusFiltrado}
          onBusca={setBusca}
          onPerfil={setPerfilFiltrado}
          onStatus={setStatusFiltrado}
        />

        <div className="overflow-x-auto rounded-3xl border border-borda bg-superficie">
          <table className="w-full min-w-4xl border-collapse text-left">
            <caption className="sr-only">
              {filtrando
                ? "Cadastros que correspondem à busca e aos filtros"
                : "Todos os cadastros, ativos primeiro"}
            </caption>

            <thead>
              <tr className="border-b border-borda">
                <th scope="col" className={CABECALHO}>
                  Pessoa
                </th>
                <th scope="col" className={CABECALHO}>
                  Perfil
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
                  <td colSpan={4} className="px-5 py-16">
                    <EstadoVazio
                      semCadastros={pessoas.length === 0}
                      onLimpar={limparFiltros}
                    />
                  </td>
                </tr>
              ) : null}

              {visiveis.map((pessoa) => {
                const inativo = pessoa.status === STATUS_PESSOA.inativo;
                // Um botão só fica preso quando *outra* linha está trabalhando:
                // na própria linha o spinner já diz o que está acontecendo.
                const travado = ocupado && emAndamento?.matricula !== pessoa.matricula;

                return (
                  <tr
                    key={pessoa.matricula}
                    className={[
                      "border-b border-borda last:border-b-0 hover:bg-superficie-2",
                      // Inativo pesa menos na varredura: continua legível, mas
                      // não disputa atenção com quem ainda circula.
                      inativo ? "bg-superficie-2/60" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <td className={CELULA}>
                      <span className="block">
                        <span
                          className={[
                            "block text-lg font-semibold tracking-tight",
                            inativo ? "text-tinta-suave" : "text-tinta",
                          ].join(" ")}
                        >
                          {pessoa.nome}
                        </span>
                        <span className="mt-0.5 block text-sm text-tinta-suave">
                          {/*
                            A matrícula em monoespaçada, como a etiqueta do
                            inventário e pelo mesmo motivo: ela é conferida
                            caractere a caractere contra a carteirinha, e os
                            zeros à esquerda precisam ser contáveis com o olho.
                          */}
                          <span className="font-mono font-semibold">
                            {pessoa.matricula}
                          </span>
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          {pessoa.cursos}
                        </span>

                        {pessoa.emprestimosAbertos > 0 ? (
                          <span className="mt-1 block text-sm text-marca-azul">
                            Está com{" "}
                            <span className="font-mono font-semibold">
                              {pessoa.equipamentosEmMaos.join(", ")}
                            </span>
                          </span>
                        ) : null}
                      </span>
                    </td>

                    <td className={CELULA}>
                      <SeloPerfil perfil={pessoa.perfil} />
                    </td>

                    <td className={CELULA}>
                      <SeloStatusPessoa status={pessoa.status} />
                    </td>

                    <td className={`${CELULA} text-right`}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Botao
                          variante="secundario"
                          tamanho="pequeno"
                          onClick={() => setEditando(pessoa)}
                          disabled={travado}
                          aria-label={`Editar o cadastro de ${pessoa.nome}`}
                        >
                          <IconeLapis className="size-5" />
                          Editar
                        </Botao>

                        {inativo ? (
                          <Botao
                            variante="secundario"
                            tamanho="pequeno"
                            onClick={() => moverPara(pessoa, STATUS_PESSOA.ativo)}
                            carregando={
                              emAndamento?.matricula === pessoa.matricula &&
                              emAndamento.acao === "situacao"
                            }
                            disabled={travado}
                            aria-label={`Ativar o cadastro de ${pessoa.nome}`}
                          >
                            <IconePessoaCheck className="size-5" />
                            Ativar
                          </Botao>
                        ) : (
                          <Botao
                            variante="fantasma"
                            tamanho="pequeno"
                            onClick={() => pedirInativacao(pessoa)}
                            carregando={
                              emAndamento?.matricula === pessoa.matricula &&
                              emAndamento.acao === "situacao"
                            }
                            disabled={travado}
                            aria-label={`Inativar o cadastro de ${pessoa.nome}`}
                          >
                            <IconeBloquear className="size-5" />
                            Inativar
                          </Botao>
                        )}
                      </div>

                      {falha?.matricula === pessoa.matricula ? (
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
          O anúncio para leitor de tela é uma região viva **sempre presente** no
          DOM: uma região que só nasce quando o texto aparece não é lida. É
          `sr-only`, ou seja, posicionada em absoluto — não vira item do flex e
          não abre vão entre a tabela e o rodapé.
        */}
        <p role="status" className="sr-only">
          {filtrando
            ? `${visiveis.length} de ${pessoas.length} cadastros correspondem aos filtros.`
            : ""}
        </p>

        <div className="flex flex-col gap-3 px-1">
          {filtrando && visiveis.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base text-tinta-suave">
                Mostrando{" "}
                <span className="numeros-tabulares font-semibold text-tinta">
                  {visiveis.length}
                </span>{" "}
                de <span className="numeros-tabulares">{pessoas.length}</span>{" "}
                {pessoas.length === 1 ? "cadastro" : "cadastros"}.
              </p>

              <Botao variante="fantasma" tamanho="pequeno" onClick={limparFiltros}>
                Limpar filtros
              </Botao>
            </div>
          ) : null}

          <p className="text-base text-tinta-tenue">
            Cadastro inativo não retira equipamento no tablet, mas continua
            conseguindo devolver o que está com a pessoa — é o que evita que um
            aparelho fique parado na mochila de quem saiu. O cadastro nunca é
            apagado: o histórico de empréstimos aponta para ele.
          </p>
        </div>
      </section>

      <ModalDeEdicao
        pessoa={editando}
        salvando={emAndamento?.acao === "edicao"}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarEdicao}
      />

      <ModalDeInativacao
        alvo={inativando}
        inativando={emAndamento?.acao === "situacao"}
        onCancelar={() => setInativando(null)}
        onConfirmar={(pessoa) => moverPara(pessoa, STATUS_PESSOA.inativo)}
      />

      <Notificacao mensagem={aviso} onFechar={() => setAviso(null)} />
    </>
  );
}

/**
 * Busca e filtros (Tarefa 8, item 4).
 *
 * Fica **entre o `h2` e a tabela**, e não junto dos cartões do topo: um
 * controle que muda o que a tabela mostra pertence à tabela. Encostado no
 * resumo, pareceria filtrar também as contagens — que continuam sendo de todos
 * os cadastros, de propósito.
 *
 * Os três controles são **controlados**, ao contrário dos `<select>` de
 * formulário do painel, que são não-controlados por obrigação (o React 19 limpa
 * o form quando a action termina). Não é incoerência: estes não são enviados a
 * lugar nenhum — o estado deles *é* o filtro.
 */
function BarraDeFiltros({
  busca,
  perfilFiltrado,
  statusFiltrado,
  onBusca,
  onPerfil,
  onStatus,
}: {
  busca: string;
  perfilFiltrado: string;
  statusFiltrado: string;
  onBusca: (valor: string) => void;
  onPerfil: (valor: string) => void;
  onStatus: (valor: string) => void;
}) {
  return (
    <div role="search" className="flex flex-col gap-3 lg:flex-row">
      <div className="relative lg:flex-1">
        <label htmlFor="busca-de-pessoas" className="sr-only">
          Buscar por nome ou matrícula
        </label>

        <IconeLupa className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-tinta-tenue" />

        <input
          id="busca-de-pessoas"
          type="search"
          value={busca}
          onChange={(evento) => onBusca(evento.target.value)}
          placeholder="Buscar por nome, matrícula ou curso..."
          autoComplete="off"
          spellCheck={false}
          className={`${CAMPO_SEM_LADOS} pr-4 pl-12`}
        />
      </div>

      {/*
        A largura é a mesma medida na Tarefa 7 (34rem para dois seletores):
        com 26rem os rótulos "Todos os perfis" e "Todas as situações" cortavam,
        porque cada um fica com metade da faixa menos os 48px da seta.
      */}
      <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem] lg:shrink-0">
        <Selecao
          aria-label="Filtrar por perfil"
          value={perfilFiltrado}
          onChange={(evento) => onPerfil(evento.target.value)}
        >
          <option value="">Todos os perfis</option>
          <option value={PERFIL.estudante}>Estudante</option>
          <option value={PERFIL.professor}>Professor</option>
        </Selecao>

        <Selecao
          aria-label="Filtrar por situação"
          value={statusFiltrado}
          onChange={(evento) => onStatus(evento.target.value)}
        >
          <option value="">Todas as situações</option>
          <option value={STATUS_PESSOA.ativo}>Ativo</option>
          <option value={STATUS_PESSOA.inativo}>Inativo</option>
        </Selecao>
      </div>
    </div>
  );
}

/**
 * A tabela sem nenhuma linha para mostrar.
 *
 * São dois casos com a mesma aparência e conselhos opostos, e confundi-los é o
 * que faz uma tela parecer quebrada: **não há cadastro nenhum** (a resposta é
 * importar a planilha acima) e **os filtros não acharam nada** (a resposta é
 * desfazer os filtros).
 */
function EstadoVazio({
  semCadastros,
  onLimpar,
}: {
  semCadastros: boolean;
  onLimpar: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-superficie-2 text-tinta-tenue">
        {semCadastros ? (
          <IconePessoas className="size-8" />
        ) : (
          <IconeLupa className="size-8" />
        )}
      </span>

      <div>
        <p className="text-xl font-semibold tracking-tight text-tinta">
          {semCadastros
            ? "Nenhum cadastro no sistema"
            : "Nenhum cadastro encontrado com estes filtros."}
        </p>
        <p className="mt-2 text-base text-tinta-suave">
          {semCadastros
            ? "Importe a planilha da coordenação no formulário acima — sem cadastro, ninguém consegue retirar equipamento no tablet."
            : "Tente outro nome ou matrícula, ou volte a ver a lista inteira."}
        </p>
      </div>

      {semCadastros ? null : (
        <Botao variante="secundario" tamanho="pequeno" onClick={onLimpar}>
          Limpar filtros
        </Botao>
      )}
    </div>
  );
}

export type DadosEditados = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
  status: string;
};

/**
 * Edição manual completa (Tarefa 8, item 4).
 *
 * **A matrícula é editável**, e é o item 1 da tarefa que pede isso: ela existe
 * para "correções ortográficas na matrícula" — o banco propaga a troca para
 * todos os empréstimos por `onUpdate: Cascade`, exercitado contra uma cópia do
 * `dev.db` antes desta tela existir. O aviso abaixo do campo diz isso na tela,
 * porque trocar uma chave primária parece perigoso para quem está clicando.
 *
 * O `<form>` existe para o Enter funcionar, e os campos são **não-controlados**
 * (`defaultValue`): o modal é montado do zero a cada abertura — `pessoa` nulo
 * devolve `null` — então não há estado velho para sincronizar.
 */
function ModalDeEdicao({
  pessoa,
  salvando,
  onCancelar,
  onSalvar,
}: {
  pessoa: PessoaDoPainel | null;
  salvando: boolean;
  onCancelar: () => void;
  onSalvar: (pessoa: PessoaDoPainel, dados: DadosEditados) => void;
}) {
  const campoRef = useRef<HTMLInputElement>(null);

  /*
    O foco vem depois do `showModal()`, não antes: o `<dialog>` nativo move o
    foco para o primeiro focável ao abrir, e o `showModal()` roda no efeito do
    `Modal` — ou seja, depois dos efeitos dos filhos. Um `focus()` daqui seria
    desfeito um instante depois; o `requestAnimationFrame` cai no quadro
    seguinte, quando o diálogo já abriu.
  */
  useEffect(() => {
    if (!pessoa) return;

    const quadro = requestAnimationFrame(() => campoRef.current?.select());
    return () => cancelAnimationFrame(quadro);
  }, [pessoa]);

  if (!pessoa) return null;

  return (
    <Modal
      aberto
      titulo="Editar cadastro"
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
            form="formulario-da-pessoa"
            carregando={salvando}
            className="sm:min-w-40"
          >
            Salvar
          </Botao>
        </>
      }
    >
      <form
        id="formulario-da-pessoa"
        onSubmit={(evento) => {
          evento.preventDefault();
          const dados = new FormData(evento.currentTarget);

          onSalvar(pessoa, {
            matricula: String(dados.get("matricula") ?? ""),
            nome: String(dados.get("nome") ?? ""),
            perfil: String(dados.get("perfil") ?? ""),
            cursos: String(dados.get("cursos") ?? ""),
            status: String(dados.get("status") ?? ""),
          });
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="matricula" className="text-base font-semibold text-tinta">
            Matrícula
          </label>
          {/*
            `maxLength` é 15, e não 20: é o mesmo teto que `MATRICULA_VALIDA`
            aplica no servidor. Com 20, dava para digitar 16 dígitos e só
            descobrir a recusa no Salvar — a tela prometendo um formato que a
            regra não aceita. Achado na D09, ao documentar esta tela.
          */}
          <input
            ref={campoRef}
            id="matricula"
            name="matricula"
            defaultValue={pessoa.matricula}
            required
            maxLength={15}
            autoComplete="off"
            spellCheck={false}
            disabled={salvando}
            className={`${CAMPO} font-mono`}
          />
          <p className="text-base text-tinta-tenue">
            É o número digitado no tablet. Corrigir aqui leva junto todo o
            histórico de empréstimos — os zeros à esquerda contam.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className="text-base font-semibold text-tinta">
            Nome completo
          </label>
          <input
            id="nome"
            name="nome"
            defaultValue={pessoa.nome}
            required
            maxLength={120}
            autoComplete="off"
            disabled={salvando}
            className={CAMPO}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="perfil" className="text-base font-semibold text-tinta">
              Perfil
            </label>
            <Selecao
              id="perfil"
              name="perfil"
              defaultValue={pessoa.perfil}
              disabled={salvando}
            >
              <option value={PERFIL.estudante}>Estudante</option>
              <option value={PERFIL.professor}>Professor</option>
            </Selecao>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="status" className="text-base font-semibold text-tinta">
              Situação
            </label>
            <Selecao
              id="status"
              name="status"
              defaultValue={pessoa.status}
              disabled={salvando}
            >
              <option value={STATUS_PESSOA.ativo}>Ativo</option>
              <option value={STATUS_PESSOA.inativo}>Inativo</option>
            </Selecao>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="cursos" className="text-base font-semibold text-tinta">
            Cursos
          </label>
          <input
            id="cursos"
            name="cursos"
            defaultValue={pessoa.cursos}
            required
            maxLength={200}
            autoComplete="off"
            disabled={salvando}
            className={CAMPO}
          />
          <p className="text-base text-tinta-tenue">
            Separe vários por vírgula. Ex.: Sistemas de Informação, Direito.
          </p>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Confirmação de inativação — e ela **só aparece quando a pessoa está com
 * equipamento**.
 *
 * A tarefa pede o toggle de um clique justamente para não abrir modal na
 * manutenção do dia a dia, e a maioria das linhas não tem empréstimo aberto.
 * Este modal é a exceção que a decisão de negócio pediu: inativar continua
 * permitido, mas quem clica precisa ver o que a pessoa está levando.
 *
 * A lista de etiquetas é relida do servidor no clique, não herdada do render:
 * "está com NOTE-03" tem que ser verdade no instante em que é lido, porque é
 * essa frase que decide se a secretaria confirma ou vai atrás do aparelho.
 */
function ModalDeInativacao({
  alvo,
  inativando,
  onCancelar,
  onConfirmar,
}: {
  alvo: Inativando | null;
  inativando: boolean;
  onCancelar: () => void;
  onConfirmar: (pessoa: PessoaDoPainel) => void;
}) {
  if (!alvo) return null;

  const { pessoa, emprestimosAbertos, equipamentosEmMaos } = alvo;
  const um = emprestimosAbertos === 1;

  return (
    <Modal
      aberto
      titulo="Inativar cadastro"
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
            onClick={() => onConfirmar(pessoa)}
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
        <div className="rounded-2xl border border-borda bg-superficie-2 p-4">
          <span className="block text-lg font-semibold tracking-tight text-tinta">
            {pessoa.nome}
          </span>
          <span className="mt-0.5 block text-base text-tinta-suave">
            <span className="font-mono font-semibold">{pessoa.matricula}</span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            {pessoa.cursos}
          </span>
        </div>

        <Alerta
          tom="aviso"
          mensagem={`${pessoa.nome} ainda está com ${um ? "1 equipamento" : `${emprestimosAbertos} equipamentos`}.`}
          detalhe={`${equipamentosEmMaos.join(", ")} — ${um ? "esse empréstimo continua" : "esses empréstimos continuam"} aberto${um ? "" : "s"} e ${um ? "aparece" : "aparecem"} em Empréstimos Ativos, mesmo depois da inativação.`}
        />

        <p>
          Inativar agora impede novas retiradas.{" "}
          <strong className="font-semibold text-tinta">
            A devolução continua liberada no tablet
          </strong>
          , para {um ? "o equipamento voltar" : "os equipamentos voltarem"} sem
          precisar reativar o cadastro.
        </p>

        <p className="text-base text-tinta-tenue">
          O cadastro continua na lista, marcado como inativo, e pode ser
          reativado a qualquer momento.
        </p>
      </div>
    </Modal>
  );
}
