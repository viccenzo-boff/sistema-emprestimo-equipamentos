import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seed do Sistema de Empréstimo de Equipamentos (Unoesc).
 *
 * Usuários: importados da planilha da coordenação, exportada como CSV em
 *   prisma/data/usuarios.csv
 * com as colunas: matricula, nome, perfil, cursos
 *
 * Para usar um arquivo em outro caminho, defina a variável de ambiente
 * USUARIOS_CSV (ex.: USUARIOS_CSV=C:/planilhas/alunos.csv npm run db:seed).
 *
 * Se o arquivo não existir, um conjunto pequeno de dados de exemplo é usado
 * para permitir testar os fluxos do tablet e do painel administrativo.
 *
 * O script é idempotente: pode ser executado várias vezes sem duplicar dados
 * e sem resetar o status de equipamentos que já estão emprestados.
 */

const CAMINHO_CSV = process.env.USUARIOS_CSV
  ? resolve(process.env.USUARIOS_CSV)
  : join(process.cwd(), "prisma", "data", "usuarios.csv");

type UsuarioSeed = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
};

/** Inventário inicial. Novos itens também podem ser cadastrados pelo painel /admin. */
const INVENTARIO: { id: string; tipo: string }[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `NOTE-${String(i + 1).padStart(2, "0")}`,
    tipo: "Notebook",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `TAB-${String(i + 1).padStart(2, "0")}`,
    tipo: "Tablet",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `EXT-${String(i + 1).padStart(2, "0")}`,
    tipo: "Extensão",
  })),
];

const USUARIOS_EXEMPLO: UsuarioSeed[] = [
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

/** Remove acentos e normaliza para comparar cabeçalhos e o campo perfil. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

function lerUsuariosDoCsv(caminho: string): UsuarioSeed[] {
  // Excel em pt-BR grava UTF-8 com BOM e costuma usar ";" como separador.
  const conteudo = readFileSync(caminho, "utf8").replace(/^﻿/, "");
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

  const porMatricula = new Map<string, UsuarioSeed>();
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

    // 1. Usuários (planilha da coordenação, ou dados de exemplo)
    let usuarios: UsuarioSeed[];

    if (existsSync(CAMINHO_CSV)) {
      usuarios = lerUsuariosDoCsv(CAMINHO_CSV);
      console.log(`Usuários: ${usuarios.length} lidos de ${CAMINHO_CSV}`);
    } else {
      usuarios = USUARIOS_EXEMPLO;
      console.log(
        `Usuários: ${CAMINHO_CSV} não encontrado - usando ${usuarios.length} registros de exemplo.\n` +
          `  Para importar a planilha real, exporte-a como CSV com as colunas\n` +
          `  matricula, nome, perfil, cursos e salve em prisma/data/usuarios.csv`,
      );
    }

    for (const usuario of usuarios) {
      await prisma.usuario.upsert({
        where: { matricula: usuario.matricula },
        // Reimportar a planilha atualiza os dados cadastrais.
        update: {
          nome: usuario.nome,
          perfil: usuario.perfil,
          cursos: usuario.cursos,
        },
        create: usuario,
      });
    }

    // 2. Equipamentos
    for (const equipamento of INVENTARIO) {
      await prisma.equipamento.upsert({
        where: { id: equipamento.id },
        // O status nao e atualizado de proposito: um item ja EMPRESTADO ou em
        // MANUTENCAO nao pode voltar para DISPONIVEL por reexecucao do seed.
        update: { tipo: equipamento.tipo },
        create: { ...equipamento, status: "DISPONIVEL" },
      });
    }
    console.log(`Equipamentos: ${INVENTARIO.length} itens no inventário.`);

    const [totalUsuarios, totalEquipamentos, totalEmprestimos] =
      await Promise.all([
        prisma.usuario.count(),
        prisma.equipamento.count(),
        prisma.emprestimo.count(),
      ]);

    console.log(
      `\nBanco atual: ${totalUsuarios} usuários, ${totalEquipamentos} equipamentos, ${totalEmprestimos} empréstimos.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error("\nFalha no seed:", erro);
  process.exit(1);
});
