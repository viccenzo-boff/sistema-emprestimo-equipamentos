-- Quem está com equipamento neste momento, e desde quando.
--
-- Inclui os dois estados "fora da prateleira": ATIVO (a pessoa está com o
-- aparelho) e AGUARDANDO_BAIXA (a pessoa já declarou a devolução no tablet e o
-- aparelho espera a conferência do secretário na bancada).
--
-- As datas estão gravadas em UTC; 'localtime' converte para o horário do PC.

SELECT
  e.equip_id                                            AS etiqueta,
  c.nome                                                AS categoria,
  p.nome                                                AS pessoa,
  p.matricula                                           AS matricula,
  p.perfil                                              AS perfil,
  datetime(e.data_retirada, 'localtime')                AS retirado_em,
  CASE e.status
    WHEN 'ATIVO'            THEN 'Com a pessoa'
    WHEN 'AGUARDANDO_BAIXA' THEN 'Na bancada, aguardando conferência'
  END                                                   AS situacao,
  datetime(e.data_devolucao, 'localtime')               AS devolucao_declarada_em,
  CAST((julianday('now') - julianday(e.data_retirada)) AS INTEGER) AS dias_fora
FROM Emprestimo e
JOIN Pessoa      p ON p.matricula = e.pessoa_id
JOIN Equipamento q ON q.id = e.equip_id
JOIN Categoria   c ON c.id = q.categoria_id
WHERE e.status IN ('ATIVO', 'AGUARDANDO_BAIXA')
ORDER BY e.data_retirada;
