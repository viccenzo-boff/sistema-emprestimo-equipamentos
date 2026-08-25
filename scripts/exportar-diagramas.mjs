/**
 * Exporta os diagramas BPMN da wiki para SVG — `npm run docs:diagramas`.
 *
 * Lê cada `docs/processos-fonte/NN-nome.bpmn`, importa no **bpmn-js** (o mesmo
 * motor que roda por trás do bpmn.io) e grava `docs/assets/diagramas/NN-nome.svg`.
 *
 * Por que este script existe, e não uma linha no CONTRIBUTING mandando exportar
 * à mão: o `.bpmn` é a fonte e o `.svg` é o que a página publica. Sem um comando
 * que refaça o segundo a partir do primeiro, o SVG commitado começa a divergir da
 * fonte em silêncio — ninguém vê, porque as duas coisas continuam abrindo. Com o
 * comando, quem editar um diagrama no bpmn.io roda uma linha e o par volta a
 * bater. `--verificar` faz a pergunta inversa, para o CI: *o SVG no disco é o que
 * esta fonte produz hoje?*
 *
 * O bpmn-js **não** entra no `package.json`. Ele é uma dependência da wiki, não
 * do sistema — mesma regra que já vale para o MkDocs (Python) e para o Vale
 * (binário Go): mora em `.tools/`, fora do Git, com a receita de instalação na
 * seção "Documentação" do CONTRIBUTING.md.
 *
 * Uso:
 *   node scripts/exportar-diagramas.mjs              grava os SVG
 *   node scripts/exportar-diagramas.mjs --verificar  só confere, não escreve
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTES = path.join(RAIZ, "docs", "processos-fonte");
const DESTINO = path.join(RAIZ, "docs", "assets", "diagramas");
const FERRAMENTA = path.join(RAIZ, ".tools", "bpmn-js");

const VERIFICAR = process.argv.includes("--verificar");

/**
 * Onde procurar o Chrome. Ele já é premissa deste projeto — as verificações de
 * interface das tarefas anteriores usam o mesmo binário, por CDP, sem instalar
 * dependência de automação.
 */
const CAMINHOS_DO_CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((caminho) => typeof caminho === "string" && caminho.length > 0);

const PORTA = 9333;

/** A página que carrega o bpmn-js. Gerada dentro de `.tools/` porque o `<script
 *  src>` relativo precisa estar ao lado do bundle baixado. */
const PAGINA = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="diagram-js.css">
<link rel="stylesheet" href="bpmn-js.css">
<style>
  html, body { margin: 0; }
  /* O tamanho do contêiner não define o do SVG — o \`saveSVG\` usa os limites do
     próprio diagrama —, mas o bpmn-js precisa de uma caixa com área para montar
     o canvas. */
  #tela { width: 2400px; height: 1600px; }
