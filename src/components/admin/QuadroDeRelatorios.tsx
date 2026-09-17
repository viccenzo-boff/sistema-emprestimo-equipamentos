"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

import { Botao } from "@/components/ui/Botao";
import { CAMPO_SEM_LADOS, Selecao } from "@/components/ui/Campo";
import { lerDia, UNIDADE_DE_PERIODO, type UnidadeDePeriodo } from "@/lib/periodo";
import { diaLocal } from "@/lib/texto";

/**
 * O quadro dos relatórios (Tarefa 16, §1): a linha do seletor de período em
 * cima, e embaixo o conteúdo que o período escopa — a barra de abas e os
 * painéis, que chegam prontos do servidor como `children`.
 *
 * É ilha de cliente porque é aqui que mora a transição: trocar o período é
 * `router.push` dentro de `useTransition`, e enquanto o servidor responde o
 * conteúdo fica com opacidade reduzida e `aria-busy`. **Sem `loading.tsx`**,
 * de propósito — esqueleto piscando é o anti-padrão, e o relatório anterior
 * continua legível até o novo chegar.
 *
 * O período muda a **consulta**, não recorta dado que já desceu: por isso
 * ele vive nos `searchParams` (lidos no render do servidor) e não em estado
 * de cliente como os filtros do inventário. Trocar de aba, ao contrário, não
 * vai ao servidor — ver `AbasDeRelatorios`.
 */

type Props = {
  /** `de`/`ate` em AAAA-MM-DD, os que o servidor aplicou (já resolvidos, nunca "este mês"). */
  de: string;
  ate: string;
  /** A unidade derivada do intervalo aplicado — a tela nasce mostrando esta. */
  unidade: UnidadeDePeriodo;
  /** O período por extenso, formatado no servidor. */
  porExtenso: string;
  /** Os anos do `<select>` — da primeira retirada ao corrente. */
  anos: number[];
  children: ReactNode;
};

