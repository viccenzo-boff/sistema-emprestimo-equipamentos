import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { FilaDeDevolucoes } from "@/components/admin/FilaDeDevolucoes";
import { TelaSenha } from "@/components/admin/TelaSenha";
import { listarFilaDeDevolucoes } from "@/lib/consultas-admin";
import { senhaMestreConfigurada, temSessaoAdmin } from "@/lib/sessao-admin";

/**
 * Fila de Devoluções — a tela inicial do painel (spec, seção 4, Fluxo 3).
 *
 * É a primeira porque é a única com prazo: enquanto a secretaria não confirma o
 * recebimento, o equipamento está na bancada, fora do inventário do tablet e
 * fora das mãos de quem o levou.
 *
 * A mesma rota mostra o campo de senha para quem não tem sessão. Não é uma tela
 * "por cima" do painel: sem sessão, a consulta ao banco nem chega a acontecer e
 * nenhum nome de aluno entra no HTML.
 *
 * `force-dynamic` porque a página lê o banco a cada acesso. A chamada de
 * `cookies()` dentro de `temSessaoAdmin()` já obrigaria isso; o export deixa a
 * intenção explícita e sobrevive a uma futura mudança na verificação.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDaFila() {
  if (!(await temSessaoAdmin())) {
    return <TelaSenha configurado={senhaMestreConfigurada()} />;
  }

  const itens = await listarFilaDeDevolucoes();

  return (
    <CascaAdmin
      aba="fila"
      // A própria lista é a contagem — não vale uma segunda consulta ao banco.
      pendentes={itens.length}
      titulo="Fila de Devoluções"
      descricao="Equipamentos que os usuários informaram ter devolvido e aguardam conferência na bancada."
    >
      <FilaDeDevolucoes itens={itens} />
    </CascaAdmin>
  );
}
