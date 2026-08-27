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

# Os três portões, na mesma ordem em que a Action os roda:
mkdocs build --strict           # 1. build estrito
./.tools/vale/vale.exe docs/    # 2. vocabulário + estilo Microsoft no inglês
npm run docs:links              # 3. links e âncoras
```

Os três precisam sair em 0. Rodá-los aqui é literalmente rodar o CI: são os
mesmos comandos, nas mesmas versões.

Três coisas que economizam um diagnóstico:

- **O `serve` abre em `/sistema-emprestimo-equipamentos/`, não em `/`.** O
  `site_url` do [mkdocs.yml](mkdocs.yml) tem esse prefixo (é onde o Pages
  publica), e o servidor de desenvolvimento o respeita. Pedir `/` devolve um
  302 — não é erro.
- **O `--strict` não é opcional.** Sem ele, link para arquivo inexistente vira
  aviso e o site sobe com ele.
- **E o `--strict` sozinho não basta.** Ele promove `WARNING` a erro, e âncora
  quebrada é `INFO` — o build sai em **0** com a âncora quebrada impressa na
  saída. Quem fecha esse furo é o portão 3.

O inglês em `docs/en/` repete os **mesmos nomes de pasta** do português.
Traduzir nome de diretório quebra o pareamento do `mkdocs-static-i18n` e o
seletor de idioma passa a jogar o leitor na home em vez de manter a página.
Enquanto a tradução (D12) não chega, o `/en/` mostra o conteúdo em português
com o menu traduzido — é o `fallback_to_default`, e é ele que mantém o seletor
funcionando página a página.

### O vocabulário controlado e o estilo Microsoft (Vale)

O [Vale](https://vale.sh) confere as páginas de `docs/` em duas camadas: o
**vocabulário controlado do projeto** em todas elas, e o **estilo Microsoft
completo** só nas que estão em inglês (D13). A configuração é o
[.vale.ini](.vale.ini) e o vocabulário está em
`.vale/styles/config/vocabularies/Wiki/` — os dois **são versionados**. O que
não é versionado é o executável nem o pacote do estilo Microsoft, que o
`vale sync` baixa na versão fixada dentro do `.vale.ini`.

**O Vale não entra no `docs-requirements.txt`**: ele é um binário Go de ~44 MB,
e aquele arquivo é Python. Baixe o release oficial para `.tools/`, que está no
`.gitignore`:

```bash
mkdir -p .tools/vale && cd .tools/vale
curl -sSL -o vale.zip https://github.com/errata-ai/vale/releases/download/v3.18.0/vale_3.18.0_Windows_64-bit.zip
unzip -o vale.zip && cd ../..
./.tools/vale/vale.exe --version    # vale version 3.18.0
```

Quem preferir instalar no `PATH` (`scoop install vale`, `choco install vale`,
`brew install vale`) roda só `vale sync` e `vale docs/`. A versão conferida
aqui é a 3.18.0.

```bash
./.tools/vale/vale.exe sync     # uma vez: baixa o estilo Microsoft fixado
./.tools/vale/vale.exe docs/    # tem que sair em 0
```

O `sync` grava em `.vale/styles/Microsoft/`, que está no `.gitignore` pela mesma
regra do executável. **Sem rodar o `sync` antes, o Vale reclama que o estilo não
existe** — não é configuração quebrada, é pacote ausente.

Cinco coisas que economizam um diagnóstico:

- **Não existe lint de estilo em português, e o `.vale.ini` não tem um.** Os
  estilos prontos do Vale são escritos para inglês. Nas páginas em português o
  que roda é um vocabulário próprio, que resolve o problema real: duas páginas
  discordarem do nome da mesma coisa.
- **A ordem das seções do `.vale.ini` é load-bearing, e errar não dá erro.**
  Medido na D13: quando duas seções casam o mesmo arquivo, a de baixo
  **substitui** a de cima — não soma —, e quem desempata é a **ordem no
  arquivo**, não a especificidade. Invertendo os blocos, as páginas em inglês
  perdem o Microsoft; a ferramenta sai em 0, informa o número certo de arquivos,
  e o conjunto de regras aplicado é o errado. Por isso as seções de `docs/en/`
  ficam **por último** e repetem o `Vale` na lista: `BasedOnStyles = Vale,
  Microsoft` é a forma explícita de somar.
- **O escopo está preso a `docs/`, e são duas seções por idioma.** Não é
  redundância: medido, `docs/**/*.md` **não** casa `docs/index.md`, e
  `docs/*.md` **não** casa `docs/referencia/glossario.md`. Com um padrão só,
  `vale docs/` dizia "0 files" para a árvore inteira abaixo do primeiro nível e
  **saía com sucesso** — um portão mudo é pior que portão nenhum, porque parece
  verde. **Confira o rodapé da saída:** hoje ele tem que dizer `in 31 files`.
- **`Vale.Spelling` está desligado nos dois idiomas, e tem que ficar.** Em
  português ele é um corretor de inglês lendo português: numa página de prova
  com quatro frases, 15 dos 19 alertas eram *"Did you really mean 'tabela'?"*.
  Em inglês o motivo é o inverso e igualmente forte — ligado, ele acusa **676
  erros** nas 15 páginas, todos rótulos de tela em português (*"Did you really
  mean 'Continuar'?"*) que a regra 1 do guia de estilo obriga a citar.
- **Aviso não quebra o build; erro sim — e isso é nativo, não configurado.**
  Medido: o Vale sai em 1 quando existe pelo menos um alerta de nível `error`, e
  em 0 com qualquer quantidade de `warning` e `suggestion`, **independentemente
  do `MinAlertLevel`** (que controla só o que é exibido). Hoje as páginas em
  inglês somam 104 avisos e 354 sugestões do estilo Microsoft e o comando sai em
  0: são apontamentos para ler, não passivo a zerar.

Três regras do Microsoft estão desligadas de propósito, cada uma com o motivo ao
lado no `.vale.ini`. Com as três ligadas eram **570 erros** em 15 arquivos, dos
quais 569 eram delas — `Dashes` (203, o travessão com espaço é a pontuação da
wiki inteira), `Contractions` (350, o registro formal da D12) e `Quotes` (16, a
pontuação dentro das aspas altera o texto citado). As outras 44 regras ficam em
força total, que é o que faz "erro" continuar querendo dizer alguma coisa.

A regra mais importante do vocabulário é que **"usuário" não é sinônimo de
estudante nem de professor** — neste sistema a palavra quer dizer login de
administrador, e só isso ([AGENTS.md](AGENTS.md), "Convenções do projeto"). A
forma minúscula é recusada; o rótulo de tela **Usuário**, capitalizado, passa.
A lista inteira, com o porquê de cada entrada, está comentada dentro do
`reject.txt`.

Quando uma página precisar escrever o termo proibido de propósito, o escape é
`<!-- vale Vale.Avoid = NO -->` … `<!-- vale Vale.Avoid = YES -->`, e ele tem
que ser fechado. O [guia de estilo](docs/contribuir/guia-de-estilo.md) usa isso
nele mesmo.

### O verificador de links (lychee, D13)

```bash
npm run docs:links      # constrói o site e confere; tem que sair em 0
```

O comando é o mesmo que a Action roda. Ele constrói a wiki em `.site-links/`
(fora do Git) e passa o resultado ao [lychee](https://lychee.cli.rs), com as
âncoras internas incluídas. Precisa do ambiente Python ativado, como todo o
resto da wiki.

O binário mora em `.tools/lychee/`, pela mesma regra do Vale e do bpmn-js — não
é Python, não é do sistema, não entra em `package.json`. A versão conferida é a
0.24.2, a mesma que o workflow instala:

```bash
mkdir -p .tools/lychee && cd .tools/lychee
curl -sSL -o lychee.zip https://github.com/lycheeverse/lychee/releases/download/lychee-v0.24.2/lychee-x86_64-pc-windows-msvc.zip
unzip -oj lychee.zip '*/lychee.exe' && rm lychee.zip && cd ../..
./.tools/lychee/lychee.exe --version    # lychee 0.24.2
```

Quem instalar no `PATH` não precisa de nada: o script procura primeiro
`LYCHEE_PATH`, depois `.tools/`, depois o `PATH`.

Quatro coisas que economizam um diagnóstico:

- **O alvo é o site construído, e não `docs/`.** Contra a letra do enunciado da
  D13, e por medição. Sobre o markdown de origem o lychee dá 60 falsos
  positivos: **57 âncoras**, porque ele recalcula o identificador de cada título
  com um algoritmo que **preserva o acento**, enquanto o Python-Markdown
  normaliza para ASCII (provado nos dois sentidos — ele aceita `#baixa-física` e
  recusa `#baixa-fisica`, e é a segunda que o site gera); e **3 arquivos** de
  `docs/en/contribuir/`, que não existem como markdown porque a página vem do
  `fallback_to_default` do i18n. No HTML gerado o identificador está escrito, e
  as páginas do fallback existem. O porquê inteiro está no cabeçalho de
  [scripts/verificar-links.mjs](scripts/verificar-links.mjs).
