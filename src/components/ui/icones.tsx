/**
 * Ícones em SVG inline.
 *
 * São poucos e nunca mudam — uma biblioteca de ícones aqui seria um pacote
 * inteiro no bundle do tablet para desenhar seis formas. Todos herdam a cor do
 * texto (`currentColor`) e o tamanho vem da classe, nunca de atributo fixo.
 */

type PropsDeIcone = {
  className?: string;
};

const TRACO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Svg({
  className,
  children,
}: PropsDeIcone & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconeNotebook({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <rect x="3" y="4.5" width="18" height="12" rx="1.75" {...TRACO} />
      <path d="M1.5 19.5h21" {...TRACO} />
    </Svg>
  );
}

export function IconeTablet({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <rect x="5.5" y="2.5" width="13" height="19" rx="2" {...TRACO} />
      <path d="M10.5 18.5h3" {...TRACO} />
    </Svg>
  );
}

export function IconeExtensao({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M9 2.5v5M15 2.5v5" {...TRACO} />
      <path d="M6.5 7.5h11v3a5.5 5.5 0 0 1-5.5 5.5A5.5 5.5 0 0 1 6.5 10.5z" {...TRACO} />
      <path d="M12 16v5.5" {...TRACO} />
    </Svg>
  );
}

export function IconeCaixa({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" {...TRACO} />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" {...TRACO} />
    </Svg>
  );
}

export function IconeCheck({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="m4.5 12.5 5 5 10-11" {...TRACO} strokeWidth={2.25} />
    </Svg>
  );
}

export function IconeAlerta({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M12 3.5 22 20H2z" {...TRACO} />
      <path d="M12 9.5v4.5" {...TRACO} />
      <circle cx="12" cy="17.25" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconeInfo({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" {...TRACO} />
      <path d="M12 11v5.5" {...TRACO} />
      <circle cx="12" cy="7.75" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconeSeta({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M14.5 5.5 8 12l6.5 6.5" {...TRACO} strokeWidth={2} />
    </Svg>
  );
}

export function IconeApagar({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M8.5 5.5H20a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H8.5L2.5 12z" {...TRACO} />
      <path d="m11.5 9.5 5 5M16.5 9.5l-5 5" {...TRACO} />
    </Svg>
  );
}

/**
 * Ícone da categoria, escolhido pelo `tipo` gravado no banco.
 *
 * Renderiza aqui dentro em vez de devolver o componente para quem chama: um
 * componente escolhido durante o render remonta a cada troca de tipo (e o lint
 * de React reclama, com razão).
 */
export function IconeCategoria({ tipo, className }: PropsDeIcone & { tipo: string }) {
  const chave = tipo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (chave.includes("notebook")) return <IconeNotebook className={className} />;
  if (chave.includes("tablet")) return <IconeTablet className={className} />;
  if (chave.includes("exten")) return <IconeExtensao className={className} />;
  return <IconeCaixa className={className} />;
}
