import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";
import type { SessaoAdmin } from "@/lib/sessao-admin";
import { ContaDoAdmin } from "@/components/admin/ContaDoAdmin";
import {
  IconeCaixa,
  IconeEtiquetas,
  IconeFila,
  IconePessoas,
  IconeRelogio,
} from "@/components/ui/icones";

/**
 * Moldura das cinco telas do painel: barra lateral de navegação e área de
 * conteúdo.
 *
 * É componente, não `layout.tsx`, por dois motivos que se somam:
 *
 * 1. Um layout do App Router não re-renderiza a cada navegação entre rotas
 *    irmãs — o número de itens na fila ficaria congelado ao trocar de aba.
 *    Compondo a moldura dentro de cada página, o contador é relido a cada
 *    render, junto com o resto dos dados daquela tela.
 * 2. Layout também não é porta: ele não impede a rota aninhada de renderizar
 *    nem a Server Action de ser chamada. Deixar a verificação de sessão em cada
 *    página (e em cada action) evita a ilusão de que a moldura protege algo.
 *
 * Desktop primeiro, como manda a spec: a coluna fica ao lado em telas largas e
 * vira uma faixa horizontal abaixo de `lg`, para o painel continuar utilizável
 * em um notebook pequeno da coordenação sem virar outro projeto.
 */

export type AbaDoPainel =
  | "fila"
  | "ativos"
  | "inventario"
  | "categorias"
  | "pessoas";

type Props = {
  /**
   * Quem está logado agora (Tarefa 10).
   *
   * O nome substituiu a palavra "Secretaria", que era escrita à mão. Não é
   * enfeite: é o motivo declarado daquela tarefa. Com senha única, "quem
   * confirmou o recebimento deste equipamento?" não tinha resposta possível, e
   * quem está de pé no balcão não sabia sequer com qual conta o navegador ficou
   * aberto desde o turno anterior.
   *
   * Ficava embaixo da marca até a Tarefa 11, quando desceu para o
   * [ContaDoAdmin](src/components/admin/ContaDoAdmin.tsx), no pé da barra —
   * junto dos dois botões que agem sobre essa conta.
   */
  admin: SessaoAdmin;
  aba: AbaDoPainel;
  /** Quantos empréstimos esperam conferência agora. Vira aviso no menu. */
  pendentes: number;
  titulo: string;
  descricao: string;
  children: ReactNode;
};

const ABAS = [
  {
    id: "fila" as const,
    rotulo: "Fila de Devoluções",
    href: "/admin",
    Icone: IconeFila,
  },
  {
    id: "ativos" as const,
    rotulo: "Empréstimos Ativos",
    href: "/admin/ativos",
    Icone: IconeRelogio,
  },
  {
    id: "inventario" as const,
    rotulo: "Inventário",
    href: "/admin/inventario",
    Icone: IconeCaixa,
  },
  // Logo abaixo do Inventário porque é onde se vai depois de esbarrar nele: a
  // categoria que falta no `<select>` do cadastro é criada aqui.
  {
    id: "categorias" as const,
    rotulo: "Categorias",
    href: "/admin/categorias",
    Icone: IconeEtiquetas,
  },
  /*
    Pessoas fica por último de propósito, e não junto da fila.

    As quatro abas acima são o trabalho do dia — a secretaria entra no painel
    para conferir devolução e mexer no inventário. Cadastro é manutenção de
    início de semestre: a planilha da coordenação chega uma vez, é importada, e
    a aba fica meses sem ser aberta. Pôr uma tarefa rara no topo empurraria para
    baixo as três que acontecem toda hora.
  */
  {
    id: "pessoas" as const,
    rotulo: "Pessoas",
    href: "/admin/pessoas",
    Icone: IconePessoas,
  },
];

export function CascaAdmin({
  admin,
  aba,
  pendentes,
  titulo,
  descricao,
  children,
}: Props) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-8 border-b border-borda bg-superficie p-6 lg:w-72 lg:border-r lg:border-b-0 lg:p-7">
        <div>
          {/* Import estático: largura e altura vêm do próprio arquivo. */}
          <Image src={logoUnoesc} alt="Unoesc" className="h-10 w-auto" priority />
          <p className="mt-3 text-sm leading-tight font-semibold text-tinta">
            Painel Administrativo
          </p>
        </div>

        <nav aria-label="Seções do painel" className="lg:flex-1">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {ABAS.map(({ id, rotulo, href, Icone }) => {
              const ativa = id === aba;

              return (
                <li key={id}>
                  <Link
                    href={href}
                    aria-current={ativa ? "page" : undefined}
                    className={[
                      "flex min-h-12 items-center gap-3 rounded-xl px-4 py-2.5",
                      "text-base font-semibold transition-colors duration-150",
                      ativa
                        ? "bg-marca-azul text-white"
                        : "text-tinta-suave hover:bg-marca-azul-tenue hover:text-marca-azul",
                    ].join(" ")}
                  >
                    <Icone className="size-5 shrink-0" />
                    <span className="flex-1">{rotulo}</span>

                    {id === "fila" && pendentes > 0 ? (
                      <span
                        className={[
                          "numeros-tabulares inline-flex min-w-6 items-center justify-center",
                          "rounded-full px-1.5 py-0.5 text-sm font-bold",
                          ativa ? "bg-white text-marca-azul" : "bg-aviso text-white",
                        ].join(" ")}
                      >
                        {pendentes}
                        <span className="sr-only"> aguardando conferência</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ContaDoAdmin admin={admin} />
      </aside>

      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-balance text-marca-azul lg:text-4xl">
              {titulo}
            </h1>
            <p className="mt-2 text-lg text-tinta-suave">{descricao}</p>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}
