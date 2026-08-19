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
 * Devolução: a seta desce para dentro da bandeja.
 * É a metáfora da bancada — o equipamento sai da mão e fica apoiado ali.
 */
export function IconeDevolver({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M12 3v9" {...TRACO} strokeWidth={2} />
      <path d="m8.25 8.5 3.75 3.75 3.75-3.75" {...TRACO} strokeWidth={2} />
      <path d="M3.5 14.5v4a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4" {...TRACO} />
    </Svg>
  );
}

/* ------------------------------------------------------------------------- *
 * Painel Administrativo (Fluxo 3)
 * ------------------------------------------------------------------------- */

/** Fila de devoluções: itens empilhados esperando conferência na bancada. */
export function IconeFila({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M3.5 13.5v5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5" {...TRACO} />
      <path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4" {...TRACO} />
      <path d="M7.5 3.5h9M6.5 7.5h11" {...TRACO} />
    </Svg>
  );
}

/** Empréstimos ativos: o que está fora, e há quanto tempo. */
export function IconeRelogio({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" {...TRACO} />
      <path d="M12 7.5V12l3 2" {...TRACO} />
    </Svg>
  );
}

/** Acesso restrito: a tela de senha do painel. */
export function IconeCadeado({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" {...TRACO} />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" {...TRACO} />
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Sair do painel. */
export function IconeSair({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M15 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H15" {...TRACO} />
      <path d="M10.5 8 6.5 12l4 4M6.5 12H15" {...TRACO} />
    </Svg>
  );
}

/** Cadastrar item novo no inventário. */
export function IconeMais({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M12 5.5v13M5.5 12h13" {...TRACO} strokeWidth={2.25} />
    </Svg>
  );
}

/**
 * Seta do `<select>` de categoria.
 *
 * Existe porque `appearance-none` apaga a seta nativa junto com o estilo do
 * sistema — e sem seta o campo volta a parecer um campo de texto, que é
 * exatamente a confusão que o `<select>` veio resolver.
 */
export function IconeChevron({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="m6.5 9.5 5.5 5.5 5.5-5.5" {...TRACO} strokeWidth={2} />
    </Svg>
  );
}

/** Manutenção: o equipamento sai de circulação. */
export function IconeFerramenta({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path
        d="M15.5 3.5a5 5 0 0 0-4.6 6.95L3.9 17.4a1.5 1.5 0 0 0 0 2.12l.58.58a1.5 1.5 0 0 0 2.12 0l6.95-6.95A5 5 0 1 0 15.5 3.5z"
        {...TRACO}
      />
    </Svg>
  );
}

/** Editar a etiqueta: o lápis é o verbo "renomear" em um símbolo só. */
export function IconeLapis({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M4 20h4l10-10a2.4 2.4 0 0 0-3.4-3.4L4.6 16.6z" {...TRACO} />
      <path d="m13.8 7.2 3 3" {...TRACO} />
    </Svg>
  );
}

/**
 * Inativar: o círculo cortado, não a lixeira.
 *
 * A lixeira promete que o registro some, e ele não some — o equipamento fica no
 * banco justamente para o histórico de empréstimos continuar apontando para
 * algum lugar. O símbolo de proibido diz o que de fato acontece: o item para de
 * ser oferecido.
 */
export function IconeBloquear({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.25" {...TRACO} />
      <path d="m6.4 6.4 11.2 11.2" {...TRACO} />
    </Svg>
  );
}

/** Reativar: a seta que volta. */
export function IconeRestaurar({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M4.5 9.5h5v-5" {...TRACO} />
      <path
        d="M4.9 9.4a8 8 0 1 1-.65 5.1"
        {...TRACO}
      />
    </Svg>
  );
}

/** Categorias: a etiqueta de prateleira. */
export function IconeEtiquetas({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path
        d="M4 5.75A1.75 1.75 0 0 1 5.75 4h4.4c.46 0 .9.18 1.23.51l7.1 7.1a1.75 1.75 0 0 1 0 2.48l-4.4 4.4a1.75 1.75 0 0 1-2.47 0l-7.1-7.1A1.75 1.75 0 0 1 4 10.15z"
        {...TRACO}
      />
      <circle cx="8.4" cy="8.4" r="1.35" {...TRACO} />
    </Svg>
  );
}

/** Busca no inventário: a lupa, que é a única forma que ninguém precisa aprender. */
export function IconeLupa({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <circle cx="10.75" cy="10.75" r="6.25" {...TRACO} />
      <path d="m15.4 15.4 4.1 4.1" {...TRACO} strokeWidth={2} />
    </Svg>
  );
}

/** Gestão de usuários: duas pessoas, que é o que a aba lista. */
export function IconePessoas({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <circle cx="9.5" cy="8" r="3.25" {...TRACO} />
      <path d="M3.5 19.25a6 6 0 0 1 12 0" {...TRACO} />
      <path d="M16 5.1a3.25 3.25 0 0 1 0 5.8" {...TRACO} />
      <path d="M17.5 13.9a6 6 0 0 1 3 5.35" {...TRACO} />
    </Svg>
  );
}

/**
 * Importação de planilha: a grade da tabela com a seta entrando.
 *
 * A seta aponta para **dentro** do documento de propósito — a mesma forma com a
 * seta saindo é o ícone universal de exportar, e as duas ações viveriam lado a
 * lado se o painel um dia ganhar "baixar a lista".
 */
export function IconePlanilha({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M20 12.5v-6A1.5 1.5 0 0 0 18.5 5h-13A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19h6" {...TRACO} />
      <path d="M4 9.25h16M9.75 9.25V19" {...TRACO} />
      <path d="M17.5 14.5v5.5m0 0 2.25-2.25M17.5 20l-2.25-2.25" {...TRACO} />
    </Svg>
  );
}

/**
 * Baixar: a seta descendo para a bandeja.
 *
 * Deliberadamente **não** é a grade do [IconePlanilha] com a seta invertida,
 * que era a forma prevista ali para um futuro "baixar a lista". Os dois botões
 * vivem no mesmo cartão, e a versão espelhada obrigaria a secretaria a
 * distinguir importar de baixar pela direção de uma seta de 20px. A forma
 * genérica de download não tem esse problema — e deixa a grade espelhada livre
 * para quando existir exportação de dados de verdade.
 */
export function IconeBaixar({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <path d="M12 3.75v10.5" {...TRACO} />
      <path d="m8.25 10.5 3.75 3.75 3.75-3.75" {...TRACO} />
      <path d="M4.75 16v2.5A1.75 1.75 0 0 0 6.5 20.25h11a1.75 1.75 0 0 0 1.75-1.75V16" {...TRACO} />
    </Svg>
  );
}

/** Confirmação de usuário: a pessoa com o visto. */
export function IconePessoaCheck({ className }: PropsDeIcone) {
  return (
    <Svg className={className}>
      <circle cx="10" cy="8" r="3.25" {...TRACO} />
      <path d="M4 19.25a6 6 0 0 1 10.4-4.1" {...TRACO} />
      <path d="m14.75 18 2 2 3.75-4" {...TRACO} strokeWidth={2} />
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