export function QuadroDeRelatorios({ de, ate, unidade, porExtenso, anos, children }: Props) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [pendente, iniciarTransicao] = useTransition();

  /**
   * A URL canônica: `?aba=…&de=…&ate=…`. A aba vem dos `searchParams` que o
   * `history.replaceState` das abas mantém em dia — é o que faz trocar o
   * período **manter a aba**, que é o motivo de a aba ter ido para a URL.
   */
  function aplicar(novoDe: string, novoAte: string) {
    if (novoDe === de && novoAte === ate) return;

    const aba = parametros.get("aba");
    const consulta = new URLSearchParams();
    if (aba) consulta.set("aba", aba);
    consulta.set("de", novoDe);
    consulta.set("ate", novoAte);

    iniciarTransicao(() => {
      // `scroll: false`: quem trocou o período está olhando o quadro, e o
      // relatório novo entra no lugar do antigo sem a página pular ao topo.
      router.push(`/admin/relatorios?${consulta.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/*
        O seletor é remontado a cada período aplicado (`key`): o estado local
        dele — a unidade em edição, os dois campos do intervalo — nasce do
        período novo, e não sobra valor digitado de uma navegação anterior.
      */}
      <SeletorDePeriodo
        key={`${de}|${ate}`}
        de={de}
        ate={ate}
        unidade={unidade}
        porExtenso={porExtenso}
        anos={anos}
        aoAplicar={aplicar}
        pendente={pendente}
      />

      <div
        aria-busy={pendente || undefined}
        className={[
          "transition-opacity duration-200",
          pendente ? "pointer-events-none opacity-60" : "opacity-100",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * O seletor
 * ------------------------------------------------------------------------- */

const UNIDADES: { id: UnidadeDePeriodo; rotulo: string }[] = [
  { id: UNIDADE_DE_PERIODO.dia, rotulo: "Dia" },
  { id: UNIDADE_DE_PERIODO.mes, rotulo: "Mês" },
  { id: UNIDADE_DE_PERIODO.ano, rotulo: "Ano" },
  { id: UNIDADE_DE_PERIODO.intervalo, rotulo: "Período" },
];

/**
 * Quanto tempo o campo de data espera antes de aplicar (ms).
 *
 * Medido no Chrome (pt-BR): o `change` de um `<input type="date">` dispara
 * **a cada tecla** que produz um valor válido — e antes disso dispara com o
 * valor vazio. Digitar "10" no campo de mês navegaria para janeiro e depois
 * para outubro. A folga deixa quem digita terminar; quem escolhe no
 * calendário nem percebe. Não é um debounce de rede — é um debounce de dedo.
 */
const FOLGA_DE_DIGITACAO_MS = 500;

/** O primeiro ano que os campos aceitam. Antes disso não há retirada, e `0002` (o ano a meio caminho de digitar 2026) fica inválido em vez de navegar. */
const ANO_MINIMO = 2020;

type PropsDoSeletor = {
  de: string;
  ate: string;
  unidade: UnidadeDePeriodo;
  porExtenso: string;
  anos: number[];
  aoAplicar: (de: string, ate: string) => void;
  pendente: boolean;
};

/**
 * Uma linha, alinhada à esquerda, acima da barra de abas — nunca dentro de
 * um cartão: uma linha de filtro acima de tudo que ela escopa é o padrão de
 * dashboard, e a coordenação lê "setembro de 2026" antes de ler os números.
 *
 * **A unidade aplicada é derivada da URL** (`unidade`); a unidade em edição
 * é estado local que nasce dela e é reposto a cada período aplicado (o `key`
 * no quadro). É o que permite clicar em "Período" e editar dois campos sem
 * navegar no meio — Dia, Mês e Ano aplicam na mudança do próprio campo;
 * Período precisa do **Aplicar**, porque dois campos aplicados um a um
 * navegariam com o segundo ainda por preencher.
 *
 * Quatro controles nativos, sem biblioteca de calendário: o projeto não tem
 * nenhuma, e o `<input type="date">` do Chrome tem o calendário embutido.
 */
function SeletorDePeriodo({ de, ate, unidade, porExtenso, anos, aoAplicar, pendente }: PropsDoSeletor) {
  const [unidadeEmEdicao, setUnidadeEmEdicao] = useState<UnidadeDePeriodo>(unidade);
  const [intervaloDe, setIntervaloDe] = useState(de);
  const [intervaloAte, setIntervaloAte] = useState(ate);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // O seletor é remontado a cada período aplicado; um temporizador da
  // instância anterior não pode navegar depois que ela sumiu.
  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const anoCorrente = anos[anos.length - 1] ?? new Date().getFullYear();
  const minimo = `${ANO_MINIMO}-01-01`;
  const maximo = `${anoCorrente}-12-31`;

  /** Aplica depois da folga, e só um valor válido dentro de `min`/`max`. */
  function aplicarComFolga(campo: HTMLInputElement, montar: (valor: string) => [string, string] | null) {
    if (temporizador.current) clearTimeout(temporizador.current);
    if (!campo.validity.valid || campo.value === "") return;

    const periodo = montar(campo.value);
    if (!periodo) return;

    temporizador.current = setTimeout(() => aoAplicar(periodo[0], periodo[1]), FOLGA_DE_DIGITACAO_MS);
  }

  const diaDeIntervaloValido = lerDia(intervaloDe);
  const diaDeIntervaloAteValido = lerDia(intervaloAte);
  const intervaloValido =
    diaDeIntervaloValido !== null &&
    diaDeIntervaloAteValido !== null &&
    diaDeIntervaloValido.getTime() <= diaDeIntervaloAteValido.getTime();

  /*
    O campo de data é o `CAMPO_SEM_LADOS` do painel com o seu recuo, e a
    largura vem do invólucro (`w-44`), nunca de uma utilidade por cima: no
    Tailwind 4 `w-auto` contra o `w-full` do campo se resolve pela ordem do
    CSS gerado, não pela ordem no atributo — a armadilha registrada para os
    tamanhos do `Botao`. Toda a linha fica em 56 px: os campos são `min-h-14`
    com borda de 2 px, e os botões de unidade são `min-h-11` dentro de um
    grupo com `p-1` e a mesma borda (2 + 4 + 44 + 4 + 2).
  */
  const campoDeData = `${CAMPO_SEM_LADOS} px-3`;

  return (
    <section aria-label="Período do relatório" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Unidade do período"
          className="flex rounded-2xl border-2 border-borda bg-superficie-2 p-1"
        >
          {UNIDADES.map(({ id, rotulo }) => {
            const escolhida = id === unidadeEmEdicao;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={escolhida}
                onClick={() => setUnidadeEmEdicao(id)}
                className={[
                  "min-h-11 rounded-xl px-3.5 text-base font-semibold transition-colors duration-150",
                  escolhida ? "bg-superficie text-marca-azul shadow-sm" : "text-tinta-suave hover:text-tinta",
                ].join(" ")}
              >
                {rotulo}
              </button>
            );
          })}
        </div>

        {unidadeEmEdicao === UNIDADE_DE_PERIODO.dia ? (
          <div className="w-44">
            <input
              type="date"
              aria-label="Dia"
              defaultValue={de}
              min={minimo}
              max={maximo}
              disabled={pendente}
              onChange={(evento) => aplicarComFolga(evento.currentTarget, (valor) => [valor, valor])}
              className={campoDeData}
            />
          </div>
        ) : null}

        {/* O de mês é mais largo que o de dia: "setembro de 2026" mais o ícone do calendário não cabem em 11 rem. */}
        {unidadeEmEdicao === UNIDADE_DE_PERIODO.mes ? (
          <div className="w-60">
            <input
              type="month"
              aria-label="Mês"
              defaultValue={de.slice(0, 7)}
              min={minimo.slice(0, 7)}
              max={maximo.slice(0, 7)}
              disabled={pendente}
              onChange={(evento) => aplicarComFolga(evento.currentTarget, mesInteiro)}
              className={campoDeData}
            />
          </div>
        ) : null}

        {unidadeEmEdicao === UNIDADE_DE_PERIODO.ano ? (
          <div className="w-36">
            <Selecao
              aria-label="Ano"
              defaultValue={anos.includes(Number(de.slice(0, 4))) ? de.slice(0, 4) : String(anoCorrente)}
              disabled={pendente}
              onChange={(evento) => {
                const ano = evento.currentTarget.value;
                aoAplicar(`${ano}-01-01`, `${ano}-12-31`);
              }}
            >
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </Selecao>
          </div>
        ) : null}

        {unidadeEmEdicao === UNIDADE_DE_PERIODO.intervalo ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-base text-tinta-suave">
              De
              <span className="w-44">
                <input
                  type="date"
                  aria-label="Início do período"
                  value={intervaloDe}
                  min={minimo}
                  max={maximo}
                  disabled={pendente}
                  onChange={(evento) => setIntervaloDe(evento.currentTarget.value)}
                  className={campoDeData}
                />
              </span>
            </label>
            <label className="flex items-center gap-2 text-base text-tinta-suave">
              até
              <span className="w-44">
                <input
                  type="date"
                  aria-label="Fim do período"
                  value={intervaloAte}
                  min={minimo}
                  max={maximo}
                  disabled={pendente}
                  onChange={(evento) => setIntervaloAte(evento.currentTarget.value)}
                  className={campoDeData}
                />
              </span>
            </label>
            <Botao
              variante="secundario"
              tamanho="pequeno"
              disabled={!intervaloValido}
              carregando={pendente}
              onClick={() => aoAplicar(intervaloDe, intervaloAte)}
            >
              Aplicar
            </Botao>
          </div>
        ) : null}
      </div>

      {/*
        O período aplicado, por extenso, formatado no servidor: em relatório,
        o leitor precisa ver a que janela o número se refere — e o campo em
        edição pode estar mostrando outra coisa enquanto ele decide.
      */}
      <p className="text-base text-tinta-suave">
        Mostrando <strong className="font-semibold text-tinta">{porExtenso}</strong>.
      </p>
    </section>
  );
}

/** "2026-09" → o mês inteiro, primeiro e último dia. */
function mesInteiro(valor: string): [string, string] | null {
  const [ano, mes] = valor.split("-").map(Number);
  if (!ano || !mes) return null;

  const primeiro = new Date(ano, mes - 1, 1);
  const ultimo = new Date(ano, mes, 0);
  return [diaLocal(primeiro), diaLocal(ultimo)];
}
