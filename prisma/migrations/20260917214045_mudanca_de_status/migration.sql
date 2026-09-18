-- Tarefa 17 — histórico de situação do equipamento e o índice de carona.
--
-- Três instruções, as três aditivas: a tabela `MudancaDeStatus` (uma linha por
-- transição feita no painel — DISPONIVEL ↔ MANUTENCAO ↔ INATIVO —, com quem e
-- quando), o índice que o relatório lê (as linhas de um equipamento em ordem
-- de `em`) e o índice em `Emprestimo.data_retirada` que a §0 da Tarefa 16
-- prometeu para a primeira migration seguinte. Nenhuma tabela é reconstruída e
-- nenhuma linha existente é tocada.
--
-- **Nenhuma linha é semeada aqui, de propósito.** Um equipamento que já
-- estiver em MANUTENCAO ou INATIVO no dia da instalação fica sem entrada no
-- histórico: uma linha de abertura com o carimbo da migration seria dado
-- inventado dentro de uma métrica (a duração da estadia). O relatório mostra
-- "desde —" para ele, e a saída dele fica fora das durações.
--
-- `ON DELETE SET NULL` em `administrador_id` porque a recuperação de senha
-- documentada é apagar a conta e ressemear: com RESTRICT o banco recusaria
-- assim que a conta tivesse histórico; com CASCADE a senha esquecida apagaria
-- o histórico. O nome fica gravado ao lado (`administrador_nome`), que é o que
-- o relatório mostra quando o vínculo se foi. Provado em cópia do dev.db:
-- apagar a conta deixa o id nulo, o nome intacto e o foreign_key_check vazio.
--
-- Gerada com `prisma migrate dev --create-only` contra uma cópia do dev.db, e
-- ensaiada na cópia antes do arquivo real.

-- CreateTable
CREATE TABLE "MudancaDeStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "equip_id" TEXT NOT NULL,
    "de" TEXT NOT NULL,
    "para" TEXT NOT NULL,
    "em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "administrador_id" INTEGER,
    "administrador_nome" TEXT NOT NULL,
    CONSTRAINT "MudancaDeStatus_equip_id_fkey" FOREIGN KEY ("equip_id") REFERENCES "Equipamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MudancaDeStatus_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "Administrador" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MudancaDeStatus_equip_id_em_idx" ON "MudancaDeStatus"("equip_id", "em");

-- CreateIndex
CREATE INDEX "Emprestimo_data_retirada_idx" ON "Emprestimo"("data_retirada");
