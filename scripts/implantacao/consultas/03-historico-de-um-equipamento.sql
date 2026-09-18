-- Tudo que aconteceu com UMA etiqueta, em ordem de tempo: cada empréstimo
-- (retirada, devolução declarada, baixa) e cada mudança de situação feita no
-- painel (manutenção, inativação), com quem fez.
--
-- Troque 'NOTE-01' pela etiqueta que quer ver — aparece 2 vezes.
-- Escreva exatamente como está no adesivo (maiúsculas).

SELECT
  datetime(e.data_retirada, 'localtime')           AS quando,
  'Retirada'                                       AS evento,
  p.nome || ' (' || p.matricula || ')'             AS quem,
  CASE e.status
    WHEN 'ATIVO'            THEN 'ainda com a pessoa'
    WHEN 'AGUARDANDO_BAIXA' THEN 'devolução declarada em ' || datetime(e.data_devolucao, 'localtime')
    WHEN 'CONCLUIDO'        THEN 'devolvido em ' || datetime(e.data_devolucao, 'localtime')
                              || ', conferido em ' || COALESCE(datetime(e.data_baixa, 'localtime'), '—')
  END                                              AS detalhe
FROM Emprestimo e
JOIN Pessoa p ON p.matricula = e.pessoa_id
WHERE e.equip_id = 'NOTE-01'

UNION ALL

SELECT
  datetime(m.em, 'localtime')                      AS quando,
  'Situação: ' || m.de || ' → ' || m.para          AS evento,
  m.administrador_nome                             AS quem,
  ''                                               AS detalhe
FROM MudancaDeStatus m
WHERE m.equip_id = 'NOTE-01'

ORDER BY quando;