- **Ele é o único portão que pega âncora quebrada.** O `mkdocs build --strict`
  classifica "o doc não contém a âncora `#x`" como `INFO`, e `--strict` só
  promove `WARNING` a erro: o build **sai em 0** com a âncora quebrada impressa
  na saída. Medido na D08, na D11, na D12 e de novo na D13.
- **A mensagem aponta o HTML gerado, não o `.md`.** É o preço de conferir o
  artefato publicado. O script devolve o caminho de volta: cada erro sai com uma
  linha `origem:` apontando o arquivo de `docs/` que se edita.
- **Os links externos não são conferidos (`--offline`), e isso é medido.** A
  wiki tem 109 links para o github.com, e o host devolve limite de taxa com
  recuo de 5 minutos: a execução não terminou em 2 minutos e duas seguidas
  discordaram. O portão existe para pegar o que **este repositório** quebra —
  página renomeada, âncora movida, imagem apagada. Site de terceiro fora do ar
  não é defeito da wiki, e CI vermelho que ninguém consegue consertar é o que
  todo mundo aprende a ignorar. O link canônico do próprio site também falharia
  enquanto o Pages não estiver ligado.

### Os diagramas BPMN (D04)

A fonte de cada processo é um `.bpmn` em `docs/processos-fonte/` — XML padrão
OMG, que o Git versiona e faz diff linha a linha. O que a página publica é o SVG
em `docs/assets/diagramas/`, e ele é **gerado a partir da fonte**, nunca editado
à mão.

