import { diaLocal, inicioDoDia } from "@/lib/texto";

/**
 * O período dos relatórios (Tarefa 16, §1): a leitura dos `searchParams`
 * `de`/`ate`, o padrão quando faltam ou estão errados, a unidade que a tela
 * mostra selecionada, e o texto por extenso ao lado dos números.
 *
 * **Módulo puro, de propósito**: sem `next/headers`, sem Prisma, sem DOM. A
 * Tarefa 17 (Índice de Manutenção) consome o mesmo período, e os scripts de
 * verificação o importam do terminal para calcular a fronteira que a consulta
 * tem que respeitar. Tudo que precisa de servidor mora em
 * [consultas-admin.ts](consultas-admin.ts); tudo que precisa de navegador mora
 * no `SeletorDePeriodo`.
 *
 * **A URL carrega datas resolvidas, nunca "este mês".** Um link guardado hoje
 * tem que mostrar setembro em novembro. Por isso `interpretarPeriodo` devolve
 * sempre `de`/`ate` concretos — e, quando a URL não os traz, o padrão (o mês
 * corrente) é calculado aqui **sem** reescrever a URL: nada de redirect a cada
 * abertura.
 *
 * Aritmética de calendário (`new Date(ano, mes, dia)`), nunca de
 * milissegundos: com horário de verão no meio, as duas divergem em uma hora e
 * a fronteira do dia escorrega — a mesma regra do `inicioDoDia`.
 */

/** As quatro unidades do seletor. A tela mostra uma; a URL não guarda nenhuma. */
export const UNIDADE_DE_PERIODO = {
  dia: "dia",
  mes: "mes",
  ano: "ano",
  intervalo: "intervalo",
} as const;

export type UnidadeDePeriodo = (typeof UNIDADE_DE_PERIODO)[keyof typeof UNIDADE_DE_PERIODO];

/**
 * Um período já interpretado.
 *
 * `de` e `ate` são o primeiro e o último dia, ambos às 00:00 no fuso da
 * máquina. `fim` é o dia seguinte a `ate`, também às 00:00: **a consulta é
 * `data_retirada >= de AND data_retirada < fim`**, e é assim que `ate` vira
 * inclusivo sem aritmética de "23:59:59.999". A fronteira foi provada em cópia
 * do banco contra o texto `+00:00` do SQLite (Tarefa 16): o primeiro instante
 * de `de` entra, o último de `ate` entra, o primeiro do dia seguinte fica de
 * fora.
 */
export type Periodo = {
  de: Date;
  ate: Date;
  fim: Date;
  /** `de` e `ate` em `AAAA-MM-DD`, o formato da URL e dos campos da tela. */
  deTexto: string;
  ateTexto: string;
  /** Quantos dias de calendário o período cobre (`ate` incluído). */
  dias: number;
  /** A unidade que a tela mostra selecionada — derivada, não guardada. */
  unidade: UnidadeDePeriodo;
  /** "setembro de 2026", "3 a 9 de agosto de 2026" — formatado aqui, no servidor. */
  porExtenso: string;
};

const FORMATO_DE_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-02-30" volta nulo. `new Date(2026, 1, 30)` **não** recusa: vira 2 de
 * março em silêncio, e o relatório mostraria um período que ninguém pediu. A
 * volta pelos três componentes é o que pega isso.
 */
export function lerDia(texto: string): Date | null {
  const partes = FORMATO_DE_DIA.exec(texto);
  if (!partes) return null;

  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(ano, mes - 1, dia);

  const bate =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;

  return bate ? data : null;
}

/** O período de um dia só. */
export function periodoDeDia(dia: Date): Periodo {
  return montar(inicioDoDia(dia), inicioDoDia(dia));
}

/** O mês de calendário que contém a data. */
export function periodoDeMes(data: Date): Periodo {
  const de = new Date(data.getFullYear(), data.getMonth(), 1);
  const ate = new Date(data.getFullYear(), data.getMonth() + 1, 0);
  return montar(de, ate);
}

/** O ano de calendário. */
export function periodoDeAno(ano: number): Periodo {
  return montar(new Date(ano, 0, 1), new Date(ano, 11, 31));
}

/** Qualquer intervalo, `ate` inclusivo. Quem chama já garantiu `de <= ate`. */
export function periodoDeIntervalo(de: Date, ate: Date): Periodo {
  return montar(inicioDoDia(de), inicioDoDia(ate));
}

/** O padrão da tela: o mês corrente. */
export function periodoPadrao(hoje: Date): Periodo {
  return periodoDeMes(hoje);
}

