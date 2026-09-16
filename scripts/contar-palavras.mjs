#!/usr/bin/env node
/**
 * Conta as palavras da wiki por idioma, no site CONSTRUÍDO — é o número que a
 * tabela "Depois: o que existe hoje" do estudo de caso publica.
 *
 *   npm run docs:palavras            # constrói e conta
 *   npm run docs:palavras -- --site  # só conta, sobre o `site/` que já existe
 *
 * Por que sobre o site, e não sobre o markdown: `wc -w` em `docs/` conta
 * sintaxe — URL de link, célula de tabela, atributo de imagem, o comentário
 * HTML do template — e dá ~27 % a mais do que o leitor lê. O número que
 * interessa é o do texto renderizado, e ele só existe depois do build.
 *
 * O que conta como uma página de cada idioma vem da árvore de ORIGEM: cada
 * `docs/**.md` fora de `en/` é português, cada `docs/en/**.md` é inglês, e
 * cada um é lido na página que o MkDocs gerou para ele. As páginas que o
 * `fallback_to_default` cria em `/en/` a partir de um `.md` português não
 * entram no inglês — são o mesmo texto contado duas vezes. É a mesma
 * contagem de páginas da tabela (17 e 16 em 2026-09-16).
 *
 * O texto é o do `<article>`: fora dele ficam a navegação, o índice lateral,
 * a busca e o rodapé, que se repetem em toda página e não são conteúdo. Uma
 * "palavra" é o que sobra entre espaços depois de tirar as tags — o mesmo
 * critério do `wc -w`, aplicado ao texto certo.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const RAIZ = process.cwd();
const DOCS = join(RAIZ, "docs");
const SITE = join(RAIZ, "site");

if (!process.argv.includes("--site")) {
  // `shell: false`, como no verificar-links.mjs: o `mkdocs` é resolvido pelo
  // PATH do ambiente ativado, e é isso que faz o de dentro do `.venv-docs` ser
  // o escolhido (ver a decisão da D02 sobre chamar pelo caminho).
  const build = spawnSync("mkdocs", ["build", "--strict", "--quiet"], {
    stdio: "inherit",
    shell: false,
  });
  if (build.status !== 0) {
    console.error("O `mkdocs build --strict` falhou. Ative o ambiente Python (.venv-docs).");
    process.exit(1);
  }
}

if (!existsSync(SITE)) {
  console.error("Não existe `site/`. Rode sem `--site` para construir antes.");
  process.exit(1);
}

function arquivosMd(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosMd(caminho);
    return nome.endsWith(".md") ? [caminho] : [];
  });
}

/** `docs/painel/inventario.md` -> `site/painel/inventario/index.html`; `index.md` -> `index.html`. */
function paginaDe(md) {
  const rel = relative(DOCS, md).split(sep).join("/").replace(/\.md$/, "");
  const html = rel.endsWith("index") ? `${rel}.html` : `${rel}/index.html`;
  return join(SITE, html);
}

function palavrasDoArtigo(html) {
  const inicio = html.indexOf("<article");
  const fim = html.lastIndexOf("</article>");
  if (inicio < 0 || fim < 0) return null;
  const texto = html
    .slice(inicio, fim)
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ");
  return texto.split(/\s+/).filter(Boolean).length;
}

const totais = { pt: { paginas: 0, palavras: 0 }, en: { paginas: 0, palavras: 0 } };
const faltando = [];

for (const md of arquivosMd(DOCS).sort()) {
  const idioma = relative(DOCS, md).split(sep)[0] === "en" ? "en" : "pt";
  const pagina = paginaDe(md);
  if (!existsSync(pagina)) {
    faltando.push(relative(RAIZ, md));
    continue;
  }
  const n = palavrasDoArtigo(readFileSync(pagina, "utf8"));
  if (n === null) {
    faltando.push(`${relative(RAIZ, md)} (sem <article>)`);
    continue;
  }
  totais[idioma].paginas += 1;
  totais[idioma].palavras += n;
}

const fmt = (n) => n.toLocaleString("pt-BR");
console.log(
  `Português: ${totais.pt.paginas} páginas, ${fmt(totais.pt.palavras)} palavras.\n` +
    `Inglês:    ${totais.en.paginas} páginas, ${fmt(totais.en.palavras)} palavras.`,
);

// Página de origem sem página gerada é defeito de mapeamento, não conteúdo a
// menos: o número sairia menor sem nenhum aviso.
if (faltando.length > 0) {
  console.error(`\nSem página gerada para ${faltando.length} arquivo(s):\n  ${faltando.join("\n  ")}`);
  process.exit(1);
}
