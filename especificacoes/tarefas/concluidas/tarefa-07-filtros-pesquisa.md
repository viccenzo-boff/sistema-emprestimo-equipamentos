# Tarefa 07: Usabilidade do Inventário (Pesquisa e Filtros)

Esta tarefa tem como objetivo melhorar a usabilidade da página principal de Inventário (`/admin/inventario`), facilitando a localização de equipamentos em listas longas.

## 1. Barra de Pesquisa Geral
* **Localização:** Adicione uma barra de pesquisa (input de texto) acima da tabela de equipamentos (e abaixo da seção de resumo/cards).
* **Funcionalidade:** 
  * O input deve ter um placeholder descritivo: "Buscar por etiqueta ou categoria...".
  * A pesquisa deve ser em tempo real (client-side filtrando os dados já carregados na tabela) ou via query params (server-side) - escolha a que oferecer melhor performance para o padrão Next.js App Router.
  * A busca deve considerar tanto a coluna de Etiqueta (ex: "NOTE-11") quanto o nome da Categoria vinculada.

## 2. Filtro por Categoria e Status
* **Localização:** Adicione botões de filtro ou menus Dropdown (`<select>`) ao lado da barra de pesquisa.
* **Filtros Necessários:**
  1. **Filtro de Categoria:** Um seletor populado com as categorias existentes no banco de dados. Permite que o administrador veja apenas "Notebooks" ou apenas "Extensões". Deve incluir a opção "Todas as categorias".
  2. **Filtro de Status:** Um seletor com as opções: "Todos", "Disponível", "Emprestado", "Manutenção" e "Inativo".

## 3. UI/UX: Feedback de Estado Vazio
* Se uma pesquisa ou filtro não retornar nenhum equipamento, a tabela não deve ficar em branco de forma que pareça um erro.
* Exiba uma mensagem amigável no centro da tabela, como: "Nenhum equipamento encontrado com estes filtros."

*Nota para a IA: Não é necessário criar funcionalidade de pesquisa na tela de Categorias (`/admin/categorias`) neste momento, pois a lista esperada é pequena. Foco total na página de Inventário.*