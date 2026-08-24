# Notas de trabalho

Este arquivo é **nota de trabalho**, e mora fora de `docs/` de propósito: tudo
que está em `docs/` vira página publicada da wiki, e receita de captura de tela
não é conteúdo para quem vai usar o sistema.

Quem vai mexer no **código** deve ler o [README.md](README.md) e o
[AGENTS.md](AGENTS.md). Quem vai escrever a **wiki** deve ler a
[spec-wiki.md](spec-wiki.md).

## Documentação

### O ambiente Python da wiki

O site da wiki é gerado pelo MkDocs, que é Python. As ferramentas **não estão
no `package.json`** de propósito: o projeto é Node, e misturar as duas árvores
faria um `npm ci` na máquina da secretaria baixar um gerador de site estático.
Elas vivem em [docs-requirements.txt](docs-requirements.txt), com as versões
fixadas — o site é publicado por uma Action, e faixa de versão faria o build de
amanhã ser outro build sem que nenhum commit mudasse.

```bash
python -m venv .venv-docs
source .venv-docs/Scripts/activate   # Git Bash no Windows
# .venv-docs\Scripts\activate        # PowerShell
pip install -r docs-requirements.txt
```

O `.venv-docs/` e o `site/` estão no `.gitignore`.

**Ative o ambiente; não chame os executáveis pelo caminho.** O `mike` roda o
MkDocs como subprocesso pelo nome `mkdocs`, resolvido pelo `PATH`. Se você
chamar `.venv-docs/Scripts/mike.exe` sem ativar, ele encontra um `mkdocs`
global de outra instalação de Python e falha com *"The `mike` plugin is not
installed"* — a mensagem culpa o plugin, mas o problema é qual `mkdocs` foi
executado. Aconteceu nesta máquina, que tem um MkDocs solto no Python 3.13.

Conferido com Python 3.14.0, que é a versão que a Action também usa.

### Escrever e conferir localmente

```bash
mkdocs serve            # servidor com recarga automática
mkdocs build --strict   # o mesmo portão que roda no CI
```

Duas coisas que economizam um diagnóstico:

- **O `serve` abre em `/sistema-emprestimo-equipamentos/`, não em `/`.** O
  `site_url` do [mkdocs.yml](mkdocs.yml) tem esse prefixo (é onde o Pages
  publica), e o servidor de desenvolvimento o respeita. Pedir `/` devolve um
  302 — não é erro.
- **O `--strict` não é opcional.** Sem ele, link quebrado vira aviso e o site
  sobe com o link quebrado. É o mesmo comando que a Action roda antes de
  publicar, então o que falha aqui falha lá.

O inglês em `docs/en/` repete os **mesmos nomes de pasta** do português.
Traduzir nome de diretório quebra o pareamento do `mkdocs-static-i18n` e o
seletor de idioma passa a jogar o leitor na home em vez de manter a página.
Enquanto a tradução (D12) não chega, o `/en/` mostra o conteúdo em português
com o menu traduzido — é o `fallback_to_default`, e é ele que mantém o seletor
funcionando página a página.

### Reproduzir o estado de demonstração

