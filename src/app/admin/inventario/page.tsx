import { redirect } from "next/navigation";

import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { GestaoInventario } from "@/components/admin/GestaoInventario";
import { ResumoInventario } from "@/components/admin/ResumoInventario";
import {
  contarFilaDeDevolucoes,
  listarInventario,
  resumirInventario,
} from "@/lib/consultas-admin";
import { temSessaoAdmin } from "@/lib/sessao-admin";

/**
 * Gestão de Inventário (spec, seção 4, Fluxo 3, item 2).
 *
 * As categorias sugeridas no cadastro saem da própria lista já carregada, na
 * ordem em que ela vem — nada de uma consulta a mais para descobrir o que a
 * página tem na mão.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDeInventario() {
  if (!(await temSessaoAdmin())) redirect("/admin");

  const [itens, resumo, pendentes] = await Promise.all([
    listarInventario(),
    resumirInventario(),
    contarFilaDeDevolucoes(),
  ]);

  const categorias = [...new Set(itens.map((item) => item.tipo))];

  return (
    <CascaAdmin
      aba="inventario"
      pendentes={pendentes}
      titulo="Inventário"
      descricao="Todo o equipamento cadastrado, com a situação de cada item."
    >
      <ResumoInventario {...resumo} />
      <GestaoInventario itens={itens} categorias={categorias} />
    </CascaAdmin>
  );
}