Para editar um diagrama: abra o `.bpmn` em [bpmn.io](https://bpmn.io) (ou no
Camunda Modeler), mexa, salve por cima do arquivo, e então:

```bash
npm run docs:diagramas   # regrava os cinco SVG a partir dos cinco .bpmn
```

O comando não é conveniência: sem ele o SVG commitado começa a divergir da fonte
**em silêncio**, porque os dois continuam abrindo normalmente e ninguém vê a
diferença. `npm run docs:diagramas -- --verificar` faz a pergunta inversa e não
escreve nada — é a forma de o CI (D13) recusar um SVG desatualizado.

O exportador é [scripts/exportar-diagramas.mjs](scripts/exportar-diagramas.mjs).
Ele usa o **bpmn-js**, que é o motor que roda por dentro do próprio bpmn.io, e
por isso "importou sem aviso aqui" quer dizer "abre no bpmn.io sem erro de
validação". Além de exportar, ele recusa:

- diagrama com referência solta (fluxo apontando para elemento que não existe);
- rótulo de atividade maior que a própria caixa — o bpmn-js quebra a linha
  sozinho mas **não** aumenta o retângulo, e o texto vaza por cima da seta
  vizinha sem que nada acuse.

#### Instalar o bpmn-js

Ele é dependência da **wiki**, não do sistema, e por isso não está no
`package.json` — mesma regra do MkDocs (Python) e do Vale (binário Go). Mora em
`.tools/`, que está no `.gitignore`:

```bash
mkdir -p .tools/bpmn-js && cd .tools/bpmn-js
curl -sSLO https://unpkg.com/bpmn-js@18.6.2/dist/bpmn-viewer.production.min.js
curl -sSLO https://unpkg.com/bpmn-js@18.6.2/dist/assets/diagram-js.css
curl -sSLO https://unpkg.com/bpmn-js@18.6.2/dist/assets/bpmn-js.css
```

