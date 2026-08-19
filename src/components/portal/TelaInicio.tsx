"use client";

import { MeusEquipamentos } from "@/components/portal/MeusEquipamentos";
import { TelaCategorias } from "@/components/portal/TelaCategorias";
import { Alerta } from "@/components/ui/Alerta";
import { primeiroNome } from "@/lib/texto";
import type { Categoria, EmprestimoAtivo } from "@/lib/tipos";

/**
 * A tela que aparece logo depois da matrícula. É o encontro dos dois fluxos:
 * daqui a pessoa retira (Fluxo 1) ou devolve (Fluxo 2).
 *
 * Layout: empilhado em retrato, duas colunas em paisagem — a mesma solução da
 * [TelaMatricula](src/components/portal/TelaMatricula.tsx), pelo mesmo motivo
 * medido. Empilhado nos dois casos, três empréstimos já empurravam a grade de
 * categorias para fora da tela em um tablet deitado (1280x800): quem vinha
 * retirar via três caixas de ícone sem rótulo. Em duas colunas as duas tarefas
 * cabem inteiras, e a lista pode crescer sem empurrar nada.
 *
 * "Meus equipamentos" fica na coluna da esquerda e primeiro no HTML: em retrato
 * é o que aparece antes, e quem chega com um notebook na mão veio devolver —
 * a tarefa mais curta das duas. Ordem visual e ordem de leitura são a mesma,
 * então o foco pelo teclado segue o que o olho vê.
 *
 * Sem nenhum empréstimo ativo, a seção some inteira e a tela volta a ser
 * exatamente a do Fluxo 1 — nada de "você não tem equipamentos", que é ocupar
 * a tela para não dizer nada.
 *
 * **Cadastro inativo (Tarefa 8) troca a grade de categorias por uma
 * explicação, e mantém "Meus equipamentos" no lugar.** A assimetria é a regra
 * de negócio inteira, desenhada: quem foi inativado não retira, mas continua
 * devolvendo. Esconder as categorias é honestidade — oferecer uma prateleira
 * que a confirmação vai recusar é fazer a pessoa escolher três notebooks para
 * levar um "não" no fim. A recusa de verdade continua no servidor
 * ([confirmarRetirada](src/app/actions.ts)); esta tela é conveniência.
 */

type Props = {
  nome: string;
  /** Cadastro `INATIVO`: pode devolver, não pode retirar. */
  inativo: boolean;
  categorias: Categoria[];
  selecionadosPorTipo: Record<string, number>;
  onEscolher: (tipo: string) => void;
  tipoCarregando: string | null;
  emprestimos: EmprestimoAtivo[];
  onDevolver: (emprestimo: EmprestimoAtivo) => void;
  onDevolverTudo: () => void;
  erroDevolucao: { mensagem: string; detalhe?: string } | null;
};

export function TelaInicio({
  nome,
  inativo,
  categorias,
  selecionadosPorTipo,
  onEscolher,
  tipoCarregando,
  emprestimos,
  onDevolver,
  onDevolverTudo,
  erroDevolucao,
}: Props) {
  const temEmprestimos = emprestimos.length > 0;

  // Duas colunas só quando há duas coisas para pôr nelas. Com o cadastro
  // inativo e nada emprestado, a tela é só o aviso — e ele fica no meio.
  const duasColunas = temEmprestimos && !inativo;

  return (
    <div className="animate-surgir flex flex-col gap-8">
      <div>
        <p className="text-lg text-tinta-suave">
          Olá, <span className="font-semibold text-tinta">{primeiroNome(nome)}</span>.
        </p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight text-balance text-marca-azul">
          {tituloDaTela(inativo, temEmprestimos)}
        </h1>
      </div>

      <div
        className={
          duasColunas
            ? "grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-x-10"
            : "flex flex-col gap-8"
        }
      >
        {temEmprestimos ? (
          <MeusEquipamentos
            emprestimos={emprestimos}
            onDevolver={onDevolver}
            onDevolverTudo={onDevolverTudo}
            erro={erroDevolucao}
          />
        ) : null}

        {inativo ? (
          <Alerta
            tom="aviso"
            mensagem="Este cadastro está inativo e não pode retirar equipamento."
            detalhe={
              temEmprestimos
                ? "A devolução continua liberada — use o botão ao lado de cada item acima. Para voltar a retirar, procure a secretaria."
                : "Procure a secretaria para reativar a sua matrícula."
            }
          />
        ) : (
          <TelaCategorias
            categorias={categorias}
            selecionadosPorTipo={selecionadosPorTipo}
            onEscolher={onEscolher}
            tipoCarregando={tipoCarregando}
            titulo={temEmprestimos ? "Retirar equipamento" : undefined}
            colunas={temEmprestimos ? 2 : 3}
          />
        )}
      </div>
    </div>
  );
}

/**
 * O `h1` muda com o que a pessoa pode fazer aqui.
 *
 * Perguntar "o que você vai levar?" para quem não pode levar nada seria a tela
 * oferecendo o que ela mesma vai recusar. Com cadastro inativo e um aparelho na
 * mão, a única tarefa disponível é devolver — e o título diz isso.
 */
function tituloDaTela(inativo: boolean, temEmprestimos: boolean): string {
  if (inativo) {
    return temEmprestimos ? "Devolver equipamento" : "Cadastro inativo";
  }

  return temEmprestimos ? "O que você quer fazer?" : "O que você vai levar?";
}
