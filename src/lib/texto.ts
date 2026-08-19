/**
 * Ajustes de texto para a interface em português.
 *
 * O banco guarda o `tipo` no singular ("Notebook", "Extensão") porque é o que
 * descreve uma linha da tabela. A tela fala de conjuntos ("Notebooks"), então a
 * conversão mora aqui — em um lugar só, para as telas não divergirem entre si.
 */

/** "Notebook" -> "Notebooks", "Extensão" -> "Extensões". */
export function plural(tipo: string): string {
  if (tipo.endsWith("s")) return tipo;
  if (tipo.endsWith("ão")) return `${tipo.slice(0, -2)}ões`;
  return `${tipo}s`;
}

const HORA = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const DIA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

/**
 * "Desde quando" um equipamento está com a pessoa.
 *
 * Compara dias de calendário, não intervalos de 24h: quem pegou às 23h de
 * ontem espera ler "ontem", não "há 9 horas". "Hoje" e "ontem" cobrem quase
 * todos os empréstimos; o resto cai na data, que é o que ajuda quem esqueceu.
 *
 * Só roda no cliente (a lista chega por Server Action depois da montagem), então
 * o fuso é o do tablet e não há divergência de hidratação.
 */
export function desdeQuando(data: Date): string {
  const dia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const dias = Math.round((hoje.getTime() - dia.getTime()) / 86_400_000);
  const hora = HORA.format(data);

  if (dias <= 0) return `hoje às ${hora}`;
  if (dias === 1) return `ontem às ${hora}`;
  return `${DIA.format(data)} às ${hora}`;
}

const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * "18/08/2026, 14:32" — data completa, para o painel da secretaria.
 *
 * Aqui, diferente do tablet, o valor exato importa: é o que vai para a conversa
 * com o aluno ("saiu na terça de manhã"). Roda no servidor, no render das
 * páginas do /admin, e o texto pronto é que desce para a tela.
 */
export function dataHora(data: Date): string {
  return DATA_E_HORA.format(data);
}

/**
 * "há 12 min", "há 3 h", "há 2 dias" — o quanto o relógio já andou.
 *
 * É a coluna que faz a secretaria agir: na fila diz há quanto tempo o
 * equipamento devia estar na bancada; nos ativos, há quanto tempo está fora.
 * Formatado no servidor junto com a data absoluta ao lado — sozinho, um texto
 * relativo envelhece na tela aberta o dia inteiro.
 */
export function haQuantoTempo(data: Date): string {
  const minutos = Math.floor((Date.now() - data.getTime()) / 60_000);

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

/**
 * Primeiro nome, para a saudação.
 * "Prof. Daniel Rocha" -> "Prof. Daniel": o tratamento sozinho não serve.
 */
export function primeiroNome(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);

  if (partes.length > 1 && partes[0].endsWith(".")) {
    return `${partes[0]} ${partes[1]}`;
  }

  return partes[0] ?? nomeCompleto;
}
