import { redirect } from "next/navigation";

import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { GestaoPessoas } from "@/components/admin/GestaoPessoas";
import { ImportacaoPlanilha } from "@/components/admin/ImportacaoPlanilha";
import { ResumoPessoas } from "@/components/admin/ResumoPessoas";
import {
  contarFilaDeDevolucoes,
  listarPessoasDoPainel,
  resumirPessoas,
} from "@/lib/consultas-admin";
import { sessaoAdmin } from "@/lib/sessao-admin";

/**
 * Gestão de Pessoas (Tarefa 8).
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

export default async function PaginaDePessoas() {
  const admin = await sessaoAdmin();
  if (!admin) redirect("/admin");

  const [pessoas, resumo, pendentes] = await Promise.all([
    listarPessoasDoPainel(),
    resumirPessoas(),
    contarFilaDeDevolucoes(),
  ]);

  return (
    <CascaAdmin
      admin={admin}
      aba="pessoas"
      pendentes={pendentes}
      titulo="Pessoas"
      descricao="Estudantes e professores que podem retirar equipamento no tablet."
    >
      <ResumoPessoas {...resumo} />
      <ImportacaoPlanilha />
      <GestaoPessoas pessoas={pessoas} />
    </CascaAdmin>
  );
}
