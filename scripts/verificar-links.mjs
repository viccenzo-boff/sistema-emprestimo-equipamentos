/**
 * Confere os links da wiki com o **lychee** — `npm run docs:links`.
 *
 * Constrói o site com `mkdocs build --strict` e passa o resultado ao lychee, com
 * as âncoras internas incluídas. Sai em 0 quando nenhuma referência está
 * quebrada.
 *
 * ## Por que o alvo é o site construído, e não `docs/`
 *
 * O enunciado da D13 pede "lychee sobre `docs/`". Medido antes de decidir, o
 * markdown de origem produz 60 falsos positivos, de duas naturezas — e as duas
 * são estruturais, não passivo de conteúdo:
 *
 * 1. **57 âncoras.** O lychee recalcula o identificador de cada título com o
 *    próprio algoritmo, que **preserva o acento**; o Python-Markdown normaliza
 *    para ASCII. Provado nos dois sentidos com um arquivo descartável: o lychee
 *    aceita `#baixa-física` e recusa `#baixa-fisica`, e é a segunda que o site
 *    gera. Obedecer ao portão quebraria os links no site de verdade.
 * 2. **3 arquivos.** `docs/en/contribuir/*` não existe como markdown — a página
 *    é gerada pelo `fallback_to_default` do `mkdocs-static-i18n` (decisão da
 *    D12). No markdown parece link morto; no site publicado funciona. Excluí-los
 *    exigiria uma lista que cresce a cada página não traduzida, que é o depósito
 *    que o próprio enunciado manda não criar.
 *
 * No HTML gerado o identificador está **escrito**, não deduzido, e as páginas do
 * `fallback` existem. Mesmo argumento que faz o gerador da planilha modelo
 * consumir a constante que o leitor exporta: verificação que recalcula o valor
 * é uma segunda implementação da regra.
 *
 * Preço aceito: a mensagem aponta o HTML gerado, e não o `.md` que se edita. O
 * script desfaz isso — cada erro sai com o arquivo de origem provável ao lado.
 *
 * ## Por que `--offline`
 *
 * O portão existe para pegar o que **este repositório** quebra: página
 * renomeada, âncora movida, imagem apagada. Medido: a wiki tem 109 links para o
 * github.com, e o host devolve limite de taxa com recuo de 5 minutos — a
 * execução não terminou em 2 minutos e duas seguidas discordaram. Um site de
 * terceiro fora do ar não é defeito da wiki, e CI vermelho que ninguém consegue
 * consertar é o que o preâmbulo da D13 manda evitar. O link canônico do próprio
 * site também falharia enquanto o Pages não estiver ligado.
 *
 * ## Onde mora o lychee
 *
 * Em `.tools/lychee/`, fora do Git, como o Vale e o bpmn-js: é dependência da
 * wiki, não do sistema, e não é Python nem Node. Receita na seção
 * "Documentação" do CONTRIBUTING.md; `LYCHEE_PATH` sobrescreve.
 *
 * Uso:
 *   node scripts/verificar-links.mjs                constrói e confere
 *   node scripts/verificar-links.mjs --site <dir>   confere um site já construído
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_MKDOCS = path.join(RAIZ, "mkdocs.yml");
const DESTINO_PADRAO = path.join(RAIZ, ".site-links");

const EH_WINDOWS = process.platform === "win32";

/**
 * Onde procurar o lychee. `LYCHEE_PATH` vem primeiro para a Action poder apontar
 * o binário que ela baixou; depois o `.tools/` local; por último o `PATH`, para
 * quem instalou pelo gerenciador de pacotes do sistema.
 */
const CAMINHOS_DO_LYCHEE = [
  process.env.LYCHEE_PATH,
  path.join(RAIZ, ".tools", "lychee", EH_WINDOWS ? "lychee.exe" : "lychee"),
].filter((caminho) => typeof caminho === "string" && caminho.length > 0);

