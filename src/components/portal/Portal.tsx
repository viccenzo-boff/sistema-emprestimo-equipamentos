"use client";

import { useCallback, useEffect, useState } from "react";

import {
  confirmarDevolucao,
  confirmarRetirada,
  devolverTudo,
  identificarPessoa,
  listarDisponiveis,
  listarEmprestimosAtivos,
} from "@/app/actions";
import { BarraSelecao } from "@/components/portal/BarraSelecao";
import { CabecalhoPortal } from "@/components/portal/CabecalhoPortal";
import { ModalDevolucao } from "@/components/portal/ModalDevolucao";
import { TelaEquipamentos } from "@/components/portal/TelaEquipamentos";
import { TelaInicio } from "@/components/portal/TelaInicio";
import { TelaMatricula } from "@/components/portal/TelaMatricula";
import { TelaSucesso } from "@/components/portal/TelaSucesso";
import { Notificacao } from "@/components/ui/Notificacao";
import {
  STATUS_PESSOA,
  type Categoria,
  type EmprestimoAtivo,
  type EquipamentoDisponivel,
  type RetiradaConfirmada,
  type PessoaIdentificada,
} from "@/lib/tipos";

/**
 * Portal do tablet — Fluxos 1 (retirada) e 2 (devolução) da spec.
 *
 * Os dois fluxos moram em uma rota só. Trocar de tela aqui é trocar de estado,
 * não navegar: o aluno está de pé na bancada, e voltar uma etapa não pode custar
 * um carregamento de página nem correr o risco de o botão "voltar" do navegador
 * ressuscitar uma seleção antiga.
 *
 * Os dados nunca vêm do render da página — vêm de Server Actions, chamadas no
 * momento do toque. Isso mantém a lista de equipamentos disponíveis e a de
 * itens emprestados sempre frescas, mesmo que a página fique aberta a tarde
 * inteira.
 */

type Etapa =
  | { nome: "matricula" }
  | { nome: "inicio" }
  | { nome: "equipamentos"; tipo: string }
  | { nome: "sucesso"; retirada: RetiradaConfirmada };

type Falha = { mensagem: string; detalhe?: string };

/**
 * Tablet parado volta ao início sozinho. Sem isso, quem desiste no meio do
 * fluxo deixa a sessão aberta e o próximo aluno retira equipamento no nome
 * de outra pessoa. Dois minutos é folgado para quem está escolhendo.
 */
const INATIVIDADE_MS = 120_000;

