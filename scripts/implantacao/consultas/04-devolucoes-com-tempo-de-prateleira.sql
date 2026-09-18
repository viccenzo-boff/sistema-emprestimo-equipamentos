-- Devoluções concluídas, com dois tempos que o painel mede e a coordenação
-- costuma perguntar:
--
--   horas_de_uso        da retirada até a pessoa declarar a devolução no tablet
--   horas_na_bancada    da declaração até o secretário conferir (baixa física)
--                       — é o "tempo de prateleira": o aparelho parado na
--                       bancada, invisível para o tablet e para o inventário
--
-- Só entram empréstimos com data_baixa preenchida: os concluídos antes de
-- setembro de 2026 não têm o carimbo (a coluna nasceu na Tarefa 12) e ficam
-- de fora de propósito, em vez de entrar com zero.
--
-- Últimos 90 dias. Para outro período, troque o '-90 days'.

SELECT
  e.equip_id                                                   AS etiqueta,
  c.nome                                                       AS categoria,
  p.nome                                                       AS pessoa,
  datetime(e.data_retirada, 'localtime')                       AS retirada,
  datetime(e.data_devolucao, 'localtime')                      AS devolucao_declarada,
  datetime(e.data_baixa, 'localtime')                          AS conferida,
  ROUND((julianday(e.data_devolucao) - julianday(e.data_retirada)) * 24, 1) AS horas_de_uso,
  ROUND((julianday(e.data_baixa) - julianday(e.data_devolucao)) * 24, 1)    AS horas_na_bancada
FROM Emprestimo e
JOIN Pessoa      p ON p.matricula = e.pessoa_id
JOIN Equipamento q ON q.id = e.equip_id
JOIN Categoria   c ON c.id = q.categoria_id
WHERE e.status = 'CONCLUIDO'
  AND e.data_baixa IS NOT NULL
  -- julianday dos dois lados: o texto gravado tem 'T' e '+00:00', e comparar
  -- texto com texto erraria justamente a linha da fronteira.
  AND julianday(e.data_retirada) >= julianday('now', '-90 days')
ORDER BY e.data_baixa DESC;