</style>
</head>
<body>
<div id="tela"></div>
<script src="bpmn-viewer.production.min.js"></script>
<script>
  const visualizador = new BpmnJS({ container: "#tela" });

  window.renderizar = async function (xml) {
    const { warnings } = await visualizador.importXML(xml);
    const { svg } = await visualizador.saveSVG();

    // A largura e a altura declaradas no SVG são o que decide se o diagrama
    // aparece inteiro a 100% de zoom. Voltam junto para o script poder afirmar
    // sobre elas sem reabrir o arquivo.
    const largura = Number((svg.match(/width="(\\d+(?:\\.\\d+)?)"/) || [])[1]);
    const altura = Number((svg.match(/height="(\\d+(?:\\.\\d+)?)"/) || [])[1]);

    return {
      avisos: warnings.map((aviso) => String(aviso && aviso.message ? aviso.message : aviso)),
      svg,
      largura,
      altura,
      corte: conferirCorte(svg, atividades()),
    };
  };

  /** Os ids das caixas de atividade — é dentro delas que o rótulo tem de caber. */
  function atividades() {
    return visualizador
      .get("elementRegistry")
      .filter((elemento) => /^bpmn:(Task|.*Task|SubProcess)$/.test(elemento.type))
      .map((elemento) => elemento.id);
  }

  /**
   * "Legível a 100% de zoom, sem corte" — medido no artefato publicado, e não
   * no canvas do bpmn-js.
   *
   * São **duas** perguntas, e a segunda é a que pega defeito de verdade:
   *
   * 1. Todo texto cabe na área visível do SVG? Medido, e não presumido — mas
   *    raramente falha: o \`saveSVG\` cresce para incluir rótulo externo que
   *    transborda a raia (conferido, o SVG passou de 700x360 para 714x418 com um
   *    evento encostado no canto). Fica como prova de que a leitura aconteceu.
   * 2. O rótulo de cada atividade cabe **dentro da própria caixa**? Esse falha,
   *    e é o modo de errar de quem escreve o XML à mão: o bpmn-js quebra a linha
   *    sozinho, mas não aumenta o retângulo — o texto vaza por baixo, por cima da
   *    seta ou da tarefa vizinha. O arquivo abre, o SVG tem tamanho plausível, e
   *    o diagrama fica ilegível.
   *
   * O SVG é montado no documento no tamanho intrínseco (1:1 com as unidades de
   * usuário, que é o que "100% de zoom" quer dizer).
   */
  function conferirCorte(svg, atividades) {
    const documento = new DOMParser().parseFromString(svg, "image/svg+xml");
    const raiz = document.importNode(documento.documentElement, true);

    const caixa = document.createElement("div");
    caixa.style.position = "absolute";
    caixa.style.left = "0";
    caixa.style.top = "0";
    caixa.appendChild(raiz);
    document.body.appendChild(caixa);

    const area = raiz.getBoundingClientRect();
    const textos = Array.from(raiz.querySelectorAll("text"));
    const cortados = [];

    for (const texto of textos) {
      const r = texto.getBoundingClientRect();
      // Meio pixel de folga: o arredondamento do próprio navegador ao converter
      // unidade de usuário em pixel de tela produz diferenças dessa ordem.
      const folga = 0.5;

      if (
        r.left < area.left - folga ||
        r.top < area.top - folga ||
        r.right > area.right + folga ||
        r.bottom > area.bottom + folga
      ) {
        cortados.push(texto.textContent.replace(/\\s+/g, " ").trim());
      }
    }

    const transbordam = [];

    for (const id of atividades) {
      const grupo = raiz.querySelector('[data-element-id="' + id + '"]');
      const forma = grupo && grupo.querySelector("rect");
      const texto = grupo && grupo.querySelector("text");

      if (!forma || !texto) {
        transbordam.push(id + " (sem forma ou sem rótulo no SVG)");
        continue;
      }

      const f = forma.getBoundingClientRect();
      const t = texto.getBoundingClientRect();

      if (t.top < f.top - 0.5 || t.bottom > f.bottom + 0.5 || t.left < f.left - 0.5 || t.right > f.right + 0.5) {
        transbordam.push(
          id + ': "' + texto.textContent.replace(/\\s+/g, " ").trim() + '"',
        );
      }
    }

    caixa.remove();

    // \`medidos\` e \`atividades.length\` existem para provar que a leitura
    // aconteceu: zero problema em zero elemento medido é o verde de quem não
    // olhou nada.
    return {
      medidos: textos.length,
      atividades: atividades.length,
      cortados,
      transbordam,
    };
  }

  window.pronto = true;
