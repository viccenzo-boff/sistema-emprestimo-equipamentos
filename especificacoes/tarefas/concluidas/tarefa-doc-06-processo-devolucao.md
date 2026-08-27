# Tarefa D06: Processo 2 — Devolução de equipamento

Segunda página do portal, e a primeira metade do ciclo que a D07 fecha. É a
página em que a seção "regras que não são óbvias" carrega mais peso do que o
passo a passo — o procedimento tem quatro cliques, e o que precisa ser explicado
é por que ele não termina o que parece terminar.

Arquivo: `docs/portal/devolucao.md`

## 1. Antes de escrever

* Estado de demonstração da D01 no ar, com empréstimos `ATIVO` disponíveis.
* Execute a devolução no navegador e confirme, no `db:studio`, que o
  `Equipamento` **continua** `EMPRESTADO` depois de confirmada.
* Leia [ModalDevolucao.tsx](../../../src/components/portal/ModalDevolucao.tsx) e
  [MeusEquipamentos.tsx](../../../src/components/portal/MeusEquipamentos.tsx).

## 2. O passo a passo

`TelaMatricula` → `TelaInicio` com "Meus equipamentos" → botão "Devolver" da
linha → modal de confirmação → confirmação.

O texto do modal é citado **literalmente**, com a grafia exata da tela. Ele
existe para impedir que a pessoa declare a devolução e leve o aparelho embora —
a advertência é parte do processo, não enfeite de interface.

## 3. Regras que não são óbvias (seção 7)

Esta é a página onde a explicação abaixo precisa ficar impecável. Ela é a mais
citada e a mais mal compreendida do sistema:

* **Devolver no tablet é declarar, não entregar.** O empréstimo passa a
  `AGUARDANDO_BAIXA` e o equipamento **não** volta para disponível. Se voltasse,
  o tablet ofereceria a outro aluno um aparelho que continua em cima da bancada.
  Quem fecha o ciclo é a secretaria, no processo da D07.
* **O horário registrado é o do clique**, não o da conferência. A diferença
  entre os dois é o tempo de prateleira, e existe para medir o gargalo — está
  explicada na página da D07.
* **Cadastro inativo devolve normalmente.** É o outro lado da trava assimétrica
  da D05: a inativação impede retirar, nunca devolver.

Inclua um aviso visual (admonition) apontando para a página da D07, para o
leitor entender onde o ciclo termina.

## 4. Capturas

Em `docs/assets/images/devolucao/`. No mínimo: "Meus equipamentos" com itens
ativos, o botão "Devolver" em destaque, o modal de confirmação com o texto
integral, e o estado da lista logo após a confirmação.

A captura do modal é a mais importante da página. Enquadre de forma que o texto
completo do aviso apareça legível.

## 5. Verificação

* `mkdocs build --strict` em 0 aviso.
* O texto do modal na página bate **caractere a caractere** com o da tela.
* A página deixa explícito, em mais de um lugar, que o equipamento não fica
  disponível — repetição aqui é proposital.
* O link para a página da D07 funciona.
* Nenhuma captura mostra nome que não venha do `db:demo`.
* O diagrama `02-devolucao.svg` está embutido e termina em `AGUARDANDO_BAIXA`.

*Atenção: se em algum momento você escrever que o equipamento "é devolvido ao
estoque" nesta página, está errado — reescreva. Essa é a frase que a regra de
negócio inteira existe para desmentir.*
