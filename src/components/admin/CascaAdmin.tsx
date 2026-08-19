import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { sairDoAdmin } from "@/app/admin/actions";
import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";
import { Botao } from "@/components/ui/Botao";
import { IconeCaixa, IconeFila, IconeRelogio, IconeSair } from "@/components/ui/icones";

/**
 * Moldura das três telas do painel: barra lateral de navegação e área de
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

export type AbaDoPainel = "fila" | "ativos" | "inventario";

type Props = {
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
];

export function CascaAdmin({ aba, pendentes, titulo, descricao, children }: Props) {
  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-8 border-b border-borda bg-superficie p-6 lg:w-72 lg:border-r lg:border-b-0 lg:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            {/* Import estático: largura e altura vêm do próprio arquivo. */}
            <Image src={logoUnoesc} alt="Unoesc" className="h-10 w-auto" priority />
            <p className="mt-3 text-sm leading-tight font-semibold text-tinta">
              Painel Administrativo
            </p>
            <p className="text-sm leading-tight text-tinta-tenue">
              Secretaria
            </p>
          </div>

          {/* Em telas estreitas a saída fica no topo, ao lado da marca. */}
          <form action={sairDoAdmin} className="lg:hidden">
            <Botao type="submit" variante="fantasma" tamanho="pequeno">
              <IconeSair className="size-5" />
              Sair
            </Botao>
          </form>
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

        <form action={sairDoAdmin} className="hidden lg:block">
          <Botao type="submit" variante="secundario" tamanho="pequeno" larguraTotal>
            <IconeSair className="size-5" />
            Sair do painel
          </Botao>
        </form>
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
