-- CreateTable
CREATE TABLE "Usuario" (
    "matricula" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "cursos" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Equipamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL'
);

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" TEXT NOT NULL,
    "equip_id" TEXT NOT NULL,
    "data_retirada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_devolucao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT "Emprestimo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("matricula") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Emprestimo_equip_id_fkey" FOREIGN KEY ("equip_id") REFERENCES "Equipamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