As capturas de tela da wiki não podem conter dado de pessoa real
([spec-wiki.md](spec-wiki.md) §7: *"Nenhum dado pessoal real em captura de tela.
Sem exceção, nem borrado."*). O estado que as telas mostram é montado por
script, com gente fictícia:

```bash
npm run db:reset      # apaga e recria o banco a partir das migrations
npm run db:seed       # cai no PESSOAS_EXEMPLO porque pessoas.csv nao existe
npm run db:demo       # acrescenta pessoas, emprestimos e status
npm run dev
```

**Os três passos são necessários, e o segundo não é redundante.** Neste Prisma 7
o `db:reset` **não** roda o seed sozinho — conferido nesta máquina, o banco fica
com zero linha em todas as tabelas depois dele. (No Prisma 6 ele semeava, e é
por isso que vale a pena estar escrito aqui.)

O resultado é sempre o mesmo cenário:

| O que                        | Quanto                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| Pessoas                      | 15, sendo 2 inativas e 3 professores                        |
| Empréstimos                  | 10 — 3 `ATIVO`, 4 `AGUARDANDO_BAIXA`, 3 `CONCLUIDO`         |
| Equipamentos                 | 20 — 9 disponíveis, 7 emprestados, 2 manutenção, 2 inativos |
| Fila de Devoluções           | 4 linhas, com esperas diferentes (há 5 h, 3 h, 2 h, 1 h)    |
| "Meus equipamentos" (tablet) | matrícula `0012345` (Ana Souza), com 2 itens                |

`npm run db:demo` é idempotente e **restaura** o cenário: depois de você clicar
nos botões testando uma tela, rodá-lo de novo devolve tudo ao enquadramento
original. Não é preciso resetar o banco entre uma captura e outra — só entre
sessões, se algo tiver saído do lugar de vez.

### Voltar atrás

Não existe "desfazer" no `db:demo` — ele escreve direto. O caminho de volta é
recriar o banco:

```bash
npm run db:reset && npm run db:seed
```

Isso deixa o banco no estado de produção limpo (4 cadastros de exemplo, 20
equipamentos disponíveis, nenhum empréstimo) e apaga o cenário de demonstração
junto.

### As duas travas do `db:demo`

O script se recusa a rodar quando o banco parece ter dado real. São duas travas,
e a segunda existe porque a primeira sozinha não basta:

1. **Arquivo no disco** — recusa se `prisma/data/pessoas.csv` ou
   `prisma/data/usuarios.csv` existir. Essa é a planilha da coordenação (o
   segundo nome é o legado, que o seed ainda aceita).
2. **Formato do banco** — recusa se houver mais de 4 cadastros que o script não
   reconhece. Desde a Tarefa 8 a porta principal de dado real é a importação de
   `.xlsx` pelo `/admin/pessoas`, que **não deixa arquivo nenhum no disco** — uma
   máquina cujos cadastros vieram por ali passaria pela trava 1 sem parar.

Se você tem motivo para rodar mesmo assim, o banco é descartável: `db:reset`
antes.

### Resolução das capturas

| Onde                   | Janela     | Por quê                                                                           |
| ---------------------- | ---------- | --------------------------------------------------------------------------------- |
| Portal do tablet (`/`) | 1280 x 800 | É a medida de paisagem que o [AGENTS.md](AGENTS.md) usa como referência do tablet |
| Painel (`/admin/...`)  | 1440 x 900 | Desktop da secretaria; é a maior das três larguras já medidas no painel           |

O portal tem layout diferente em retrato e em paisagem (as duas colunas viram
uma pilha). **Capture em paisagem**, que é como o tablet fica no balcão — foi
para essa orientação que a divisão de tela foi medida.

### Com qual conta capturar o painel

**Sempre `secretaria` / `Mudar@123`.**

O nome de quem está logado aparece na barra lateral de toda tela do painel, e
duas das quatro contas do seed (`jeanzao`, `viccenzo`) são de pessoas reais.
`secretaria` é a conta neutra, e é a única que pode aparecer em captura pública.

Isso vale só para a captura. As quatro contas continuam existindo no banco e no
`npm run db:studio` — o `db:demo` **não** as altera, porque quem é dono da tabela
`Administrador` é o `prisma/seed.ts`, e reescrever os nomes aqui criaria dois
donos para o mesmo campo: o próximo `db:seed` devolveria os nomes reais em
silêncio.

### Nome de arquivo das capturas

Nome descritivo, nunca UUID — a mesma regra que o [README.md](README.md) já
estabelece para os assets do código. O wiki anterior usava UUID, e não havia
como saber o que uma imagem mostrava sem abri-la.

```text
docs/assets/images/retirada/03-selecao-de-itens.png
docs/assets/images/baixa-fisica/01-fila-de-devolucoes.png
```

### O que o cenário foi desenhado para mostrar

Alguns casos estão no `prisma/demo-estado.ts` de propósito, e não por variedade.
Se você mexer no elenco, mantenha-os — são o que várias páginas da wiki precisam
fotografar:

- **Ana Souza com 2 itens** — o "Devolver tudo" do tablet e o "Confirmar Todas
  as Devoluções" do painel só aparecem a partir de dois itens (Tarefa 5).
- **Larissa Coutinho, inativa, com item na fila** — a regra assimétrica da
  Tarefa 8: inativo trava a retirada e libera a devolução.
- **"João Pedro de Almeida"** — a partícula minúscula do Title Case (Tarefa 8.1).
- **"Direito" e "Administração"** — curso fora do `CURSOS_OFICIAIS`, mantido e
  jogado para o fim da string.
- **Três empréstimos concluídos com 6 h, 20 h e 48 h de prateleira** — o
  intervalo `data_baixa - data_devolucao` da Tarefa 12. Se as duas datas
  coincidissem, a métrica daria zero e não haveria o que mostrar.

### Como a wiki é publicada

Ninguém publica a wiki à mão. Quem publica é
[.github/workflows/docs.yml](.github/workflows/docs.yml), a cada `push` na
`main` que toque `docs/**`, o `mkdocs.yml`, o `docs-requirements.txt` ou o
próprio workflow. O job instala o Python, roda `mkdocs build --strict` como
portão e só então chama o `mike`.

O `mike` mantém uma branch `gh-pages` que **não existe no repositório de
código** — ela só tem o site construído, uma pasta por versão:

```text
gh-pages/
├── index.html      ← redireciona para a versão padrão
├── versions.json   ← o que alimenta o seletor de versão do cabeçalho
└── v1.0/           ← o site inteiro, PT na raiz e EN em v1.0/en/
```

A versão publicada é a `v1.0`, que é o estado congelado que esta wiki descreve
([spec-wiki.md](spec-wiki.md) §2.1). O padrão aponta para ela **por decisão
explícita**, e não para um alias móvel: quando a Tarefa 13 entrar e virar
`v1.1`, alguém roda `mike set-default v1.1` de propósito, em vez de a raiz do
site mudar sozinha debaixo de quem tinha o link.

### Ligar o GitHub Pages (uma vez só)

Isto ainda **não foi feito** e precisa ser feito pelo dono do repositório, uma
vez. A ordem importa: a branch `gh-pages` nasce no primeiro deploy, e o Pages
não pode ser apontado para uma branch que não existe.

1. Dê o `push` da `main`. A Action roda e cria a `gh-pages`.
   (Se preferir criar a branch antes de ter conteúdo novo em `docs/`, rode o
   workflow pela aba **Actions → Documentacao → Run workflow** — ele aceita
   execução manual justamente por isso.)
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `gh-pages`, pasta `/ (root)`, e **Save**.

   Pela linha de comando dá no mesmo:

   ```bash
   gh api -X POST repos/viccenzo-boff/sistema-emprestimo-equipamentos/pages \
     -f 'source[branch]=gh-pages' -f 'source[path]=/'
   ```

3. Confira a URL: <https://viccenzo-boff.github.io/sistema-emprestimo-equipamentos/>.
   Ela deve redirecionar para `/v1.0/` e mostrar `v1.0` no seletor de versão,
   ao lado do nome do site.

### Despublicar, ou voltar atrás

A publicação escreve numa branch própria — o código nunca corre risco. Os
caminhos de volta, do mais brando ao mais radical:

```bash
mike set-default --push v1.0   # a raiz voltou a apontar para o lugar errado
mike delete --push v1.0        # tira uma versão do ar (e do seletor)
mike delete --all --push       # esvazia a gh-pages
```

Para tirar o site do ar por inteiro, **Settings → Pages → Source: None**. A
branch `gh-pages` pode ficar onde está: sem o Pages ligado, ela é só um
diretório de arquivos no Git.
