import { redirect } from "next/navigation";

import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { GestaoCategorias } from "@/components/admin/GestaoCategorias";
import {
  contarFilaDeDevolucoes,
  listarCategoriasDoPainel,
} from "@/lib/consultas-admin";
import { sessaoAdmin } from "@/lib/sessao-admin";

/**
 * Gestão de Categorias (Tarefa 6).
 *
 * A verificação de sessão está aqui, na página, e não no `layout.tsx` — pelo
 * mesmo motivo das outras três telas do painel: layout não re-renderiza entre
 * rotas irmãs e não impede um POST direto no endpoint da Server Action.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDeCategorias() {
  const admin = await sessaoAdmin();
  if (!admin) redirect("/admin");

  const [categorias, pendentes] = await Promise.all([
    listarCategoriasDoPainel(),
    contarFilaDeDevolucoes(),
  ]);

  return (
    <CascaAdmin
      admin={admin}
      aba="categorias"
      pendentes={pendentes}
      titulo="Categorias"
      descricao="As prateleiras do inventário. É por elas que o tablet organiza o que está disponível."
    >
      <GestaoCategorias categorias={categorias} />
    </CascaAdmin>
  );
}
