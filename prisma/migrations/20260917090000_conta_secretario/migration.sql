-- A conta neutra do painel passa a chamar-se `secretario` (nome exibido
-- "Secretário").
--
-- Por que é migration e não só uma linha no seed: o `prisma/seed.ts` faz
-- `upsert` por `usuario`. Trocar só o seed faria um banco que já tem a conta
-- antiga ganhar uma quinta conta — com a senha padrão — e manter a antiga com
-- a senha que a pessoa escolheu. Este UPDATE renomeia a linha que existe, e o
-- seed seguinte a encontra pelo nome novo e não toca na senha (regra da Tarefa
-- 10: campo que a origem não menciona é campo que o banco preserva).
--
-- Ninguém é deslogado: a sessão é assinada pelo hash bcrypt da conta, que não
-- muda, e o nome exibido na barra vem do banco a cada requisição (ver
-- `lerSessaoAdmin` em src/lib/sessao-admin.ts). O que muda é o login digitado
-- na tela — `secretario`, sem acento, porque a busca ignora caixa e espaços mas
-- não acento.
--
-- Ensaiada em cópia do dev.db antes do arquivo real.

-- Guarda: recusa a migration com o banco intacto se as duas contas coexistirem
-- (alguém já criou `secretario` à mão no db:studio). Sem a guarda, o UPDATE
-- estouraria no índice único de `usuario` com uma mensagem que fala de índice,
-- não do que fazer.
--
-- É `TEMPORARY` pelo mesmo motivo das migrations das Tarefas 8.1 e 10: o
-- Prisma não envolve migration de SQLite em transação, e uma tabela comum
-- sobreviveria à reprovação, aparecendo no banco de quem foi só conferir.
CREATE TEMPORARY TABLE "_guarda_conta" (
  colisoes INTEGER NOT NULL CHECK (colisoes = 0)
);

INSERT INTO "_guarda_conta" (colisoes)
SELECT COUNT(*) FROM "Administrador"
WHERE usuario = 'secretario'
  AND EXISTS (SELECT 1 FROM "Administrador" WHERE usuario = 'secretaria');

DROP TABLE "_guarda_conta";

-- A renomeação. Idempotente de propósito: na segunda execução o WHERE não casa
-- nada. `id` e `senha` ficam como estão.
UPDATE "Administrador"
SET usuario = 'secretario', nome = 'Secretário'
WHERE usuario = 'secretaria';
