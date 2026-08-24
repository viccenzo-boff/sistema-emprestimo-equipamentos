# Tarefa D08: Processo 4 — Gestão de inventário

Página da secretaria sobre o cadastro e o ciclo de vida do equipamento. A regra
que ela precisa ensinar é a diferença entre **tirar de circulação** e **apagar** —
distinção que o sistema faz de propósito e que a interface não explica sozinha.

Arquivo: `docs/painel/inventario.md`

## 1. Antes de escrever

* Estado de demonstração da D01, com itens em `DISPONIVEL`, `EMPRESTADO`,
  `MANUTENCAO` e `INATIVO`.
* Execute no navegador: cadastrar item, mandar para manutenção, trazer de volta,
  aposentar, reativar, criar categoria e tentar apagar categoria que tem item.
* Leia [GestaoInventario.tsx](src/components/admin/GestaoInventario.tsx),
  [GestaoCategorias.tsx](src/components/admin/GestaoCategorias.tsx) e as actions
  em [src/app/admin/actions.ts](src/app/admin/actions.ts).

## 2. O passo a passo

Cubra quatro procedimentos, cada um com sua sequência numerada:

1. Cadastrar um equipamento novo (incluindo a normalização da etiqueta).
2. Enviar para manutenção e trazer de volta.
3. Aposentar um item e reativar.
4. Criar e apagar categoria.

## 3. Regras que não são óbvias (seção 7)

* **Equipamento nunca é apagado.** O histórico de empréstimos aponta para ele, e
  apagar levaria junto o registro do semestre passado. Aposentar (`INATIVO`) é a
  forma de tirar de circulação: o item some do tablet — nem nas contagens entra —
  e continua na lista do inventário, em cinza, com botão de reativar.
* **Manutenção e aposentadoria não são a mesma coisa.** Manutenção é temporária e
  operacional; aposentadoria é o fim da vida útil do aparelho. Deixe a diferença
  explícita, porque a interface oferece as duas lado a lado.
* **Categoria, ao contrário, pode ser apagada de verdade** — nenhum empréstimo
  aponta para ela. Mas só quando está vazia, e quem recusa é o próprio banco de
  dados, não uma validação de tela. Explique o que a secretária vê quando tenta.
* **Item com empréstimo aberto tem a situação travada** até o ciclo fechar. Aqui
  o comportamento é o **oposto** do da pessoa (D09), e a página precisa dizer
  isso, porque a mesma palavra "inativar" produz resultados diferentes nas duas
  telas.

## 4. Capturas

Em `docs/assets/images/inventario/`. No mínimo: lista com os quatro status
visíveis ao mesmo tempo, formulário de cadastro, item aposentado em cinza com o
botão de reativar, gestão de categorias, e a mensagem de recusa ao apagar
categoria não vazia.

A captura da lista com os quatro status juntos é a mais didática da página —
monte o estado para consegui-la.

## 5. Verificação

* `mkdocs build --strict` em 0 aviso.
* Os quatro procedimentos têm sequência numerada própria.
* A diferença entre manutenção e aposentadoria está dita em uma frase que um
  leitor apressado não confunde.
* A comparação com a inativação de pessoa (D09) está presente e linkada.
* O diagrama `04-inventario.svg` está embutido.
* Nenhuma captura mostra dado fora do `db:demo`.