/**
 * Lê `de`/`ate` como vêm dos `searchParams` e devolve o período — ou o
 * padrão, com `invalido: true` para a tela avisar.
 *
 * Não é erro 400: quem colou um link torto ainda vê o relatório, com a frase
 * "Período inválido. Mostrando o mês atual." em vez de uma página em branco.
 * Sem `de` e sem `ate` não é inválido — é a URL canônica de quem abriu a aba
 * pelo menu.
 *
 * Um dos dois presente e o outro ausente **é** inválido: a URL só é canônica
 * com os dois, e um `de` sozinho não diz até quando.
 *
 * Sem teto de intervalo, de propósito: a escala (~1.300 retiradas por ano)
 * não pede, e "dez anos" é uma consulta que cabe no render.
 */
export function interpretarPeriodo(
  params: { de?: string | string[]; ate?: string | string[] },
  hoje: Date = new Date(),
): { periodo: Periodo; invalido: boolean } {
  const deTexto = primeiro(params.de);
  const ateTexto = primeiro(params.ate);

  if (deTexto === undefined && ateTexto === undefined) {
    return { periodo: periodoPadrao(hoje), invalido: false };
  }

  const de = deTexto === undefined ? null : lerDia(deTexto);
  const ate = ateTexto === undefined ? null : lerDia(ateTexto);

  if (!de || !ate || de.getTime() > ate.getTime()) {
    return { periodo: periodoPadrao(hoje), invalido: true };
  }

  return { periodo: periodoDeIntervalo(de, ate), invalido: false };
}

/** `?a=1&a=2` chega como array; o primeiro vale, como o resto do painel faria. */
function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/**
 * A unidade é **derivada** do intervalo, e não guardada na URL: exatamente um
 * dia é Dia; exatamente um mês de calendário é Mês; exatamente um ano é Ano;
 * o resto é Período. Uma fonte de verdade só — a tela não tem como mostrar
 * "Mês" selecionado com 3 a 9 de agosto aplicado.
 */
export function unidadeDoPeriodo(de: Date, ate: Date): UnidadeDePeriodo {
  if (mesmoDia(de, ate)) return UNIDADE_DE_PERIODO.dia;

  const primeiroDoMes = de.getDate() === 1 && de.getMonth() === ate.getMonth();
  const ultimoDoMes = mesmoDia(ate, new Date(ate.getFullYear(), ate.getMonth() + 1, 0));
  if (primeiroDoMes && ultimoDoMes && de.getFullYear() === ate.getFullYear()) {
    return UNIDADE_DE_PERIODO.mes;
  }

  const primeiroDoAno = de.getMonth() === 0 && de.getDate() === 1;
  const ultimoDoAno = ate.getMonth() === 11 && ate.getDate() === 31;
  if (primeiroDoAno && ultimoDoAno && de.getFullYear() === ate.getFullYear()) {
    return UNIDADE_DE_PERIODO.ano;
  }

  return UNIDADE_DE_PERIODO.intervalo;
}

function mesmoDia(a: Date, b: Date): boolean {
  return diaLocal(a) === diaLocal(b);
}

const MES = new Intl.DateTimeFormat("pt-BR", { month: "long" });
const MES_E_ANO = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

/**
 * O período por extenso, na forma em que um relatório impresso o escreveria:
 * "17 de setembro de 2026", "setembro de 2026", "2026",
 * "3 a 9 de agosto de 2026", "3 de agosto a 17 de setembro de 2026",
 * "20 de dezembro de 2025 a 5 de janeiro de 2026".
 *
 * Só as partes que diferem se repetem — o leitor lê "3 a 9 de agosto" de uma
 * vez, e "3 de agosto de 2026 a 9 de agosto de 2026" duas.
 */
export function descreverPeriodo(de: Date, ate: Date): string {
  const unidade = unidadeDoPeriodo(de, ate);

  if (unidade === UNIDADE_DE_PERIODO.dia) return `${de.getDate()} de ${MES_E_ANO.format(de)}`;
  if (unidade === UNIDADE_DE_PERIODO.mes) return MES_E_ANO.format(de);
  if (unidade === UNIDADE_DE_PERIODO.ano) return String(de.getFullYear());

  const mesmoAno = de.getFullYear() === ate.getFullYear();
  const mesmoMes = mesmoAno && de.getMonth() === ate.getMonth();

  if (mesmoMes) return `${de.getDate()} a ${ate.getDate()} de ${MES_E_ANO.format(de)}`;
  if (mesmoAno) {
    return `${de.getDate()} de ${MES.format(de)} a ${ate.getDate()} de ${MES_E_ANO.format(ate)}`;
  }
  return `${de.getDate()} de ${MES_E_ANO.format(de)} a ${ate.getDate()} de ${MES_E_ANO.format(ate)}`;
}