</script>
</body>
</html>
`;

async function principal() {
  if (!existsSync(FERRAMENTA)) {
    erroFatal(
      `O bpmn-js não está em ${caminhoRelativo(FERRAMENTA)}.`,
      'Ele fica fora do Git, como o Vale. A receita está na seção "Documentação" do CONTRIBUTING.md.',
    );
  }

  const chrome = CAMINHOS_DO_CHROME.find((caminho) => existsSync(caminho));

  if (!chrome) {
    erroFatal(
      "Não encontrei o Chrome nesta máquina.",
      "Aponte o caminho do executável em CHROME_PATH e rode de novo.",
    );
  }

  const fontes = (await readdir(FONTES))
    .filter((nome) => nome.endsWith(".bpmn"))
    .sort();

  if (fontes.length === 0) {
    erroFatal(`Nenhum .bpmn em ${caminhoRelativo(FONTES)}.`);
  }

  await writeFile(path.join(FERRAMENTA, "exportador.html"), PAGINA, "utf8");
  await mkdir(DESTINO, { recursive: true });

  const perfil = await mkdtemp(path.join(tmpdir(), "bpmn-chrome-"));
  const processo = subirChrome(chrome, perfil);

  let divergencias = 0;

  try {
    const cdp = await conectar();

    await cdp.enviar("Page.enable");
    await cdp.enviar("Page.navigate", {
      url: `file:///${path.join(FERRAMENTA, "exportador.html").replace(/\\/g, "/")}`,
    });
    await esperarPagina(cdp);

    for (const nome of fontes) {
      const xml = await readFile(path.join(FONTES, nome), "utf8");
      const resultado = await cdp.avaliar(
        `window.renderizar(${JSON.stringify(xml)})`,
      );

      resultado.svg = idsEstaveis(resultado.svg);

      // Aviso de importação **é** erro de validação aqui. O bpmn.io mostra a
      // mesma lista num painel lateral: referência a elemento que não existe,
      // atributo fora do esquema, forma sem posição no diagrama. Nada disso
      // impede o arquivo de abrir — e é justamente por isso que ele precisa
      // derrubar este comando.
      if (resultado.avisos.length > 0) {
        console.error(`✗ ${nome}`);
        for (const aviso of resultado.avisos) console.error(`    ${aviso}`);
        divergencias += 1;
        continue;
      }

      if (resultado.corte.medidos === 0) {
        console.error(`✗ ${nome} — nenhum texto no SVG. O diagrama saiu sem rótulo?`);
        divergencias += 1;
        continue;
      }

      if (resultado.corte.cortados.length > 0) {
        console.error(`✗ ${nome} — rótulo(s) fora da área visível do SVG:`);
        for (const rotulo of resultado.corte.cortados) console.error(`    "${rotulo}"`);
        console.error("    Alargue a raia ou encurte o rótulo: o texto está no XML e não na tela.");
        divergencias += 1;
        continue;
      }

      if (resultado.corte.transbordam.length > 0) {
        console.error(`✗ ${nome} — rótulo(s) maiores que a própria caixa:`);
        for (const alvo of resultado.corte.transbordam) console.error(`    ${alvo}`);
        console.error("    Aumente a altura da atividade no dc:Bounds ou encurte o texto.");
        divergencias += 1;
        continue;
      }

      const destino = path.join(DESTINO, nome.replace(/\.bpmn$/, ".svg"));
      const medida =
        `${Math.round(resultado.largura)}x${Math.round(resultado.altura)}, ` +
        `${resultado.corte.medidos} rótulos, ${resultado.corte.atividades} atividades`;

      if (VERIFICAR) {
        const gravado = existsSync(destino) ? await readFile(destino, "utf8") : null;

        /*
          A comparação normaliza a quebra de linha, e isso não é frouxidão.

          Esta máquina tem `core.autocrlf=true` e o repositório não tem
          `.gitattributes` — conferido, não suposto. O SVG é gravado com LF e o
          Git o devolve com CRLF no próximo checkout: comparar byte a byte
          acusaria os cinco diagramas como "fora de dia" em qualquer clone novo,
          incluindo o do CI, sem que uma linha de conteúdo tivesse mudado. A
          pergunta que este portão faz é sobre o desenho, não sobre o final da
          linha.
        */
        if (semCrlf(gravado) !== semCrlf(resultado.svg)) {
          console.error(
            `✗ ${nome} — o SVG no disco não é o que esta fonte produz (${medida}).`,
          );
          divergencias += 1;
          continue;
        }

        console.log(`✓ ${nome} — SVG em dia (${medida})`);
        continue;
      }

      await writeFile(destino, resultado.svg, "utf8");
      console.log(`✓ ${nome} → ${caminhoRelativo(destino)} (${medida})`);
    }
  } finally {
    await encerrar(processo, perfil);
  }

  if (divergencias > 0) {
    console.error(
      VERIFICAR
        ? `\n${divergencias} diagrama(s) fora de dia. Rode \`npm run docs:diagramas\` e commite o SVG junto.`
        : `\n${divergencias} diagrama(s) com erro de validação. Nada foi gravado para eles.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    VERIFICAR
      ? `\n${fontes.length} diagrama(s) conferido(s).`
      : `\n${fontes.length} diagrama(s) exportado(s).`,
  );
}

function subirChrome(executavel, perfil) {
  return spawn(
    executavel,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${PORTA}`,
      `--user-data-dir=${perfil}`,
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
}

/**
 * Encerra o Chrome e apaga o perfil descartável.
 *
 * O `kill` volta antes de o processo ter morrido, e no Windows o `lockfile` do
 * perfil continua preso enquanto isso — apagar na linha seguinte falha com
 * EBUSY. Foi o que aconteceu na primeira execução: os SVG saíram certos e o
 * script terminou com exceção na limpeza. Espera-se o `exit` e ainda assim se
 * repete a remoção, porque o antivírus da máquina pode segurar o diretório mais
 * um instante.
 */
async function encerrar(processo, perfil) {
  const morreu = new Promise((resolver) => processo.once("exit", resolver));
  processo.kill();
  await Promise.race([morreu, pausa(5000)]);

  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    try {
      await rm(perfil, { recursive: true, force: true });
      return;
    } catch {
      await pausa(200);
    }
  }

  console.warn(`Aviso: não consegui apagar o perfil temporário ${perfil}.`);
}