O exportador também precisa do **Chrome**, que já é premissa deste repositório —
é o mesmo binário que as verificações de interface das tarefas anteriores usam,
por CDP, sem instalar dependência de automação. Em outra máquina, aponte o
caminho em `CHROME_PATH`.

Quem clonar o repositório e rodar `npm run docs:diagramas` sem baixar o bpmn-js
não tem erro de configuração: tem ferramenta ausente, e o comando diz isso.

#### Três coisas que economizam um diagnóstico

- **Rótulo externo quebra em 90 px, e a largura do `dc:Bounds` não muda isso.**
  Ela posiciona o rótulo, não o alarga. Nome de gateway com palavra longa
  (`AGUARDANDO_BAIXA`) quebra no meio da palavra; a saída é reescrever o nome,
  não alargar a caixa. Dentro de uma atividade a regra é outra: ali quem manda é
  a largura da forma.
- **O nome do gateway sai centrado logo abaixo do losango, que é por onde desce
  a seta do "não".** A linha corta o texto. O conserto é o `BPMNLabel` com
  `dc:Bounds` explícito — o mesmo que o bpmn.io grava quando alguém arrasta o
  rótulo com o mouse.
- **Acrescentar `.tools/` quebrou o `npm run lint` antes de a D04 mexer em uma
  linha de produto.** O ESLint 9 não lê o `.gitignore`: com o bundle do bpmn-js
  no disco, o portão foi de 0 para 2054 problemas. O
  [eslint.config.mjs](eslint.config.mjs) ignora `.tools/**` por causa disso.
  Rode os portões do projeto depois de baixar qualquer ferramenta nova.

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

**Com uma exceção, medida na D05: o `db:demo` não desfaz uma retirada feita pelo
tablet.** Ele faz `upsert` nos dez empréstimos da faixa de ids reservada
(9001–9010) e reescreve o status de todo equipamento — mas um `Emprestimo` novo,
criado pela tela, nasce com id próprio (9011 em diante) e ele não apaga. O efeito
é traiçoeiro justamente porque metade se desfaz: o equipamento volta a
`DISPONIVEL`, o empréstimo fica, e a pessoa aparece com item na mão na captura
seguinte — trocando o título da tela inicial de "O que você vai levar?" para "O
que você quer fazer?". Depois de exercitar o Fluxo 1, recrie o banco:

```bash
npm run db:reset && npm run db:seed && npm run db:demo
```

**E uma segunda exceção, medida na D06: o `db:demo` não restaura o `status` de
quem veio do seed.** Ele faz `upsert` nas suas **onze** pessoas fictícias, e só
nelas; as quatro do `PESSOAS_EXEMPLO` do seed — entre elas a Ana Souza
(`0012345`), que é quem tem "Meus equipamentos" cheio — ele não menciona. E o
seed também não reescreve `status` de cadastro que já existe, por decisão da
Tarefa 8 ("campo que a origem não menciona é campo que o banco preserva"). Ou
seja: se você inativar a Ana à mão para fotografar a trava assimétrica, **nada
a reativa sozinho** — nem `db:demo`, nem `db:seed`. Desfaça no mesmo gesto em
que fizer, ou recrie o banco com a receita de três passos acima.

### Capturar sem mexer no seu `dev.db`

O `db:reset` apaga o banco de desenvolvimento. Para não perder o estado com que
você vinha trabalhando, aponte o `DATABASE_URL` para um arquivo separado — o
`.env` não sobrescreve variável já definida no ambiente, e o `.gitignore` já
cobre `*.db`:

```bash
export DATABASE_URL="file:./dev-demo.db"
npx prisma migrate deploy   # cria o arquivo com as migrations aplicadas
npx tsx prisma/seed.ts
npx tsx prisma/demo-estado.ts
npx next dev -p 3100
```

Duas coisas que custaram diagnóstico na D05:

- **O `next dev` recusa subir um segundo servidor do mesmo projeto.** Ele
  responde mandando usar o que já está de pé — que aponta para o outro banco.
  Encerre o servidor antigo antes; a mensagem dele traz o `taskkill` pronto.
