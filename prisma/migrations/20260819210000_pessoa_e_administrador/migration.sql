-- Tarefa 10: `Usuario` vira `Pessoa`, `Emprestimo.usuario_id` vira `pessoa_id`,
-- e nasce a tabela `Administrador` (contas do painel, senha em hash bcrypt).
--
-- ESCRITA À MÃO, E TINHA QUE SER. O que o `prisma migrate diff` propôs para
-- este mesmo schema foi:
--
--     DROP TABLE "Usuario";                       -- apaga todas as pessoas
--     CREATE TABLE "Pessoa" (...);                -- vazia
--     INSERT INTO "new_Emprestimo" ("data_devolucao", "data_retirada",
--       "equip_id", "id", "status") SELECT ...    -- sem "pessoa_id"
--
-- O gerador não tem como saber que `Pessoa` é a mesma tabela com outro nome:
-- para ele, uma sumiu e outra apareceu. O segundo defeito é pior que o
-- primeiro por ser silencioso ao contrário — com empréstimos na tabela, o
-- INSERT sem `pessoa_id` estoura no NOT NULL e a migration falha; **sem**
-- empréstimos, ele passa, e o que se perde (os cadastros) já foi perdido na
-- linha de cima sem nenhum erro.
--
-- Aqui os dados atravessam: a `Pessoa` nasce de um SELECT da `Usuario`, e o
-- `pessoa_id` de cada empréstimo é o `usuario_id` que já estava lá.

-- ---------------------------------------------------------------------------
-- 0. Guarda: nenhum empréstimo pode ficar órfão.
--
-- Vem antes de qualquer coisa destrutiva de propósito. Se algum `usuario_id`
-- não tiver dono, o CHECK reprova o INSERT, a migration para aqui e o banco
-- fica intacto — é melhor falhar com tudo no lugar do que carregar adiante um
-- vínculo que ninguém conferiu. (Com `PRAGMA foreign_keys = 1` ligado pelo
-- adapter, essa contagem é zero por construção; a guarda existe para o banco
-- que rodou algum tempo com a integridade desligada.)
--
-- E TEMPORARY para nao deixar residuo: o Prisma nao envolve migration de SQLite
-- em transacao (os PRAGMA nao rodam dentro de uma), entao uma tabela comum
-- sobreviveria a reprovacao e apareceria no banco de quem foi so conferir.
-- ---------------------------------------------------------------------------
CREATE TEMPORARY TABLE "_guarda_tarefa_10" (
    "emprestimos_orfaos" INTEGER NOT NULL CHECK ("emprestimos_orfaos" = 0)
);

INSERT INTO "_guarda_tarefa_10" ("emprestimos_orfaos")
SELECT COUNT(*)
FROM "Emprestimo" e
LEFT JOIN "Usuario" u ON u."matricula" = e."usuario_id"
WHERE u."matricula" IS NULL;

DROP TABLE "_guarda_tarefa_10";

-- ---------------------------------------------------------------------------
-- 1. Administrador — contas do painel.
-- ---------------------------------------------------------------------------
CREATE TABLE "Administrador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL
);

CREATE UNIQUE INDEX "Administrador_usuario_key" ON "Administrador"("usuario");

-- ---------------------------------------------------------------------------
-- 2. Usuario -> Pessoa, e Emprestimo.usuario_id -> pessoa_id.
--
-- As duas coisas na mesma janela de `foreign_keys=OFF` porque uma depende da
-- outra: enquanto a `Emprestimo` antiga apontar para `Usuario`, a `Usuario` não
-- pode sair; e a nova só pode nascer depois de a `Pessoa` existir.
-- ---------------------------------------------------------------------------
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "Pessoa" (
    "matricula" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "cursos" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO'
);

-- SELECT direto, sem junção e sem valor padrão: é a mesma tabela com outro
-- nome, e toda linha tem que atravessar. A guarda do passo 0 é quem responde
-- pelo que a junção responderia.
INSERT INTO "Pessoa" ("matricula", "nome", "perfil", "cursos", "status")
SELECT "matricula", "nome", "perfil", "cursos", "status" FROM "Usuario";

CREATE TABLE "new_Emprestimo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoa_id" TEXT NOT NULL,
    "equip_id" TEXT NOT NULL,
    "data_retirada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_devolucao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT "Emprestimo_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "Pessoa" ("matricula") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_equip_id_fkey" FOREIGN KEY ("equip_id") REFERENCES "Equipamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- O `id` vai junto e explícito: ele é a chave que a Fila de Devoluções endereça
-- ("confirmar o recebimento do empréstimo 42"). Deixar o AUTOINCREMENT
-- renumerar as linhas trocaria o alvo de qualquer tela aberta no momento da
-- migração.
INSERT INTO "new_Emprestimo" ("id", "pessoa_id", "equip_id", "data_retirada", "data_devolucao", "status")
SELECT "id", "usuario_id", "equip_id", "data_retirada", "data_devolucao", "status" FROM "Emprestimo";

DROP TABLE "Emprestimo";
ALTER TABLE "new_Emprestimo" RENAME TO "Emprestimo";

DROP TABLE "Usuario";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
