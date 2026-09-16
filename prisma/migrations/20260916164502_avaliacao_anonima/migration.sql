-- Tarefa 14 — avaliação anônima no fim da retirada.
--
-- Três mudanças, as três aditivas (nenhuma tabela é reconstruída, nenhuma
-- linha existente é tocada): a coluna que guarda o dia em que os rostos foram
-- mostrados a cada pessoa, a tabela das avaliações e a tabela de configuração
-- da URL do formulário externo.
--
-- O `AUTOINCREMENT` da `Avaliacao` é o que o gerador do Prisma escreve para
-- todo `Int @id` em SQLite, mesmo sem `@default(autoincrement())` no schema
-- — conferido no SQL gerado. Ele é inofensivo aqui porque **toda** inserção
-- fornece o id (o schema não tem default, então o client exige o campo), e o
-- id é aleatório de propósito: sequencial, seria a ordem de gravação, que é o
-- pareamento pessoa-nota que a tabela existe para não guardar. Ver o
-- comentário do modelo em schema.prisma.
--
-- Ensaiada em cópia do dev.db antes do arquivo real.

-- AlterTable
ALTER TABLE "Pessoa" ADD COLUMN "avaliacao_pedida_em" DATETIME;

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nota" INTEGER,
    "dia" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Configuracao" (
    "chave" TEXT NOT NULL PRIMARY KEY,
    "valor" TEXT NOT NULL
);
