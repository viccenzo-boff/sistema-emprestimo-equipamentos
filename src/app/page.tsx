import Image from "next/image";

import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";
import { prisma } from "@/lib/prisma";

/**
 * Página provisória de verificação do setup (Tarefa 1).
 * Será substituída na Tarefa 2 pelo Portal do Aluno/Professor (tablet),
 * conforme o Fluxo 1 e o Fluxo 2 da especificação.
 */

// Os dados vêm do SQLite a cada requisição: sem isso o Next pré-renderiza a
// página no build e os números ficariam congelados.
export const dynamic = "force-dynamic";
export default async function Home() {
  let banco:
    | { ok: true; usuarios: number; equipamentos: number; emprestimos: number }
    | { ok: false; erro: string };

  try {
    const [usuarios, equipamentos, emprestimos] = await Promise.all([
      prisma.usuario.count(),
      prisma.equipamento.count(),
      prisma.emprestimo.count(),
    ]);
    banco = { ok: true, usuarios, equipamentos, emprestimos };
  } catch (erro) {
    banco = {
      ok: false,
      erro:
        erro instanceof Error
          ? erro.message
          : "Não foi possível consultar o banco de dados.",
    };
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {/* Import estático: largura e altura vêm do próprio arquivo. */}
        <Image src={logoUnoesc} alt="Unoesc" className="h-10 w-auto" priority />

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Sistema de Empréstimo de Equipamentos
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Setup inicial concluído — Next.js (App Router), TailwindCSS, Prisma e
          SQLite.
        </p>

        {banco.ok ? (
          <dl className="mt-8 grid grid-cols-3 gap-3">
            <Contador rotulo="Usuários" valor={banco.usuarios} />
            <Contador rotulo="Equipamentos" valor={banco.equipamentos} />
            <Contador rotulo="Empréstimos" valor={banco.emprestimos} />
          </dl>
        ) : (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Não foi possível conectar ao banco de dados.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Rode <code className="font-mono">npm run db:migrate</code> e{" "}
              <code className="font-mono">npm run db:seed</code> para criar o
              arquivo <code className="font-mono">dev.db</code>.
            </p>
            <p className="mt-2 font-mono text-xs text-amber-700">{banco.erro}</p>
          </div>
        )}

        <section className="mt-8 border-t border-zinc-200 pt-6">
          <h2 className="text-sm font-semibold text-zinc-900">Próximos passos</h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>
              <span className="font-mono text-zinc-900">/</span> — Portal do
              Aluno/Professor (tablet): retirada e devolução
            </li>
            <li>
              <span className="font-mono text-zinc-900">/admin</span> — Painel
              Administrativo: fila de devoluções e inventário
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function Contador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4 text-center">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {rotulo}
      </dt>
      <dd className="mt-1 text-2xl font-semibold text-zinc-900">{valor}</dd>
    </div>
  );
}
