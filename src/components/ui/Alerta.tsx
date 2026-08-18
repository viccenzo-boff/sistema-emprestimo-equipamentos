import { IconeAlerta, IconeCheck, IconeInfo } from "@/components/ui/icones";

/**
 * Aviso visual do portal.
 *
 * Regra de conteúdo: `mensagem` diz o que aconteceu, `detalhe` diz o que fazer
 * agora. Erro que só informa deixa o aluno parado na frente do tablet.
 *
 * Acessibilidade: erros usam `role="alert"` (o leitor de tela interrompe e
 * anuncia na hora); avisos e confirmações usam `status`, que espera a pausa.
 */

type TomDeAlerta = "erro" | "aviso" | "sucesso" | "info";

type Props = {
  tom?: TomDeAlerta;
  mensagem: string;
  detalhe?: string;
  className?: string;
};

const TONS: Record<
  TomDeAlerta,
  { caixa: string; medalha: string; titulo: string; corpo: string; Icone: typeof IconeAlerta }
> = {
  erro: {
    caixa: "border-erro-borda bg-erro-fundo",
    medalha: "bg-erro text-white",
    titulo: "text-erro",
    corpo: "text-erro/85",
    Icone: IconeAlerta,
  },
  aviso: {
    caixa: "border-aviso-borda bg-aviso-fundo",
    medalha: "bg-aviso text-white",
    titulo: "text-aviso",
    corpo: "text-aviso/85",
    Icone: IconeAlerta,
  },
  sucesso: {
    caixa: "border-sucesso-borda bg-sucesso-fundo",
    medalha: "bg-sucesso text-white",
    titulo: "text-sucesso",
    corpo: "text-sucesso/85",
    Icone: IconeCheck,
  },
  info: {
    caixa: "border-borda bg-marca-azul-tenue",
    medalha: "bg-marca-azul text-white",
    titulo: "text-marca-azul",
    corpo: "text-tinta-suave",
    Icone: IconeInfo,
  },
};

export function Alerta({ tom = "erro", mensagem, detalhe, className = "" }: Props) {
  const estilo = TONS[tom];
  const { Icone } = estilo;

  return (
    <div
      role={tom === "erro" ? "alert" : "status"}
      className={[
        "animate-surgir-curto flex items-start gap-4 rounded-2xl border p-5",
        estilo.caixa,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          estilo.medalha,
        ].join(" ")}
      >
        <Icone className="size-6" />
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <p className={["text-lg leading-snug font-semibold", estilo.titulo].join(" ")}>
          {mensagem}
        </p>
        {detalhe ? (
          <p className={["mt-1 text-base leading-relaxed", estilo.corpo].join(" ")}>
            {detalhe}
          </p>
        ) : null}
      </div>
    </div>
  );
}
