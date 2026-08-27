# Tarefa 13: Módulo de Relatórios e Relatório de Ocupação

Esta tarefa inaugura o módulo analítico do sistema. O objetivo é criar a estrutura de navegação dos relatórios e implementar o primeiro painel de dados (Ocupação e Capacidade).

## 1. Navegação e Layout Base
* **Menu Lateral:** Adicione um novo item "Relatórios" (ícone de gráfico) no menu lateral do painel administrativo.
* **Página de Relatórios (`/admin/relatorios`):**
  * Crie um cabeçalho para a página com um sistema de navegação por Abas (Tabs) horizontais.
  * As abas devem ser: "Ocupação e picos de uso", "Ranking de Consumo" e "Índice de Manutenção".
  * Deixe as abas de Consumo e Manutenção exibindo apenas um texto centralizado ("Relatório em desenvolvimento...") por enquanto.
  * A aba "Ocupação e picos de uso" será a aba ativa por padrão.

## 2. Lógica do Relatório 1: Ocupação e picos de uso
Este relatório visa dar argumentos para a coordenação sobre a necessidade de compra de novos equipamentos, mostrando o esgotamento do estoque.
* **Server Action (`/admin/relatorios/actions.ts` ou similar):** Crie uma função para buscar os dados consolidados.
* **Indicadores Visuais (Cards no topo da aba):**
  * **Empréstimos no Mês:** Total de registros na tabela `Emprestimo` feitos no mês atual (para mostrar o volume de trabalho).
  * **Equipamentos na Rua:** Contagem de equipamentos que estão atualmente com o status `EMPRESTADO` ou `AGUARDANDO_BAIXA`.
* **Visão de Esgotamento por Categoria (Gráfico ou Barras de Progresso):**
  * Para cada categoria existente (Notebook, Extensão, etc.), calcule a Taxa de Ocupação atual.
  * Exemplo de UI: Mostrar uma barra de progresso do Tailwind. Se "Notebooks" tem 10 no total e 9 estão emprestados, a barra mostra "90% de ocupação (9 de 10)".
  * **Alerta Crítico:** Se uma categoria estiver com 100% de ocupação (nenhum item com status `DISPONIVEL`), exiba um alerta visual em vermelho: "Estoque Esgotado". Se estiver com apenas 1 ou 2 disponíveis, exiba um alerta em amarelo: "Estoque Crítico".

*Atenção Claude: Utilize componentes nativos do Tailwind para as barras de progresso. Não é necessário instalar bibliotecas de gráficos complexas (como Chart.js ou Recharts) se barras horizontais simples resolverem o problema com elegância.*