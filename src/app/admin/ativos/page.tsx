import { redirect } from "next/navigation";

import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { TabelaAtivos } from "@/components/admin/TabelaAtivos";
import {
  contarFilaDeDevolucoes,
  listarEmprestimosEmCurso,
} from "@/lib/consultas-admin";
import { temSessaoAdmin } from "@/lib/sessao-admin";

/**
 * Visão Geral dos empréstimos `ATIVO` (spec, seção 4, Fluxo 3, item 3).
 *
 * Sem sessão, redireciona para /admin — que é onde mora o campo de senha. A
 * verificação é da página, não do layout: rota aninhada renderiza mesmo com o
 * layout escondendo tudo.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDeAtivos() {
  if (!(await temSessaoAdmin())) redirect("/admin");

  const [emprestimos, pendentes] = await Promise.all([
    listarEmprestimosEmCurso(),
    contarFilaDeDevolucoes(),
  ]);

  return (
    <CascaAdmin
      aba="ativos"
      pendentes={pendentes}
      titulo="Empréstimos Ativos"
      descricao="Quem está com qual equipamento neste momento. Somente leitura."
    >
      <TabelaAtivos emprestimos={emprestimos} />
    </CascaAdmin>
  );
}
