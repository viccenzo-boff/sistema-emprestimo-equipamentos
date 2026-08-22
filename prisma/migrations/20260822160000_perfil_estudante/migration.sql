-- Tarefa 8.1 — o perfil passa a ser gravado como "Estudante" / "Professor".
--
-- Por que existe: `PERFIL` em src/lib/tipos.ts deixou de valer "ALUNO" e
-- "PROFESSOR". As linhas antigas não quebram nenhuma FK, mas param de casar com
-- tudo que compara o valor — o filtro de perfil do painel, a contagem do resumo
-- e o `<select>` do modal de edição. Sem este UPDATE o cadastro continua no
-- banco e some das telas, que é o pior dos dois mundos: parece apagado e não
-- está.
--
-- Por que só o perfil, se a Tarefa 8.1 também normaliza nome e cursos:
-- reproduzir `normalizarCursos` em SQL significaria uma segunda implementação
-- da mesma regra — sem função de split, sem ordenação estável dentro de um
-- group_concat, e destinada a divergir do TypeScript na primeira mudança do
-- mapa de cursos. É o argumento que já tirou `semAcento` das actions na Tarefa
-- 7. O saneamento de cursos roda por `npm run db:sanear`, que chama a **mesma**
-- função que a importação usa. O perfil fica aqui porque é o único cujo valor
-- antigo quebra tela.
--
-- Ensaiada em cópia do dev.db antes do arquivo real.

-- Guarda: recusa a migration com o banco intacto se aparecer um perfil que não
-- é nenhum dos quatro valores conhecidos (os dois antigos e os dois novos).
--
-- É `TEMPORARY` pelo mesmo motivo da migration da Tarefa 10: o Prisma não
-- envolve migration de SQLite em transação, e uma tabela comum sobreviveria à
-- reprovação, aparecendo no banco de quem foi só conferir.
CREATE TEMPORARY TABLE "_guarda_perfil" (
  desconhecidos INTEGER NOT NULL CHECK (desconhecidos = 0)
);

INSERT INTO "_guarda_perfil" (desconhecidos)
SELECT COUNT(*) FROM "Pessoa"
WHERE perfil NOT IN ('ALUNO', 'PROFESSOR', 'Estudante', 'Professor');

DROP TABLE "_guarda_perfil";

-- A conversão. Idempotente de propósito: rodar de novo não muda nada, porque
-- 'Estudante' e 'Professor' não casam com os WHERE.
UPDATE "Pessoa" SET perfil = 'Estudante' WHERE perfil = 'ALUNO';
UPDATE "Pessoa" SET perfil = 'Professor' WHERE perfil = 'PROFESSOR';
