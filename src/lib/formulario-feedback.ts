import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { CHAVE_URL_FORMULARIO, type QrDoFormulario } from "@/lib/tipos";

/**
 * O formulário externo de sugestões e o QR code que aponta para ele
 * (Tarefa 14, item 6).
 *
 * O QR existe porque o celular do estudante **não alcança** o computador do
 * secretário — a rede é local e HTTP —, então um formulário dentro do sistema
 * seria um QR morto. O destino é um formulário do Google numa conta
 * institucional do setor (procedimento no CONTRIBUTING.md), e a URL mora no
 * banco porque "anos sem atualização" corta dos dois lados: se o link mudar,
 * trocá-lo não pode exigir deploy.
 *
 * Módulo neutro: é lido pela action do tablet (`confirmarRetirada`, que manda
 * o QR na resposta) e pelo render do painel (a prévia no cartão "Formulário de
 * sugestões"). Uma cópia em cada lado seria a segunda regra que diverge em
 * silêncio — o mesmo argumento que tirou `semAcento` das actions na Tarefa 7.
 */

/**
 * A URL configurada, ou nulo quando não há linha ou o valor está em branco.
 * Nos dois casos o QR não aparece, e nada quebra: é o estado de fábrica.
 */
export async function lerUrlDoFormulario(): Promise<string | null> {
  const linha = await prisma.configuracao.findUnique({
    where: { chave: CHAVE_URL_FORMULARIO },
    select: { valor: true },
  });

  const valor = linha?.valor.trim() ?? "";
  return valor.length > 0 ? valor : null;
}

/** Teto da URL. Um link de formulário tem ~50 caracteres; 2 KB já é um QR ilegível. */
export const TAMANHO_MAXIMO_DA_URL = 2048;

/**
 * Aceita a URL, ou explica por que não.
 *
 * Só `https://` — a câmera do celular abre o link direto, sem ninguém conferir
 * o cadeado, e um `http://` num formulário que pede texto livre seria um canal
 * aberto na rede do campus. Quem valida a forma é o próprio `URL` do Node, não
 * uma expressão regular: é o mesmo interpretador que o celular vai usar.
 */
export function validarUrlDoFormulario(
  bruta: string,
): { ok: true; url: string } | { ok: false; motivo: string } {
  const texto = bruta.trim();

  if (texto.length > TAMANHO_MAXIMO_DA_URL) {
    return { ok: false, motivo: `A URL tem mais de ${TAMANHO_MAXIMO_DA_URL} caracteres.` };
  }

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return { ok: false, motivo: "Isso não é um endereço completo." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, motivo: "O endereço precisa começar com https://." };
  }

  if (url.hostname.length === 0) {
    return { ok: false, motivo: "O endereço não tem domínio." };
  }

  return { ok: true, url: url.toString() };
}

/**
 * Gera o QR em SVG, no servidor, sem tocar a rede.
 *
 * Conferido antes de virar desenho: `toString` com `type: "svg"` devolve um
 * `<svg>` com `viewBox` e dois `<path>` — nada mais —, em ~13 ms e ~1,5 KB
 * para uma URL de formulário, e a mesma URL produz sempre o mesmo texto. Sem
 * `width`/`height` no arquivo: o tamanho é de quem exibe.
 *
 * Nível de correção `M` (15%) e margem de um módulo: é o que uma câmera de
 * celular lê a 30–40 cm de um tablet, e a margem menor deixa o código maior
 * dentro dos mesmos pixels.
 */
export async function gerarQrDoFormulario(url: string): Promise<QrDoFormulario> {
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
  });

  return { svg, url };
}

/**
 * Os dois passos de uma vez, para quem só quer "o QR, se houver".
 *
 * Uma leitura de banco e uma geração de ~13 ms por retirada — mais barato do
 * que tornar a rota `/` dinâmica para ler a URL no render da página.
 */
export async function qrDoFormularioSeConfigurado(): Promise<QrDoFormulario | null> {
  const url = await lerUrlDoFormulario();
  return url ? gerarQrDoFormulario(url) : null;
}
