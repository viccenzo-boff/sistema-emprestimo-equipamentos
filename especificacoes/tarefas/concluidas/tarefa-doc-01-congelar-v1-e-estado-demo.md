# Tarefa D01: Congelar a v1.0 e criar o estado de demonstração

Esta tarefa prepara o terreno para a wiki: congela a versão que será documentada
e cria um estado de banco que permite fotografar **todas** as telas do sistema
sem expor dado de pessoa real.

Leia a [spec-wiki.md](../../spec-wiki.md) antes de começar, principalmente as seções
2.1 (o que a v1.0 inclui) e 8 (pré-requisitos e riscos).

## 1. Congelar a v1.0

* Confirme que a `main` está limpa (`git status`) e sincronizada com o remoto.
* O `tarefa-13-relatorios-ocupacao.md` **não commitado é esperado** — a Tarefa 13
  fica fora da v1.0 por decisão registrada na spec. Não o inclua na tag.
* Crie uma tag anotada:

```bash
git tag -a v1.0 -m "Versao documentada pela wiki: Tarefas 1 a 12, mais a 8.1"
```

* **Não faça `push` da tag.** Publicar é decisão do dono do repositório, como
  manda o [AGENTS.md](../../../AGENTS.md).

## 2. Por que um script de demonstração é necessário

O `prisma/seed.ts` cria pessoas, categorias, equipamentos e administradores —
mas **nunca cria um `Emprestimo`**. Todo equipamento nasce `DISPONIVEL`.

Consequência: hoje é impossível capturar a Fila de Devoluções, a seção "Meus
equipamentos" do portal, um item em manutenção ou um item aposentado. Metade das
telas da wiki não tem como ser fotografada.

Além disso, os quatro registros de `PESSOAS_EXEMPLO` deixam a tela de Gestão de
Pessoas visualmente vazia — busca e filtro não têm o que demonstrar com quatro
linhas.

## 3. Criar `prisma/demo-estado.ts`

Um script **separado** do seed. Não altere o `prisma/seed.ts`: a §1 da
[spec-wiki.md](../../spec-wiki.md) diz que decisão que serve só ao portfólio e piora o
produto não entra, e o seed é ferramenta de produção da secretaria.

O script deve:

* Montar a conexão do **mesmo jeito** que o `prisma/seed.ts` monta (adapter
  `PrismaBetterSqlite3`). Leia `.agents/skills/prisma-cli/` e
  `.agents/skills/prisma-client-api/` antes de escrever query — o Prisma 7 difere
  do 6 em pontos que quebram código escrito de memória.
* Acrescentar pessoas fictícias até somar cerca de **15**, com mistura de
  perfis, cursos e status (algumas `INATIVO`), respeitando as formas canônicas
  garantidas por [sanitizacao.ts](../../../src/lib/sanitizacao.ts). Nomes claramente
  fictícios; **nenhum nome de pessoa real, nem de colega**.
* Criar empréstimos cobrindo **os três status** de `Emprestimo`:
  * ao menos 2 em `ATIVO` (para "Meus equipamentos" e para `/admin/ativos`);
  * ao menos 3 em `AGUARDANDO_BAIXA` (para a Fila de Devoluções ter fila);
  * ao menos 2 em `CONCLUIDO`, com `data_baixa` preenchida e distante da
    `data_devolucao`, para o tempo de prateleira aparecer diferente de zero.
* Deixar equipamentos cobrindo **os quatro status**: `DISPONIVEL`, `EMPRESTADO`,
  `MANUTENCAO` e `INATIVO`.
* Ser **idempotente**, como o seed: rodar duas vezes não duplica nada.
* Recusar-se a rodar se `prisma/data/pessoas.csv` existir — esse arquivo é a
  planilha real da coordenação, e misturar dado real com dado de demonstração é
  exatamente o acidente que esta tarefa existe para impedir.

Acrescente o atalho ao `package.json`:

```json
"db:demo": "tsx prisma/demo-estado.ts"
```

## 4. Registrar o procedimento de captura

O [CONTRIBUTING.md](../../../CONTRIBUTING.md) existe e está **vazio** (0 bytes). Use-o: é
nota de trabalho, mora fora de `docs/` e portanto não vira página publicada.

Abra nele uma seção "Documentação" com a receita exata para reproduzir o estado
de demonstração:

```bash
npm run db:reset      # apaga e recria
npm run db:seed       # cai no PESSOAS_EXEMPLO porque pessoas.csv nao existe
npm run db:demo       # acrescenta pessoas, emprestimos e status
npm run dev
```

Mais a resolução de janela usada nas capturas do painel e a do tablet
(1280x800, a medida que o [AGENTS.md](../../../AGENTS.md) já usa como referência de
paisagem).

## 5. Verificação

* `npm run lint` sai em 0.
* `npx tsc --noEmit` sai em 0.
* `npm run db:demo` rodado **duas vezes** produz o mesmo estado.
* Com o `dev` no ar: a Fila de Devoluções mostra ao menos 3 itens, o portal da
  matrícula de teste mostra "Meus equipamentos" preenchido, e o inventário
  mostra item em manutenção e item aposentado em cinza.
* `git tag` lista `v1.0`.
* Nenhum nome real aparece em `npm run db:studio`.

*Atenção: esta tarefa toca o `package.json` e cria arquivo em `prisma/`. É a
única tarefa da série que mexe fora de `docs/`. Todas as outras são só
documentação.*
