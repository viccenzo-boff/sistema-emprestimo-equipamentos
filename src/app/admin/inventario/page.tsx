import { redirect } from "next/navigation";

import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { GestaoInventario } from "@/components/admin/GestaoInventario";
import { ResumoInventario } from "@/components/admin/ResumoInventario";
import {
  contarFilaDeDevolucoes,
  listarInventario,
  listarOpcoesDeCategoria,
  resumirInventario,
} from "@/lib/consultas-admin";
import { temSessaoAdmin } from "@/lib/sessao-admin";

/**
 * Gestão de Inventário (spec, seção 4, Fluxo 3, item 2).
 *
 * As opções do `<select>` de categoria vêm de consulta própria, e não de um
 * `map` sobre o inventário já carregado. Era assim até a Tarefa 5, quando
 * categoria existia apenas como texto dentro de um equipamento e derivar dava
 * no mesmo. Agora existe categoria sem nenhum item — recém-criada na tela ao
 * lado, ou esvaziada — e derivar esconderia justamente aquela que a pessoa
 * acabou de criar para usar.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDeInventario() {
  if (!(await temSessaoAdmin())) redirect("/admin");

  const [itens, categorias, resumo, pendentes] = await Promise.all([
    listarInventario(),
    listarOpcoesDeCategoria(),
    resumirInventario(),
    contarFilaDeDevolucoes(),
  ]);

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