export function Portal() {
  const [etapa, setEtapa] = useState<Etapa>({ nome: "matricula" });
  const [matricula, setMatricula] = useState("");
  const [pessoa, setPessoa] = useState<PessoaIdentificada | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoDisponivel[]>([]);
  const [selecionados, setSelecionados] = useState<EquipamentoDisponivel[]>([]);

  // Fluxo 2: o que está com a pessoa e o que ela pediu para devolver.
  //
  // `paraDevolver` é uma lista, e não um item: o modal é o mesmo para o botão da
  // linha (um item) e para o "Devolver tudo" (todos). Um estado só evita a
  // combinação impossível de "modo lote" ligado com um item selecionado.
  const [emprestimos, setEmprestimos] = useState<EmprestimoAtivo[]>([]);
  const [paraDevolver, setParaDevolver] = useState<EmprestimoAtivo[] | null>(null);
  const [devolvendo, setDevolvendo] = useState(false);

  const [entrando, setEntrando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [tipoCarregando, setTipoCarregando] = useState<string | null>(null);

  const [erroLogin, setErroLogin] = useState<Falha | null>(null);
  const [erroLista, setErroLista] = useState<Falha | null>(null);
  const [erroConfirmacao, setErroConfirmacao] = useState<Falha | null>(null);
  // Dois lugares para o erro da devolução: dentro do modal, enquanto ele está
  // aberto e dá para tentar de novo; na lista, quando o modal já se fechou
  // porque o item saiu de baixo dos pés.
  const [erroModal, setErroModal] = useState<Falha | null>(null);
  const [erroDevolucao, setErroDevolucao] = useState<Falha | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);

  const reiniciar = useCallback(() => {
    setEtapa({ nome: "matricula" });
    setMatricula("");
    setPessoa(null);
    setCategorias([]);
    setEquipamentos([]);
    setSelecionados([]);
    setEmprestimos([]);
    setParaDevolver(null);
    setDevolvendo(false);
    setErroLogin(null);
    setErroLista(null);
    setErroConfirmacao(null);
    setErroModal(null);
    setErroDevolucao(null);
    setAviso(null);
  }, []);

  const fecharAviso = useCallback(() => setAviso(null), []);

  // Zera a sessão depois de um tempo sem nenhum toque (ver INATIVIDADE_MS).
  // Uma devolução em voo segura o relógio: apagar a sessão no meio da escrita
  // deixaria a pessoa sem saber se o item foi devolvido ou não.
  useEffect(() => {
    if (etapa.nome === "matricula" || etapa.nome === "sucesso") return;
    if (devolvendo) return;

    let temporizador = window.setTimeout(reiniciar, INATIVIDADE_MS);

    const renovar = () => {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(reiniciar, INATIVIDADE_MS);
    };

    window.addEventListener("pointerdown", renovar);
    window.addEventListener("keydown", renovar);

    return () => {
      window.clearTimeout(temporizador);
      window.removeEventListener("pointerdown", renovar);
      window.removeEventListener("keydown", renovar);
    };
  }, [etapa.nome, devolvendo, reiniciar]);

  async function entrar() {
    if (entrando) return;

    setEntrando(true);
    setErroLogin(null);

    const resultado = await identificarPessoa(matricula);

    setEntrando(false);

    if (!resultado.ok) {
      setErroLogin({ mensagem: resultado.mensagem, detalhe: resultado.detalhe });
      return;
    }

    setPessoa(resultado.dados.pessoa);
    setCategorias(resultado.dados.categorias);
    setEmprestimos(resultado.dados.emprestimos);
    setEtapa({ nome: "inicio" });
  }

  async function abrirCategoria(tipo: string) {
    setErroLista(null);
    setErroConfirmacao(null);
    setEquipamentos([]);
    setTipoCarregando(tipo);
    setEtapa({ nome: "equipamentos", tipo });

    const resultado = await listarDisponiveis(tipo);

    setTipoCarregando(null);

    if (!resultado.ok) {
      setErroLista({ mensagem: resultado.mensagem, detalhe: resultado.detalhe });
      return;
    }

    setEquipamentos(resultado.dados);
  }

  function alternarItem(id: string) {
    setErroConfirmacao(null);
    setSelecionados((atuais) => {
      if (atuais.some((item) => item.id === id)) {
        return atuais.filter((item) => item.id !== id);
      }

      const equipamento = equipamentos.find((item) => item.id === id);
      return equipamento ? [...atuais, equipamento] : atuais;
    });
  }

  function removerItem(id: string) {
    setErroConfirmacao(null);
    setSelecionados((atuais) => atuais.filter((item) => item.id !== id));
  }

  async function confirmar() {
    if (confirmando) return;

    setConfirmando(true);
    setErroConfirmacao(null);

    const resultado = await confirmarRetirada(
      matricula,
      selecionados.map((item) => item.id),
    );

    setConfirmando(false);

    if (!resultado.ok) {
      setErroConfirmacao({
        mensagem: resultado.mensagem,
        detalhe: resultado.detalhe,
      });

      // O item foi levado por outra pessoa entre a listagem e a confirmação:
      // tira da seleção e da lista para o aluno não tentar de novo no mesmo.
      const perdidos = resultado.indisponiveis ?? [];
      if (perdidos.length > 0) {
        setSelecionados((atuais) =>
          atuais.filter((item) => !perdidos.includes(item.id)),
        );
        setEquipamentos((atuais) =>
          atuais.filter((item) => !perdidos.includes(item.id)),
        );
      }

      if (resultado.motivo === "MATRICULA_NAO_ENCONTRADA") reiniciar();
      return;
    }

    setEtapa({ nome: "sucesso", retirada: resultado.dados });
  }

  /* ----------------------------------------------------------------------- *
   * Fluxo 2 — devolução
   * ----------------------------------------------------------------------- */

  /** Passo 2: o toque em "Devolver" só abre o modal. Nada vai para o banco. */
  function pedirDevolucao(emprestimo: EmprestimoAtivo) {
    abrirModalDeDevolucao([emprestimo]);
  }

  /** O mesmo passo 2, com a lista inteira: o atalho "Devolver tudo". */
  function pedirDevolucaoDeTudo() {
    if (emprestimos.length === 0) return;

    abrirModalDeDevolucao(emprestimos);
  }

  function abrirModalDeDevolucao(alvos: EmprestimoAtivo[]) {
    if (devolvendo) return;

    setErroModal(null);
    setErroDevolucao(null);
    setAviso(null);
    setParaDevolver(alvos);
  }

  function cancelarDevolucao() {
    if (devolvendo) return;

    setParaDevolver(null);
    setErroModal(null);
  }

  /**
   * Passo 4: a confirmação do modal.
   *
   * O equipamento continua `EMPRESTADO` de propósito — quem devolve para o
   * inventário é a secretaria, no /admin. Por isso as categorias não são
   * relidas aqui: a contagem de disponíveis não mudou.
   */
  async function efetivarDevolucao() {
    if (!paraDevolver || paraDevolver.length === 0 || devolvendo) return;

    const alvos = paraDevolver;
    const emLote = alvos.length > 1;

    setDevolvendo(true);
    setErroModal(null);

    // Um item passa pela action de sempre, que filtra por id **e** matrícula. O
    // lote tem action própria: ela decide o alvo no servidor, a partir da
    // matrícula, em vez de aceitar uma lista de ids vinda da tela.
    const resultado = emLote
      ? await devolverTudo(matricula)
      : await confirmarDevolucao(matricula, alvos[0].id);

    setDevolvendo(false);

    if (!resultado.ok) {
      if (resultado.motivo === "MATRICULA_VAZIA") {
        reiniciar();
        return;
      }

      // O empréstimo não está mais ativo (duplo-toque, ou a secretaria deu
      // baixa antes). Insistir no modal não leva a lugar nenhum: fecha, relê a
      // lista e explica na tela de onde o item sumiu.
      if (resultado.motivo === "EMPRESTIMO_NAO_ENCONTRADO") {
        setParaDevolver(null);
        setErroDevolucao({
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });

        const atualizada = await listarEmprestimosAtivos(matricula);
        if (atualizada.ok) setEmprestimos(atualizada.dados);
        return;
      }

      // Falha passageira (banco fora do ar): o modal fica aberto para tentar
      // de novo sem ter de procurar o item na lista outra vez.
      setErroModal({ mensagem: resultado.mensagem, detalhe: resultado.detalhe });
      return;
    }

    setParaDevolver(null);
    setEmprestimos(resultado.dados.restantes);
    setAviso(
      "devolvidos" in resultado.dados
        ? `${resultado.dados.devolvidos.length} equipamentos devolvidos. Deixe todos na bancada.`
        : `${resultado.dados.devolvido.equip_id} devolvido. Deixe na bancada.`,
    );
  }

  const selecionadosPorTipo = selecionados.reduce<Record<string, number>>(
    (contagem, item) => {
      contagem[item.tipo] = (contagem[item.tipo] ?? 0) + 1;
      return contagem;
    },
    {},
  );

  const mostrarBarra = etapa.nome === "inicio" || etapa.nome === "equipamentos";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CabecalhoPortal
        pessoa={etapa.nome === "sucesso" ? null : pessoa}
        onSair={reiniciar}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pt-4 pb-8 sm:px-8">
        {etapa.nome === "matricula" ? (
          <TelaMatricula
            matricula={matricula}
            onMatriculaChange={setMatricula}
            onEnviar={entrar}
            carregando={entrando}
            erro={erroLogin}
          />
        ) : null}

        {etapa.nome === "inicio" && pessoa ? (
          <TelaInicio
            nome={pessoa.nome}
            inativo={pessoa.status === STATUS_PESSOA.inativo}
            categorias={categorias}
            selecionadosPorTipo={selecionadosPorTipo}
            onEscolher={abrirCategoria}
            tipoCarregando={tipoCarregando}
            emprestimos={emprestimos}
            onDevolver={pedirDevolucao}
            onDevolverTudo={pedirDevolucaoDeTudo}
            erroDevolucao={erroDevolucao}
          />
        ) : null}

        {etapa.nome === "equipamentos" ? (
          <TelaEquipamentos
            tipo={etapa.tipo}
            equipamentos={equipamentos}
            selecionados={selecionados.map((item) => item.id)}
            onAlternar={alternarItem}
            onVoltar={() => {
              setErroConfirmacao(null);
              setEtapa({ nome: "inicio" });
            }}
            carregando={tipoCarregando !== null}
            erro={erroLista}
          />
        ) : null}

        {etapa.nome === "sucesso" ? (
          <TelaSucesso
            nome={etapa.retirada.pessoa.nome}
            itens={etapa.retirada.itens}
            onConcluir={reiniciar}
          />
        ) : null}
      </main>

      {mostrarBarra ? (
        <BarraSelecao
          itens={selecionados}
          onRemover={removerItem}
          onConfirmar={confirmar}
          confirmando={confirmando}
          erro={erroConfirmacao}
        />
      ) : null}

      <ModalDevolucao
        emprestimos={paraDevolver}
        onConfirmar={efetivarDevolucao}
        onCancelar={cancelarDevolucao}
        confirmando={devolvendo}
        erro={erroModal}
      />

      <Notificacao mensagem={aviso} onFechar={fecharAviso} />
    </div>
  );
}
