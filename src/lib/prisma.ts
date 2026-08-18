import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 usa driver adapters. Para SQLite o adapter é o better-sqlite3.
 * A URL é lida de DATABASE_URL (.env) e resolvida a partir da raiz do projeto,
 * o mesmo caminho que o Prisma CLI usa nas migrations.
 */
function criarPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });

  return new PrismaClient({ adapter });
}

// Em desenvolvimento o hot-reload do Next recria os módulos a cada alteração.
// Guardar a instância no globalThis evita abrir várias conexões no arquivo .db.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof criarPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? criarPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
