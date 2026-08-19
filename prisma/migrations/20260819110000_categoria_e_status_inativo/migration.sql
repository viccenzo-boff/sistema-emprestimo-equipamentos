-- Tarefa 6: `Equipamento.tipo` (String) vira uma FK para a nova tabela `Categoria`.
--
-- A migration foi escrita à mão porque a automática do Prisma não tem como
-- adivinhar de onde sai o `categoria_id` de 21 equipamentos já cadastrados: ela
-- propõe apagar a coluna `tipo` e criar a FK obrigatória vazia, o que só
-- funciona em banco sem dados. Aqui a tabela nasce **a partir** dos tipos que já
-- existem, e o vínculo é feito por junção antes de a coluna antiga sumir.

-- CreateTable
CREATE TABLE "Categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- Semeia as categorias com as grafias que já estão no inventário.
--
-- A ordem do INSERT vira a ordem dos ids, e o id é o que ordena as categorias
-- no tablet e no painel. Por isso o CASE: as três categorias da spec nascem
-- 1, 2 e 3 — a mesma ordem que estava fixa no código antes desta tarefa — e
-- qualquer categoria criada depois entra no fim da fila, que é onde uma
-- categoria nova pertence.
INSERT INTO "Categoria" ("nome")
SELECT "tipo" FROM (SELECT DISTINCT "tipo" FROM "Equipamento")
ORDER BY
    CASE "tipo"
        WHEN 'Notebook' THEN 0
        WHEN 'Tablet' THEN 1
        WHEN 'Extensão' THEN 2
        ELSE 3
    END,
    "tipo";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoria_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
    CONSTRAINT "Equipamento_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- INNER JOIN de propósito: se algum equipamento não casar com nenhuma
-- categoria, é melhor a migration falhar aqui, com o banco intacto, do que
-- levar o item para um `categoria_id` inventado. Como a `Categoria` acabou de
-- ser semeada de `SELECT DISTINCT "tipo"` da própria tabela, a junção cobre
-- todas as linhas por construção.
INSERT INTO "new_Equipamento" ("id", "categoria_id", "status")
SELECT "Equipamento"."id", "Categoria"."id", "Equipamento"."status"
FROM "Equipamento"
JOIN "Categoria" ON "Categoria"."nome" = "Equipamento"."tipo";

DROP TABLE "Equipamento";
ALTER TABLE "new_Equipamento" RENAME TO "Equipamento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- O status `INATIVO` não precisa de DDL: `status` é TEXT livre, como os outros
-- status do projeto. Quem restringe os valores é a camada de aplicação.
