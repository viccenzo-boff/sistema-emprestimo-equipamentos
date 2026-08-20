import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
// O custo do bcrypt tem um dono só: o seed cria as contas e o painel troca a
// senha delas (Tarefa 11). Duas constantes de mesmo nome em arquivos diferentes
// seriam duas regras assim que uma fosse ajustada. O módulo é neutro de
// propósito — não importa `next/headers` nem o Prisma —, e por isso pode ser
// lido daqui, de dentro do `tsx` no terminal.
import { CUSTO_BCRYPT } from "../src/lib/senha";

/**
 * Seed do Sistema de Empréstimo de Equipamentos (Unoesc).
 *
 * Pessoas: importadas da planilha da coordenação, exportada como CSV em
 *   prisma/data/pessoas.csv
 * com as colunas: matricula, nome, perfil, cursos
 *
 * Para usar um arquivo em outro caminho, defina a variável de ambiente
 * PESSOAS_CSV (ex.: PESSOAS_CSV=C:/planilhas/alunos.csv npm run db:seed).
 *
 * Se o arquivo não existir, um conjunto pequeno de dados de exemplo é usado
 * para permitir testar os fluxos do tablet e do painel administrativo.
 *
 * O script é idempotente: pode ser executado várias vezes sem duplicar dados,
 * sem resetar o status de equipamentos que já estão emprestados e sem devolver
 * ao padrão a senha de um administrador que já existe.
 */

/**
 * O CSV mudou de nome na Tarefa 10 (`usuarios.csv` -> `pessoas.csv`), e o nome
 * antigo continua sendo aceito.
 *
 * Não é gentileza: o arquivo real está no `.gitignore` e mora na máquina da
 * secretaria, onde ninguém vai renomeá-lo por causa de um commit. Sem o
 * atalho, o seed não acharia a planilha, cairia nos quatro registros de
 * exemplo e **não daria erro nenhum** — a falha apareceria semanas depois, na
 * forma de um aluno que "não está cadastrado".
 */
function caminhoDoCsv(): { caminho: string; legado: boolean } {
  const daVariavel = process.env.PESSOAS_CSV ?? process.env.USUARIOS_CSV;
  if (daVariavel) return { caminho: resolve(daVariavel), legado: false };

  const atual = join(process.cwd(), "prisma", "data", "pessoas.csv");
  if (existsSync(atual)) return { caminho: atual, legado: false };

  const antigo = join(process.cwd(), "prisma", "data", "usuarios.csv");
  if (existsSync(antigo)) return { caminho: antigo, legado: true };

  return { caminho: atual, legado: false };
}

type PessoaSeed = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
};

/**
 * Categorias do inventário, na ordem em que aparecem no tablet e no painel.
 *
 * A ordem importa: `Categoria.id` é o que ordena as duas telas, e o id sai da
 * ordem de criação. Reordenar esta lista não reordena um banco já semeado — as
 * categorias existentes mantêm o id que ganharam da primeira vez.
 */
const CATEGORIAS = ["Notebook", "Tablet", "Extensão"];

/** Inventário inicial. Novos itens também podem ser cadastrados pelo painel /admin. */
const INVENTARIO: { id: string; categoria: string }[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `NOTE-${String(i + 1).padStart(2, "0")}`,
    categoria: "Notebook",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `TAB-${String(i + 1).padStart(2, "0")}`,
    categoria: "Tablet",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `EXT-${String(i + 1).padStart(2, "0")}`,
    categoria: "Extensão",
  })),
];

const PESSOAS_EXEMPLO: PessoaSeed[] = [
  {
    matricula: "0012345",
    nome: "Ana Souza",
    perfil: "ALUNO",
    cursos: "Sistemas de Informação",
  },
  {
    matricula: "0023456",
    nome: "Bruno Lima",
    perfil: "ALUNO",
    cursos: "Ciência da Computação",
  },
  {
    matricula: "0034567",
    nome: "Carla Mendes",
    perfil: "ALUNO",
    cursos: "Engenharia da Computação",
  },
  {
    matricula: "9001",
    nome: "Prof. Daniel Rocha",
    perfil: "PROFESSOR",
    cursos: "Sistemas de Informação, Ciência da Computação",
  },
];

/* ------------------------------------------------------------------------- *
 * Administradores do painel (Tarefa 10)
 * ------------------------------------------------------------------------- */

/**
 * As contas do painel nascem aqui porque a Tarefa 10 decidiu não ter tela de
 * cadastro de administrador neste MVP. Consequência a conhecer: **este arquivo
 * é o caminho de recuperação** de uma senha esquecida — apaga-se a linha no
 * `npm run db:studio` e roda-se `npm run db:seed` de novo, que recria a conta
 * com a senha padrão.
 */