async function principal() {
  const siteInformado = lerOpcao("--site");
  const prefixo = await prefixoDoSiteUrl();

  const base = siteInformado ? path.resolve(RAIZ, siteInformado) : DESTINO_PADRAO;
  const publicado = path.join(base, prefixo);

  if (siteInformado) {
    if (!existsSync(publicado)) {
      erroFatal(
        `O site informado não tem o diretório do prefixo publicado.`,
        `Esperado: ${caminhoRelativo(publicado)}\n` +
          `O 'site_url' do mkdocs.yml publica em '/${prefixo}/', e o lychee precisa\n` +
          `dessa pasta para resolver os links absolutos que o tema gera.`,
      );
    }
  } else {
    await construir(publicado);
  }

  const lychee = localizarLychee();
  const paginas = await contarHtml(publicado);

  // Cobertura antes do veredito. Ferramenta que examinou o conjunto vazio sai em
  // 0, e esse verde é indistinguível do verde de um site sem link quebrado.
  const lidos = await contarEntradas(lychee, base);

  if (paginas === 0) {
    erroFatal("Nenhuma página HTML no site construído — o lychee não teria o que ler.");
  }

  if (lidos !== paginas) {
    erroFatal(
      "O lychee não leu todas as páginas do site.",
      `No disco: ${paginas} arquivo(s) .html\nLidos pelo lychee: ${lidos}\n` +
        `O padrão de caminho passado ao lychee está errado, e um escopo errado\n` +
        `sai em 0 tendo lido menos do que devia.`,
    );
  }

  const relatorio = await conferir(lychee, base);

  console.log(
    `\nLinks da wiki — ${paginas} páginas, ${relatorio.total} referências ` +
      `(${relatorio.unique} únicas), ${relatorio.excludes} não conferidas (--offline).`,
  );

  if (relatorio.errors === 0) {
    console.log("Nenhuma referência quebrada.\n");
    return;
  }

  console.error(`\n${relatorio.errors} referência(s) quebrada(s):\n`);

  for (const [arquivo, ocorrencias] of Object.entries(relatorio.error_map)) {
    const html = path.resolve(arquivo);
    console.error(`  ${caminhoRelativo(html)}`);
    console.error(`  origem: ${origemProvavel(html, publicado)}`);

    for (const ocorrencia of ocorrencias) {
      const linha = ocorrencia.span?.line ?? "?";
      const coluna = ocorrencia.span?.column ?? "?";
      const motivo = ocorrencia.status?.text ?? "erro desconhecido";
      console.error(`    linha ${linha}:${coluna}  ${motivo}`);
      console.error(`      ${decodeURI(ocorrencia.url ?? "")}`);
    }

    console.error("");
  }

  process.exit(1);
}

/**
 * O prefixo vem do `site_url` do mkdocs.yml, e não de uma constante aqui.
 *
 * O tema gera link absoluto (`/sistema-emprestimo-equipamentos/en/`) no seletor
 * de idioma e no canônico. Para o lychee resolvê-los, o site precisa estar
 * construído **dentro** de uma pasta com esse nome, e o `--root-dir` apontar
 * para o pai. Repetir o nome aqui criaria o segundo dono de um valor que já tem
 * dono: no dia em que o repositório mudar de nome, o portão passaria a acusar
 * 33 links que estão certos.
 */
async function prefixoDoSiteUrl() {
  const yml = await readFile(CONFIG_MKDOCS, "utf8");
  const casamento = yml.match(/^site_url:\s*(\S+)\s*$/m);

  if (!casamento) {
    erroFatal("O mkdocs.yml não declara 'site_url', e é dele que sai o prefixo publicado.");
  }

  const { pathname } = new URL(casamento[1]);
  const prefixo = pathname.replace(/^\/+|\/+$/g, "");

  if (prefixo.length === 0) {
    erroFatal(
      "O 'site_url' do mkdocs.yml publica na raiz do domínio.",
      "Este script assume um prefixo de caminho (é o caso do GitHub Pages de projeto).",
    );
  }

  return prefixo;
}

async function construir(publicado) {
  await rm(DESTINO_PADRAO, { recursive: true, force: true });

  const codigo = await executar("mkdocs", ["build", "--strict", "-d", publicado], {
    herdarSaida: true,
  });

  if (codigo !== 0) {
    erroFatal(
      "O 'mkdocs build --strict' falhou, então não há site para conferir.",
      "Ative o ambiente Python da wiki antes (seção 'Documentação' do CONTRIBUTING.md).",
    );
  }
}

const ARGUMENTOS_COMUNS = (base) => [
  "--offline",
  "--include-fragments",
  // O MkDocs publica com URL de diretório: um link para `glossario/` é servido
  // por `glossario/index.html`. Sem esta linha o lychee acha o diretório, não
  // consegue ler âncora de dentro dele, e devolve 180 "Cannot find fragment".
  "--index-files",
  "index.html",
  // Resolve os links absolutos do tema contra a pasta que representa a raiz do
  // domínio — por isso o site é construído dentro do prefixo do `site_url`.
  "--root-dir",
  base,
  "--no-progress",
  `${path.basename(base)}/**/*.html`,
];

