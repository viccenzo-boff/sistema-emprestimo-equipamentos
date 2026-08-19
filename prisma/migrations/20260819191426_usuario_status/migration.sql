-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "matricula" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "cursos" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO'
);
INSERT INTO "new_Usuario" ("cursos", "matricula", "nome", "perfil") SELECT "cursos", "matricula", "nome", "perfil" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
