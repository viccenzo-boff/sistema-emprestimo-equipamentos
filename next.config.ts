import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /*
       * O padrão do Next é 1 MB, e a importação da Tarefa 8 sobe um arquivo.
       *
       * O número não é chute: a planilha é enviada **duas vezes** (uma para
       * analisar, outra para confirmar), e uma .xlsx com o curso inteiro —
       * ~5.000 linhas de matrícula, nome, perfil e cursos — fica na casa das
       * centenas de KB, porque o formato é XML compactado. 4 MB dá folga para
       * a planilha vir com formatação, aba extra e as colunas que a coordenação
       * usa e o sistema ignora.
       *
       * O limite de verdade é o do servidor, e não o da tela: a action recusa
       * acima de 3 MB com mensagem própria (`MAXIMO_DE_BYTES` em
       * [planilha-pessoas](src/lib/planilha-pessoas.ts)). Este teto fica
       * deliberadamente **acima** daquele — se fossem iguais, o arquivo grande
       * demais estouraria no framework e a pessoa veria um erro genérico de
       * rede em vez da frase que diz o que fazer.
       */
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
