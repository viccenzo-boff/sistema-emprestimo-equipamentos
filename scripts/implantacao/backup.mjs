/**
 * Backup diário e cópia de consulta do banco de produção (Tarefa 18).
 *
 * Roda na máquina da coordenação, pelo Node do sistema, de dois jeitos: pela
 * Tarefa Agendada que o `instalar.ps1` cria (todo dia às 19:00, como SYSTEM) e
 * pelo atalho "Atualizar copia para consulta" da área de trabalho. Produz dois
 * arquivos a partir de `dados\emprestimos.db`:
 *
 *   backups\emprestimos-AAAA-MM-DD.db   — um por dia, os últimos 30 ficam
 *   consulta\emprestimos-consulta.db    — a cópia que a coordenação abre no
 *                                         DB Browser for SQLite
 *
 * ## Por que é uma cópia, e não "abrir o banco somente leitura"
 *
 * SQLite não tem usuários: "somente leitura" seria só o modo de abertura da
 * ferramenta de quem consulta. E mesmo uma leitura segura um lock
 * **compartilhado** que bloqueia o `commit` do serviço — o `journal_mode` deste
 * projeto é `delete` e o `better-sqlite3` espera 5 s por lock antes de estourar
 * `SQLITE_BUSY` (medido em 2026-09-18). Uma consulta longa no arquivo vivo
 * derrubaria a retirada no tablet naquele instante, sem ninguém saber por quê.
 * A cópia resolve segurança e disponibilidade de uma vez, e o mesmo arquivo é
 * o backup.
 *
 * ## Por que `db.backup()` e não `copyFile`
 *
 * Copiar o arquivo enquanto o serviço escreve pode pegar o banco no meio de
 * uma transação — a cópia abre, mas pode estar inconsistente. O
 * `backup()` do better-sqlite3 é a API de online backup do próprio SQLite:
 * produz uma cópia consistente sem parar o serviço, página a página. O banco
 * tem poucos MB; leva milissegundos.
 *
 * ## Onde este script acha o banco
 *
 * Lê o `DATABASE_URL` do `.env` da pasta do app (a mesma linha que o serviço
 * lê), sem depender do `dotenv` — este script roda fora do `npm`, pelo
 * Agendador de Tarefas. A raiz da instalação é a pasta **acima** de `app\`
 * (`C:\emprestimos`), a menos que `EMPRESTIMOS_RAIZ` diga outra — e o script
 * se recusa a rodar de um clone que não se chame `app`, para não criar
 * `backups\` ao lado de uma pasta de desenvolvimento.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

const DIAS_DE_RETENCAO = 30;
const PREFIXO = "emprestimos-";
const NOME_DA_CONSULTA = "emprestimos-consulta.db";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function raizDaInstalacao() {
  if (process.env.EMPRESTIMOS_RAIZ) return resolve(process.env.EMPRESTIMOS_RAIZ);

  if (basename(APP) !== "app") {
    falhar(
      `Este script espera rodar de <raiz>\\app (por exemplo C:\\emprestimos\\app), ` +
        `e está em ${APP}.\n  Defina EMPRESTIMOS_RAIZ se a instalação usa outra pasta.`,
    );
  }

  return dirname(APP);
}

/** Lê `DATABASE_URL` do `.env` do app e devolve o caminho do arquivo `.db`. */
function caminhoDoBanco() {
  const env = join(APP, ".env");

  if (!existsSync(env)) {
    falhar(`Não achei ${env}. O instalar.ps1 escreve esse arquivo; rode-o primeiro.`);
  }

  const linha = readFileSync(env, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.startsWith("DATABASE_URL="));

  if (!linha) falhar(`O ${env} não tem a linha DATABASE_URL=.`);

  const valor = linha
    .slice("DATABASE_URL=".length)
    .trim()
    .replace(/^["']|["']$/g, "");
  const semPrefixo = valor.replace(/^file:/, "");

  // O Prisma resolve caminho relativo a partir da raiz do projeto (regra do
  // AGENTS.md). Em produção o caminho é absoluto; o relativo fica pelo caso de
  // alguém apontar o script para um clone de desenvolvimento.
  return isAbsolute(semPrefixo) ? semPrefixo : resolve(APP, semPrefixo);
}

function dataDeHoje() {
  const agora = new Date();
  const mm = String(agora.getMonth() + 1).padStart(2, "0");
  const dd = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mm}-${dd}`;
}

/**
 * Grava a cópia num `.tmp` e renomeia por cima do destino. Se alguém estiver
 * com o destino aberto (o DB Browser, por exemplo), o Windows recusa o
 * `rename` — e é melhor recusar com uma frase do que sobrescrever um arquivo
 * em uso.
 */
async function copiarPara(origem, destino) {
  const temporario = `${destino}.tmp`;
  if (existsSync(temporario)) unlinkSync(temporario);

  await origem.backup(temporario);

  try {
    renameSync(temporario, destino);
  } catch (erro) {
    unlinkSync(temporario);
    falhar(
      `Não consegui gravar ${destino}.\n` +
        `  Se o arquivo estiver aberto no DB Browser, feche-o e tente de novo.\n` +
        `  (${erro instanceof Error ? erro.message : String(erro)})`,
    );
  }

  return statSync(destino).size;
}

function apagarBackupsAntigos(pasta) {
  const limite = new Date();
  limite.setDate(limite.getDate() - DIAS_DE_RETENCAO);
  const corte = limite.toISOString().slice(0, 10);

  let apagados = 0;

  for (const nome of readdirSync(pasta)) {
    const casou = /^emprestimos-(\d{4}-\d{2}-\d{2})\.db$/.exec(nome);
    if (!casou) continue;

    // Comparação de texto funciona porque AAAA-MM-DD ordena como data.
    if (casou[1] < corte) {
      unlinkSync(join(pasta, nome));
      apagados += 1;
    }
  }

  return apagados;
}

function falhar(mensagem) {
  console.error(`\nBackup NÃO feito: ${mensagem}\n`);
  process.exit(1);
}

async function main() {
  const raiz = raizDaInstalacao();
  const banco = caminhoDoBanco();

  if (!existsSync(banco)) {
    falhar(`O banco ${banco} não existe.`);
  }

  const pastaBackups = join(raiz, "backups");
  const pastaConsulta = join(raiz, "consulta");
  mkdirSync(pastaBackups, { recursive: true });
  mkdirSync(pastaConsulta, { recursive: true });

  const origem = new Database(banco, { readonly: true, fileMustExist: true });

  try {
    const datado = join(pastaBackups, `${PREFIXO}${dataDeHoje()}.db`);
    const consulta = join(pastaConsulta, NOME_DA_CONSULTA);

    const bytesDatado = await copiarPara(origem, datado);
    const bytesConsulta = await copiarPara(origem, consulta);
    const apagados = apagarBackupsAntigos(pastaBackups);

    console.log(`Backup do dia:      ${datado} (${bytesDatado} bytes)`);
    console.log(`Cópia de consulta:  ${consulta} (${bytesConsulta} bytes)`);
    if (apagados > 0) {
      console.log(`Backups com mais de ${DIAS_DE_RETENCAO} dias apagados: ${apagados}`);
    }
  } finally {
    origem.close();
  }
}

main().catch((erro) => {
  falhar(erro instanceof Error ? erro.message : String(erro));
});
