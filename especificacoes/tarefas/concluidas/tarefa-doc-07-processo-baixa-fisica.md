# Tarefa D07: Processo 3 — Baixa física (Fila de Devoluções)

Primeira página da trilha da secretaria, e o fechamento do ciclo que a D06
deixou aberto. É a página mais valiosa da wiki: ela documenta a decisão de
produto que dá identidade ao sistema.

Arquivo: `docs/painel/baixa-fisica.md`

## 1. Antes de escrever

* Estado de demonstração da D01 com ao menos três empréstimos em
  `AGUARDANDO_BAIXA`.
* Execute a baixa no navegador e confirme no `db:studio`: `Emprestimo` vai a
  `CONCLUIDO`, `data_baixa` é preenchida, `data_devolucao` **permanece
  intacta**, e o `Equipamento` volta a `DISPONIVEL`.
* Leia [FilaDeDevolucoes.tsx](../../../src/components/admin/FilaDeDevolucoes.tsx) e a
  action correspondente em [src/app/admin/actions.ts](../../../src/app/admin/actions.ts).

## 2. O passo a passo

Login no painel → Fila de Devoluções → conferir fisicamente o aparelho na bancada
→ "Confirmar Recebimento Físico".

O passo da conferência física **não é um clique** e precisa aparecer como passo
mesmo assim. É a única etapa do sistema inteiro que acontece fora da tela, e
omiti-la faz a página descrever um processo que não é o real.

## 3. Regras que não são óbvias (seção 7)

* **Só esta confirmação devolve o equipamento ao estoque.** Enquanto o
  empréstimo estiver na fila, o aparelho está invisível para o tablet e continua
  contando como fora.
* **Três marcadores de tempo, cada um com um dono.** `data_retirada` é o tablet
  entregando; `data_devolucao` é o tablet registrando a declaração do usuário;
  `data_baixa` é a secretaria conferindo. A diferença entre os dois últimos é o
  **tempo de prateleira** — o aparelho parado na bancada, invisível para o
  tablet e para o inventário. Serve para medir gargalo de operação.
* **Confirmar duas vezes o mesmo item não causa efeito duplicado.** O sistema
  trata a repetição; explique que a secretária pode clicar sem medo se ficar em
  dúvida se o clique registrou.

## 4. Uma nota de manutenção que vale registrar

Vale uma linha na página (ou no registro de decisões da tarefa): até a Tarefa 12,
a baixa **sobrescrevia** a `data_devolucao`, e por isso o tempo de prateleira dava
sempre zero. Se alguém reintroduzir aquela linha no `updateMany` da baixa, a
métrica volta a mentir **sem nenhum erro aparecer**. Documentar isso é o que
transforma a wiki em defesa contra regressão, e não só em manual.

Se preferir manter a página limpa para a secretaria, ponha essa nota na página de
regras de negócio da D10 e deixe aqui só o link.

## 5. Capturas

Em `docs/assets/images/baixa-fisica/`. No mínimo: a fila com vários itens, uma
linha isolada mostrando os dados do empréstimo, o botão de confirmação, e a fila
depois da baixa (com o item a menos).

Se a interface exibir o tempo decorrido, capture um caso com diferença visível —
o `db:demo` foi construído para produzir isso.

## 6. Verificação

* `mkdocs build --strict` em 0 aviso.
* A conferência física aparece como passo numerado.
* A explicação dos três marcadores de tempo está em linguagem de usuário, sem
  citar nome de campo do banco no corpo do texto (nome de campo entre parênteses
  ou em nota é aceitável).
* O link de volta para a página da D06 funciona, e o da D06 para cá também.
* O diagrama `03-baixa-fisica.svg` está embutido e começa onde o `02` termina.