- **O indicador de desenvolvimento do Next aparece em toda captura**, no canto
  inferior esquerdo ("Rendering …"). Ele vive num `<nextjs-portal>` pendurado no
  `body` e não aparece em asserção nenhuma — some com
  `document.querySelectorAll('nextjs-portal').forEach(e => e.remove())` antes de
  fotografar. Não mexa no `next.config.ts` por causa disso: necessidade da wiki
  não muda o comportamento de quem desenvolve.

E uma terceira, medida na D09: **o servidor segura o arquivo do banco.** Um
`rm dev-demo.db` com o `next dev` de pé responde `Device or resource busy` no
Windows. Encerre o servidor, recrie o banco, suba de novo — nessa ordem.

### Fotografar diálogo e aviso flutuante

O `<dialog>` aberto por `showModal()` e o aviso de sucesso vivem no **top
layer**: `getBoundingClientRect()` devolve coordenada de **janela**, e o recorte
de captura do Chrome é sempre em coordenada de **documento**. Os dois só
coincidem com a página rolada até o topo.

Isso produziu dois modos de errar na D09, e nenhum deles falha — os dois
entregam uma imagem plausível:

- somar `scrollY` ao retângulo fotografa **a página que está atrás** do diálogo
  (com a rolagem em 1019px, saiu a tabela);
- desligar `captureBeyondViewport` fotografa **o topo do documento** (saiu uma
  imagem em branco).

A receita é rolar até o topo antes de medir, e conferir que `scrollY` é mesmo 0
antes de disparar. O elemento fixo não se move com a rolagem, então o
enquadramento não muda.

### Ler o aviso de sucesso em roteiro de captura

O aviso fica ~6 segundos na tela e **persiste entre ações**. Lê-lo "assim que o
elemento existir" devolve a mensagem da ação **anterior** — na D09 isso fez duas
asserções seguidas reprovarem falando de um evento que já tinha acontecido, e o
diagnóstico natural é culpar o produto.

Feche o aviso (`button[aria-label="Fechar aviso"]`) antes de cada ação, e só
então espere um novo aparecer. A âncora é esse botão, e não `[role="status"]`:
o painel tem **três** elementos com esse papel, e o primeiro do DOM está sempre
vazio.

### Depois de exercitar a importação, recrie o banco

A importação da D09 **cria cadastros**, e a segunda trava do `db:demo` conta os
cadastros que o script não reconhece. Um cadastro criado pela tela — ou uma
matrícula corrigida para um número fora do elenco — passa do teto de 4, e a
próxima execução do `db:demo` é recusada:

```text
Recusado: o banco tem 6 cadastros que este script não reconhece.
```

Não é defeito: é a trava fazendo o trabalho dela, porque um banco com cadastro
que ela não conhece é indistinguível de um banco com dado real. O caminho é a
receita de três passos (`reset` + `seed` + `demo`), com o servidor encerrado
antes.

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
`main` que toque `docs/**`, o `mkdocs.yml`, o `docs-requirements.txt`, a
configuração do Vale, o verificador de links ou o próprio workflow.

**São dois jobs no mesmo workflow, e o segundo depende do primeiro** (D13):

| Job         | O que faz                                                             |
| ----------- | --------------------------------------------------------------------- |
| `qualidade` | `mkdocs build --strict`, depois o Vale, depois o `npm run docs:links` |
| `publicar`  | `needs: qualidade` — só então instala o Python e chama o `mike`       |

A linha `needs: qualidade` **é** o portão. Sem ela os dois jobs correriam em
paralelo e a wiki subiria antes de qualquer conferência — o mesmo efeito de ter
dois workflows separados, que é o que a D13 existe para impedir.

O `mike deploy` roda o build por dentro mas **não aceita `--strict`** (conferido
em `mike deploy --help`), e é por isso que o build estrito é um passo próprio do
job de qualidade em vez de estar no de publicação.

As versões do Vale e do lychee ficam em `env:` no topo do workflow, fixadas, e
são as mesmas da receita de instalação local acima. Ao subir uma delas, suba nos
dois lugares — senão o portão da sua máquina deixa de ser o portão do CI.

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