const ADMINISTRADORES: { nome: string; usuario: string }[] = [
  { nome: "Secretaria", usuario: "secretaria" },
  { nome: "Cidi", usuario: "cidi" },
  { nome: "Jeanzão", usuario: "jeanzao" },
  { nome: "Viccenzo", usuario: "viccenzo" },
];

/** Senha inicial das quatro contas. Existe para ser trocada. */
const SENHA_PADRAO = "Mudar@123";

/** Remove acentos e normaliza para comparar cabeçalhos e o campo perfil. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Divide uma linha de CSV respeitando campos entre aspas duplas
 * (necessário porque `cursos` costuma conter vírgulas).
 */
function dividirLinha(linha: string, delimitador: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];

    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }

    if (char === delimitador && !dentroDeAspas) {
      campos.push(atual);
      atual = "";
      continue;
    }

    atual += char;
  }

  campos.push(atual);
  return campos.map((campo) => campo.trim());
}

function lerPessoasDoCsv(caminho: string): PessoaSeed[] {
  // Excel em pt-BR grava UTF-8 com BOM e costuma usar ";" como separador.
  const conteudo = readFileSync(caminho, "utf8").replace(/^\uFEFF/, "");
  const linhas = conteudo
    .split(/\r?\n/)
    .filter((linha) => linha.trim().length > 0);

  if (linhas.length < 2) {
    throw new Error(
      `O arquivo ${caminho} não tem linhas de dados (apenas cabeçalho ou vazio).`,
    );
  }

  const cabecalhoBruto = linhas[0];
  const delimitador =
    (cabecalhoBruto.match(/;/g)?.length ?? 0) >
    (cabecalhoBruto.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const colunas = dividirLinha(cabecalhoBruto, delimitador).map(normalizar);
  const indiceDe = (...nomes: string[]) =>
    colunas.findIndex((coluna) => nomes.includes(coluna));

  const iMatricula = indiceDe("matricula", "ra", "registro");
  const iNome = indiceDe("nome", "nome completo", "aluno");
  const iPerfil = indiceDe("perfil", "tipo", "vinculo");
  const iCursos = indiceDe("cursos", "curso");

  if (iMatricula < 0 || iNome < 0) {
    throw new Error(
      `Cabeçalho inválido em ${caminho}. São necessárias ao menos as colunas ` +
        `"matricula" e "nome". Encontrado: ${colunas.join(", ")}`,
    );
  }

  const porMatricula = new Map<string, PessoaSeed>();
  const ignoradas: number[] = [];

  linhas.slice(1).forEach((linha, indice) => {
    const campos = dividirLinha(linha, delimitador);
    // A matrícula é mantida como string para preservar zeros à esquerda.
    const matricula = campos[iMatricula]?.trim() ?? "";
    const nome = campos[iNome]?.trim() ?? "";

    if (!matricula || !nome) {
      ignoradas.push(indice + 2); // +2: linha do cabeçalho + índice base 1
      return;
    }

    const perfilBruto = iPerfil >= 0 ? normalizar(campos[iPerfil] ?? "") : "";
    const perfil = perfilBruto.startsWith("prof") ? "PROFESSOR" : "ALUNO";

    porMatricula.set(matricula, {
      matricula,
      nome,
      perfil,
      cursos: (iCursos >= 0 ? campos[iCursos]?.trim() : "") ?? "",
    });
  });

  if (ignoradas.length > 0) {
    console.warn(
      `  ${ignoradas.length} linha(s) ignorada(s) por falta de matrícula ou nome: ${ignoradas.join(", ")}`,
    );
  }

  return [...porMatricula.values()];
}

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Seed - Sistema de Empréstimo de Equipamentos\n");

    // 1. Pessoas (planilha da coordenação, ou dados de exemplo)
    const { caminho: CAMINHO_CSV, legado } = caminhoDoCsv();
    let pessoas: PessoaSeed[];

    if (existsSync(CAMINHO_CSV)) {
      pessoas = lerPessoasDoCsv(CAMINHO_CSV);
      console.log(`Pessoas: ${pessoas.length} lidas de ${CAMINHO_CSV}`);

      if (legado) {
        console.warn(
          `  Aviso: este arquivo usa o nome antigo. Renomeie para\n` +
            `  prisma/data/pessoas.csv — "usuarios.csv" segue aceito, mas é legado.`,
        );
      }
    } else {
      pessoas = PESSOAS_EXEMPLO;
      console.log(
        `Pessoas: ${CAMINHO_CSV} não encontrado - usando ${pessoas.length} registros de exemplo.\n` +
          `  Para importar a planilha real, exporte-a como CSV com as colunas\n` +
          `  matricula, nome, perfil, cursos e salve em prisma/data/pessoas.csv`,
      );
    }

    for (const pessoa of pessoas) {
      await prisma.pessoa.upsert({
        where: { matricula: pessoa.matricula },
        /*
          Reimportar a planilha atualiza os dados cadastrais — e **não toca no
          `status`**, de propósito (Tarefa 8).

          É a mesma regra da importação de .xlsx pelo painel: campo que a
          origem não menciona é campo que o banco preserva. O CSV do seed não
          tem coluna de status, então rodar `db:seed` de novo não pode
          ressuscitar um cadastro que a secretaria inativou na semana passada.
          `status` também não aparece no `create`: quem cadastra novo nasce
          `ATIVO` pelo padrão da coluna.
        */
        update: {
          nome: pessoa.nome,
          perfil: pessoa.perfil,
          cursos: pessoa.cursos,
        },
        create: pessoa,
      });
    }

    // 2. Categorias
    //
    // Sequencial, e não `Promise.all`: a ordem de criação vira o `id`, e o `id`
    // é o que ordena as categorias nas telas. Em paralelo, a ordem sairia do
    // acaso do agendamento.
    const idPorCategoria = new Map<string, number>();

    for (const nome of CATEGORIAS) {
      const categoria = await prisma.categoria.upsert({
        where: { nome },
        update: {},
        create: { nome },
      });

      idPorCategoria.set(nome, categoria.id);
    }
    console.log(`Categorias: ${CATEGORIAS.length} (${CATEGORIAS.join(", ")}).`);

    // 3. Equipamentos
    for (const equipamento of INVENTARIO) {
      const categoria_id = idPorCategoria.get(equipamento.categoria);

      if (categoria_id === undefined) {
        throw new Error(
          `Equipamento ${equipamento.id} referencia a categoria ` +
            `"${equipamento.categoria}", que não está em CATEGORIAS.`,
        );
      }

      await prisma.equipamento.upsert({
        where: { id: equipamento.id },
        // O status nao e atualizado de proposito: um item ja EMPRESTADO, em
        // MANUTENCAO ou INATIVO nao pode voltar para DISPONIVEL por
        // reexecucao do seed.
        update: { categoria_id },
        create: { id: equipamento.id, categoria_id, status: "DISPONIVEL" },
      });
    }
    console.log(`Equipamentos: ${INVENTARIO.length} itens no inventário.`);

    /*
      4. Administradores do painel (Tarefa 10).

      A SENHA DE QUEM JÁ EXISTE NÃO É TOCADA — é a mesma regra do `status` da
      pessoa e do `status` do equipamento, e é o que impede que rodar `db:seed`
      para importar a planilha nova de segunda-feira devolva as quatro senhas
      ao padrão sem ninguém pedir. O `nome` continua sendo atualizado, porque
      esse **está** no seed: campo que a origem menciona é campo que o seed
      grava.

      O hash só é calculado para quem vai ser criado. Cada um custa ~209ms de
      CPU, e nos outros casos não haveria o que fazer com o resultado.
    */
    const criados: string[] = [];

    for (const admin of ADMINISTRADORES) {
      const existente = await prisma.administrador.findUnique({
        where: { usuario: admin.usuario },
        select: { id: true },
      });

      if (existente) {
        await prisma.administrador.update({
          where: { usuario: admin.usuario },
          data: { nome: admin.nome },
        });
        continue;
      }

      await prisma.administrador.create({
        data: {
          nome: admin.nome,
          usuario: admin.usuario,
          senha: await bcrypt.hash(SENHA_PADRAO, CUSTO_BCRYPT),
        },
      });

      criados.push(admin.usuario);
    }

    if (criados.length > 0) {
      console.log(
        `Administradores: ${criados.length} criado(s) - ${criados.join(", ")}.\n` +
          `  Senha inicial de todos: ${SENHA_PADRAO}\n` +
          `  TROQUE ANTES DE USAR NA SECRETARIA.`,
      );
    } else {
      console.log(
        `Administradores: ${ADMINISTRADORES.length} já existiam - senhas preservadas.`,
      );
    }

    const [
      totalPessoas,
      totalCategorias,
      totalEquipamentos,
      totalEmprestimos,
      totalAdministradores,
    ] = await Promise.all([
      prisma.pessoa.count(),
      prisma.categoria.count(),
      prisma.equipamento.count(),
      prisma.emprestimo.count(),
      prisma.administrador.count(),
    ]);

    console.log(
      `\nBanco atual: ${totalPessoas} pessoas, ${totalCategorias} categorias, ` +
        `${totalEquipamentos} equipamentos, ${totalEmprestimos} empréstimos, ` +
        `${totalAdministradores} administradores.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error("\nFalha no seed:", erro);
  process.exit(1);
});
