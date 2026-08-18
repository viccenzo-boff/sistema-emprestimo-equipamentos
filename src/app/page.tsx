import { Portal } from "@/components/portal/Portal";

/**
 * Portal do Aluno/Professor (tablet da bancada) — Fluxos 1 e 2 da spec.
 *
 * A página em si não lê o banco, por isso não precisa ser dinâmica: ela é só a
 * casca da interface. Todo dado — inventário e itens emprestados — chega por
 * Server Action no momento do toque, que é o que mantém as listas corretas em
 * um tablet que fica ligado o dia inteiro sem recarregar.
 */
export default function Home() {
  return <Portal />;
}
