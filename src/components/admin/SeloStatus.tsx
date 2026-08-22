import { rotuloDePerfil } from "@/lib/sanitizacao";
import { STATUS_EQUIPAMENTO, STATUS_PESSOA } from "@/lib/tipos";

/**
 * A situação de um equipamento, em uma palavra.
 *
 * Cor **e** palavra, nunca só a cor: a tabela de inventário é lida de relance,
 * e quem não distingue verde de âmbar precisaria adivinhar. O ponto colorido é
 * reforço, não a informação.
 *
 * Os tons vêm dos papéis semânticos da paleta, não de escolha livre: disponível
 * é o estado bom (sucesso), manutenção é o estado que pede atenção (aviso),
 * emprestado é estado neutro de sistema (azul da marca) — não é problema nenhum
 * um equipamento estar na mão de alguém.
 *
 * Inativo é o único sem cor: cinza sobre cinza, o mesmo par que a tabela usa
 * para texto secundário. Não é um estado que peça ação nem que informe boa
 * notícia — é um item que saiu de cena, e a linha inteira deve pesar menos que
 * as vizinhas quando o olho varre a lista.
 */

type Props = {
  status: string;
  className?: string;
};

const SELOS: Record<string, { rotulo: string; caixa: string; ponto: string }> = {
  [STATUS_EQUIPAMENTO.disponivel]: {
    rotulo: "Disponível",
    caixa: "border-sucesso-borda bg-sucesso-fundo text-sucesso",
    ponto: "bg-marca-verde-forte",
  },
  [STATUS_EQUIPAMENTO.emprestado]: {
    rotulo: "Emprestado",
    caixa: "border-borda bg-marca-azul-tenue text-marca-azul",
    ponto: "bg-marca-azul-claro",
  },
  [STATUS_EQUIPAMENTO.manutencao]: {
    rotulo: "Manutenção",
    caixa: "border-aviso-borda bg-aviso-fundo text-aviso",
    ponto: "bg-aviso",
  },
  [STATUS_EQUIPAMENTO.inativo]: {
    rotulo: "Inativo",
    caixa: "border-borda bg-superficie-2 text-tinta-tenue",
    ponto: "bg-tinta-tenue",
  },
};

export function SeloStatus({ status, className = "" }: Props) {
  const selo = SELOS[status] ?? {
    rotulo: status,
    caixa: "border-borda bg-superficie-2 text-tinta-suave",
    ponto: "bg-tinta-tenue",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1",
        "text-sm font-semibold whitespace-nowrap",
        selo.caixa,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={["size-2 rounded-full", selo.ponto].join(" ")} aria-hidden="true" />
      {selo.rotulo}
    </span>
  );
}

/**
 * A situação de um **cadastro de pessoa** (Tarefa 8).
 *
 * Vive neste arquivo, e não no componente da tela, porque "selo" é vocabulário
 * do painel inteiro: a mesma forma, o mesmo raio, a mesma altura de linha nas
 * três tabelas. O que muda é a paleta, e ela segue a mesma lógica semântica do
 * selo de equipamento — inclusive na parte que parece descuido e não é:
 *
 * **Inativo continua sendo o único sem cor.** Cinza sobre cinza, exatamente
 * como o equipamento aposentado. Não é um estado que peça ação nem que dê boa
 * notícia; é um cadastro que saiu de cena, e a linha inteira deve pesar menos
 * quando o olho varre a lista.
 *
 * Ativo é verde, e é o **verde forte** da paleta (5,4:1 sobre branco), não o
 * verde da logo — que dá 3,0:1 e serve para borda e realce, nunca para texto.
 */
const SELOS_DE_PESSOA: Record<string, { rotulo: string; caixa: string; ponto: string }> = {
  [STATUS_PESSOA.ativo]: {
    rotulo: "Ativo",
    caixa: "border-sucesso-borda bg-sucesso-fundo text-sucesso",
    ponto: "bg-marca-verde-forte",
  },
  [STATUS_PESSOA.inativo]: {
    rotulo: "Inativo",
    caixa: "border-borda bg-superficie-2 text-tinta-tenue",
    ponto: "bg-tinta-tenue",
  },
};

export function SeloStatusPessoa({ status, className = "" }: Props) {
  const selo = SELOS_DE_PESSOA[status] ?? {
    rotulo: status,
    caixa: "border-borda bg-superficie-2 text-tinta-suave",
    ponto: "bg-tinta-tenue",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1",
        "text-sm font-semibold whitespace-nowrap",
        selo.caixa,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={["size-2 rounded-full", selo.ponto].join(" ")} aria-hidden="true" />
      {selo.rotulo}
    </span>
  );
}

/**
 * O perfil, em uma palavra.
 *
 * Sem cor de estado de propósito: perfil não é situação — professor não é
 * "melhor" nem "pior" que estudante, e pintar os dois com a paleta semântica
 * faria a coluna competir com o selo ao lado, que **é** situação.
 *
 * O `de-para` que existia aqui saiu na Tarefa 8.1: o banco agora grava o valor
 * já na forma exibida, e quem cuida do caso legado ("ALUNO" em caixa alta, de
 * uma linha que escapou da migration) é o `rotuloDePerfil`.
 */
export function SeloPerfil({ perfil, className = "" }: { perfil: string; className?: string }) {
  const rotulo = rotuloDePerfil(perfil);

  return (
    <span
      className={[
        "inline-flex items-center rounded-lg border border-borda bg-superficie-2 px-2.5 py-0.5",
        "text-sm font-medium whitespace-nowrap text-tinta-suave",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {rotulo}
    </span>
  );
}
