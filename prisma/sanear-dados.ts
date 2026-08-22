import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";
import { normalizarCursos, normalizarPerfil } from "../src/lib/sanitizacao";
import { PERFIL } from "../src/lib/tipos";

/**
 * Saneamento retroativo dos cadastros já gravados — Tarefa 8.1.
 *
 * `npm run db:sanear`            mostra o que mudaria, sem escrever nada
 * `npm run db:sanear -- --aplicar`  grava
 *
 * ## Por que isto não é uma migration
 *
 * A migration `20260822160000_perfil_estudante` cuida do **perfil**, e só dele,
 * porque só ele quebra tela: com `PERFIL.estudante` valendo "Estudante", uma
 * linha gravada como "ALUNO" some do filtro e da contagem do painel.
 *
 * Os **cursos** ficaram aqui porque normalizá-los em SQL exigiria uma segunda
 * implementação de `normalizarCursos` — o SQLite não tem função de split, e a
 * ordenação hierárquica dentro de um `group_concat` não é estável nas versões
 * que este projeto alcança. Essa segunda cópia divergiria da primeira no dia em
 * que um curso entrasse no mapa: a importação passaria a gravar de um jeito e o
 * banco antigo continuaria de outro, sem nada acusar. É o mesmo argumento que
 * tirou `semAcento` das actions na Tarefa 7 e `COLUNAS_CANONICAS` do gerador de
 * planilha na Tarefa 9. Aqui a regra é lida da **mesma função** que a
 * importação usa, o que torna a divergência impossível por construção.
 *
 * ## Por que a prévia é o padrão
 *
 * Pelo mesmo motivo da importação de planilha: a operação não tem desfazer, e
 * reescrever o curso de centenas de cadastros a partir de um mapa errado é o
 * tipo de estrago que só se descobre depois. Sem `--aplicar` o script lê,
 * compara e imprime — não abre transação nenhuma.
 *
 * ## O que ele deliberadamente NÃO toca
 *
 * **O nome.** Foi decisão explícita do dono do repositório: o Title Case passa a
 * valer para tudo que entrar daqui para frente, mas reescrever o nome de todo
 * mundo de uma vez é uma mudança visível em cada tela do sistema, e um nome já
 * revisado à mão no painel não deve ser desfeito por uma heurística. Os nomes
 * vão se ajustando conforme a coordenação reenvia a planilha.
 */

/** Uma diferença encontrada entre o que está gravado e o que a regra produz. */
type Ajuste = {
  matricula: string;
  nome: string;
  campo: "perfil" | "cursos";
  de: string;
  para: string;
};

async function main() {
  const aplicar = process.argv.includes("--aplicar");

  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const pessoas = await prisma.pessoa.findMany({
      select: { matricula: true, nome: true, perfil: true, cursos: true },
      orderBy: { matricula: "asc" },
    });

    const ajustes: Ajuste[] = [];
    /** Perfis que a regra não reconheceu — ficam como estão e são reportados. */
    const perfisEstranhos: { matricula: string; perfil: string }[] = [];

    for (const pessoa of pessoas) {
      /*
        O perfil só é trocado quando a regra reconhece o valor. Um "SERVIDOR"
        gravado à mão no db:studio **fica como está** e aparece no relatório: o
        script existe para uniformizar grafia, não para decidir sozinho o que
        uma pessoa é. Adivinhar aqui teria o mesmo problema de adivinhar na
        importação, com o agravante de não haver prévia por linha.
      */
      const perfil = normalizarPerfil(pessoa.perfil);

      if (perfil === null) {
        perfisEstranhos.push({ matricula: pessoa.matricula, perfil: pessoa.perfil });
      } else if (perfil !== pessoa.perfil) {
        ajustes.push({
          matricula: pessoa.matricula,
          nome: pessoa.nome,
          campo: "perfil",
          de: pessoa.perfil,
          para: perfil,
        });
      }

      /*
        Curso que vira string vazia é o caso a não gravar: significa que a
        célula original não tinha nada aproveitável, e trocar um valor ruim por
        nenhum valor é perder o pouco que dava para investigar depois.
      */
      const cursos = normalizarCursos(pessoa.cursos);

      if (cursos.length > 0 && cursos !== pessoa.cursos) {
        ajustes.push({
          matricula: pessoa.matricula,
          nome: pessoa.nome,
          campo: "cursos",
          de: pessoa.cursos,
          para: cursos,
        });
      }
    }

    console.log(`\n${pessoas.length} cadastro(s) lido(s).`);

    if (perfisEstranhos.length > 0) {
      console.warn(
        `\n${perfisEstranhos.length} cadastro(s) com perfil fora de ` +
          `${PERFIL.estudante}/${PERFIL.professor}, mantidos como estão:`,
      );
      for (const { matricula, perfil } of perfisEstranhos) {
        console.warn(`  ${matricula}  perfil="${perfil}"`);
      }
      console.warn("  Corrija pelo painel ou pela planilha — o script não adivinha.");
    }

    if (ajustes.length === 0) {
      console.log("\nNada a sanear: os dados já estão na forma canônica.\n");
      return;
    }

    console.log(`\n${ajustes.length} ajuste(s) ${aplicar ? "a gravar" : "encontrado(s)"}:\n`);

    for (const ajuste of ajustes) {
      console.log(`  ${ajuste.matricula}  ${ajuste.nome}`);
      console.log(`    ${ajuste.campo}: "${ajuste.de}"`);
      console.log(`             -> "${ajuste.para}"`);
    }

    if (!aplicar) {
      console.log(
        "\nNada foi gravado. Para aplicar:  npm run db:sanear -- --aplicar\n",
      );
      return;
    }

    /*
      Transação única, e não melhor-esforço item a item.

      É a mesma escolha da gravação da importação de planilha, pelo mesmo
      motivo: quem rodou o comando leu a lista inteira e decidiu uma vez. Metade
      aplicada deixaria o banco em um estado que ninguém revisou — e, pior, o
      relatório impresso acima deixaria de descrever o que está gravado.
    */
    await prisma.$transaction(
      ajustes.map((ajuste) =>
        prisma.pessoa.update({
          where: { matricula: ajuste.matricula },
          data: { [ajuste.campo]: ajuste.para },
        }),
      ),
    );

    console.log(`\n${ajustes.length} ajuste(s) gravado(s).\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error("\nFalha no saneamento:", erro);
  process.exit(1);
});
