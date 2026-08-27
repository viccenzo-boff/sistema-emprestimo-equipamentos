# Tarefa 06: Gestão Avançada de Inventário e Categorias

Esta tarefa visa melhorar a gestão de equipamentos no painel administrativo, introduzindo o gerenciamento de categorias e novas ações para os itens. Leia atentamente as mudanças no banco de dados e na interface.

## 1. Atualização do Banco de Dados (Prisma Schema)
* **Nova Tabela `Categoria`**:
  * `id` (Int, PK, autoincrement)
  * `nome` (String, unique)
* **Atualização na Tabela `Equipamento`**:
  * Substitua o campo `tipo` (String) por um relacionamento obrigatório com a tabela `Categoria` (campo `categoriaId`).
  * Adicione um novo status possível para o equipamento: `INATIVO`. O campo `status` agora aceita: "DISPONIVEL", "EMPRESTADO", "MANUTENCAO", "INATIVO".

*Nota para a IA: Após alterar o `schema.prisma`, gere e aplique a migration no banco SQLite de desenvolvimento para refletir essas mudanças antes de codificar as telas.*

## 2. Nova Tela: Gestão de Categorias (`/admin/categorias`)
* Adicione um novo item no menu lateral esquerdo chamado "Categorias", localizado abaixo de "Inventário".
* Crie a página `/admin/categorias`.
* Esta página deve ter:
  * Um formulário simples para cadastrar uma nova categoria (apenas um input de texto e botão "Cadastrar").
  * Uma lista/tabela das categorias existentes.
  * Na lista, adicione a opção de excluir a categoria (a exclusão só deve ser permitida pelo banco se não houver nenhum equipamento vinculado a ela).

## 3. Melhoria: Cadastro de Equipamentos (`/admin/inventario`)
* No formulário de "Cadastrar equipamento" no topo da página de Inventário, o campo "Categoria" deve ser alterado. Ele não pode mais ser um campo de texto livre com autocompletar.
* Transforme-o em um `<select>` HTML nativo populado dinamicamente com os dados da nova tabela `Categoria`.

## 4. Novas Ações de Equipamento (Editar e Inativar)
Na lista de equipamentos (tabela inferior da página de Inventário), adicione novas ações:
* **Editar Etiqueta (Lápis):**
  * **Regra de Negócio:** O botão de editar só deve aparecer (ou estar habilitado) se o equipamento estiver `DISPONIVEL`.
  * Ao clicar, abra um Modal simples para alterar o código/nome da etiqueta do equipamento.
* **Inativar (Ícone de Lixeira ou Bloqueio):**
  * **Regra de Negócio:** Equipamentos NÃO devem ser deletados do banco de dados para não quebrar o histórico de empréstimos. Eles devem ser inativados.
  * O botão só deve estar visível/habilitado se o status for `DISPONIVEL` ou `MANUTENCAO`.
  * Ao clicar, exiba um Modal de confirmação: *"Tem certeza que deseja inativar este equipamento? Ele não aparecerá mais para novos empréstimos."*
  * Ao confirmar, mude o status no banco para `INATIVO`.
  * Equipamentos inativos devem continuar aparecendo na lista do inventário, mas com um selo/status visual diferenciado (ex: cor cinza) indicando "Inativo".