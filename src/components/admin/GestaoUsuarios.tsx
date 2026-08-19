"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  alterarStatusUsuario,
  contarEmprestimosAbertos,
  editarUsuario,
} from "@/app/admin/usuarios/actions";
import { SeloPerfil, SeloStatusUsuario } from "@/components/admin/SeloStatus";
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
import { PERFIL, STATUS_USUARIO, type UsuarioDoPainel } from "@/lib/tipos";

/**
 * Gestão de Usuários (Tarefa 8, item 4): a tabela de cadastros com busca,
 * filtros, edição por modal e o botão de ativar/inativar direto na linha.
 *
 * As regras de verdade estão no servidor
 * ([actions](src/app/admin/usuarios/actions.ts)); esta tela é conveniência, não
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
  usuarios: UsuarioDoPainel[];
};

type Falha = { matricula: string; mensagem: string; detalhe?: string };

/** O que está em voo agora — a linha tem dois botões, então o `id` não basta. */
type EmAndamento = { matricula: string; acao: "situacao" | "edicao" } | null;

/** O alvo do modal de inativação, já com a contagem relida do servidor. */
type Inativando = {
  usuario: UsuarioDoPainel;
  emprestimosAbertos: number;
  equipamentosEmMaos: string[];
};

export function GestaoUsuarios({ usuarios }: Props) {
  const router = useRouter();
  const [, iniciarTransicao] = useTransition();
  const [emAndamento, setEmAndamento] = useState<EmAndamento>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [editando, setEditando] = useState<UsuarioDoPainel | null>(null);
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

    return usuarios.filter((usuario) => {
      /*
        A linha que está exibindo um erro nunca é escondida por filtro.

        Regra herdada da Tarefa 7, e ela vale ainda mais aqui: `relerSeDesencontrou`
        relê o banco quando tela e banco discordam, e a releitura pode trocar o
        status para um que o filtro exclui. Sem esta saída, o pedido falharia, a
        linha sumiria levando a explicação junto, e a secretaria veria o clique
        não fazer nada.
      */
      if (usuario.matricula === comFalha) return true;

      if (perfilFiltrado !== "" && usuario.perfil !== perfilFiltrado) return false;
      if (statusFiltrado !== "" && usuario.status !== statusFiltrado) return false;
      if (termo === "") return true;

      // Nome e matrícula, que é o que a tarefa pede. Os cursos entram junto
      // porque estão na mesma célula da tabela: procurar "direito" e não achar
      // a linha que diz "Direito" na tela seria a busca mentindo.
      return (
        semAcento(usuario.nome).includes(termo) ||
        semAcento(usuario.matricula).includes(termo) ||
        semAcento(usuario.cursos).includes(termo)
      );
    });
  }, [usuarios, termo, perfilFiltrado, statusFiltrado, falha?.matricula]);

  function relerSeDesencontrou(motivo: string) {
    if (
      motivo === "USUARIO_NAO_ENCONTRADO" ||
      motivo === "STATUS_INVALIDO" ||
      motivo === "MATRICULA_DUPLICADA"
    ) {
      router.refresh();
    }
  }

  function moverPara(usuario: UsuarioDoPainel, destino: string) {
    if (ocupado) return;

    setEmAndamento({ matricula: usuario.matricula, acao: "situacao" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await alterarStatusUsuario(usuario.matricula, destino);

      if (!resultado.ok) {
        setFalha({
          matricula: usuario.matricula,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        relerSeDesencontrou(resultado.motivo);
        setEmAndamento(null);
        return;
      }

      setAviso(
        destino === STATUS_USUARIO.inativo
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
  function pedirInativacao(usuario: UsuarioDoPainel) {
    if (ocupado) return;

    if (usuario.emprestimosAbertos === 0) {
      moverPara(usuario, STATUS_USUARIO.inativo);
      return;
    }

    setEmAndamento({ matricula: usuario.matricula, acao: "situacao" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await contarEmprestimosAbertos(usuario.matricula);
      setEmAndamento(null);

      if (!resultado.ok) {
        setFalha({
          matricula: usuario.matricula,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        relerSeDesencontrou(resultado.motivo);
        return;
      }

      // Devolveu tudo entre o render e o clique: não há o que avisar.
      if (resultado.dados.emprestimosAbertos === 0) {
        moverPara(usuario, STATUS_USUARIO.inativo);
        return;
      }

      setInativando({ usuario, ...resultado.dados });
    });
  }

  function salvarEdicao(atual: UsuarioDoPainel, dados: DadosEditados) {
    if (ocupado) return;

    setEmAndamento({ matricula: atual.matricula, acao: "edicao" });
    setFalha(null);

    iniciarTransicao(async () => {
      const resultado = await editarUsuario(atual.matricula, dados);

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
                      semCadastros={usuarios.length === 0}
                      onLimpar={limparFiltros}
                    />
                  </td>
                </tr>
              ) : null}

              {visiveis.map((usuario) => {
                const inativo = usuario.status === STATUS_USUARIO.inativo;
                // Um botão só fica preso quando *outra* linha está trabalhando:
                // na própria linha o spinner já diz o que está acontecendo.
                const travado = ocupado && emAndamento?.matricula !== usuario.matricula;

                return (
                  <tr
                    key={usuario.matricula}
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
                          {usuario.nome}
                        </span>
                        <span className="mt-0.5 block text-sm text-tinta-suave">
                          {/*
                            A matrícula em monoespaçada, como a etiqueta do
                            inventário e pelo mesmo motivo: ela é conferida
                            caractere a caractere contra a carteirinha, e os
                            zeros à esquerda precisam ser contáveis com o olho.
                          */}
                          <span className="font-mono font-semibold">
                            {usuario.matricula}
                          </span>
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          {usuario.cursos}
                        </span>

                        {usuario.emprestimosAbertos > 0 ? (
                          <span className="mt-1 block text-sm text-marca-azul">
                            Está com{" "}
                            <span className="font-mono font-semibold">
                              {usuario.equipamentosEmMaos.join(", ")}
                            </span>
                          </span>
                        ) : null}
                      </span>
                    </td>

                    <td className={CELULA}>
                      <SeloPerfil perfil={usuario.perfil} />
                    </td>

                    <td className={CELULA}>
                      <SeloStatusUsuario status={usuario.status} />
                    </td>

                    <td className={`${CELULA} text-right`}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Botao
                          variante="secundario"
                          tamanho="pequeno"
                          onClick={() => setEditando(usuario)}
                          disabled={travado}
                          aria-label={`Editar o cadastro de ${usuario.nome}`}
                        >
                          <IconeLapis className="size-5" />
                          Editar
                        </Botao>

                        {inativo ? (
                          <Botao
                            variante="secundario"
                            tamanho="pequeno"
                            onClick={() => moverPara(usuario, STATUS_USUARIO.ativo)}
                            carregando={
                              emAndamento?.matricula === usuario.matricula &&
                              emAndamento.acao === "situacao"
                            }
                            disabled={travado}
                            aria-label={`Ativar o cadastro de ${usuario.nome}`}
                          >
                            <IconePessoaCheck className="size-5" />
                            Ativar
                          </Botao>
                        ) : (
                          <Botao
                            variante="fantasma"
                            tamanho="pequeno"
                            onClick={() => pedirInativacao(usuario)}
                            carregando={
                              emAndamento?.matricula === usuario.matricula &&
                              emAndamento.acao === "situacao"
                            }
                            disabled={travado}
                            aria-label={`Inativar o cadastro de ${usuario.nome}`}
                          >
                            <IconeBloquear className="size-5" />
                            Inativar
                          </Botao>
                        )}
                      </div>

                      {falha?.matricula === usuario.matricula ? (
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
            ? `${visiveis.length} de ${usuarios.length} cadastros correspondem aos filtros.`
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
                de <span className="numeros-tabulares">{usuarios.length}</span>{" "}
                {usuarios.length === 1 ? "cadastro" : "cadastros"}.
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
        usuario={editando}
        salvando={emAndamento?.acao === "edicao"}
        onCancelar={() => setEditando(null)}
        onSalvar={salvarEdicao}
      />

      <ModalDeInativacao
        alvo={inativando}
        inativando={emAndamento?.acao === "situacao"}
        onCancelar={() => setInativando(null)}
        onConfirmar={(usuario) => moverPara(usuario, STATUS_USUARIO.inativo)}
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
        <label htmlFor="busca-de-usuarios" className="sr-only">
          Buscar por nome ou matrícula
        </label>

        <IconeLupa className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-tinta-tenue" />

        <input
          id="busca-de-usuarios"
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
          <option value={PERFIL.aluno}>Aluno</option>
          <option value={PERFIL.professor}>Professor</option>
        </Selecao>

        <Selecao
          aria-label="Filtrar por situação"
          value={statusFiltrado}
          onChange={(evento) => onStatus(evento.target.value)}
        >
          <option value="">Todas as situações</option>
          <option value={STATUS_USUARIO.ativo}>Ativo</option>
          <option value={STATUS_USUARIO.inativo}>Inativo</option>
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
 * (`defaultValue`): o modal é montado do zero a cada abertura — `usuario` nulo
 * devolve `null` — então não há estado velho para sincronizar.
 */
function ModalDeEdicao({
  usuario,
  salvando,
  onCancelar,
  onSalvar,
}: {
  usuario: UsuarioDoPainel | null;
  salvando: boolean;
  onCancelar: () => void;
  onSalvar: (usuario: UsuarioDoPainel, dados: DadosEditados) => void;
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
    if (!usuario) return;

    const quadro = requestAnimationFrame(() => campoRef.current?.select());
    return () => cancelAnimationFrame(quadro);
  }, [usuario]);

  if (!usuario) return null;

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
            form="formulario-do-usuario"
            carregando={salvando}
            className="sm:min-w-40"
          >
            Salvar
          </Botao>
        </>
      }
    >
      <form
        id="formulario-do-usuario"
        onSubmit={(evento) => {
          evento.preventDefault();
          const dados = new FormData(evento.currentTarget);

          onSalvar(usuario, {
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
          <input
            ref={campoRef}
            id="matricula"
            name="matricula"
            defaultValue={usuario.matricula}
            required
            maxLength={20}
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
            defaultValue={usuario.nome}
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
              defaultValue={usuario.perfil}
              disabled={salvando}
            >
              <option value={PERFIL.aluno}>Aluno</option>
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
              defaultValue={usuario.status}
              disabled={salvando}
            >
              <option value={STATUS_USUARIO.ativo}>Ativo</option>
              <option value={STATUS_USUARIO.inativo}>Inativo</option>
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
            defaultValue={usuario.cursos}
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
  onConfirmar: (usuario: UsuarioDoPainel) => void;
}) {
  if (!alvo) return null;

  const { usuario, emprestimosAbertos, equipamentosEmMaos } = alvo;
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
            onClick={() => onConfirmar(usuario)}
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
            {usuario.nome}
          </span>
          <span className="mt-0.5 block text-base text-tinta-suave">
            <span className="font-mono font-semibold">{usuario.matricula}</span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            {usuario.cursos}
          </span>
        </div>

        <Alerta
          tom="aviso"
          mensagem={`${usuario.nome} ainda está com ${um ? "1 equipamento" : `${emprestimosAbertos} equipamentos`}.`}
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
