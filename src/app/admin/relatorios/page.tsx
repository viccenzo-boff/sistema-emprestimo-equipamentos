import { redirect } from "next/navigation";

import { AbasDeRelatorios } from "@/components/admin/AbasDeRelatorios";
import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { QuadroDeRelatorios } from "@/components/admin/QuadroDeRelatorios";
import { RelatorioDeConsumo } from "@/components/admin/RelatorioDeConsumo";
import { RelatorioDeManutencao } from "@/components/admin/RelatorioDeManutencao";
import { RelatorioDeOcupacao } from "@/components/admin/RelatorioDeOcupacao";
import { RelatorioDeSatisfacao } from "@/components/admin/RelatorioDeSatisfacao";
import { Alerta } from "@/components/ui/Alerta";
import {
  anosComRetirada,
  contarFilaDeDevolucoes,
  montarRelatorioDeConsumo,
  montarRelatorioDeManutencao,
  montarRelatorioDeOcupacao,
  montarRelatorioDeSatisfacao,
} from "@/lib/consultas-admin";
import { interpretarPeriodo } from "@/lib/periodo";
import { sessaoAdmin } from "@/lib/sessao-admin";
import { abaDaUrl } from "@/lib/tipos";

/**
 * Relatórios (Tarefa 13) — a sexta tela do painel, e a primeira que só lê.
 *
 * Os relatórios são montados aqui, no servidor, e descem para a barra de abas
 * já renderizados. A alternativa — a aba buscar os dados ao ser aberta —
 * exigiria uma Server Action, ou seja, um endpoint POST público criado para
 * uma leitura que abre junto com a página. A Tarefa 14 acrescentou o segundo
 * relatório (Satisfação), a Tarefa 16 o terceiro (Ranking de Consumo) e a
 * Tarefa 17 o quarto (Índice de Manutenção) pelo mesmo caminho: as consultas
 * correm em paralelo, e a única escrita da tela — a URL do formulário — é a
 * única action.
 *
 * **O período e a aba vivem nos `searchParams`** (Tarefa 16):
 * `?aba=consumo&de=2026-09-01&ate=2026-09-30`. O período muda a consulta, e
 * por isso é lido aqui, no render — sem `de`/`ate` vale o mês corrente, e a
 * URL **não** é reescrita (um link guardado tem que mostrar setembro em
 * novembro, e nada de redirect a cada abertura). Um período torto cai no
 * padrão com um aviso, e não num erro 400: quem colou um link errado ainda vê
 * o relatório. `searchParams` é uma `Promise` no Next 16 — daí o `await`.
 *
 * `force-dynamic` porque a página lê o banco a cada acesso. A chamada de
 * `cookies()` dentro de `sessaoAdmin()` já obrigaria isso; o export deixa a
 * intenção explícita — e aqui ela pesa mais do que nas outras telas, porque um
 * relatório congelado no build é exatamente o tipo de erro que ninguém percebe:
 * os números continuam plausíveis, só param no tempo.
 */
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
};

export default async function PaginaDeRelatorios({ searchParams }: Props) {
  const admin = await sessaoAdmin();
  if (!admin) redirect("/admin");

  const parametros = await searchParams;
  const { periodo, invalido } = interpretarPeriodo(parametros);
  const abaInicial = abaDaUrl(parametros.aba);

  const [ocupacao, satisfacao, consumo, manutencao, anos, pendentes] = await Promise.all([
    montarRelatorioDeOcupacao(periodo),
    montarRelatorioDeSatisfacao(),
    montarRelatorioDeConsumo(periodo),
    montarRelatorioDeManutencao(periodo),
    anosComRetirada(),
    contarFilaDeDevolucoes(),
  ]);

  return (
    <CascaAdmin
      admin={admin}
      aba="relatorios"
      pendentes={pendentes}
      titulo="Relatórios"
      descricao="Os números do empréstimo para levar à coordenação: o volume do período, o quanto cada prateleira está no fim, o que sai e quem leva, como as pessoas avaliam a retirada, e quanto do estoque fica parado no conserto."
    >
      <QuadroDeRelatorios
        de={periodo.deTexto}
        ate={periodo.ateTexto}
        unidade={periodo.unidade}
        porExtenso={periodo.porExtenso}
        anos={anos}
      >
        <div className="flex flex-col gap-6">
          {invalido ? (
            <Alerta
              tom="aviso"
              mensagem="Período inválido. Mostrando o mês atual."
              detalhe="O endereço trazia uma data que não existe, um formato errado ou um início depois do fim. Escolha o período de novo acima."
            />
          ) : null}

          <AbasDeRelatorios
            abaInicial={abaInicial}
            ocupacao={<RelatorioDeOcupacao dados={ocupacao} de={periodo.deTexto} ate={periodo.ateTexto} />}
            satisfacao={<RelatorioDeSatisfacao {...satisfacao} />}
            consumo={<RelatorioDeConsumo dados={consumo} de={periodo.deTexto} ate={periodo.ateTexto} />}
            manutencao={<RelatorioDeManutencao dados={manutencao} de={periodo.deTexto} ate={periodo.ateTexto} />}
          />
        </div>
      </QuadroDeRelatorios>
    </CascaAdmin>
  );
}
