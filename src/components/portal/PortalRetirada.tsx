"use client";

import { useCallback, useEffect, useState } from "react";

import {
  confirmarRetirada,
  identificarUsuario,
  listarDisponiveis,
} from "@/app/actions";
import { BarraSelecao } from "@/components/portal/BarraSelecao";
import { CabecalhoPortal } from "@/components/portal/CabecalhoPortal";
import { TelaCategorias } from "@/components/portal/TelaCategorias";
import { TelaEquipamentos } from "@/components/portal/TelaEquipamentos";
import { TelaMatricula } from "@/components/portal/TelaMatricula";
import { TelaSucesso } from "@/components/portal/TelaSucesso";
import type {
  Categoria,
  EquipamentoDisponivel,
  RetiradaConfirmada,
  UsuarioIdentificado,
} from "@/lib/tipos";

/**
 * Fluxo 1 da spec — Retirada de Equipamento.
 *
 * Todo o fluxo mora em uma rota só. Trocar de tela aqui é trocar de estado, não
 * navegar: o aluno está de pé na bancada, e voltar uma etapa não pode custar um
 * carregamento de página nem correr o risco de o botão "voltar" do navegador
 * ressuscitar uma seleção antiga.
 *
 * Os dados nunca vêm do render da página — vêm de Server Actions, chamadas no
 * momento do toque. Isso mantém a lista de equipamentos disponíveis sempre
 * fresca, mesmo que a página fique aberta a tarde inteira.
 */

type Etapa =
  | { nome: "matricula" }
  | { nome: "categorias" }
  | { nome: "equipamentos"; tipo: string }
  | { nome: "sucesso"; retirada: RetiradaConfirmada };

type Falha = { mensagem: string; detalhe?: string };

/**
 * Tablet parado volta ao início sozinho. Sem isso, quem desiste no meio do
 * fluxo deixa a sessão aberta e o próximo aluno retira equipamento no nome
 * de outra pessoa. Dois minutos é folgado para quem está escolhendo.
 */
const INATIVIDADE_MS = 120_000;

export function PortalRetirada() {
  const [etapa, setEtapa] = useState<Etapa>({ nome: "matricula" });
  const [matricula, setMatricula] = useState("");
  const [usuario, setUsuario] = useState<UsuarioIdentificado | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoDisponivel[]>([]);
  const [selecionados, setSelecionados] = useState<EquipamentoDisponivel[]>([]);

  const [entrando, setEntrando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [tipoCarregando, setTipoCarregando] = useState<string | null>(null);

  const [erroLogin, setErroLogin] = useState<Falha | null>(null);
  const [erroLista, setErroLista] = useState<Falha | null>(null);
  const [erroConfirmacao, setErroConfirmacao] = useState<Falha | null>(null);

  const reiniciar = useCallback(() => {
    setEtapa({ nome: "matricula" });
    setMatricula("");
    setUsuario(null);
    setCategorias([]);
    setEquipamentos([]);
    setSelecionados([]);
    setErroLogin(null);
    setErroLista(null);
    setErroConfirmacao(null);
  }, []);

  // Zera a sessão depois de um tempo sem nenhum toque (ver INATIVIDADE_MS).
  useEffect(() => {
    if (etapa.nome === "matricula" || etapa.nome === "sucesso") return;

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
  }, [etapa.nome, reiniciar]);

  async function entrar() {
    if (entrando) return;

    setEntrando(true);
    setErroLogin(null);

    const resultado = await identificarUsuario(matricula);

    setEntrando(false);

    if (!resultado.ok) {
      setErroLogin({ mensagem: resultado.mensagem, detalhe: resultado.detalhe });
      return;
    }

    setUsuario(resultado.dados.usuario);
    setCategorias(resultado.dados.categorias);
    setEtapa({ nome: "categorias" });
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

  const selecionadosPorTipo = selecionados.reduce<Record<string, number>>(
    (contagem, item) => {
      contagem[item.tipo] = (contagem[item.tipo] ?? 0) + 1;
      return contagem;
    },
    {},
  );

  const mostrarBarra = etapa.nome === "categorias" || etapa.nome === "equipamentos";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CabecalhoPortal
        usuario={etapa.nome === "sucesso" ? null : usuario}
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

        {etapa.nome === "categorias" && usuario ? (
          <TelaCategorias
            nome={usuario.nome}
            categorias={categorias}
            selecionadosPorTipo={selecionadosPorTipo}
            onEscolher={abrirCategoria}
            tipoCarregando={tipoCarregando}
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
              setEtapa({ nome: "categorias" });
            }}
            carregando={tipoCarregando !== null}
            erro={erroLista}
          />
        ) : null}

        {etapa.nome === "sucesso" ? (
          <TelaSucesso
            nome={etapa.retirada.usuario.nome}
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
    </div>
  );
}
