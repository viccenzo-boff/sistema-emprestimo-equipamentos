-- Retiradas do mês: total por categoria e, abaixo, por pessoa.
--
-- O mês é o CORRENTE, no horário local. Para outro mês, troque as duas
-- ocorrências de strftime('%Y-%m', 'now', 'localtime') por um texto fixo,
-- por exemplo '2026-08'.
--
-- O DB Browser mostra o resultado de UMA instrução por vez (a última
-- executada). Selecione a consulta que quer ver e use "Executar linha atual"
-- (Ctrl+E), ou apague a que não interessa.

-- 1) Por categoria
SELECT
  strftime('%Y-%m', e.data_retirada, 'localtime') AS mes,
  c.nome                                          AS categoria,
  COUNT(*)                                        AS retiradas,
  COUNT(DISTINCT e.pessoa_id)                     AS pessoas_distintas
FROM Emprestimo e
JOIN Equipamento q ON q.id = e.equip_id
JOIN Categoria   c ON c.id = q.categoria_id
WHERE strftime('%Y-%m', e.data_retirada, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
GROUP BY mes, c.nome
ORDER BY retiradas DESC;

-- 2) Por pessoa
SELECT
  p.nome                                          AS pessoa,
  p.matricula                                     AS matricula,
  p.perfil                                        AS perfil,
  p.cursos                                        AS cursos,
  COUNT(*)                                        AS retiradas,
  MIN(datetime(e.data_retirada, 'localtime'))     AS primeira,
  MAX(datetime(e.data_retirada, 'localtime'))     AS ultima
FROM Emprestimo e
JOIN Pessoa p ON p.matricula = e.pessoa_id
WHERE strftime('%Y-%m', e.data_retirada, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
GROUP BY p.matricula
ORDER BY retiradas DESC, p.nome;
