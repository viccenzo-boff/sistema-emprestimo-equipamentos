import { redirect } from "next/navigation";

import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { GestaoUsuarios } from "@/components/admin/GestaoUsuarios";
import { ImportacaoPlanilha } from "@/components/admin/ImportacaoPlanilha";
import { ResumoUsuarios } from "@/components/admin/ResumoUsuarios";
import {
  contarFilaDeDevolucoes,
  listarUsuariosDoPainel,
  resumirUsuarios,
} from "@/lib/consultas-admin";
import { temSessaoAdmin } from "@/lib/sessao-admin";

/**
 * Gestão de Usuários (Tarefa 8).
 *
 * `force-dynamic` pela regra do projeto: rota que lê o banco não pode ser
 * pré-renderizada, senão o Next congela os dados no build e a secretaria passa
 * a semana olhando o cadastro de sexta-feira passada. A classificação sai como
 * `ƒ` no relatório do build — é lá que isso se confere, não aqui.
 *
 * A sessão é verificada **nesta página**, e não no layout: layout não
 * re-renderiza entre rotas irmãs e não é porta. A mesma regra vale nas actions,
 * que é onde ela realmente protege.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDeUsuarios() {
  if (!(await temSessaoAdmin())) redirect("/admin");

  const [usuarios, resumo, pendentes] = await Promise.all([
    listarUsuariosDoPainel(),
    resumirUsuarios(),
    contarFilaDeDevolucoes(),
  ]);

  return (
    <CascaAdmin
      aba="usuarios"
      pendentes={pendentes}
      titulo="Usuários"
      descricao="Estudantes e professores que podem retirar equipamento no tablet."
    >
      <ResumoUsuarios {...resumo} />
      <ImportacaoPlanilha />
      <GestaoUsuarios usuarios={usuarios} />
    </CascaAdmin>
  );
}
