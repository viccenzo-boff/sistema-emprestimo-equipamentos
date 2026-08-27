# Tarefa D05: Processo 1 — Retirada de equipamento

Primeira página de processo da wiki. Ela estabelece o padrão que as quatro
seguintes vão repetir — se algo no template da D03 não funcionar na prática,
descobre-se aqui, e o template é corrigido antes de multiplicar o erro.

Arquivo: `docs/portal/retirada.md`

## 1. Antes de escrever

* Suba o estado de demonstração da D01 (`db:reset`, `db:seed`, `db:demo`, `dev`).
* **Execute o fluxo inteiro no navegador**, do teclado da matrícula até a tela de
  sucesso. Documentação escrita de memória é a que envelhece sem ninguém notar.
* Leia [src/app/actions.ts](../../../src/app/actions.ts) e os componentes de
  [src/components/portal/](../../../src/components/portal/) para conferir cada ramificação.

## 2. O passo a passo

O caminho feliz, em ordem de tela: `TelaMatricula` → `TelaInicio` →
`TelaCategorias` → `TelaEquipamentos` → `BarraSelecao` → `TelaSucesso`.

Ramificações que **precisam** aparecer como decisão explícita, porque cada uma
leva a uma saída diferente:

* Matrícula não encontrada.
* Matrícula encontrada mas com cadastro `INATIVO` — a pessoa entra no portal, e
  no lugar da grade de categorias aparece uma explicação. Não é erro, é regra.
* Categoria sem nenhum item disponível.

## 3. Regras que não são óbvias (seção 7)

Escreva estas três em linguagem de usuário final. A fonte é a seção "Regra de
negócio que não é óbvia pelo código" do [AGENTS.md](../../../AGENTS.md).

* **Cada item retirado vira um registro separado.** Levar três itens de uma vez
  gera três empréstimos, não um com três itens. É o que permite devolver um e
  ficar com os outros dois.
* **Cadastro inativo entra no portal, mas não retira.** A trava é assimétrica de
  propósito: quem foi inativado costuma estar com um aparelho na mochila, e
  travar os dois lados garantiria que o equipamento nunca voltasse.
* **A etiqueta aparece inteira e em fonte monoespaçada** (`NOTE-01`) porque
  precisa bater caractere a caractere com o adesivo colado no aparelho. Por isso
  ela nunca é abreviada nem "embelezada" na tela.

## 4. Capturas

Em `docs/assets/images/retirada/`, nomeadas `NN-acao-descrita.png` conforme a
D03. No mínimo: teclado da matrícula, tela inicial com categorias, lista de
equipamentos de uma categoria, barra de seleção com itens escolhidos, tela de
sucesso, e as telas das três ramificações da §2.

Janela em 1280x800 (paisagem), a medida de referência do
[AGENTS.md](../../../AGENTS.md).

## 5. Verificação

* `mkdocs build --strict` em 0 aviso.
* Cada passo numerado corresponde a exatamente uma ação do usuário.
* Cada ramificação está no formato "Se SIM → / Se NÃO →".
* Toda captura abre em tamanho cheio ao clicar.
* Nenhuma captura mostra nome que não venha do `db:demo`.
* O diagrama `01-retirada.svg` está embutido e o link para o `.bpmn` funciona.
* **Teste de leitor leigo:** alguém que nunca viu o sistema consegue fazer uma
  retirada seguindo só esta página. Se você não tiver quem testar, releia
  fingindo não saber onde ficam os botões — e corrija todo passo que só faz
  sentido para quem já conhece a tela.
