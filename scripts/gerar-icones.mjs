#!/usr/bin/env node
/**
 * Gera os ícones do web app a partir da logo da marca (Tarefa 19).
 *
 * Por que um script e não quatro PNG feitos à mão: ícone recortado no editor
 * de imagem é um arquivo que ninguém sabe refazer quando a logo muda. Aqui o
 * recorte é derivado da própria logo, e refazer é rodar o comando.
 *
 *   node scripts/gerar-icones.mjs               grava os arquivos
 *   node scripts/gerar-icones.mjs --verificar   confere sem escrever
 *
 * O `sharp` não está no package.json de propósito: ele é dependência do
 * próprio Next (0.35.3 na árvore) e só é usado aqui, uma vez por mudança de
 * logo. Se um dia o Next parar de trazê-lo, este script passa a pedir
 * instalação explícita — e é melhor descobrir assim do que carregar uma
 * dependência de 10 MB no `package.json` por causa de quatro arquivos.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEM = join(RAIZ, "src/assets/brand/logo-unoesc-colorido.png");

/**
 * A logo é EMPILHADA: símbolo em cima, a palavra "unoesc" embaixo, separados
 * por uma faixa horizontal inteiramente vazia em y=233..263 (31px). Medido no
 * arquivo, não estimado — e o recorte é por LINHA, nunca por coluna: o maior
 * vão vertical vazio do arquivo inteiro tem 5px (x=374..378), então não existe
 * corte limpo entre símbolo e palavra no eixo horizontal.
 *
 * Refaça a medição (e este número) se a logo for trocada.
 */
const ULTIMA_LINHA_DO_SIMBOLO = 232;

/**
 * Margem de 10% em cada lado — o símbolo ocupa 80% do lado do ícone. O iOS
 * arredonda o `apple-touch-icon` por conta própria e o Android o põe num
 * quadrado arredondado; sem margem, o símbolo encostaria no corte.
 */
const MARGEM = 0.1;

/** Abaixo disto o pixel é fundo, não desenho. */
const LIMIAR_ALFA = 16;

/**
 * Não há `src/app/icon.png` aqui, e a ausência é medida. O enunciado o pedia
 * como "favicon, convenção do Next", mas o projeto já tem `src/app/favicon.ico`
 * — e, com o `.ico` presente, o Next emite só
 * `<link rel="icon" href="/favicon.ico" sizes="256x256">`: o `/icon.png` vira
 * uma rota estática que NENHUMA página referencia. Conferido por HTTP contra o
 * `next start`, lendo as tags do HTML da `/`.
 *
 * Se um dia o `favicon.ico` sair, é aqui que o `icon.png` volta.
 */
const ALVOS = [
  { arquivo: "public/apple-touch-icon.png", lado: 180 },
  { arquivo: "public/icon-192.png", lado: 192 },
  { arquivo: "public/icon-512.png", lado: 512 },
];

/** Caixa envolvente do desenho dentro da banda recortada. */
async function caixaDoSimbolo() {
  const { data, info } = await sharp(ORIGEM)
    .extract({
      left: 0,
      top: 0,
      width: (await sharp(ORIGEM).metadata()).width,
      height: ULTIMA_LINHA_DO_SIMBOLO + 1,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] < LIMIAR_ALFA) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) {
    throw new Error(
      `Nenhum pixel opaco em y=0..${ULTIMA_LINHA_DO_SIMBOLO} de ${ORIGEM}. ` +
        "A logo mudou? Refaça a medição da faixa vazia antes de rodar.",
    );
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/** Um PNG quadrado, com o símbolo centralizado sobre branco OPACO. */
async function montar(caixa, lado) {
  const conteudo = Math.round(lado * (1 - 2 * MARGEM));

  // `fit: "contain"` preserva a proporção; o fundo branco opaco não é
  // preferência: o iOS compõe o apple-touch-icon sobre PRETO, então um PNG
  // com transparência sai com halo escuro em volta do símbolo.
  const simbolo = await sharp(ORIGEM)
    .extract(caixa)
    .resize(conteudo, conteudo, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .toBuffer();

  return sharp({
    create: {
      width: lado,
      height: lado,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: simbolo, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const verificar = process.argv.includes("--verificar");
const caixa = await caixaDoSimbolo();
const origem = await sharp(ORIGEM).metadata();

console.log(
  `logo: ${origem.width}x${origem.height} — símbolo em ` +
    `x=${caixa.left}..${caixa.left + caixa.width - 1}, ` +
    `y=${caixa.top}..${caixa.top + caixa.height - 1} ` +
    `(${caixa.width}x${caixa.height})`,
);

let divergentes = 0;
for (const { arquivo, lado } of ALVOS) {
  const destino = join(RAIZ, arquivo);
  const novo = await montar(caixa, lado);
  const ampliacao = (lado * (1 - 2 * MARGEM)) / caixa.height;
  const nota = `${arquivo} — ${lado}x${lado}, ${novo.length} bytes, ${ampliacao.toFixed(2)}x da fonte`;

  if (verificar) {
    const atual = await readFile(destino).catch(() => null);
    const igual =
      atual !== null &&
      createHash("sha256").update(atual).digest("hex") ===
        createHash("sha256").update(novo).digest("hex");
    console.log(`  ${igual ? "ok" : "DIVERGE"}  ${nota}`);
    if (!igual) divergentes++;
    continue;
  }

  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, novo);
  console.log(`  gravado  ${nota}`);
}

if (verificar && divergentes > 0) {
  console.error(
    `\n${divergentes} ícone(s) fora de sincronia com a logo. ` +
      "Rode `node scripts/gerar-icones.mjs`.",
  );
  process.exit(1);
}