/**
 * Espera a porta de depuração abrir e devolve um cliente mínimo.
 *
 * É o mesmo driver das verificações de interface das tarefas anteriores: o
 * WebSocket é o que o Node já traz desde a v22, e o protocolo é requisição e
 * resposta casada por `id`.
 */
async function conectar() {
  let alvo = null;

  for (let tentativa = 0; tentativa < 60 && !alvo; tentativa += 1) {
    try {
      const resposta = await fetch(`http://127.0.0.1:${PORTA}/json/list`);
      const alvos = await resposta.json();
      alvo = alvos.find((item) => item.type === "page");
    } catch {
      await pausa(150);
    }
  }

  if (!alvo) erroFatal("O Chrome não abriu a porta de depuração.");

  const socket = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((resolver, rejeitar) => {
    socket.addEventListener("open", resolver, { once: true });
    socket.addEventListener("error", rejeitar, { once: true });
  });

  let proximoId = 0;
  const pendentes = new Map();

  socket.addEventListener("message", (evento) => {
    const mensagem = JSON.parse(evento.data);
    const pendente = pendentes.get(mensagem.id);
    if (!pendente) return;

    pendentes.delete(mensagem.id);
    if (mensagem.error) pendente.rejeitar(new Error(mensagem.error.message));
    else pendente.resolver(mensagem.result);
  });

  const enviar = (method, params = {}) =>
    new Promise((resolver, rejeitar) => {
      const id = (proximoId += 1);
      pendentes.set(id, { resolver, rejeitar });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const avaliar = async (expressao) => {
    const { result, exceptionDetails } = await enviar("Runtime.evaluate", {
      expression: expressao,
      awaitPromise: true,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        exceptionDetails.exception?.description ?? exceptionDetails.text,
      );
    }

    return result.value;
  };

  return { enviar, avaliar };
}

/** O `pronto` da página, e não o evento de carga: o bundle é grande. */
async function esperarPagina(cdp) {
  for (let tentativa = 0; tentativa < 100; tentativa += 1) {
    if (await cdp.avaliar("window.pronto === true")) return;
    await pausa(100);
  }

  erroFatal("A página do exportador não terminou de carregar o bpmn-js.");
}

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const semCrlf = (texto) => (texto === null ? null : texto.replace(/\r\n/g, "\n"));

/**
 * Troca os ids das pontas de seta por uma sequência estável.
 *
 * O bpmn-js sorteia um id novo para cada marcador a cada instância do
 * visualizador — `marker-33wm49p9tx0n17ty4dyeh0hc8` numa execução,
 * `marker-cct5i73ygs9krjto82iq7doxw` na seguinte. Sem esta normalização, exportar
 * o mesmo `.bpmn` duas vezes dá dois arquivos diferentes: o `git diff` acusaria
 * os cinco SVG a cada `npm run docs:diagramas`, e não haveria como distinguir a
 * mudança de desenho do ruído. Foi assim que o `--verificar` reprovou cinco
 * arquivos recém-exportados na primeira vez que rodou.
 *
 * O id aparece na definição (`id="marker-…"`) e no uso (`url('#marker-…')`), e a
 * substituição pega os dois.
 */
function idsEstaveis(svg) {
  const vistos = new Map();

  return svg.replace(/marker-[0-9a-z]{16,}/g, (id) => {
    if (!vistos.has(id)) vistos.set(id, `marker-${vistos.size + 1}`);
    return vistos.get(id);
  });
}

const caminhoRelativo = (alvo) => path.relative(RAIZ, alvo).replace(/\\/g, "/");

function erroFatal(mensagem, detalhe) {
  console.error(`\n${mensagem}`);
  if (detalhe) console.error(detalhe);
  process.exit(1);
}

await principal();
