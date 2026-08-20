import { CascaAdmin } from "@/components/admin/CascaAdmin";
import { FilaDeDevolucoes } from "@/components/admin/FilaDeDevolucoes";
import { TelaLogin } from "@/components/admin/TelaLogin";
import { listarFilaDeDevolucoes } from "@/lib/consultas-admin";
import { existeAdministrador, sessaoAdmin } from "@/lib/sessao-admin";

/**
 * Fila de Devoluções — a tela inicial do painel (spec, seção 4, Fluxo 3).
 *
 * É a primeira porque é a única com prazo: enquanto a secretaria não confirma o
 * recebimento, o equipamento está na bancada, fora do inventário do tablet e
 * fora das mãos de quem o levou.
 *
 * A mesma rota mostra o login para quem não tem sessão. Não é uma tela "por
 * cima" do painel: sem sessão, a consulta ao banco nem chega a acontecer e
 * nenhum nome de aluno entra no HTML.
 *
 * `existeAdministrador()` só é consultado no caminho de quem **não** entrou —
 * é a pergunta "o sistema foi instalado?", e fazer essa contagem a cada render
 * do painel seria uma consulta por acesso para uma resposta que só interessa à
 * tela de login.
 *
 * `force-dynamic` porque a página lê o banco a cada acesso. A chamada de
 * `cookies()` dentro de `sessaoAdmin()` já obrigaria isso; o export deixa a
 * intenção explícita e sobrevive a uma futura mudança na verificação.
 */
export const dynamic = "force-dynamic";

export default async function PaginaDaFila() {
  const admin = await sessaoAdmin();

  if (!admin) {
    return <TelaLogin temContas={await existeAdministrador()} />;
  }

  const itens = await listarFilaDeDevolucoes();

  return (
    <CascaAdmin
      admin={admin}
      aba="fila"
      // A própria lista é a contagem — não vale uma segunda consulta ao banco.
      pendentes={itens.length}
      titulo="Fila de Devoluções"
      descricao="Equipamentos que as pessoas informaram ter devolvido e aguardam conferência na bancada."
    >
      <FilaDeDevolucoes itens={itens} />
    </CascaAdmin>
  );
}
