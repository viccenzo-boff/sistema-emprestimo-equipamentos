import { redirect } from "next/navigation";

import { AbasDeRelatorios } from "@/components/admin/AbasDeRelatorios";
import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { RelatorioDeOcupacao } from "@/components/admin/RelatorioDeOcupacao";
import { RelatorioDeSatisfacao } from "@/components/admin/RelatorioDeSatisfacao";
import {
  contarFilaDeDevolucoes,
  montarRelatorioDeOcupacao,
  montarRelatorioDeSatisfacao,
} from "@/lib/consultas-admin";
import { sessaoAdmin } from "@/lib/sessao-admin";

/**
 * Relatórios (Tarefa 13) — a sexta tela do painel, e a primeira que só lê.
 *
 * Os relatórios são montados aqui, no servidor, e descem para a barra de abas
 * já renderizados. A alternativa — a aba buscar os dados ao ser aberta —
 * exigiria uma Server Action, ou seja, um endpoint POST público criado para
 * uma leitura que abre junto com a página. A Tarefa 14 acrescentou o segundo
 * relatório (Satisfação) pelo mesmo caminho: as duas consultas correm em
 * paralelo, e a única escrita da tela — a URL do formulário — é a única
 * action.
 *
 * `force-dynamic` porque a página lê o banco a cada acesso. A chamada de
 * `cookies()` dentro de `sessaoAdmin()` já obrigaria isso; o export deixa a
 * intenção explícita — e aqui ela pesa mais do que nas outras telas, porque um
 * relatório congelado no build é exatamente o tipo de erro que ninguém percebe:
 * os números continuam plausíveis, só param no tempo.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDeRelatorios() {
  const admin = await sessaoAdmin();
  if (!admin) redirect("/admin");

  const [ocupacao, satisfacao, pendentes] = await Promise.all([
    montarRelatorioDeOcupacao(),
    montarRelatorioDeSatisfacao(),
    contarFilaDeDevolucoes(),
  ]);

  return (
    <CascaAdmin
      admin={admin}
      aba="relatorios"
      pendentes={pendentes}
      titulo="Relatórios"
      descricao="Os números do empréstimo para levar à coordenação: o volume do mês, o quanto cada prateleira está no fim e como as pessoas avaliam a retirada."
    >
      <AbasDeRelatorios
        ocupacao={<RelatorioDeOcupacao {...ocupacao} />}
        satisfacao={<RelatorioDeSatisfacao {...satisfacao} />}
      />
    </CascaAdmin>
  );
}