async function contarEntradas(lychee, base) {
  const { stdout } = await capturar(lychee, ["--dump-inputs", ...ARGUMENTOS_COMUNS(base)], {
    cwd: path.dirname(base),
  });

  return stdout.split("\n").filter((linha) => linha.trim().length > 0).length;
}

async function conferir(lychee, base) {
  const { stdout, stderr } = await capturar(
    lychee,
    ["--format", "json", ...ARGUMENTOS_COMUNS(base)],
    { cwd: path.dirname(base), aceitarFalha: true },
  );

  try {
    return JSON.parse(stdout);
  } catch {
    erroFatal("O lychee não devolveu um relatório JSON legível.", stderr || stdout);
  }
}

/**
 * De volta ao arquivo que a pessoa edita.
 *
 * `<publicado>/referencia/glossario/index.html` veio de `docs/referencia/glossario.md`.
 * Quando o `.md` não existe, a página é uma das que o `fallback_to_default` gera
 * a partir do português — dizer isso poupa a busca por um arquivo que nunca
 * existiu.
 */
function origemProvavel(html, publicado) {
  const relativo = path.relative(publicado, html).replace(/\\/g, "/");
  const semIndex = relativo.replace(/(^|\/)index\.html$/, "$1").replace(/\/$/, "");
  const candidato = path.join(RAIZ, "docs", `${semIndex === "" ? "index" : semIndex}.md`);

  if (existsSync(candidato)) return caminhoRelativo(candidato);

  const equivalentePt = relativo.startsWith("en/")
    ? path.join(RAIZ, "docs", `${semIndex.slice(3) || "index"}.md`)
    : null;

  if (equivalentePt && existsSync(equivalentePt)) {
    return `${caminhoRelativo(equivalentePt)} (a página em inglês vem do fallback do i18n)`;
  }

  return "gerada pelo tema — não há markdown de origem";
}

async function contarHtml(diretorio) {
  const entradas = await readdir(diretorio, { withFileTypes: true, recursive: true });
  return entradas.filter((entrada) => entrada.isFile() && entrada.name.endsWith(".html")).length;
}

function localizarLychee() {
  for (const caminho of CAMINHOS_DO_LYCHEE) {
    if (existsSync(caminho)) return caminho;
  }

  // Sem o binário em `.tools/`, ainda pode estar no PATH (scoop, brew, cargo).
  return EH_WINDOWS ? "lychee.exe" : "lychee";
}

function executar(comando, argumentos, { herdarSaida = false, cwd = RAIZ } = {}) {
  return new Promise((resolver) => {
    const processo = spawn(comando, argumentos, {
      cwd,
      shell: false,
      stdio: herdarSaida ? "inherit" : "ignore",
    });

    processo.on("error", (erro) =>
      erroFatal(`Não consegui executar '${comando}'.`, erro.message),
    );
    processo.on("close", (codigo) => resolver(codigo));
  });
}

function capturar(comando, argumentos, { cwd = RAIZ, aceitarFalha = false } = {}) {
  return new Promise((resolver) => {
    const processo = spawn(comando, argumentos, { cwd, shell: false, });
    let stdout = "";
    let stderr = "";

    processo.stdout.on("data", (pedaco) => (stdout += pedaco));
    processo.stderr.on("data", (pedaco) => (stderr += pedaco));

    processo.on("error", (erro) =>
      erroFatal(
        `Não consegui executar o lychee em '${comando}'.`,
        `${erro.message}\n\nReceita de instalação: seção "Documentação" do CONTRIBUTING.md.`,
      ),
    );

    processo.on("close", (codigo) => {
      if (codigo !== 0 && !aceitarFalha) {
        erroFatal(`O lychee saiu com código ${codigo}.`, stderr || stdout);
      }

      resolver({ stdout, stderr });
    });
  });
}

function lerOpcao(nome) {
  const indice = process.argv.indexOf(nome);
  if (indice === -1) return null;

  const valor = process.argv[indice + 1];
  if (!valor || valor.startsWith("--")) erroFatal(`A opção ${nome} precisa de um caminho.`);

  return valor;
}

const caminhoRelativo = (alvo) => path.relative(RAIZ, alvo).replace(/\\/g, "/");

function erroFatal(mensagem, detalhe) {
  console.error(`\n${mensagem}`);
  if (detalhe) console.error(detalhe);
  process.exit(1);
}

await principal();
