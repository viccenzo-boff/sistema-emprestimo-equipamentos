import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ferramentas da wiki (D02). As duas estao no .gitignore, mas o ESLint 9
    // nao le o .gitignore: sem estas linhas ele varre o JavaScript que vem
    // dentro do MkDocs Material e o do site gerado, e o `npm run lint` sai de
    // 0 para milhares de problemas em codigo que nao e nosso.
    ".venv-docs/**",
    "site/**",
    // O `npm run docs:links` (D13) constroi uma segunda copia do site aqui,
    // para o lychee resolver os links absolutos do tema. Medido: sem esta
    // linha o `npm run lint` foi de 0 para 863 problemas (42 erros) no
    // instante em que o diretorio apareceu -- terceira vez que a mesma
    // armadilha aparece neste projeto.
    ".site-links/**",
    // Mesma armadilha, medida de novo na D04: o bpmn-js baixado para `.tools/`
    // e um bundle minificado de ~730 KB, e o `npm run lint` foi de 0 para 2054
    // problemas assim que ele apareceu no disco. `.tools/**` cobre tambem o
    // binario do Vale e a proxima ferramenta que for parar ali.
    ".tools/**",
  ]),
]);

export default eslintConfig;
