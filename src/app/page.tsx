import { PortalRetirada } from "@/components/portal/PortalRetirada";

/**
 * Portal do Aluno/Professor (tablet da bancada) — Fluxo 1 da spec.
 *
 * A página em si não lê o banco, por isso não precisa ser dinâmica: ela é só a
 * casca da interface. Todo dado de inventário chega por Server Action no
 * momento do toque, que é o que mantém a lista de disponíveis correta em um
 * tablet que fica ligado o dia inteiro sem recarregar.
 *
 * O Fluxo 2 (devolução) entra nesta mesma rota na próxima tarefa.
 */
export default function Home() {
  return <PortalRetirada />;
}
