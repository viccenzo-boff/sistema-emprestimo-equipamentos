# Consultas prontas para a coordenação

Arquivos `.sql` para abrir no **DB Browser for SQLite**, sobre a **cópia de
consulta** (`C:\emprestimos\consulta\emprestimos-consulta.db`) — nunca sobre o
banco vivo em `dados\`. O guia de instalação da wiki explica o passo a passo;
o resumo é:

1. Área de trabalho → **Atualizar copia para consulta** (para a cópia ter os
   dados de agora).
2. DB Browser → **Arquivo → Abrir banco de dados somente leitura** → a cópia.
3. Aba **Executar SQL** → ícone de pasta (**Abrir arquivo SQL**) → um destes
   arquivos → **Executar** (F5 ou Ctrl+Enter).
4. Para levar ao Excel: botão **Salvar os resultados → Exportar para CSV**.

| Arquivo | Responde |
| --- | --- |
| `01-quem-esta-com-o-que-agora.sql` | Quem está com equipamento neste momento, e desde quando |
| `02-retiradas-do-mes.sql` | Quantas retiradas no mês, por categoria e por pessoa |
| `03-historico-de-um-equipamento.sql` | Tudo que aconteceu com uma etiqueta (empréstimos e manutenção) |
| `04-devolucoes-com-tempo-de-prateleira.sql` | Devoluções concluídas, com quanto tempo o aparelho esperou na bancada |

## Três coisas que ninguém deduz

- **As datas estão gravadas em UTC** (3 horas à frente de Brasília), como
  texto `2026-09-16T14:30:00.000+00:00`. Toda consulta aqui converte com
  `datetime(coluna, 'localtime')`; sem isso, tudo aparece 3 h adiantado e uma
  retirada das 22h cai no dia seguinte.
- **Os status são em caixa alta**: `ATIVO`, `AGUARDANDO_BAIXA`, `CONCLUIDO`
  (empréstimo) e `DISPONIVEL`, `EMPRESTADO`, `MANUTENCAO`, `INATIVO`
  (equipamento).
- **Três datas, três donos**: `data_retirada` é o tablet entregando,
  `data_devolucao` é a pessoa **declarando** a devolução no tablet, e
  `data_baixa` é o secretário **conferindo** o aparelho na bancada. A diferença
  entre as duas últimas é o tempo de prateleira.

O desenho das tabelas está na página "Arquitetura do sistema" da wiki.
