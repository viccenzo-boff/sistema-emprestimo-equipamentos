import type { Metadata } from "next";

/**
 * Layout do Painel Administrativo.
 *
 * Faz duas coisas e nenhuma delas é autenticação: troca o título da aba do
 * navegador (a secretaria costuma deixar tablet e painel abertos lado a lado)
 * e marca o segmento `/admin` como um nó de layout, que é o alvo do
 * `revalidatePath("/admin", "layout")` das actions — uma invalidação sozinha
 * atualiza a fila, os ativos e o inventário.
 *
 * A verificação de sessão fica em cada página e em cada Server Action, nunca
 * aqui. Layout não re-renderiza a cada navegação entre rotas irmãs e não impede
 * a rota aninhada de renderizar — usar layout como porta dá a sensação de
 * proteção sem a proteção.
 */

export const metadata: Metadata = {
  title: "Painel Administrativo | Unoesc",
  description:
    "Fila de devoluções, empréstimos ativos e inventário do sistema de empréstimo de equipamentos.",
  // O painel é interno e não deve aparecer em busca alguma.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
