<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- Conteúdo abaixo é do projeto. O bloco acima é gerenciado pelo `next dev`;
     não escreva nada entre os marcadores BEGIN/END. -->

## Sistema de Empréstimo de Equipamentos — Unoesc

MVP para empréstimo de notebooks, tablets e extensões, rodando em rede local no
computador da secretaria. Duas frentes: `/` (tablet, retirada e devolução) e
`/admin` (desktop, secretaria).

**A especificação é [spec.md](spec.md) e ela manda.** Leia por inteiro antes de
mexer em qualquer coisa — escopo, fluxos e regras de negócio estão lá.

### Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run db:migrate   # cria/aplica migration após mudar o schema
npm run db:generate  # regenera o Prisma Client (necessário após mudar o schema)
npm run db:seed      # popula usuários e inventário (idempotente)
npm run db:studio    # inspecionar o banco
npm run lint         # tem que sair em 0
```

### Prisma 7 — leia antes de escrever qualquer query

Este projeto usa **Prisma 7**, que difere do 6 em pontos que quebram código
escrito de memória:

- O client é importado de `@/lib/prisma` (instância única com driver adapter).
  **Nunca** instancie `new PrismaClient()` direto em um componente ou action.
- O client gerado fica em `src/generated/prisma/` — não é `@prisma/client`.
  Tipos vêm de `@/generated/prisma/client`.
- A URL do banco fica em [prisma.config.ts](prisma.config.ts), **não** no
  `schema.prisma`.
- SQLite exige o driver adapter `@prisma/adapter-better-sqlite3`.
- Após mudar o schema: `npm run db:migrate` **e** `npm run db:generate`. O v7 não
  gera o client automaticamente.
- O caminho relativo em `DATABASE_URL` resolve a partir da **raiz do projeto**
  (CLI e app usam o mesmo `./dev.db`).

A documentação canônica desta versão está instalada em `.agents/skills/prisma-*`.
Leia o guia do seu caso antes de configurar — vale mais que memória de treino.

O mesmo vale para o Next 16: os guias estão em `node_modules/next/dist/docs/`.

### Convenções do projeto

- **Schema**: os nomes de campo seguem a spec, em snake_case (`usuario_id`,
  `equip_id`, `data_retirada`). Não "corrija" para camelCase.
- **Matrícula é `String`**, sempre. Converter para número apaga zeros à esquerda.
- **Imagens**: componentes usam import estático de `src/assets/<finalidade>/`;
  `public/` só para URL fixa (favicon, ícones PWA). Detalhes na seção "Imagens e
  assets" do [README.md](README.md).
- **Rotas que leem o banco** precisam ser dinâmicas — sem isso o Next congela os
  dados no build. Confira a classificação das rotas no relatório do `build`.
- Textos de interface em português, voltados a aluno e secretaria.

### Regra de negócio que não é óbvia pelo código

O status `AGUARDANDO_BAIXA` separa "o usuário disse que devolveu" de "a secretaria
recolheu". Enquanto o empréstimo está nesse estado, o equipamento **não** volta
para `DISPONIVEL` — só a confirmação no `/admin` fecha o ciclo. Quebrar isso faz o
sistema oferecer no tablet um equipamento que ainda está na bancada.

Cada item emprestado gera um registro **separado** em `Emprestimo`.

### Estado atual

**Tarefa 1 (concluída):** setup de Next.js 16 + Tailwind 4 + Prisma 7/SQLite, com
os três modelos da spec, migration inicial aplicada e seed idempotente. `tsc`,
`lint` e `build` em 0; a página inicial foi requisitada e devolveu dados reais do
banco.

**Tarefa 2 — Fluxo 1 (concluída):** Portal do Aluno/Professor em `/` com a
retirada completa (matrícula → categorias → itens → confirmação). A página de
status provisória foi substituída. `tsc`, `lint` e `build` em 0; o fluxo inteiro
foi exercitado no navegador e as actions foram testadas contra o `dev.db`,
inclusive o rollback da transação.

**Decisões de design já tomadas** (não refazer sem motivo):

- Paleta extraída da logo por leitura dos pixels: azul `#023770`, verde
  `#3aaa35`. Os tokens vivem em `@theme` no [globals.css](src/app/globals.css).
- **Existem dois verdes.** O verde da logo dá 3,0:1 sobre branco — serve para
  borda, ícone grande e realce de seleção, **nunca** para texto ou fundo de
  botão. Para isso existe `marca-verde-forte` (5,4:1). Todos os pares de cor da
  interface foram conferidos com cálculo de contraste, não a olho.
- Tema claro, sem variante escura: o tablet fica sob luz forte e tela escura
  vira espelho. `color-scheme` está fixado em `light`.
- Tipografia: Geist Sans para tudo; a monoespaçada só nas etiquetas
  (`NOTE-01`), que precisam bater caractere a caractere com o adesivo do
  aparelho — por isso a etiqueta aparece inteira na tela, nunca "embelezada".
- Alvo de toque mínimo de 64px (`min-h-16` no [Botao](src/components/ui/Botao.tsx)).
  Variantes de tamanho são propriedades do componente, não classes soltas: no
  Tailwind 4 duas utilidades concorrentes se resolvem pela ordem no CSS gerado,
  então "sobrescrever" por `className` sai aleatório (e o `!` de importante virou
  sufixo: `px-0!`, não `!px-0`).

**Tarefa 3 (próxima):** Fluxo 2 — devolução pelo usuário, na mesma rota `/`.
Encaixa depois da identificação, ao lado das categorias: a matrícula já traz o
usuário, falta listar os empréstimos `ATIVO` dele e o modal de confirmação com o
aviso da bancada.

### Ambiente

- `ADMIN_PASSWORD` no `.env` é um **placeholder** (`unoesc-admin`). Trocar antes
  de usar na secretaria.
- `npm audit` reporta 3 avisos "high" em `deepmerge-ts`, via `@prisma/config` —
  dependência **só de desenvolvimento**, sem exposição no app. **Não rode
  `npm audit fix --force`**: ele rebaixa o Prisma para 6.x e quebra este setup.
- A porta 3000 desta máquina costuma estar ocupada por outro processo; o Next cai
  para 3001+ sozinho.
- `prisma/data/usuarios.csv` (planilha real, dados pessoais) está no `.gitignore`.
  Versione apenas `usuarios.example.csv`.
