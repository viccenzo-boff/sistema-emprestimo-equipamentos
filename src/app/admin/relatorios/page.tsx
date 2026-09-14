import { redirect } from "next/navigation";

import { AbasDeRelatorios } from "@/components/admin/AbasDeRelatorios";
import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { RelatorioDeOcupacao } from "@/components/admin/RelatorioDeOcupacao";
import { contarFilaDeDevolucoes, montarRelatorioDeOcupacao } from "@/lib/consultas-admin";
import { sessaoAdmin } from "@/lib/sessao-admin";

/**
 * Relatórios (Tarefa 13) — a sexta tela do painel, e a primeira que só lê.
 *
 * O relatório de ocupação é montado aqui, no servidor, e desce para a barra de
 * abas já renderizado. A alternativa — a aba buscar os dados ao ser aberta —
 * exigiria uma Server Action, ou seja, um endpoint POST público criado para uma
 * leitura que abre junto com a página.
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

  const [relatorio, pendentes] = await Promise.all([
    montarRelatorioDeOcupacao(),
    contarFilaDeDevolucoes(),
  ]);

  return (
    <CascaAdmin
      admin={admin}
      aba="relatorios"
      pendentes={pendentes}
      titulo="Relatórios"
      descricao="Os números do empréstimo para levar à coordenação: o volume do mês e o quanto cada prateleira está no fim."
    >
      <AbasDeRelatorios ocupacao={<RelatorioDeOcupacao {...relatorio} />} />
    </CascaAdmin>
  );
}