/** Os `searchParams` do período, para montar a URL canônica. */
export function parametrosDoPeriodo(periodo: Pick<Periodo, "deTexto" | "ateTexto">): string {
  return `de=${periodo.deTexto}&ate=${periodo.ateTexto}`;
}

function montar(de: Date, ate: Date): Periodo {
  const fim = inicioDoDia(ate, -1);
  const dias = Math.round((fim.getTime() - de.getTime()) / 86_400_000);

  return {
    de,
    ate,
    fim,
    deTexto: diaLocal(de),
    ateTexto: diaLocal(ate),
    dias,
    unidade: unidadeDoPeriodo(de, ate),
    porExtenso: descreverPeriodo(de, ate),
  };
}

/* ------------------------------------------------------------------------- *
 * O grão da série "Retiradas por dia" (Tarefa 16, §3)
 * ------------------------------------------------------------------------- */

/** Por dia até 31 dias, por semana até 182, por mês acima. */
export const GRAO_DA_SERIE = { dia: "dia", semana: "semana", mes: "mes" } as const;

export type GraoDaSerie = (typeof GRAO_DA_SERIE)[keyof typeof GRAO_DA_SERIE];

const MAXIMO_DE_DIAS_POR_DIA = 31;
const MAXIMO_DE_DIAS_POR_SEMANA = 182;

export function graoDaSerie(periodo: Pick<Periodo, "dias">): GraoDaSerie {
  if (periodo.dias <= MAXIMO_DE_DIAS_POR_DIA) return GRAO_DA_SERIE.dia;
  if (periodo.dias <= MAXIMO_DE_DIAS_POR_SEMANA) return GRAO_DA_SERIE.semana;
  return GRAO_DA_SERIE.mes;
}

/** Um balde da série: o intervalo `[inicio, fim)` e os dois textos que a tela usa. */
export type BaldeDaSerie = {
  inicio: Date;
  fim: Date;
  /** O rótulo do eixo: "03/09", "01/09" (segunda da semana), "set/26". */
  rotulo: string;
  /** O que o tooltip diz por extenso: "3 de setembro de 2026", "semana de 1 a 7 de setembro de 2026". */
  detalhe: string;
};

const DIA_E_MES = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const MES_CURTO = new Intl.DateTimeFormat("pt-BR", { month: "short" });

/** "set/26" — o `Intl` dá "set." e o ano se junta à mão, porque "set. de 26" não cabe num eixo. */
function mesEAnoCurtos(data: Date): string {
  return `${MES_CURTO.format(data).replace(".", "")}/${String(data.getFullYear()).slice(-2)}`;
}

/**
 * Os baldes do período, **com os vazios incluídos**: dia sem retirada aparece
 * com zero, não some — o buraco é a informação.
 *
 * A semana vai de segunda a domingo. O primeiro balde da série começa na
 * segunda que contém `de` (pode começar antes do período) e o último termina
 * no domingo que contém `ate`; o que conta em cada um são só as retiradas do
 * período, então um balde parcial diz o que aconteceu naqueles dias — nunca
 * inventa dado fora da janela.
 */
export function baldesDaSerie(periodo: Periodo, grao: GraoDaSerie = graoDaSerie(periodo)): BaldeDaSerie[] {
  const baldes: BaldeDaSerie[] = [];

  if (grao === GRAO_DA_SERIE.dia) {
    for (let d = periodo.de; d.getTime() < periodo.fim.getTime(); d = inicioDoDia(d, -1)) {
      baldes.push({
        inicio: d,
        fim: inicioDoDia(d, -1),
        rotulo: DIA_E_MES.format(d),
        detalhe: `${d.getDate()} de ${MES_E_ANO.format(d)}`,
      });
    }
    return baldes;
  }

  if (grao === GRAO_DA_SERIE.semana) {
    // getDay(): 0 = domingo. A segunda que contém `de` é `de - ((dia + 6) % 7)`.
    let inicio = inicioDoDia(periodo.de, (periodo.de.getDay() + 6) % 7);
    while (inicio.getTime() < periodo.fim.getTime()) {
      const fim = inicioDoDia(inicio, -7);
      const ultimo = inicioDoDia(fim, 1);
      baldes.push({
        inicio,
        fim,
        rotulo: DIA_E_MES.format(inicio),
        detalhe: `semana de ${descreverPeriodo(inicio, ultimo)}`,
      });
      inicio = fim;
    }
    return baldes;
  }

  let inicio = new Date(periodo.de.getFullYear(), periodo.de.getMonth(), 1);
  while (inicio.getTime() < periodo.fim.getTime()) {
    const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
    baldes.push({
      inicio,
      fim,
      rotulo: mesEAnoCurtos(inicio),
      detalhe: MES_E_ANO.format(inicio),
    });
    inicio = fim;
  }
  return baldes;
}
