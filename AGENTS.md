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

**A wiki tem especificação própria: [spec-wiki.md](spec-wiki.md).** Ela manda
sobre `docs/` e sobre a série `tarefa-doc-NN`; em conflito, a `spec.md` vence —
a wiki descreve o sistema, não o define.

### Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run db:migrate   # cria/aplica migration após mudar o schema
npm run db:generate  # regenera o Prisma Client (necessário após mudar o schema)
npm run db:seed      # popula pessoas, inventário e administradores
npm run db:sanear    # prévia da normalização dos cadastros; grava com -- --aplicar
npm run db:demo      # estado fictício para as capturas da wiki (recusa banco real)
npm run db:studio    # inspecionar o banco
npm run lint         # tem que sair em 0
```

A wiki (`docs/`) é MkDocs, ou seja **Python**, e por isso não está no
`package.json`. As ferramentas ficam em `docs-requirements.txt`, com versões
fixadas, e a receita de ambiente está na seção "Documentação" do
[CONTRIBUTING.md](CONTRIBUTING.md). Com o ambiente ativado:

```bash
mkdocs serve            # a wiki com recarga automática
mkdocs build --strict   # tem que sair em 0; é o portão que a Action roda
```

O **Vale** confere o vocabulário controlado das páginas (D03). Ele é binário Go,
mora em `.tools/` (fora do Git) e a receita de instalação está na mesma seção do
[CONTRIBUTING.md](CONTRIBUTING.md):

```bash
./.tools/vale/vale.exe docs/   # tem que sair em 0
```

Os **diagramas BPMN** (D04) têm fonte em `docs/processos-fonte/*.bpmn` e SVG
derivado em `docs/assets/diagramas/`. O SVG **nunca** é editado à mão:

```bash
npm run docs:diagramas               # regrava os SVG a partir dos .bpmn
npm run docs:diagramas -- --verificar # confere sem escrever; é o portão do CI
```

O comando precisa do bpmn-js em `.tools/bpmn-js/` (fora do Git, como o Vale) e
do Chrome. Receita na seção "Documentação" do [CONTRIBUTING.md](CONTRIBUTING.md).

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

- **Schema**: os nomes de campo seguem a spec, em snake_case (`pessoa_id`,
  `equip_id`, `data_retirada`, `categoria_id`). Não "corrija" para camelCase —
  o enunciado da Tarefa 6 pedia `categoriaId`, e a convenção do projeto venceu
  por decisão explícita. (`pessoa_id` chamava-se `usuario_id` até a Tarefa 10.)
- **`Pessoa.perfil` vale `"Estudante"` ou `"Professor"`** — Title Case, não
  caixa alta (Tarefa 8.1). É o único campo do banco gravado **na forma
  exibida**, e por isso a tela não tem `de-para` de perfil: quem escreve o
  rótulo é `rotuloDePerfil`. Os status continuam em caixa alta; a assimetria é
  intencional, porque nenhum status é exibido cru.
- **Nome e cursos também têm forma canônica** (Tarefa 8.1): nome em Title Case
  com partícula minúscula, cursos na ordem hierárquica SI → CC → EC e o resto
  em ordem alfabética depois. Quem garante isso é
  [sanitizacao.ts](src/lib/sanitizacao.ts), na **escrita** — nunca na leitura.
  Não normalize de novo ao exibir: o banco já está certo, e uma segunda passada
  é a chance de duas telas discordarem.
- **A entidade de quem retira equipamento é `Pessoa`, não `Usuario`** (Tarefa
  10). "Usuário" agora quer dizer **login de administrador**, e só isso: é o
  campo `Administrador.usuario`. Se você encontrar "usuário" em algum lugar
  falando de aluno ou professor, é resíduo — corrija.
- **Matrícula é `String`**, sempre. Converter para número apaga zeros à esquerda.
- **Imagens**: componentes usam import estático de `src/assets/<finalidade>/`;
  `public/` só para URL fixa (favicon, ícones PWA). Detalhes na seção "Imagens e
  assets" do [README.md](README.md).
- **Rotas que leem o banco** precisam ser dinâmicas — sem isso o Next congela os
  dados no build. Confira a classificação das rotas no relatório do `build`.
- Textos de interface em português, voltados a aluno e secretaria.

### Commits e sincronização

**Este projeto commita direto na `main`. Não crie branch, não abra PR.** O
histórico é linear desde o primeiro commit, o repositório tem um único autor e
não há revisão de pares — um branch aqui só deixaria trabalho pronto esperando
uma etapa que ninguém vai executar. Isto vale por decisão explícita do dono do
repositório (2026-08-20), e substitui qualquer regra padrão em contrário.

**O ciclo normal de uma tarefa é: implementar, verificar, organizar os commits
na `main` e parar aí.** Quem testa é o dono do repositório, e quem sincroniza
com o remoto é ele, pelo `pull` do lado dele. Deixe os commits prontos e diga
que estão prontos — **não faça `push` por conta própria**. Publicar antes do
teste tira dele a chance de mandar corrigir algo enquanto o histórico ainda é
local.

**A exceção é ele pedir.** Quando a mensagem disser para sincronizar, publicar
ou "dar o pull", aí sim o `push` faz parte da tarefa. Autorização em uma tarefa
não vale para a seguinte.

Sobre a forma das mensagens: `tipo(escopo): assunto`, **sem acento**, corpo
explicando o **porquê** (a alternativa descartada, a medição, o conflito que
apareceu), e o rodapé `Co-Authored-By:`. Corte por tema, não por arquivo nem por
sessão — o enunciado da tarefa entra antes da implementação, e correção de
defeito antigo vai em commit próprio. Leia os últimos commits antes de escrever
o primeiro.

### Regra de negócio que não é óbvia pelo código

O status `AGUARDANDO_BAIXA` separa "o usuário disse que devolveu" de "a secretaria
recolheu". Enquanto o empréstimo está nesse estado, o equipamento **não** volta
para `DISPONIVEL` — só a confirmação no `/admin` fecha o ciclo. Quebrar isso faz o
sistema oferecer no tablet um equipamento que ainda está na bancada.

Cada item emprestado gera um registro **separado** em `Emprestimo`.

**São três marcadores temporais, e cada um tem um dono só** (Tarefa 12):
`data_retirada` é o tablet entregando, `data_devolucao` é o tablet **declarando**
a devolução (`ATIVO` -> `AGUARDANDO_BAIXA`) e `data_baixa` é a secretaria
**conferindo fisicamente** (`AGUARDANDO_BAIXA` -> `CONCLUIDO`). A diferença entre
os dois últimos é o tempo de prateleira — o aparelho parado na bancada, invisível
para o tablet e para o inventário. Até a Tarefa 12 a baixa **sobrescrevia** a
`data_devolucao`, então esse intervalo dava zero sempre; se alguém devolver aquela
linha ao `updateMany` de `darBaixa`, a métrica volta a mentir sem nenhum erro
aparecer.

`INATIVO` é a aposentadoria do equipamento, e existe porque **equipamento não é
apagado**: `Emprestimo.equip_id` aponta para ele, e um DELETE levaria junto o
histórico do semestre passado. O item inativo some do tablet (nem nas contagens
entra) e continua na lista do inventário, em cinza, com botão de reativar.
Categoria, ao contrário, pode ser apagada de verdade — nenhum `Emprestimo`
aponta para ela —, mas só quando está vazia, e quem recusa é o banco.

**`Pessoa.status` tem o mesmo nome e uma regra diferente do `Equipamento`.**
Pessoa também nunca é apagada (`Emprestimo.pessoa_id` aponta para ela, e o
banco recusa o DELETE com P2003), mas o `INATIVO` dela é **assimétrico**:
bloqueia a **retirada** e libera a **devolução**. Quem foi inativado costuma
estar com um aparelho na mochila, e travar os dois lados faria a inativação
garantir que o equipamento nunca volta. Por isso a matrícula inativa entra no
tablet normalmente — a grade de categorias é que dá lugar a uma explicação. Pelo
mesmo motivo, inativar alguém com empréstimo aberto é **permitido** (com aviso),
ao contrário do equipamento, cuja situação trava até o ciclo fechar.

A matrícula é editável no painel, e a correção dela **leva o histórico junto**
(`onUpdate: Cascade` + `PRAGMA foreign_keys = 1`). Só aceita dígitos, até 15,
porque é isso que o teclado do tablet consegue digitar.

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

**Tarefa 3 — Fluxo 2 (concluída):** devolução pelo usuário, na mesma rota `/`.
A tela seguinte à matrícula virou `TelaInicio`, que reúne "Meus equipamentos"
(empréstimos `ATIVO` da matrícula) e a grade de categorias. `tsc`, `lint` e
`build` em 0; as actions foram exercitadas contra o `dev.db` e também pela via
HTTP real (POST com `Next-Action`), confirmando que o `Equipamento` **não** muda
de status na devolução.

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
  sufixo: `px-0!`, não `!px-0`). A mesma armadilha vale para recuo: por isso o
  campo do painel é composto a partir de `CAMPO_SEM_LADOS`, e quem precisa de
  outro recuo (a lupa da busca à esquerda, a seta do `<select>` à direita) monta
  o seu em vez de somar `pl-12` por cima de um `px-4`.
- **Modal é `<dialog>` nativo com `showModal()`**, não `<div>` posicionada. Dá de
  graça a trava de foco, o `inert` no resto da página e o *top layer* — que
  resolve a briga de `z-index` com a `BarraSelecao`, sticky no rodapé. Efeito
  colateral que já economizou código: enquanto o modal está aberto, spinner ou
  estado "travado" nas linhas atrás dele seriam desenhados onde ninguém vê.
- **"Meus equipamentos" e as categorias dividem a tela em paisagem**, empilhadas
  em retrato — a mesma solução da `TelaMatricula`, pelo mesmo motivo medido.
  Empilhado nos dois casos, **três** empréstimos já empurravam a grade de
  categorias para fora de um tablet deitado (1280x800): quem vinha retirar via
  três caixas de ícone sem rótulo. Isso foi medido no navegador, não estimado.
  A lista fica à esquerda e primeiro no HTML, para ordem visual e ordem de
  leitura coincidirem. Sem nenhum empréstimo ativo a seção some inteira e a tela
  volta a ser a do Fluxo 1, com o mesmo `h1`.
- A legenda da linha diz "Tablet · ontem às 12:26" e esconde "retirado" em
  `sr-only`. Não é enfeite: na coluna estreita sobram 199px e a versão com a
  palavra ocupa 256px, quebrando em duas linhas. Quem enxerga tem o contexto da
  seção; quem ouve, não — então a palavra continua lá para o leitor de tela.
- **Escrita sempre filtra pela matrícula**, nunca só pelo id que veio da tela.
  Server Action é endpoint POST público: sem o filtro, um POST direto daria
  baixa no empréstimo de qualquer pessoa chutando um id sequencial.

**Tarefa 4 — Fluxo 3 (concluída):** painel administrativo em `/admin`, com a
tela de senha, a fila de `AGUARDANDO_BAIXA` ("Confirmar Recebimento Físico"), a
visão somente-leitura dos `ATIVO` em `/admin/ativos` e a gestão de inventário em
`/admin/inventario` (alternar `DISPONIVEL`/`MANUTENCAO` e cadastrar item novo).
`tsc`, `lint` e `build` em 0, com as três rotas classificadas como dinâmicas
(`ƒ`) no relatório do build. O fluxo inteiro foi exercitado por HTTP real contra
o `dev.db`: login certo e errado, cookie adulterado e com prazo esticado à mão,
baixa de um empréstimo (que virou `CONCLUIDO` com o equipamento voltando a
`DISPONIVEL`), repetição da mesma baixa, as travas do inventário, o cadastro com
normalização de etiqueta e categoria, e o bloqueio por tentativas.

**Decisões do Fluxo 3** (não refazer sem motivo):

- ~~**A sessão é um HMAC do prazo de validade, com a senha mestre como
  chave.**~~ **Substituída na Tarefa 10**, que trocou a senha mestre por contas
  individuais: a chave do HMAC passou a ser o hash bcrypt do administrador
  logado, e a carga passou a levar `id` e `nome`. As propriedades continuam as
  mesmas, agora por conta em vez de globais — ver as decisões da Tarefa 10. O
  que **não** mudou: `secure` fica **falso** de propósito, porque a rede da
  secretaria é HTTP e com a flag ligada o navegador descartaria o cookie.
- **`temSessaoAdmin()` é chamada em cada página e em cada action**, nunca no
  layout. Layout não re-renderiza entre rotas irmãs e não impede um POST direto
  no endpoint da Server Action — usar layout como porta dá sensação de proteção
  sem proteção. Pelo mesmo motivo a barra lateral é o componente `CascaAdmin`,
  composto dentro de cada página: é o que mantém o contador da fila correto ao
  trocar de aba.
- **Cinco senhas erradas bloqueiam novas tentativas por 1 minuto.** A senha é
  única e a rede é local; sem freio, um script tenta o dicionário inteiro. O
  contador vive no `globalThis` pelo mesmo motivo do Prisma (o hot-reload
  recriaria um contador zerado).
- **Datas são formatadas no servidor** e descem como texto pronto para as ilhas
  de cliente. Formatar de novo na hidratação é a receita clássica de divergência
  de fuso/minuto em texto de tempo.
- **`EMPRESTADO` não é um botão no inventário.** O painel só alterna
  `DISPONIVEL` <-> `MANUTENCAO`; equipamento com empréstimo aberto mostra o nome
  de quem está com ele em vez de um botão apagado. Mudar `EMPRESTADO` à mão
  deixaria um `Emprestimo` aberto apontando para um item "disponível".
- **O status de origem é derivado do destino, nunca recebido da tela.** Além de
  fechar o par permitido, dá de graça a trava de concorrência: o `updateMany`
  filtra pela origem e conta as linhas afetadas.
- **Fila é cartão, ativos e inventário são tabela.** A fila é uma tarefa física
  por linha (pegar da bancada, conferir a etiqueta); as outras duas são varredura
  com o olho. Verde só na fila — é a única ação crítica da tela.
- **Cadastro normaliza etiqueta para maiúsculas e adota a grafia de categoria já
  usada no banco** (comparando sem acento e sem caixa). Sem isso, "note-11"
  conviveria com "NOTE-11" no mesmo armário e "notebook" abriria uma categoria
  nova no tablet ao lado de "Notebook".

**Tarefa 5 — Refinamento de UI/UX (concluída):** os cinco itens de
[tarefa-05-refinamento.md](tarefa-05-refinamento.md) — cartão de login mais
estreito e sem rolagem com erro, logo do login fora do cartão, `<select>` de
categoria no inventário, "Confirmar Todas as Devoluções" no painel e "Devolver
tudo" no tablet. `tsc`, `lint` e `build` em 0, com as três rotas do painel ainda
dinâmicas (`ƒ`). Tudo exercitado no navegador real (Chrome headless por CDP, sem
instalar dependência) e contra o `dev.db`: a baixa de cinco itens em lote, a
devolução de três itens pelo aluno, os dois cadastros seguidos pelo `<select>`,
o caso de item único nas duas telas, e a recusa das actions do painel sem
sessão. O banco foi devolvido ao estado em que estava antes da verificação.

**Decisões da Tarefa 5** (não refazer sem motivo):

- **A logo do login vive no cabeçalho da página, não dentro do cartão.** Dentro
  dela estava em um `flex flex-col`, e o `align-items: stretch` esticava a
  imagem até a largura do cartão com a altura presa em `h-11` — a distorção era
  isso, não o arquivo. Fora, em faixa horizontal com o mesmo `h-11 sm:h-12` e o
  mesmo `px-4 py-5 sm:px-8` do cabeçalho do portal (medido: 60,7x48 nos dois,
  proporção 1,2646 contra 1,265 nativa). Sem o `mx-auto max-w-5xl` do portal:
  ali há conteúdo à direita para equilibrar, aqui não.
- **O erro do login é inline, não um cartão de `Alerta`.** A caixa do `Alerta`
  custava ~125px e empurrava o "Entrar" para fora de um notebook de 768px.
  Medido depois da mudança: documento em 768px nos dois estados, com o botão
  terminando em 536px (sem erro) e 566px (com erro). `Alerta` continua onde é
  mensagem de página — o aviso de instalação incompleta.
- **A categoria do inventário é `<select>`, com escape para categoria nova.** O
  `datalist` parece combo mas é campo de texto: depois de escolher "Notebook", a
  lista só reabre apagando a palavra. A última opção do `<select>` troca o campo
  por um `<input>` com o **mesmo** `name` — nunca os dois ao mesmo tempo, porque
  `FormData.get` devolve o primeiro homônimo e mandaria o valor errado calado.
- **O `<select>` *de formulário* é não-controlado.** O React 19 limpa o
  formulário sozinho quando a action termina; com `value` controlado o DOM volta
  ao `defaultValue` e o React continua achando que o valor escolhido está lá — e
  o `FormData` lê o DOM. Isso foi observado no navegador antes de virar bug de
  produção: depois de cadastrar TAB-99 com "Tablet" escolhido, o campo já
  aparecia em branco. **A regra é do formulário, não do `<select>`:** os
  seletores de filtro da Tarefa 7 são controlados, e têm que ser — eles não são
  enviados a lugar nenhum, o estado deles *é* o filtro. Não "corrija" um pelo
  outro.
- **A baixa em lote do painel é melhor-esforço, item a item.** O gesto físico já
  aconteceu — a secretaria recolheu a pilha. Uma linha que saiu da fila em outra
  aba não pode desfazer a conferência das outras quatro. O resumo conta tudo:
  confirmados, presos em manutenção, fora da fila e falhos.
- **A devolução em lote do aluno é uma transação só.** Ao contrário da do
  painel, os itens vão juntos para a bancada: devolver metade faria a pessoa
  sair achando que entregou tudo.
- **O lote do aluno decide o alvo pela matrícula, no servidor**; o do painel
  recebe os ids da tela. Não é incoerência: no tablet, aceitar ids soltos abriria
  a porta para dar baixa no empréstimo de outra pessoa; no painel, "tudo que
  estiver na fila agora" incluiria uma devolução declarada depois do render, com
  o aparelho ainda na mochila.
- **Os dois botões de lote só aparecem a partir de dois itens.** Com um só, cada
  um duplicaria o botão da linha logo abaixo — dois gestos idênticos e a dúvida
  de qual faz o quê.
- **A frase crítica da spec ganha plural quando o modal é de vários.** "Deixe
  **os equipamentos** na bancada" — manter o singular com três aparelhos na mão
  seria dizer a coisa errada em nome da literalidade. O caso de um item continua
  literal, palavra por palavra.

**Tarefa 6 — Gestão de inventário e categorias (concluída):** os quatro itens
de [tarefa-06-gestao-inventario.md](tarefa-06-gestao-inventario.md) — a tabela
`Categoria` com `Equipamento.categoria_id` obrigatório, o status `INATIVO`, a
tela `/admin/categorias` (cadastrar, listar, excluir), o `<select>` de categoria
alimentado pela tabela, e as ações de linha Editar etiqueta / Inativar /
Reativar com modal em cada uma. `tsc`, `lint` e `build` em 0, com as **quatro**
rotas do painel dinâmicas (`ƒ`). A migration foi escrita à mão e ensaiada em uma
cópia do `dev.db` antes de tocar no arquivo real: 21 equipamentos preservados,
zero empréstimo órfão, `foreign_key_check` vazio. Verificação em três frentes,
com o banco devolvido à linha de base exata no fim de cada uma: HTTP real contra
as actions do painel (transições válidas e inválidas, `EMPRESTADO` e
`"constructor"` como destino, renomeação com o histórico acompanhando, exclusão
de categoria cheia e vazia, tudo repetido sem sessão); navegador real (Chrome
headless por CDP) para os dois formulários, os três modais e a medida de
rolagem; e HTTP no portal do tablet (retirada, devolução, baixa, e a
invisibilidade do inativo nas contagens).

**Decisões da Tarefa 6** (não refazer sem motivo):

- **A migration foi escrita à mão, e tinha que ser.** `prisma migrate dev`
  recusa criar uma coluna obrigatória em tabela com 21 linhas — a recusa é o
  aviso de que existe uma decisão sobre os dados a tomar, não um obstáculo. A
  migration cria a `Categoria`, semeia a partir de `SELECT DISTINCT tipo` e
  recria o `Equipamento` com **INNER JOIN** pelo nome: se alguma linha não
  casasse, é melhor a migration falhar com o banco intacto do que atribuir um
  vínculo inventado.
- **A ordem das categorias é o `Categoria.id`**, e não uma lista no código.
  Existiam duas cópias de `["Notebook", "Tablet", "Extensão"]` (uma no tablet,
  outra no painel) que precisavam ser editadas à mão a cada categoria nova e
  ainda assim não sabiam onde encaixar as que não conheciam. A migration semeou
  aquelas três como 1, 2 e 3 na ordem do `CASE`: as telas não mudaram e as duas
  listas sumiram.
- **`onUpdate: Cascade` + `onDelete: Restrict` fazem o trabalho pesado, e isso
  foi conferido antes de virar desenho.** O adapter `better-sqlite3` roda com
  `PRAGMA foreign_keys = 1` — medido em uma cópia do banco, não lido na
  documentação. Daí sai a renomeação de etiqueta (a PK muda e os 3 empréstimos
  do item vão junto, dentro da mesma instrução) e a recusa de exclusão de
  categoria em uso (P2003). Sem o pragma ligado, as duas regras seriam
  decorativas.
- **A tabela de transições é um `Map`, não um objeto.** `ORIGENS[chave]` em
  objeto literal responde a `"constructor"` e `"toString"` com valores do
  protótipo, e a guarda `if (!origens) recusa` deixaria passar — o destino vem
  do corpo de um POST público. Exercitado: `"constructor"` como destino volta
  `STATUS_INVALIDO`.
- **Ainda é o destino que a tela manda, nunca a origem.** A regra da Tarefa 4
  sobreviveu à chegada do terceiro status: o servidor deriva as origens
  permitidas do destino (`DISPONIVEL` <- manutenção ou inativo; `MANUTENCAO`
  <- disponível; `INATIVO` <- disponível ou manutenção) e o `updateMany` filtra
  por elas. `MANUTENCAO` de propósito não é alcançável a partir de `INATIVO`:
  reativa primeiro, decide o conserto depois.
- **O escape "Nova categoria..." saiu do cadastro de equipamento.** Ele era a
  solução certa na Tarefa 5, quando categoria era texto e não tinha dono. Com
  `/admin/categorias`, dois lugares criando categoria é como nasciam "notebook"
  e "Notebook" lado a lado. No lugar dele ficou um link "Gerenciar" — o caminho
  continua a um clique, mas passa por onde a grafia é conferida.
- **As opções do `<select>` vêm de consulta própria**, e não de um `map` sobre
  o inventário já carregado (que era o certo até a Tarefa 5). Agora existe
  categoria sem nenhum item, e derivar esconderia justamente a que a pessoa
  acabou de criar para usar.
- **Reativar existe, e não estava no enunciado.** Inativar sem volta é um
  caminho sem retorno em um painel operado sob pressão; a única reversão seria
  pelo Prisma Studio. Foi levantado como conflito antes de escrever código.
- **O ícone de inativar é o círculo cortado, não a lixeira.** Lixeira promete
  que o registro some, e ele não some — é justamente o oposto da regra.
- **Inativo é o único selo sem cor.** Cinza sobre cinza, com a linha inteira
  pesando menos: não é estado que peça ação nem que dê boa notícia. O quarto
  cartão do resumo só aparece quando existe algum inativo — um zero permanente
  roubaria um quarto da faixa para não informar nada.
- **`plural()` deixou de ser duas regras.** A verificação no navegador flagrou
  "Projetors": enquanto as categorias eram três e fixas, `+s` e `-ão/-ões`
  bastavam; com categoria criada pela tela, a primeira que se tenta depois de
  Notebook e Tablet costuma terminar em `-r`. A função ganhou as terminações de
  nome de equipamento (`-r/-z`, `-m`, `-l`) e a tela de Categorias passou a
  **mostrar o plural calculado** ao lado do nome — quem cadastra vê o erro na
  hora, em vez de descobrir no tablet.

**Tarefa 7 — Busca e filtros do inventário (concluída):** os três itens de
[tarefa-07-filtros-pesquisa.md](tarefa-07-filtros-pesquisa.md) — a barra de
busca por etiqueta ou categoria, os `<select>` de categoria e de situação, e o
estado vazio com mensagem em vez de tabela em branco. `tsc`, `lint` e `build` em
0, com as quatro rotas do painel ainda dinâmicas (`ƒ`). Verificado no navegador
real (Chrome headless por CDP, sem instalar dependência): 22 conferências de
filtro, mais 9 que escrevem no banco. O banco foi devolvido à linha de base
exata no fim — 5 categorias, 22 equipamentos, 20 empréstimos, `foreign_key_check`
vazio.

**Decisões da Tarefa 7** (não refazer sem motivo):

- **A filtragem é no cliente, e a spec deixava a escolha.** O inventário inteiro
  já chega no render, a página é `force-dynamic` e o componente já é ilha de
  cliente com a lista na mão. Por `searchParams` no servidor, cada tecla custaria
  um render inteiro do Server Component — no computador da própria secretaria,
  mas com a lista piscando enquanto se digita. O preço aceito: os filtros não
  sobrevivem ao F5 nem entram no histórico. Para uma tela operada de pé, em uma
  sessão, ninguém compartilha link de inventário filtrado — e o `router.refresh()`
  das ações preserva o estado do cliente, que é quando o filtro importa.
- **A barra fica entre o `h2` e a tabela, não junto dos cartões.** Encostada no
  resumo, pareceria filtrar também as contagens — que continuam sendo do
  inventário inteiro de propósito: "sobra notebook para hoje?" não pode mudar de
  resposta porque alguém deixou um filtro posto.
- **`semAcento` saiu das actions para [texto.ts](src/lib/texto.ts).** Tem dois
  donos de naturezas opostas: o cadastro a usa para **recusar** categoria
  repetida com outra grafia, a busca para **aceitar** "extensao" sem acento. Duas
  cópias divergiriam em silêncio. Além disso, módulo `"use server"` só exporta
  função assíncrona — a busca, que roda no navegador, não teria como importá-la
  de lá.
- **O valor do filtro de categoria é o nome, não o id.** É o nome que a linha
  carrega (`ItemDeInventario.tipo`), e dá no mesmo porque `Categoria.nome` é
  UNIQUE — conferido no índice `Categoria_nome_key` dentro do `dev.db`, não lido
  no schema. As opções vêm da mesma consulta que alimenta o cadastro, e não de um
  `map` sobre os itens carregados: derivar esconderia a categoria vazia, e faria
  a opção sumir justamente quando o filtro anterior esvaziou a tabela, prendendo
  quem filtrou.
- **A linha que exibe um erro nunca é escondida por filtro.** O `Alerta` da falha
  mora dentro da própria linha, e `relerSeDesencontrou` relê o banco quando tela
  e banco discordam — a releitura pode trocar o status para um que o filtro
  exclui. Sem a exceção, o pedido falharia, a linha sumiria levando a explicação
  junto, e a secretaria veria o clique não fazer nada. Exercitado de verdade:
  com o filtro em `Disponível`, o `NOTE-04` foi mudado para `MANUTENCAO` por
  fora, o clique falhou com `STATUS_INVALIDO`, e a linha ficou na tela mostrando
  o motivo.
- **"Mostrando X de Y" só aparece com filtro ativo, e existe por causa do
  cadastro.** Com um filtro posto, um equipamento novo que não casa com ele é
  gravado e não aparece na tabela: o alerta verde diz "cadastrado", a tabela não
  mostra, e a conclusão razoável é que falhou. O "de 22" virando "de 23" na mesma
  hora explica onde o item foi parar. Fora de filtro a linha some — "Mostrando 22
  de 22" é ruído, e o total já está nos cartões do topo. A alternativa descartada
  foi limpar os filtros sozinho no cadastro: desfaz um filtro que a pessoa pôs, e
  quem cadastra dez notebooks seguidos o perde dez vezes.
- **O estado vazio tem botão de volta, e são dois casos com conselhos opostos.**
  Sem equipamento nenhum, a resposta é o formulário acima; sem resultado de
  filtro, a resposta é desfazer o filtro. Confundir os dois é o que faz uma tela
  parecer quebrada. O "Limpar filtros" não estava no enunciado: foi levantado
  como conflito de reversibilidade antes de escrever código, porque a única saída
  seria lembrar quais dos três controles estão postos e zerar um por um.
- **O anúncio para leitor de tela é um `role="status"` `sr-only` sempre
  presente.** Região viva só fala se já existir no DOM quando o texto muda, e a
  linha de contagem visível some sempre que não há filtro. É `sr-only`, ou seja,
  posicionada em absoluto: não vira item do flex e não abre vão entre a tabela e
  o rodapé.
- **A largura dos seletores é medida.** Com 26rem os dois cortavam o próprio
  rótulo ("Todas as catego…") — defeito que `tsc`, `lint`, `build` e as 22
  asserções de conteúdo atravessaram sem piscar, porque o texto *está* no DOM,
  só invisível. Com 34rem, medido em 1440, 1280 e 1024px: 198px úteis para
  "Todas as categorias", que ocupa 162px.
- **Não há busca por nome de quem está com o item.** A spec pede etiqueta e
  categoria, e é o que a linha mostra. Quem procura por pessoa tem a aba
  Empréstimos Ativos.

**Tarefa 8 — Gestão de usuários e importação de .xlsx (concluída):** os quatro
itens de [tarefa-08-gestao-usuarios.md](tarefa-08-gestao-usuarios.md) — o campo
`Usuario.status` (hoje `Pessoa.status`), a leitura nativa de planilha do Excel com `xlsx`
(SheetJS), a importação com atualização parcial nos três cenários do enunciado,
e a tela `/admin/usuarios` com busca, filtros, edição por modal e o botão de
ativar/inativar de um clique. `tsc`, `lint` e `build` em 0, com as **cinco**
rotas do painel dinâmicas (`ƒ`). A migration foi ensaiada em uma cópia do
`dev.db` antes do arquivo real. Verificação em três frentes, com o banco
devolvido à linha de base exata no fim: o parser exercitado por script contra
arquivos .xlsx montados em memória (27 asserções, incluindo o arquivo "sujo");
navegador real (Chrome headless por CDP, sem instalar dependência) para os três
cenários, os dois modais, o dropzone, os filtros e o tablet (83 asserções); e
HTTP real reproduzindo byte a byte as chamadas de Server Action **sem o cookie
de sessão**, inclusive a de upload multipart (7 asserções).

**Decisões da Tarefa 8** (não refazer sem motivo):

- **`INATIVO` bloqueia a retirada e libera a devolução.** O enunciado criava o
  campo e o botão sem dizer o que o status faz; sem essa regra ele seria só um
  rótulo. Foi levantado como conflito antes de escrever código. A assimetria é o
  ponto: quem foi inativado (saiu, trancou a matrícula) quase sempre está com um
  aparelho na mochila, e travar a devolução transformaria a inativação na
  garantia de que o equipamento nunca volta. Quem devolve não pede nada ao
  sistema — está entregando.
- **O `onUpdate: Cascade` do item 1 já existia** — é o padrão do Prisma para
  relação obrigatória, e a migration inicial já o tinha gravado no SQL. Ficou
  **explícito** no schema pelo valor de documentação (escrito é regra do
  projeto; implícito era coincidência do gerador), mas **não houve mudança de
  SQL**. O comportamento foi provado por script em cópia do banco: renomear a
  matrícula levou os empréstimos junto, e o `DELETE` de usuário com histórico
  voltou P2003 — que é o que torna `INATIVO` a única saída, como no equipamento.
- **A biblioteca `xlsx` vem do CDN oficial da SheetJS, não do npm.** O pacote
  publicado no npm está parado na 0.18.5 (2022) e carrega duas advisories sem
  correção (prototype pollution, ReDoS); a SheetJS migrou a distribuição para o
  próprio CDN. O `package.json` aponta para o tarball 0.20.3 — a mesma
  biblioteca que o enunciado pede, na versão corrigida. `npm audit` continua com
  os mesmos 3 avisos de `deepmerge-ts`, e nenhum novo.
- **Os três cenários da tarefa saem de uma regra, não de três ramos:** *campo
  que a planilha preencheu é campo que a importação grava; campo que a planilha
  não trouxe é campo que o banco preserva.* Por isso `undefined` (coluna ausente
  **ou** célula vazia) é tipo, e não string vazia, em `LinhaLida`. Escrever os
  três ramos separados foi tentado e descartado: eles repetiam a validação de
  perfil e de status, e a primeira divergência entre as cópias seria silenciosa.
- **A importação tem prévia obrigatória, e ela não escreve nada.** A operação
  não tem desfazer — um arquivo errado sobrescreveria centenas de cadastros — e
  um relatório depois do fato só contaria o estrago. Conflito de reversibilidade
  levantado antes do código; a decisão de exigir a confirmação foi do usuário.
- **A planilha é enviada duas vezes, e o servidor refaz o plano na gravação.**
  Não é desperdício: uma lista de operações vinda do cliente seria escrita
  direto no banco (a action é um endpoint POST público), e entre a prévia e o
  clique o banco pode ter mudado. Por isso também **não é um `<form action>`** —
  o React 19 limpa o formulário quando a action termina, e um
  `<input type="file">` limpo perderia o arquivo que a segunda etapa precisa.
- **A gravação é uma transação só.** Ao contrário da baixa em lote da fila (que
  é melhor-esforço porque o gesto físico já aconteceu), aqui a secretaria
  conferiu uma lista e clicou uma vez: metade aplicada deixaria a base em um
  estado que ninguém revisou.
- **Matrícula é só dígito, até 15 — e a regra veio do tablet.** Uma validação
  mais frouxa foi escrita e **reprovada na verificação**: ela deixava gravar
  "TROCADA-01" com sucesso, criando um cadastro que existe no painel e que
  ninguém consegue digitar no portal, porque o campo da `TelaMatricula` descarta
  não-dígitos e corta em 15. Quando duas telas tocam o mesmo campo, vale a regra
  do consumidor mais restrito. Se um dia a coordenação usar prefixo de letra,
  quem muda primeiro é o teclado.
- **O arquivo é conferido pelos bytes (assinatura de ZIP), não pela extensão.**
  A biblioteca **não recusa sozinha**: medido, um `.txt` renomeado para `.xlsx`
  passa por `XLSX.read` sem lançar nada — o SheetJS cai no interpretador de CSV
  e devolve uma planilha de uma linha. Sem a guarda, a importação "funcionaria"
  gravando lixo.
- **`blankrows: true` é obrigatório na leitura**, por mais que linha em branco
  não interesse: descartá-las **desalinha a numeração** com a que o Excel
  mostra, e o erro reportado como "linha 3" estaria na linha 4 do arquivo. Pelo
  mesmo motivo o cabeçalho é a primeira linha que **contém a coluna de
  matrícula**, e não a primeira linha preenchida — planilha de coordenação vem
  com título de relatório em cima da tabela.
- **`perfil` e `status` são listas fechadas, e a recusa é por linha.** Um
  perfil adivinhado errado muda quem pode o quê e não deixa rastro. A prévia
  mostra a linha reprovada com o valor que veio, e quem corrige é a planilha.
  Uma célula ruim no meio de trezentas não derruba a importação das outras 299.
  **A Tarefa 8.1 afrouxou o que conta como "fora da lista"**: "prof", "alunos" e
  "estudante" eram recusados aqui e hoje são reconhecidos e convertidos — a
  recusa ficou para o que não é nenhuma das duas coisas ("Servidor",
  "Terceirizado"). A regra de *o que fazer com o desconhecido* não mudou; mudou
  o tamanho do conjunto conhecido.
- **`inalterada` é uma quarta ação, e existe por causa do reenvio.** A planilha
  da coordenação é reenviada inteira todo semestre; sem essa categoria a prévia
  diria "180 atualizações" quando 178 não mudam um caractere, e ninguém leria a
  lista. As linhas inalteradas contam no cartão e **não** entram na lista.
- **Inativar quem está com equipamento é permitido, com aviso.** Diferente do
  equipamento, cujo status trava enquanto há empréstimo aberto. É o caso comum —
  inativa-se justamente quem saiu — e travar deixaria o cadastro ativo (apto a
  retirar mais) até alguém lembrar de voltar. Sem empréstimo aberto o botão é
  **um clique, sem modal**, como o enunciado pede; o modal é a exceção que só
  aparece quando há o que avisar, e ele **relê a contagem do servidor** antes de
  mostrar o número.
- **`Campo.tsx` nasceu de uma divergência já consumada.** `CAMPO`, `CABECALHO` e
  `CELULA` estavam copiados em `GestaoInventario` e `GestaoCategorias`, e as
  duas cópias **já não eram iguais** — a de Categorias tinha perdido o estado
  `disabled` pelo caminho, então campo desabilitado ali tinha aparência de campo
  editável. Com a terceira tela precisando das mesmas classes, copiar de novo
  era garantir a próxima divergência. Mesmo argumento que tirou `semAcento` das
  actions na Tarefa 7.
- **`bodySizeLimit` é 4 MB no Next e 3 MB na action, e a diferença é
  deliberada.** Se fossem iguais, o arquivo grande demais estouraria no
  framework e a pessoa veria um erro genérico de rede em vez da frase que diz o
  que fazer.
- **O seed não toca no `status` ao reimportar.** Mesma regra da planilha: o CSV
  não tem a coluna, então `db:seed` não pode ressuscitar um cadastro que a
  secretaria inativou na semana passada.
- **A aba Usuários fica por último no menu.** As quatro acima são o trabalho do
  dia; cadastro é manutenção de início de semestre. Pôr uma tarefa rara no topo
  empurraria para baixo as que acontecem toda hora.

**Tarefa 8.1 — Sanitização e normalização de dados (concluída):** os cinco
itens de [tarefa-08.1-sanitizacao-dados.md](tarefa-08.1-sanitizacao-dados.md) —
o módulo [sanitizacao.ts](src/lib/sanitizacao.ts), o Title Case dos nomes, o
mapeamento de perfis para `Estudante`/`Professor`, o reconhecimento e a
ordenação hierárquica dos cursos, e a troca do termo "Aluno" em toda a
interface. `tsc`, `lint` e `build` em 0, com as cinco rotas do painel dinâmicas
(`ƒ`).

A migration foi escrita à mão e ensaiada em duas cópias do `dev.db` antes do
arquivo real (11 asserções: conversão, idempotência, ids preservados,
`foreign_key_check` vazio, e a guarda recusando um perfil desconhecido com o
banco intacto). Verificação em quatro frentes, com o banco comparado com a linha
de base no fim — só o `perfil` mudou, e as outras quatro tabelas ficaram
idênticas: as regras isoladas contra o módulo de produção (77 asserções,
incluindo idempotência de reenvio); o caminho real da importação, com `.xlsx`
montado em memória passando por `lerPlanilha` + `montarPlano` (21); o `db:seed`
contra uma cópia do banco com um CSV sujo de cinco linhas; e navegador real por
CDP (18), cobrindo os rótulos, os dois `<select>`, o filtro de perfil, o modal
de edição e o cabeçalho do tablet.

**Decisões da Tarefa 8.1** (não refazer sem motivo):

- **Partícula fica minúscula, contra a letra do enunciado.** Ele escreveu o
  exemplo como "Nome Do Aluno", mas isso valeria para todo nome importado, e
  "Ana Maria De Souza" não é como o cartório escreve nem como a secretaria lê o
  nome na fila. Levantado antes de escrever código; a decisão foi do dono do
  repositório. A primeira palavra é sempre capitalizada, mesmo sendo partícula —
  planilha exportada com o sobrenome à frente ("de souza ana") começaria em
  minúscula, e aí o defeito pareceria ser da limpeza.
- **"Ciência da Computação" ficou no singular**, embora o enunciado escreva
  "Ciências" duas vezes. É o singular que está no `dev.db`, no
  `pessoas.example.csv` e no nome oficial do curso; adotar o plural faria toda
  pessoa já cadastrada divergir do mapa na primeira importação. Também decisão
  do dono do repositório.
- **O ponto de "Prof." e o apóstrofo de "D'Ávila" sobrevivem à limpeza.** A
  Regra 1 manda manter "apenas letras, espaços e acentos", e ao pé da letra isso
  apaga o ponto — só que [primeiroNome()](src/lib/texto.ts) trata o primeiro
  token terminado em ponto como tratamento: sem ele, a saudação do tablet passa
  de "Prof. Daniel" para só "Prof", cumprimentando um título. O seed do projeto
  tem exatamente esse caso.
- **Separador vira espaço; ruído dentro da palavra é apagado.** São duas classes
  de caractere, e juntá-las foi um defeito real que a prova pegou: com tudo
  virando espaço, "An@a# S$ouza" saía como "An A S Ouza" — quatro palavras onde
  havia duas. Hífen, vírgula e barra separam ("nome-do-aluno", "Souza, Ana");
  arroba, cerquilha, cifrão e dígitos somem sem abrir espaço.
- **Perfil é reconhecido por prefixo, não por lista de sinônimos.** Uma lista
  exata teria que prever cada plural e cada gênero — "aluna", "professoras",
  "Profª" — para errar justamente na variante que ninguém lembrou. `alun`,
  `estud`, `discen` e `academ` de um lado; `prof` e `docen` do outro.
- **Perfil irreconhecível reprova a linha na importação; no seed vira
  `Estudante` com aviso.** O enunciado deixava escolher entre fallback e recusa,
  e a diferença entre os dois caminhos é o que cada um tem quando erra: a
  importação tem a prévia, que mostra a linha reprovada antes de qualquer
  escrita; o `db:seed` é comando de terminal cujo trabalho é deixar o banco
  utilizável, e reprovar ali daria um sistema sem metade dos cadastros e ninguém
  para ver. O que mudou no seed é que **agora ele avisa** — antes "Servidor"
  virava aluno em silêncio absoluto.
- **Curso fora do mapa é mantido, não descartado nem reprovado.** O enunciado só
  nomeia três, mas a Unoesc tem dezenas, e o próprio modal de edição sugere
  "Ex.: Sistemas de Informação, Direito". Descartar é perder dado sem erro
  nenhum aparecer; reprovar impediria importar qualquer pessoa fora dos três
  cursos até alguém editar o mapa no código. Vão para o fim, em ordem alfabética
  entre si.
- **A ordem hierárquica é a posição no array `CURSOS_OFICIAIS`**, e não uma
  tabela de prioridade ao lado. É o que faz "EC, SI" e "SI, EC" gravarem a mesma
  string — sem isso, a busca do painel depende de como a coordenação digitou.
- **A sanitização roda em `montarPlano`, antes de `considerar()`.** A posição não
  é livre: depois da comparação, o valor cru é que seria confrontado com o banco,
  e uma planilha reenviada com "ANA MARIA DE SOUZA" acharia diferente do "Ana
  Maria de Souza" gravado. As 180 linhas do semestre apareceriam como
  "atualizar" toda vez — o oposto do que a categoria `inalterada` existe para
  fazer. Exercitado: o reenvio da mesma planilha em outra grafia volta
  `inalterada`.
- **String vazia depois da limpeza não é campo ausente.** `undefined` continua
  querendo dizer "a planilha não mencionou"; `""` quer dizer "trouxe algo e esse
  algo era lixo inteiro" — e reprova a linha. Sem a distinção, "12345" no campo
  nome gravaria nome em branco, ou cairia no erro genérico de campo obrigatório,
  mandando procurar uma célula vazia que na verdade está preenchida.
- **`editarPessoa` deixou de fazer `.toUpperCase()` no perfil, e isso era uma
  quebra silenciosa.** Com `PERFIL.estudante` valendo "Estudante", o
  `.toUpperCase()` produzia "ESTUDANTE" e a comparação seguinte falhava
  **sempre**: a edição manual inteira passaria a responder "Perfil inválido"
  para o valor que o próprio `<select>` da tela acabou de enviar. Nem `tsc` nem
  `lint` veem — os dois lados são `string`. Exercitado no navegador, que é onde
  isso aparece.
- **A migration cuida só do perfil; os cursos vão pelo `npm run db:sanear`.** O
  perfil é o único cujo valor antigo quebra tela (some do filtro e da contagem
  do resumo), então tem que estar na migration. Normalizar cursos em SQL exigiria
  uma segunda implementação de `normalizarCursos` — sem função de split e sem
  ordenação estável em `group_concat` — destinada a divergir do TypeScript no dia
  em que um curso entrasse no mapa. O script lê a **mesma função** que a
  importação usa, o que torna a divergência impossível por construção. Mesmo
  argumento que tirou `semAcento` das actions na Tarefa 7.
- **`db:sanear` é prévia por padrão, e grava só com `-- --aplicar`.** Mesma razão
  da prévia da importação: a operação não tem desfazer, e reescrever o curso de
  centenas de cadastros a partir de um mapa errado é estrago que só se descobre
  depois. Sem a bandeira, ele não abre transação nenhuma.
- **O saneamento retroativo não toca no nome.** Decisão explícita do dono do
  repositório: o Title Case vale para tudo que entrar daqui para frente, mas
  reescrever o nome de todo mundo de uma vez muda cada tela do sistema, e um nome
  já revisado à mão no painel não deve ser desfeito por heurística. Os nomes se
  ajustam conforme a coordenação reenvia a planilha.
- **O seed também sanitiza, e isso não é escopo extra.** Ele lê o CSV da
  coordenação, que é a **outra** porta de entrada dos mesmos dados. Sem as
  funções ali, `db:seed` reintroduziria em minutos a sujeira que a migration
  acabou de tirar — e o `db:sanear` viraria um comando que se desfaz sozinho na
  segunda-feira seguinte.
- **`rotuloDePerfil` substituiu três comparações com "PROFESSOR" cravadas em
  string.** Aquela forma transformava **qualquer** valor diferente de
  "PROFESSOR" em "Aluno", inclusive um valor novo que ninguém previu — e o `tsc`
  não apontou nenhuma das três quando a constante mudou, porque literal de string
  não é a constante. Hoje o banco guarda o rótulo, então a função é quase a
  identidade; o que ela ainda faz é converter o legado ("ALUNO" de uma linha que
  escapou da migration) em vez de gritar em caixa alta no meio da tabela.

**Tarefa 9 — Planilha modelo para download (concluída):** os dois itens de
[tarefa-09-planilha-modelo.md](tarefa-09-planilha-modelo.md) — o botão
secundário "Baixar planilha modelo" dentro do cartão "Importar planilha" (entre
o texto explicativo e a área pontilhada) e a geração do
`modelo_importacao_usuarios.xlsx` no próprio navegador, com uma linha de
cabeçalho e nada abaixo dela. `tsc`, `lint` e `build` em 0, com as cinco rotas
do painel ainda dinâmicas (`ƒ`). Verificado em três frentes: prova em Node
contra o **módulo de produção** (24 asserções — assinatura de ZIP, ida e volta
pelo próprio importador, e o caso sujo); navegador real (Chrome headless por
CDP, sem instalar dependência — 30 asserções, incluindo o download de verdade
chegando ao disco, a medição do pacote inicial e a rota fechada sem sessão); e a
volta do arquivo **que o Chrome gravou** pelo `lerPlanilha`, preenchido e também
sujo (14 asserções). O banco terminou idêntico à linha de base, com
`foreign_key_check` vazio.

**Decisões da Tarefa 9** (não refazer sem motivo):

- **O SheetJS entra por `import()` dinâmico, e isso é medido.** A biblioteca tem
  ~1 MB; um `import` estático em componente de cliente a colocaria no pacote
  inicial de `/admin/usuarios` — tela que abre todo dia — por causa de um botão
  clicado uma vez por semestre. Conferido no navegador: nenhum pedaço acima de
  300 KB desce antes do clique, e o pedaço novo chega **no** clique. A tela não
  recarrega (`performance.getEntriesByType('navigation').length === 1`), que é o
  que o enunciado exige.
- **`gerarPlanilhaModelo` devolve `ArrayBuffer`, não `Uint8Array`.** Não é
  preferência: `XLSX.write(pasta, { type: "array" })` devolve `ArrayBuffer` — e
  os tipos publicados do pacote dizem `any`, então nada acusa. A primeira versão
  da prova leu `undefined` nos quatro primeiros bytes por isso. O perigo é o
  silêncio: um `Blob` montado sobre o valor errado é um `Blob` **válido e
  vazio**, e o arquivo chegaria com 0 byte na pasta de downloads sem uma linha
  de erro em lugar nenhum. `ArrayBuffer` é também o que os dois consumidores já
  pedem (o `Blob` e o `lerPlanilha`): conversão que não existe é conversão que
  não erra.
- **O cabeçalho não é escrito no gerador — vem de `COLUNAS_CANONICAS`,
  exportado do leitor.** Uma segunda lista pareceria idêntica hoje e divergiria
  no dia em que uma coluna mudasse de nome: o modelo geraria um arquivo que o
  próprio importador recusa, e nem `tsc`, nem `lint`, nem `build` teriam o que
  dizer. Mesmo argumento que tirou `semAcento` das actions na Tarefa 7.
- **O aviso sobre zero à esquerda não é enfeite, e o número dele foi medido.**
  Com a coluna no formato Geral, `0012345` digitado no Excel vira o número
  12345 dentro do arquivo, chega aqui como `"12345"`, **passa** na validação de
  matrícula e criaria um cadastro errado calado. O seed do projeto usa
  justamente `0012345`. Duas alternativas foram levantadas e descartadas: (a)
  não avisar nada — mantém a armadilha; (b) reservar ~200 células da coluna A
  pré-formatadas como Texto — funciona (o SheetJS comunitário escreve
  `numFmtId="49"` em célula; conferido no XML gerado), mas protege só as 200
  primeiras linhas e põe no arquivo 200 linhas em branco que o enunciado pede
  que não existam. **Formatar a coluna inteira não é possível nesta versão:** o
  estilo no elemento `<col>` é recurso pago, e o comunitário escreve ali só a
  largura — conferido, não lido na documentação.
- **`self-start` no botão, e não `items-start` no bloco.** Com o alinhamento no
  pai, o parágrafo de aviso também encolheria para o próprio conteúdo e sairia
  em uma linha larguíssima. É a mesma armadilha de `stretch` que distorceu a
  logo do login na Tarefa 5, vista do outro lado. Medido: botão de 241px em um
  cartão de 1024px.
- **O ícone de baixar é a seta na bandeja, e não a grade do `IconePlanilha`
  espelhada** — que era a forma prevista no comentário daquele ícone para um
  futuro "baixar a lista". Os dois botões vivem no mesmo cartão, e a versão
  espelhada obrigaria a distinguir importar de baixar pela direção de uma seta
  de 20px. A grade espelhada continua reservada para quando existir exportação
  de dados de verdade.
- **O download tem estado próprio (`baixando`, `erroDoModelo`), fora da máquina
  de estados da importação.** Ele não participa do ciclo analisar → confirmar;
  enfiá-lo em uma fase de `estado` faria baixar o modelo **apagar a prévia** que
  a pessoa está lendo para decidir se confirma.
- **Não há linha de exemplo abaixo do cabeçalho.** Além de o enunciado pedir
  assim, exemplo em planilha modelo é dado que alguém esquece de apagar — e
  "Ana Souza" viraria um cadastro real na primeira importação distraída.

**Tarefa 10 — Autenticação real e refatoração de domínio (concluída):** os
quatro itens de [tarefa-10-autenticacao-admin.md](tarefa-10-autenticacao-admin.md)
— `Usuario` renomeado para `Pessoa` (com `Emprestimo.pessoa_id`), a tabela
`Administrador` com senha em hash `bcryptjs`, o seed criando as quatro contas,
e o login de dois campos substituindo a senha mestre do `.env`. `tsc`, `lint` e
`build` em 0, com as cinco rotas do painel dinâmicas (`ƒ`) e `/admin/pessoas` no
lugar de `/admin/usuarios`.

A migration foi escrita à mão e ensaiada em cópia antes do arquivo real.
Verificação em cinco frentes, com o banco conferido contra a linha de base no
fim: premissas do bcrypt e do esquema de cookie por script (23 asserções);
ensaio da migration em cópia com dados realistas e em cópia com órfão plantado
(17 asserções mais a recusa da guarda); seed e preservação de senha (15);
planilha modelo indo e voltando depois da renomeação, com o arquivo sujo (22);
HTTP real contra o servidor, com doze formas de cookie forjado (42); e navegador
real por CDP, em dois roteiros — o do formulário e das cinco telas (48) e o da
fronteira exata do freio de tentativas (12).

**Decisões da Tarefa 10** (não refazer sem motivo):

- **A chave que assina o cookie é o hash bcrypt do administrador logado.** O
  enunciado mandava remover a `ADMIN_PASSWORD` e, na mesma frase, criar a sessão
  "como já estava sendo feito" — só que era justamente a senha mestre que
  assinava o cookie. Foi levantado como conflito antes de escrever código, com
  três saídas; a escolhida não põe segredo nenhum no `.env` e preserva as três
  propriedades da Tarefa 4, agora **por conta**: reiniciar o servidor não
  desloga, trocar a senha de alguém derruba a sessão daquela pessoa e só dela, e
  apagar a conta derruba na hora. Custo aceito: uma leitura de banco por
  verificação, em SQLite local, numa tela que já consulta o banco a cada render.
  As três foram exercitadas por HTTP contra o servidor de verdade.
- **O cookie carrega `id` e `nome`, os dois dentro da assinatura** — e o nome
  exibido vem do banco, não da carga. Estar assinado é o que impede trocar
  "Secretaria" por outra coisa no navegador; vir do banco é o que faz um nome
  corrigido no seed aparecer sem a pessoa precisar sair e entrar.
- **A migration foi escrita à mão, e a automática era destrutiva.** O que o
  `prisma migrate diff` propôs para este mesmo schema foi `DROP TABLE "Usuario"`
  seguido de um `INSERT` na nova `Emprestimo` **sem a coluna `pessoa_id`**. Para
  o gerador não existe "renomear tabela": uma sumiu e outra apareceu. O segundo
  defeito é o pior, por ser silencioso ao contrário — com empréstimos na tabela
  ele estoura no NOT NULL e a migration falha; **sem** empréstimos ele passa, e
  o que se perdeu (os cadastros) já se perdeu na linha de cima sem erro nenhum.
- **A migration começa por uma guarda que a faz falhar com o banco intacto.**
  Uma `CREATE TEMPORARY TABLE` com `CHECK (orfaos = 0)` antes de qualquer coisa
  destrutiva. É `TEMPORARY` porque o Prisma **não** envolve migration de SQLite
  em transação (os `PRAGMA` não rodam dentro de uma) — uma tabela comum
  sobreviveria à reprovação e apareceria no banco de quem foi só conferir.
  Exercitada nos dois sentidos: cópia limpa passa, cópia com um empréstimo órfão
  plantado é recusada com `CHECK constraint failed` e o banco fica como estava.
- **O `id` do `Emprestimo` é copiado explicitamente na migration.** Ele é a
  chave que a Fila de Devoluções endereça ("confirmar o recebimento do
  empréstimo 42"); deixar o `AUTOINCREMENT` renumerar trocaria o alvo de
  qualquer tela aberta no momento da migração.
- **O seed cria o administrador que falta e NÃO toca na senha do que já
  existe.** Mesma regra do `status` da pessoa e do equipamento: campo que a
  origem não menciona é campo que o banco preserva. Sem isso, rodar `db:seed`
  para importar a planilha de segunda-feira devolveria as quatro senhas ao
  padrão sem ninguém pedir. O `nome`, esse, continua sendo atualizado — ele
  **está** no seed. Provado: senha trocada à mão sobrevive à ressemeadura, e o
  nome corrigido volta ao valor do seed.
- **Recuperar senha esquecida é apagar a linha no `db:studio` e ressemear.** É a
  consequência direta de o enunciado não querer CRUD de administrador. Ficou
  escrito no `README` e no comentário do `schema.prisma`, porque é o tipo de
  coisa que ninguém deduz sob pressão.
- **O freio de tentativas é por login digitado, não global.** Com senha única
  (até a Tarefa 9) não havia escolha; com quatro contas, um contador global faz
  uma pessoa desastrada no teclado trancar o painel para as outras três. O custo
  aceito é que revezar entre quatro logins dá quatro vezes mais tentativas por
  minuto — vinte por minuto continua intratável para qualquer dicionário numa
  rede fechada. A fronteira foi medida no navegador: **a quinta falha ainda
  responde "inválidos" e é ela que arma o bloqueio; a sexta é a primeira
  barrada**, e nesse intervalo a senha certa também não passa.
- **O mapa do freio tem teto (`MAXIMO_DE_LOGINS_VIGIADOS`).** Sem ele, um POST
  com um login diferente a cada requisição faria o mapa crescer sem fim — o
  contador que existe para conter abuso viraria o vetor. Ao encher, esvazia.
- **"Usuário ou senha inválidos" é uma frase só, e o tempo também.** Dizer qual
  metade errou entrega a metade cara de descobrir. O tempo é igualado por um
  `HASH_DE_ISCA` — um bcrypt válido contra o qual o caso "conta não existe"
  também paga o `compare`. Medido: isca 198ms contra 193ms do caminho real
  (1,03x); uma string que **não** é hash custa 0ms, que é o vazamento de 1000x
  que a isca fecha. Um hash inválido escrito ali por engano seria um oráculo
  silencioso.
- **bcrypt custo 10, e o número foi medido nesta máquina:** ~209ms para gerar e
  ~159ms para conferir. O `bcryptjs` é JavaScript puro, e o custo 12 subiu para
  ~630ms — caro demais para uma tela que a secretaria abre várias vezes por dia,
  sem ganho proporcional numa rede fechada que já tem freio de tentativas.
  Também conferido: **bcrypt trunca em 72 bytes** (uma senha de 72 caracteres
  valida contra uma entrada de 81), e `compare` contra hash corrompido devolve
  `false` em vez de lançar — uma linha estragada no banco recusa o login em vez
  de derrubar a tela.
- **A barra lateral mostra o nome de quem entrou, no lugar do "Secretaria" que
  era fixo.** É o motivo declarado da tarefa (responsabilização) aparecendo na
  tela: com senha única, quem estava de pé no balcão não sabia sequer com qual
  conta o navegador ficou aberto desde o turno anterior.
- **O campo do login não vem do `CAMPO` de `Campo.tsx`.** Aquele traz
  `border-borda` fixo, e pintar a borda de vermelho por cima seria somar duas
  utilidades da mesma propriedade — no Tailwind 4 quem vence é a ordem no CSS
  gerado, não a ordem no atributo. É a armadilha já registrada para os tamanhos
  do `Botao` e para o recuo do `CAMPO_SEM_LADOS`. Aqui a cor da borda é
  escolhida uma vez, em `campoDoLogin(comErro)`, e não corrigida depois.
- **O erro do login continua inline, e agora há um campo a mais disputando a
  altura.** Medido de novo no navegador: com o segundo campo, o "Entrar" termina
  em 568px sem erro e 618px com erro, contra os 536/566 da Tarefa 5 — ainda
  dentro dos 768px de um notebook pequeno. Um cartão de `Alerta` (~125px) o
  jogaria para fora.
- **`existeAdministrador()` só é consultado no caminho de quem NÃO entrou.** É a
  pergunta "o sistema foi instalado?", e fazê-la a cada render do painel seria
  uma consulta por acesso para uma resposta que só interessa à tela de login. É
  ela que substituiu o antigo aviso de `ADMIN_PASSWORD` ausente, agora dizendo o
  comando que resolve (`npm run db:seed`).
- **O CSV do seed virou `pessoas.csv`, e `usuarios.csv` continua sendo aceito**
  (com aviso no console), assim como `USUARIOS_CSV` ao lado de `PESSOAS_CSV`. O
  arquivo real está no `.gitignore` e mora na máquina da secretaria, onde
  ninguém vai renomeá-lo por causa de um commit — sem o atalho, o seed não
  acharia a planilha, cairia nos quatro registros de exemplo e **não daria erro
  nenhum**. A falha apareceria semanas depois, como um aluno "não cadastrado".
- **A aba interna da planilha modelo virou "pessoas", e isso é seguro porque o
  leitor pega `SheetNames[0]`** — planilha de coordenação vem com o nome que o
  Excel deu ("Planilha1", "Sheet1"). Conferido com a ida e volta completa, e com
  o arquivo sujo.
- **O login ignora caixa e espaços em volta, e isso saiu de um defeito
  medido.** O `=` do SQLite é sensível à caixa e o campo da tela normaliza para
  minúsculas; como a única forma de acrescentar uma conta neste MVP é digitando
  no `db:studio`, uma linha gravada como "Coordenacao" existia na tabela,
  aparecia no Studio, e **não havia nada que se pudesse digitar na tela para
  entrar com ela**. Nenhuma das duas camadas estava errada sozinha — o defeito
  morava no acordo entre elas, que é a classe que nem tipo, nem lint, nem build
  pegam. Achado pela pergunta do pré-voo ("o valor mais esquisito que dá para
  gravar aqui passa em quem lê?") e provado no navegador, com três grafias.
  O caminho rápido continua sendo o `findUnique` no índice; a varredura só roda
  quando ele erra, e a tabela tem unidades de linhas.
- **`TelaSenha` virou `TelaLogin`.** Um componente chamado "tela de senha" com
  dois campos manda a próxima pessoa procurar o campo que falta.

**Tarefa 11 — Controle de sessão e perfil do admin (concluída):** os dois itens
de [tarefa-11-sessao-e-perfil.md](tarefa-11-sessao-e-perfil.md) — o Logout com o
nome de quem está logado e o modal "Alterar senha" com os três campos, validado
por `bcryptjs.compare` e gravado com `bcryptjs.hash`. `tsc`, `lint` e `build` em
0, com as cinco rotas do painel dinâmicas (`ƒ`).

**O item 1 já existia desde a Tarefa 10 e não foi reimplementado.** O verbo do
enunciado era "garanta que exista", que é dúvida declarada e não mudança pedida:
`sairDoAdmin` já apagava o cookie e redirecionava, e o nome já aparecia na barra.
O que mudou foi só o arranjo — ver a primeira decisão abaixo.

Verificação em quatro frentes, com o banco comparado com a linha de base no fim:
premissas do bcrypt e da assinatura do cookie por script, em cópia do `dev.db`
(17 asserções); HTTP real contra o servidor de produção, com cookie ausente,
forjado e legítimo (31); navegador real por CDP, cobrindo login, modal, os cinco
erros, o sucesso e a volta (41); e a medida da faixa horizontal abaixo de `lg`
(16). Mais a prova do caminho de recuperação documentado — apagar a linha e
ressemear — em cópia.

**Decisões da Tarefa 11** (não refazer sem motivo):

- **Trocar a senha derruba a própria sessão, e por isso a action reemite o
  cookie.** A chave que assina o cookie é o hash bcrypt da conta (decisão da
  Tarefa 10): gravar um hash novo é, por construção, trocar a chave. Sem o
  `criarSessao` no fim de `alterarSenha`, a pessoa seria expulsa para o login
  **antes** de ver o aviso de sucesso, e a leitura natural disso é "deu erro" —
  o enunciado pede exatamente o contrário ("exiba uma notificação de sucesso e
  feche o modal"). Medido em cópia do banco antes de virar desenho: dois
  `bcrypt.hash` da mesma senha dão hashes diferentes, a assinatura antiga para
  de bater, a refeita bate. **O efeito colateral joga a favor e é o motivo
  declarado da sprint:** a mesma conta aberta em outro computador cai na
  requisição seguinte — trocar a senha é o gesto que expulsa quem ficou logado
  na máquina do turno anterior. Exercitado por HTTP: cookie velho volta para o
  login, cookie novo continua no painel.
- **O teto da senha é de 72 bytes, e não de caracteres.** O bcrypt trunca em 72
  bytes e ignora o resto **em silêncio**. Um `maxLength={72}` no `<input>`
  contaria caracteres: 40 letras acentuadas são 40 caracteres e 80 bytes, então
  passariam — gravando o hash do pedaço e deixando valer uma senha mais curta do
  que a escolhida, sem erro em lugar nenhum. Por isso não há `maxLength` no
  campo e a conta é feita no servidor, com `TextEncoder`. Medido: `"á"` custa 2
  bytes, um emoji custa 4, e uma senha de 73 caracteres valida contra o hash dos
  72 primeiros.
- **Identidade e ação moram no mesmo bloco, no pé da barra.** O nome ficava
  embaixo da marca desde a Tarefa 10 e desceu para junto dos dois botões. A
  pergunta que a sprint existe para responder é "quem está logado neste
  computador, e como eu troco isso?", e ela se responde melhor com as três
  coisas juntas — que é também o que o enunciado pede ao pé da letra ("botão de
  Sair acompanhado do nome do administrador logado"). O "Sair" no canto superior
  das telas estreitas sumiu junto: agora o bloco inteiro vai depois da navegação
  nos dois layouts. Custo medido: a faixa horizontal abaixo de `lg` passou a
  364px de altura em 900px de largura, sem rolagem horizontal em nenhuma das
  sete larguras conferidas.
- **`ContaDoAdmin` é uma ilha só, montada uma vez.** Duas cópias do bloco (uma
  para a coluna, outra para a faixa) dariam dois `<dialog>` no documento, e um
  `showModal()` no elemento errado abre um diálogo vazio. Quem se adapta é o
  `flex`, não a quantidade de componentes.
- **O modal é montado sob condição, e não renderizado sempre com
  `aberto={false}`.** Componente que devolve `null` **não** desmonta: continua
  na árvore, e o estado junto. Com o modal sempre montado, o "Senha atual
  incorreta" de ontem estaria esperando na próxima abertura — e a tentativa de
  limpar isso num efeito é justamente o que o `react-hooks/set-state-in-effect`
  recusa (a lint pegou). Montar sob condição resolve os dois de uma vez e leva
  embora, de quebra, os três campos de senha do documento.
- **O `<form>` do modal NÃO é um `action` de servidor**, ao contrário do login.
  O React 19 limpa o formulário sozinho quando uma action de formulário termina
  — inclusive quando ela termina em erro. Com senha isso é cruel: quem errou a
  confirmação teria de redigitar os três campos. A action é chamada à mão dentro
  de `useTransition`, e o erro aparece com o que foi digitado ainda na tela.
  Conferido no navegador: depois da recusa, os três campos seguem com 9, 10 e 11
  caracteres.
- **O freio da "Senha atual" é um mapa separado, chaveado pelo `id` da conta.**
  Dentro do painel não existe login digitado — a sessão só carrega `id` e
  `nome`. E compartilhar o mapa do login juntaria as duas contagens debaixo de
  uma chave de texto onde um login gravado à mão no `db:studio` poderia colidir.
  O freio existe porque "Senha atual" é uma verificação de senha de graça para
  quem senta num navegador deixado logado: essa pessoa já tem o painel, o que
  ela **não** tem é acesso persistente — e adivinhar a senha atual daria isso,
  além de trancar o dono para fora. Medido por HTTP, a mesma fronteira da Tarefa
  10: a quinta falha responde "incorreta" e arma o bloqueio, a sexta é a
  primeira barrada, e nesse intervalo nem a senha certa passa.
- **Só a senha atual errada conta falha no freio.** Errar a confirmação ou
  escolher uma senha curta é engano de digitação, não tentativa de adivinhação;
  contar esses bloquearia a pessoa fora da própria conta por desastre no teclado.
- **A regra da senha nova é só comprimento: mínimo de 8.** O enunciado não define
  nenhuma. Exigir também número e símbolo criaria quatro maneiras de a troca ser
  recusada para quem está de pé no balcão, numa rede local fechada que já tem
  freio — e não existe "esqueci minha senha" neste MVP, então cada recusa a mais
  é um passo a mais rumo ao `db:studio`. Foi levantado como decisão antes de
  escrever código.
- **O modal diz as duas consequências antes do clique, não depois.** Que a conta
  cai nos outros computadores (é ferramenta, não susto) e que não há recuperação
  pela tela. A segunda é a resposta da varredura de reversibilidade: o caminho de
  volta é apagar a linha no `db:studio` e ressemear — exercitado nesta sessão em
  cópia, com a conta recriada validando `Mudar@123`.
- **`CUSTO_BCRYPT` mudou de dono para [senha.ts](src/lib/senha.ts).** Estava só
  no `prisma/seed.ts`; com o painel também gerando hash, seriam duas constantes
  de mesmo nome em arquivos diferentes — duas regras assim que uma fosse
  ajustada. O módulo é neutro de propósito (não importa `next/headers`, nem o
  Prisma, nem `Buffer`), o que o deixa ser lido pelo `tsx` no terminal, pelo
  servidor e pelo navegador, que precisa do mínimo para escrever a dica embaixo
  do campo.
- **`campoComErro` subiu do `TelaLogin` para o `Campo.tsx`.** Mesmo argumento, e
  a segunda cópia teria nascido nesta tarefa. A função não deriva do `CAMPO`
  porque aquele traz `border-borda` fixo, e pintar a borda de vermelho por cima
  seria somar duas utilidades da mesma propriedade — a armadilha de ordem do
  Tailwind 4 já registrada. O login foi medido de novo depois da extração, e
  continua cabendo: o "Entrar" termina em 599px sem erro e 629px com erro, em
  uma janela de 768px.
- **O aviso de sucesso nomeia a conta** ("Senha da conta Secretaria alterada").
  São quatro contas e um computador só — "Senha alterada" sem o nome é
  justamente a frase que não resolve a dúvida que a sprint existe para resolver.

**Tarefa 12 — Auditoria de baixa física (concluída):** os dois itens de
[tarefa-12-auditoria-devolucao.md](tarefa-12-auditoria-devolucao.md) — o campo
`Emprestimo.data_baixa` (`DateTime?`) e o preenchimento dele na confirmação de
recebimento do painel. `tsc`, `lint` e `build` em 0, com as cinco rotas do painel
dinâmicas (`ƒ`). A migration foi gerada com `--create-only`, lida (é um
`ALTER TABLE ADD COLUMN` puro, sem reconstrução de tabela) e ensaiada em cópia do
`dev.db` antes do arquivo real — 9 asserções, com os 7 ids preservados e
`foreign_key_check` vazio. Verificação por HTTP real contra o servidor de
produção, com o login feito pela via sem JavaScript: 30 asserções cobrindo o
ciclo avulso, o lote, a baixa repetida e as duas actions sem cookie de sessão. O
banco foi devolvido à linha de base item a item.

**Decisões da Tarefa 12** (não refazer sem motivo):

- **A baixa deixou de sobrescrever `data_devolucao`, e essa é a mudança que a
  tarefa de fato exigia.** O enunciado só pedia o campo novo, descrevendo
  `data_devolucao` como "quando o aluno clica em devolver no tablet" — o que era
  verdade até a secretaria dar baixa, porque `darBaixa` regravava o campo com o
  próprio instante (decisão da Tarefa 4, quando havia um campo de data para dois
  eventos). Aplicado ao pé da letra, `data_baixa - data_devolucao` daria ~0 ms
  para sempre: a métrica de gargalo nasceria morta, e nada acusaria — o tipo está
  certo, a coluna existe, o valor é gravado, e o relatório traria zeros
  plausíveis. Levantado como conflito antes da primeira edição; a decisão de
  remover a sobrescrita foi do usuário. Medido depois: com 1500 ms entre a
  declaração e a baixa, o intervalo gravado foi 1564 ms.
- **Nenhuma tela mudou, e isso foi conferido.** `listarFilaDeDevolucoes` é o
  único lugar que lê `data_devolucao`, e só de linhas `AGUARDANDO_BAIXA` — que
  são justamente as que ainda não passaram pela baixa. Não existe tela de
  histórico de `CONCLUIDO`, então a mudança não tem efeito visível hoje. Por isso
  o degrau do navegador foi **pulado de propósito**: a tarefa não tocou em
  formulário nem em diálogo, e o diff não tem uma linha de componente.
- **Os 6 empréstimos concluídos antes da Tarefa 12 ficam com `data_baixa` nula.**
  A `data_devolucao` deles é, comprovadamente, o instante da baixa (`darBaixa`
  era o único caminho até `CONCLUIDO`), então copiar seria transferir um valor
  verdadeiro — e é justamente por isso que não se copia: o intervalo resultante
  seria zero, e seis prateleiras instantâneas que ninguém mediu entrariam em
  qualquer média futura como se tivessem sido. Nulo se exclui sozinho do cálculo.
  Mesma família da regra "campo que a origem não menciona é campo que o banco
  preserva".
- **`data_baixa` é gravada só no `darBaixa`, que é o ponto único das duas telas.**
  A baixa avulsa e a "Confirmar Todas as Devoluções" passam pela mesma função, e
  foi o que evitou a segunda cópia da regra. Exercitado nos dois caminhos.
- **A baixa repetida não reescreve `data_baixa`.** Cai de graça do `updateMany`
  filtrado por `status: AGUARDANDO_BAIXA` que já existia contra duplo-clique, mas
  agora tem uma consequência a mais: o carimbo de auditoria é imutável depois de
  posto. Exercitado — a segunda chamada é recusada e o valor não muda.

**Tarefa D01 — Congelar a v1.0 e criar o estado de demonstração (concluída):**
a primeira da **série de documentação** (`tarefa-doc-NN`, regida pela
[spec-wiki.md](spec-wiki.md)), e a única dela que mexe fora de `docs/`. Entrega
a tag anotada `v1.0`, o `prisma/demo-estado.ts` com o atalho `npm run db:demo`, e
a seção "Documentação" do [CONTRIBUTING.md](CONTRIBUTING.md), que até aqui tinha
0 byte. `tsc` e `lint` em 0.

Verificação em quatro frentes: as premissas por script contra o ambiente real
(10 asserções); a idempotência por execução dupla com comparação estrutural do
banco (idêntica, mais 6 asserções sobre a estratégia de `upsert`); as travas
exercitadas até **recusarem** (4, com o banco intacto depois); e navegador real
por CDP, cobrindo portal, fila, inventário e pessoas (31 asserções). O `dev.db`
foi copiado antes da primeira escrita e restaurado ao estado da linha de base no
fim.

**Decisões da Tarefa D01** (não refazer sem motivo):

- **A tag `v1.0` aponta para o HEAD da `main`, e a `main` está 3 commits à
  frente do remoto.** O enunciado pedia "confirme que a `main` está sincronizada
  com o remoto", o que só se resolveria com um `push` — que o ciclo do projeto
  proíbe por conta própria. Conferido antes de decidir: os 3 commits não
  publicados tocam **só arquivos `.md`** (a spec da wiki, os 14 enunciados e o
  ponteiro no AGENTS.md), zero linha de código de produto. O estado do produto em
  `v1.0` é, portanto, idêntico ao do último commit publicado. A tag **não foi
  publicada** — `git push --tags` é decisão do dono do repositório.
- **`db:reset` NÃO roda o seed sozinho neste Prisma 7, e isso foi medido.** No
  Prisma 6 rodava, e a memória de treino diz que roda. Medido aqui: depois do
  reset, todas as tabelas ficam com zero linha. É por isso que a receita do
  CONTRIBUTING tem três passos e o segundo não é redundante — se alguém "limpar"
  a receita achando que o `db:seed` sobra, o `db:demo` seguinte quebra na primeira
  chave estrangeira.
- **A trava do `db:demo` é dupla, e a segunda é a que importa.** O enunciado
  pedia só "recusar se `prisma/data/pessoas.csv` existir". Levantado como conflito
  antes de escrever código: desde a Tarefa 8 a porta principal de dado real é a
  importação de `.xlsx` pelo `/admin/pessoas`, que **não deixa arquivo nenhum no
  disco** — a trava de arquivo protege exatamente a porta que deixou de ser a
  principal. Somou-se a isso que o seed ainda aceita o nome legado
  `usuarios.csv`, que o enunciado não menciona. A segunda trava conta os cadastros
  que o script não reconhece e recusa acima de 4. A decisão foi do dono do
  repositório.
- **O teto de 4 é um número, e não uma cópia das quatro matrículas de exemplo.**
  Copiar os valores do `PESSOAS_EXEMPLO` criaria a segunda lista que diverge em
  silêncio — o argumento que já tirou `semAcento` das actions na Tarefa 7. Um
  número não tem como divergir em valor: se o conjunto de exemplo crescer, o
  script recusa e diz o que fazer. Medida a fronteira: num banco `reset+seed+demo`
  os "não reconhecidos" são exatamente os 4 do seed e o script **passa**; um
  cadastro a mais e ele **recusa**.
- **O `db:demo` restaura o cenário; o `db:seed` preserva a edição. A inversão é
  deliberada.** No seed, campo que a origem não menciona é campo que o banco
  preserva, porque os dados são da secretaria. Aqui os dados são cenário de
  captura: depois de clicar nos botões testando uma tela, rodar de novo tem que
  devolver o enquadramento. Exercitado — dar baixa pela tela, reativar a pessoa
  inativa e liberar o equipamento, e a re-execução desfaz os três (inclusive
  limpando a `data_baixa` residual, que é por que o `update` grava `null`
  explícito em vez de `undefined`).
- **A idempotência se apoia em id explícito numa faixa reservada (9001+), porque
  `Emprestimo` não tem chave natural** — duas retiradas do mesmo item pela mesma
  pessoa são dois registros legítimos. Conferido nesta máquina antes de virar
  desenho: id explícito é aceito em PK autoincrement, e `createMany` com
  `skipDuplicates` **não existe** no SQLite do Prisma 7, então não havia atalho.
  Efeito colateral conhecido: a sequência do SQLite passa a contar de 9011; em
  banco de captura não aparece, porque nenhuma tela exibe o id do empréstimo.
- **"O mesmo estado" quer dizer a mesma estrutura, não os mesmos
  milissegundos.** Os três carimbos de tempo são recalculados a cada execução, de
  propósito: a fila precisa dizer "há 3 h" na captura tirada hoje e na tirada em
  novembro. Datas fixas dariam idempotência byte a byte e uma wiki cujas telas
  dizem "há 87 dias". A verificação compara a estrutura — pessoas, vínculos e
  status —, que sai idêntica.
- **O `EMPRESTADO` do equipamento é derivado dos empréstimos, não escrito numa
  lista à parte.** Duas listas discordariam no dia em que alguém mexesse numa só,
  e o resultado seria um cenário impossível — empréstimo aberto apontando para
  item "disponível" — fotografado e publicado como se fosse o comportamento do
  sistema. O script também recusa se uma etiqueta aparecer ao mesmo tempo num
  empréstimo aberto e na lista de fora de circulação.
- **O `demo-estado.ts` não toca na tabela `Administrador`, e a regra virou
  procedimento de captura.** O critério do enunciado ("nenhum nome real em
  `db:studio`") não é alcançável sem alterar o `prisma/seed.ts`, que o próprio
  enunciado proíbe — duas das quatro contas são de pessoas reais. Levantado como
  conflito; a decisão foi capturar sempre logado como `secretaria`, a conta
  neutra, e registrar isso no CONTRIBUTING. Reescrever os nomes pelo demo criaria
  dois donos para o mesmo campo, e o próximo `db:seed` devolveria os reais em
  silêncio. Exercitado no navegador: nenhuma das telas do painel mostra
  "Jeanzão" nem "Viccenzo" quando se entra como `secretaria`.
- **O elenco tem casos escolhidos, não variedade.** Ana Souza leva dois itens
  porque o "Devolver tudo" e o "Confirmar Todas as Devoluções" só nascem a partir
  de dois (Tarefa 5) — com um item só, as duas telas não teriam o botão que a
  wiki precisa fotografar. Larissa é inativa **e** está na fila, que é a regra
  assimétrica da Tarefa 8 em imagem. "João Pedro de Almeida" carrega a partícula
  minúscula da 8.1, e "Direito"/"Administração" são o curso fora do mapa que é
  mantido. Os três `CONCLUIDO` têm 6 h, 20 h e 48 h de prateleira, porque
  `data_baixa` colada na `data_devolucao` daria zero e não haveria métrica da
  Tarefa 12 para mostrar.
- **O nome do arquivo é `demo-estado.ts`, e a §6 da spec-wiki foi corrigida.**
  Ela dizia `seed-demo.ts` e o enunciado dizia `demo-estado.ts` — dois donos para
  o mesmo nome. Venceu o enunciado, por ser mais específico, e o nome lê melhor:
  não é um segundo seed, é uma camada de estado por cima do seed.
- **O `dev.db` desta máquina estava com a migration da Tarefa 8.1 por aplicar**
  (o `perfil` ainda gravado como "ALUNO"), o que é anterior a esta tarefa. A
  receita `reset + seed + demo` resolveu junto, porque parte das migrations.

**Tarefa D02 — Esqueleto do MkDocs, bilíngue e publicação automática
(concluída, menos o passo que é do dono do repositório):** o site vazio no ar,
com os quatro itens de
[tarefa-doc-02-esqueleto-mkdocs.md](tarefa-doc-02-esqueleto-mkdocs.md) — o
`docs-requirements.txt` com as três ferramentas fixadas, o `mkdocs.yml` com a
paleta da marca e as seis extensões que o template da D03 pede, o
`mkdocs-static-i18n` em estrutura de pasta (PT na raiz, EN em `docs/en/`), as
15 páginas do `nav` da §4 da spec-wiki, e o
[.github/workflows/docs.yml](.github/workflows/docs.yml) publicando com `mike`.
`mkdocs build --strict` em 0.

**A autorização da Unoesc chegou antes desta tarefa** (2026-08-24, confirmada
pelo dono do repositório), então o plano B da §8 — instituto fictício neutro —
não foi usado: o site nasceu com o nome real, a logo no cabeçalho e a nota de
crédito no rodapé. A §8 da spec-wiki foi atualizada.

Verificação em cinco frentes: a stack instalada de verdade num ambiente novo
(Python 3.14.0); o `site/` gerado, conferido por script (45 asserções); as seis
extensões de markdown renderizadas contra o próprio `mkdocs.yml` (8); o `mike`
ensaiado num repositório descartável **sem remoto e sem `--push`**, do deploy à
re-execução e ao `mike delete`; e navegador real por CDP contra a árvore
`gh-pages` que o ensaio produziu, servida por HTTP (26 asserções). Mais o
`mkdocs serve` exercitado nas seis rotas. Nada saiu desta máquina.

**O que NÃO foi feito, e por quê:** o Pages do repositório **não** foi
configurado para servir da `gh-pages`. É ajuste no GitHub, a branch só nasce no
primeiro deploy, e o ciclo do projeto reserva o `push` ao dono. O passo a passo
(cliques e o `gh api` equivalente) está na seção "Documentação" do
`CONTRIBUTING.md`. Pelo mesmo motivo, os dois últimos itens da verificação do
enunciado — "a Action conclui em verde" e "a URL do Pages responde" — **não
foram vistos acontecer** e continuam pendentes.

**Decisões da Tarefa D02** (não refazer sem motivo):

- **A paleta do sistema INVERTE de papel entre o modo claro e o escuro, e isso
  foi medido.** A regra dos dois verdes continua valendo, só que o verde que
  serve muda com o fundo: `#3aaa35` dá 3,01:1 no branco (reprova) e 5,40:1 no
  fundo escuro do tema (passa); `#1f7a1b` dá 5,44:1 no branco e 2,98:1 no
  escuro. Por isso `--md-accent-fg-color` tem valor diferente em cada esquema
  em vez de um só. Trocá-los de lugar reprova nos dois modos ao mesmo tempo.
- **O link no modo escuro precisa de um tom que não existia na paleta do
  sistema, e omiti-lo seria um defeito silencioso.** No esquema `slate` o
  Material define `--md-typeset-a-color: var(--md-primary-fg-color)` — lido no
  `palette.css` do tema instalado, não suposto —, e o azul da marca sobre o
  fundo escuro dá **1,38:1**: link invisível, sem erro em lugar nenhum. O tom
  novo é o mesmo azul com a luminosidade subida na escala oklch da marca
  (`oklch(75% 0.13 255.2)` = `#74b1ff`, 7,26:1 medido no navegador).
- **A logo é achatada para branco no cabeçalho, por CSS.** O arquivo tem
  exatamente duas cores sobre transparência — 18,2% dos pixels em `#023770` e
  13,0% em `#3aaa35`, contados no PNG. Sobre o cabeçalho azul a parte azul daria
  1,0:1 e sumiria: some justamente o nome, que é a maior das duas áreas. O
  arquivo em cores continua intacto para o corpo da página (D11).
- **`navigation.instant` está proibido nesta wiki.** O `mkdocs-static-i18n`
  emite um aviso dizendo que o link contextual do seletor de idioma não funciona
  com ele — e sob `--strict` aviso derruba o build. Conferido na fonte do plugin
  (`reconfigure.py`), não lido na documentação. Ligar a opção quebra a exigência
  de o seletor manter a página.
- **`fallback_to_default` é o que faz o seletor de idioma manter a página.** Com
  só a home em inglês, sem ele o `/en/` teria uma página e o seletor jogaria o
  leitor na home a partir de qualquer outra. Com ele, o `/en/` constrói a árvore
  inteira com o conteúdo em português e o menu traduzido, e a troca de idioma
  preserva a rota. Exercitado no navegador nos dois sentidos, em página funda.
- **A busca declara `lang: [pt, en]` à mão.** O plugin de i18n só acrescenta
  idioma que o lunr.js conhece, e o lunr indexa por código de duas letras: com
  `pt-BR` ele responde "não suportado" e a busca em português perde a
  radicalização. Conferido: a lista do lunr instalado tem `pt` e não tem
  `pt-BR`, e a reconfiguração do plugin **acrescenta** à lista em vez de
  substituí-la — por isso declarar não conflita.
- **O `mkdocs build --strict` é um passo próprio do workflow, antes do
  `mike`.** O `mike deploy` roda o build por dentro mas **não aceita
  `--strict`** (conferido em `mike deploy --help`): sem o passo separado, link
  quebrado viraria aviso silencioso e o site subiria com ele — exatamente o
  passivo que o enunciado manda não deixar para a D13.
- **O padrão do `mike` aponta para a `v1.0` literal, e não para um alias
  móvel.** Segue a letra do enunciado. O custo é conhecido e está escrito no
  CONTRIBUTING: quando a Tarefa 13 virar `v1.1`, alguém roda `mike set-default
  v1.1` de propósito — em vez de a raiz do site mudar sozinha debaixo de quem
  guardou o link.
- **O workflow aceita execução manual (`workflow_dispatch`), e isso não é
  enfeite.** O Pages só pode ser apontado para a `gh-pages`, e ela só nasce no
  primeiro deploy: sem o disparo manual, criar a branch exigiria um commit de
  mentira em `docs/`. Ele também é o caminho de republicação depois de um
  deploy ruim.
- **O `docs-requirements.txt` entra nos caminhos que disparam o workflow**, além
  dos três que o enunciado lista. Sem ele, subir a versão do MkDocs nunca
  republicaria o site — o build de amanhã seria outro e ninguém veria.
- **`concurrency` sem `cancel-in-progress`.** Dois deploys disputando a
  `gh-pages` fariam o segundo perder; mas cancelar o que está em andamento
  deixaria a branch num estado que ninguém escolheu, no meio de um push.
- **Ative o ambiente Python; não chame os executáveis pelo caminho.** O `mike`
  roda o MkDocs como subprocesso pelo nome `mkdocs`, resolvido pelo `PATH`.
  Chamar `.venv-docs/Scripts/mike.exe` sem ativar faz ele encontrar um `mkdocs`
  global de outro Python e falhar com *"The `mike` plugin is not installed"* — a
  mensagem culpa o plugin, e o culpado é qual `mkdocs` rodou. Aconteceu nesta
  máquina, que tem um MkDocs solto no Python 3.13.
- **O `mkdocs serve` abre em `/sistema-emprestimo-equipamentos/`, não em `/`.**
  O `site_url` tem esse prefixo porque é onde o Pages publica, e o servidor de
  desenvolvimento o respeita. Pedir `/` devolve 302 — não é erro, e custou um
  diagnóstico até ficar escrito.
- **O `docs/en/` repete os nomes de pasta do português**, inclusive os
  acentuados no rótulo e sem acento no arquivo. Traduzir nome de diretório
  quebraria o pareamento do plugin e o seletor perderia a página. Quem traduz é
  `nav_translations`, no `mkdocs.yml`.
- **`docs/contribuir/` não entrou no `nav`.** Ele está na §6.2 da spec-wiki mas
  não na árvore da §4, e o enunciado manda usar a §4. Quem decide se o guia de
  estilo é página publicada ou nota de trabalho é a D03.
- **O `eslint.config.mjs` precisou ignorar `.venv-docs/` e `site/`, e isso não
  era opcional.** Estar no `.gitignore` não basta: o ESLint 9 de configuração
  plana **não lê o `.gitignore`**. Sem as duas linhas ele varre o JavaScript
  que vem dentro do MkDocs Material e o do site gerado, e o `npm run lint`
  passa de 0 para 2252 problemas em código que não é nosso — medido, foi assim
  que apareceu. Quem "limpar" essas linhas quebra o portão do projeto sem tocar
  em uma linha de código do sistema.
- **Diretório vazio não foi criado.** `docs/assets/images/`,
  `docs/assets/diagramas/` e `docs/processos-fonte/` estão na §6.2, mas o Git não
  versiona diretório vazio: criá-los agora só deixaria pasta local que não
  chega em commit nenhum. Nascem com o primeiro arquivo (D04/D05).

**Tarefa D03 — Guia de estilo, template de processo e glossário base
(concluída):** os quatro itens de
[tarefa-doc-03-guia-de-estilo-e-template.md](tarefa-doc-03-guia-de-estilo-e-template.md)
— o [guia de estilo](docs/contribuir/guia-de-estilo.md) com as sete regras da §7
da spec-wiki em pares de certo e errado, o
[template de processo](docs/contribuir/template-processo.md) com as oito seções
da §5 comentadas uma a uma, o [glossário](docs/referencia/glossario.md) com os
quatorze verbetes exigidos mais "cadastro inativo" e "fila de devoluções", e o
[.vale.ini](.vale.ini) com o vocabulário em `.vale/styles/`. Nenhuma página de
processo foi escrita — não era desta tarefa.

`mkdocs build --strict` e `vale docs/` em 0, com as três páginas no `nav` e
servindo 200 por HTTP. Verificação em 40 asserções, com linha de base de `docs/`
antes da primeira escrita e comparação no fim: os dois portões, as três páginas
geradas e linkadas, os quatorze verbetes conferidos pelo `id` gerado, o template
copiado para `docs/painel/` construindo com as oito seções, e a **recusa** do
Vale em um arquivo descartável com as quatro formas proibidas. Mais o servidor
real, onde a rota antiga responde 404 e o seletor de idioma mantém a página
funda.

**Decisões da Tarefa D03** (não refazer sem motivo):

- **"Aluno" saiu do vocabulário da wiki; quem retira equipamento é
  "estudante".** A spec-wiki dizia "Aluno/Professor" em §3.1, §3.2 e na árvore
  da §4, e o `nav` da D02 tinha nascido assim — mas a interface diz **Estudante**
  desde a Tarefa 8.1, que trocou o termo no painel inteiro "para manter a coesão
  visual", e é esse o valor de `Pessoa.perfil`. Nascer com duas palavras para a
  mesma coisa é exatamente o que esta tarefa existe para impedir. Levantado como
  conflito antes da primeira edição; a decisão foi do dono do repositório. O item
  do `nav`, o arquivo `inicio-rapido/estudante-e-professor.md`, a
  `nav_translations` e **as oito ocorrências na spec-wiki** foram corrigidos
  juntos, para não ficarem dois donos da mesma regra.
- **`docs/contribuir/` entrou no `nav`, e a §4 da spec-wiki foi atualizada.** A
  D02 deixou a decisão explicitamente em aberto. Quem decidiu foi a §6.2: tudo
  que mora em `docs/` vira página publicada, e nota de trabalho vai para o
  `CONTRIBUTING.md`, fora do site. Quem escreve a próxima página precisa do guia
  e do template abertos ao lado — mandar essa pessoa clonar o repositório para
  ler uma regra de redação é pedágio sem motivo. A seção fica por último: não
  serve a quem veio operar o sistema.
- **O Vale não entra no `docs-requirements.txt`, e não é distração:** ele é um
  binário Go de ~44 MB e aquele arquivo é Python. Fica em `.tools/`, no
  `.gitignore`, com a receita no CONTRIBUTING. **O que é versionado é a
  configuração e o vocabulário** — que é a parte que tem valor e que a D13 vai
  rodar no CI.
- **O escopo do Vale são DUAS seções no `.vale.ini`, e a segunda não é
  redundância.** Medido nesta máquina: `docs/**.md` casa `docs/index.md` e
  **não** casa `docs/referencia/glossario.md`; `docs/**/*.md` faz o inverso. Com
  um padrão só, `vale docs/` dizia **"0 files"** para a árvore inteira abaixo do
  primeiro nível e **saía com sucesso**. É a pior classe de defeito de portão: o
  verde de um linter que não olhou nada. Só apareceu porque a verificação exigia
  ver a ferramenta **acusar**, e ela não acusava o que devia.
- **`Vale.Spelling` está desligado, e a medição está no comentário do arquivo.**
  Ele é corretor de inglês: numa página de prova com quatro frases em português,
  **15 dos 19 alertas** eram "Did you really mean 'tabela'?". É a §6.1 da
  spec-wiki confirmada por medição em vez de leitura.
- **Só a forma MINÚSCULA de "usuário" é proibida, e a caixa carrega a
  intenção.** Conferido antes de virar desenho: o `reject.txt` distingue caixa.
  Na tela de login o rótulo é **Usuário**, capitalizado, e citar rótulo
  literalmente é obrigatório pelo próprio guia — então o rótulo passa e "o
  usuário devolveu" não. Uma proibição indiscriminada tornaria impossível
  documentar a tela de login, e a página de conta do administrador (D10) nasceria
  com o lint desligado.
- **`accept.txt` só recebe nome próprio que não seja também palavra comum em
  português.** Dois foram tentados e **retirados pela própria ferramenta**:
  "Estudante" (que é rótulo de tela quando capitalizado e substantivo comum
  quando não é — com ele na lista, "o estudante digita a matrícula" virava erro)
  e "Vale" (o nome da ferramenta é também o verbo — ele reprovou a **primeira
  frase do próprio guia de estilo**). `Vale.Terms` não sabe distinguir os dois
  usos, e não há como ensiná-lo.
- **O `reject.txt` aceita expressão regular e frase de várias palavras, com
  fronteira de palavra** — conferido, "alunado" não dispara `[Aa]lunos?`. É o que
  permitiu ao vocabulário cobrir também as **regras de voz** da §7 ("você
  deverá", "o sistema irá"), e não só grafia de termo. Sem essa prova, o
  vocabulário teria nascido como lista de palavras soltas.
- **Comentário com `#` em arquivo de vocabulário é ignorado** — conferido com um
  termo plantado dentro de um comentário, que não disparou nem escrito por
  extenso. É o que permite o porquê de cada entrada morar ao lado dela, em vez de
  numa documentação à parte que ninguém abre ao editar a lista.
- **A porta de saída do lint é obrigatória, e o guia usa nela mesma.** Uma regra
  de erro sem escape vira parede sem porta: a página que precisa **explicar** o
  termo proibido não teria como. O escape é
  `<!-- vale Vale.Avoid = NO -->` … `= YES`, exercitado nos dois sentidos antes
  de virar regra escrita, e o guia de estilo o aplica em dois parágrafos —
  documentar usando é o que impede a instrução de envelhecer errada.
- **Todo link do template começa por `../`, e isso foi medido.** A primeira
  versão usava `guia-de-estilo.md`, que passa de dentro de `docs/contribuir/` e
  **quebra ao ser copiado** para `docs/painel/` — derrubando o
  `mkdocs build --strict` de quem só queria começar uma página. Reprovou na
  verificação, que é onde tinha que reprovar: o defeito só existe no gesto que o
  template existe para fazer.
- **O template ganhou um bloco visível de "como usar", e o comentário HTML do
  topo foi reduzido a um ponteiro.** Comentário HTML **atravessa** para o HTML
  gerado e fica invisível ao leitor (conferido): como a página agora é publicada,
  sem o bloco visível ela seria oito títulos e nada mais. As instruções ficam num
  lugar só, pelo mesmo motivo de sempre.
- **Página fora do `nav` é `INFO`, não `WARNING`, e o `--strict` passa.** Medido
  antes de decidir onde pôr `contribuir/`. É também o que faz o template copiado
  construir sem estar no índice — quem começa uma página não precisa editar o
  `mkdocs.yml` antes de escrever a primeira linha.
- **As âncoras do glossário são ASCII, e o markdownlint do editor acusa errado.**
  Ele usa um algoritmo de slug que preserva acento; o Python-Markdown normaliza
  para ASCII, então `## Baixa física` vira `#baixa-fisica`. As 17 âncoras
  internas foram conferidas contra o **HTML gerado**, uma a uma. Não "corrija" as
  âncoras para a forma acentuada por causa do aviso do editor: isso quebraria as
  17 de uma vez.

**Tarefa D04 — Modelagem BPMN dos cinco processos (concluída):** os cinco
`.bpmn` em `docs/processos-fonte/` e os cinco SVG derivados em
`docs/assets/diagramas/`, mais o exportador
[scripts/exportar-diagramas.mjs](scripts/exportar-diagramas.mjs) por trás de
`npm run docs:diagramas`. Nenhuma página de processo foi escrita — não era desta
tarefa. `tsc`, `lint`, `mkdocs build --strict` e `vale docs/` em 0, com o Vale
declarando 17 arquivos lidos.

Verificação em seis frentes: os cinco importados no **bpmn-js** (o motor do
próprio bpmn.io) com **zero aviso** de validação; a ida e volta pelo modelador,
provando que o arquivo sobrevive a ser aberto, mexido e salvo no bpmn.io (26
asserções, nenhum elemento perdido); a medida de corte no SVG publicado, texto a
texto, no tamanho intrínseco; os cinco abertos em Chrome real e conferidos a
olho, o que achou quatro defeitos de legibilidade que nenhum portão pegou; os 22
gateways confrontados um a um com o `if` correspondente no código; e o
`git diff --numstat`, que devolve número de linhas nos dez arquivos — se
aparecesse `- -`, o formato estaria errado.

**Decisões da D04** (não refazer sem motivo):

- **"Aluno" não entra na raia; quem retira equipamento é "Estudante e
  Professor".** O enunciado escreve "Aluno/Professor" nas cinco linhas da tabela,
  mas a D03 tirou "aluno" do vocabulário da wiki e a §3.1 da spec-wiki já foi
  corrigida. O detalhe que torna isto perigoso: **o Vale só lê `.md`** — o termo
  proibido dentro de um `.svg` passaria calado pelo portão, em cinco diagramas
  publicados. Levantado como conflito antes da primeira edição; a decisão foi do
  dono do repositório.
- **Os `.bpmn` foram escritos à mão, e o bpmn-js é quem valida.** O enunciado
  manda usar bpmn.io ou Camunda Modeler, que são interfaces gráficas; o formato
  de saída é o mesmo XML padrão OMG. O que substitui o clique não é confiança: é
  o `importXML` do **mesmo motor que o bpmn.io roda por dentro**, com a regra de
  que aviso de importação derruba o comando. Aviso ali é o que o bpmn.io mostraria
  no painel lateral — referência solta, atributo fora do esquema —, e nada disso
  impede o arquivo de abrir, que é justamente por que precisa reprovar.
- **O exportador ficou versionado, e o SVG deixou de poder divergir da fonte.**
  A alternativa era um script descartável mais uma receita manual no CONTRIBUTING
  ("abra o bpmn.io, importe, baixe o SVG, renomeie") — quatro passos que alguém
  pula. `--verificar` faz a pergunta inversa para o CI da D13. Decisão do dono do
  repositório.
- **O SVG do bpmn-js NÃO é reproduzível, e isso quase passou batido.** Cada
  instância do visualizador sorteia um id novo para as pontas de seta
  (`marker-33wm49p9tx0n17ty4dyeh0hc8` numa execução, outro na seguinte): exportar
  o mesmo `.bpmn` duas vezes dava dois arquivos diferentes. As consequências eram
  as duas piores possíveis — o `git diff` acusaria os cinco SVG a cada
  `npm run docs:diagramas`, sem ninguém conseguir separar mudança de ruído, e o
  `--verificar` reprovaria arquivos recém-gerados. Foi descoberto porque o portão
  **reprovou os cinco na primeira vez que rodou**. `idsEstaveis()` renumera os
  marcadores; provado com duas execuções seguidas e `md5sum` idêntico.
- **A comparação do `--verificar` normaliza a quebra de linha.** Esta máquina tem
  `core.autocrlf=true` e o repositório não tem `.gitattributes` (conferido, não
  suposto): o SVG é gravado com LF e o Git o devolve com CRLF no próximo
  checkout. Byte a byte, o portão acusaria os cinco diagramas em qualquer clone
  novo — inclusive o do CI — sem uma linha de conteúdo ter mudado.
- **O portão mede duas coisas, e a segunda é a que pega defeito.** A primeira —
  todo texto dentro da área visível do SVG — quase nunca falha, porque o
  `saveSVG` **cresce** para incluir rótulo externo que transborda a raia (medido:
  700x360 virou 714x418 com um evento encostado no canto). Ela fica como prova de
  que a leitura aconteceu. A segunda — rótulo de atividade maior que a própria
  caixa — falha de verdade: o bpmn-js quebra a linha sozinho mas **não** aumenta
  o retângulo, e o texto vaza por cima da seta vizinha. Exercitada nos dois
  sentidos antes de virar regra.
- **Nenhum portão pega diagrama feio, e por isso os cinco foram olhados.** O
  navegador real achou quatro defeitos que `tsc`, `lint`, `mkdocs` e o próprio
  exportador atravessaram sem piscar: a seta do "não" cortando o nome do gateway
  ao meio, `AGUARDANDO_BAIXA` quebrado como `AGUARDANDO_/BAIXA`, o rótulo
  "cadastrar um equipamento" por cima da caixa seguinte, e o texto da baixa em
  lote encostando no marcador de repetição. Legibilidade é requisito do enunciado
  ("legíveis a 100% de zoom"), e não sai de asserção de DOM.
- **Rótulo externo quebra em 90 px, e `dc:Bounds` não muda isso** — ele posiciona,
  não alarga. Foi por isso que o gateway virou "Ainda está aguardando baixa?" em
  vez de nomear o status: alargar a caixa não resolvia. Dentro de uma atividade a
  regra é outra (quem manda é a largura da forma), e lá o nome do status ficou.
- **O 02 termina em evento intermediário de mensagem e o 03 começa com o evento
  de início que o consome**, os dois chamados "Devolução declarada". É o que a §3
  do enunciado pede, e é o que impede o erro que a regra de negócio existe para
  impedir: o 02 **não** termina em "equipamento disponível", termina em "o
  equipamento segue EMPRESTADO e espera a secretaria".
- **Não existe sexto diagrama de visão geral.** O enunciado deixa opcional; a D10
  já reserva as duas máquinas de estado para Mermaid, em `docs/referencia/`,
  dizendo "não force BPMN onde ele não é a notação certa". Um BPMN de visão geral
  seria a terceira representação da mesma coisa, para manter em sincronia.
- **O tempo limite de inatividade do tablet (2 min) não está no diagrama 01.** Ele
  é comportamento de sessão, não etapa do processo: em BPMN honesto seria um
  subprocesso de evento, que pesa mais na leitura do que informa. Fica para o
  passo a passo da D05.
- **A gestão de categorias não está no diagrama 04.** Ela é outra tela
  (`/admin/categorias`) e não é um dos cinco processos da §3.1 da spec-wiki; o
  que o 04 mostra é o cadastro de equipamento **escolhendo** uma categoria que já
  existe.
- **Os 22 gateways foram confrontados com o código, um a um.** Os que não são
  óbvios: "Cadastro ativo?" mora em dois lugares (a tela troca a grade por uma
  explicação, e `confirmarRetirada` recusa no servidor); "Até 10 itens?" é
  `MAXIMO_ITENS_POR_RETIRADA`, **que a tela não impede** — é recusa só do
  servidor, e por isso entrou no diagrama; "A pessoa está com equipamento?" é o
  `emprestimosAbertos === 0` que decide entre gravar direto e abrir o aviso; e
  "O item estava EMPRESTADO?" é o `liberados.count === 1` que distingue o ciclo
  que devolve o aparelho à prateleira do que o mantém em manutenção.
- **A baixa em lote é uma atividade com marcador de repetição sequencial**, e a
  avulsa não. Não é enfeite de notação: é a decisão da Tarefa 5 desenhada — o
  lote é melhor-esforço item a item porque o gesto físico já aconteceu, e o
  diagrama tinha que mostrar que uma linha fora da fila não derruba as outras.

**Tarefa D05 — Processo 1, Retirada de equipamento (concluída):** a primeira
página de processo da wiki, em [docs/portal/retirada.md](docs/portal/retirada.md),
com as oito seções do template da D03, o diagrama BPMN embutido, as nove capturas
em `docs/assets/images/retirada/` e as ramificações no formato "Se SIM → / Se
NÃO →". Junto vieram as quatro renomeações de página que o enunciado pedia e as
correções que o **primeiro uso real** do ferramental da D03 revelou.
`mkdocs build --strict`, `vale docs/` (17 arquivos), `npm run docs:diagramas --
--verificar`, `tsc` e `lint` em 0.

Verificação em quatro frentes, com o `dev.db` do dono do repositório **conferido
byte a byte** contra a linha de base no fim (md5 idêntico — ele nunca foi
tocado): o Fluxo 1 inteiro no navegador real por CDP, em 1280x800, do teclado da
matrícula à tela de sucesso, com as três ramificações do enunciado (22
asserções); a categoria esgotada, montada e desfeita pelo próprio roteiro, nas
duas formas em que ela aparece (7); a corrida de dois tablets pelo mesmo aparelho,
com a asserção **negativa** de que nada foi gravado (6); e as duas recusas que o
cenário de nove unidades livres não alcança pela tela, por HTTP real contra o
servidor (6). Mais a conferência dos 38 links e recursos relativos da página
publicada, e a leitura visual das nove capturas e da página montada.

**Decisões da D05** (não refazer sem motivo):

- **O nome do arquivo veio do enunciado, e as quatro páginas foram renomeadas de
  uma vez.** A D02 tinha criado `retirada-de-equipamento.md`,
  `devolucao-de-equipamento.md`, `gestao-de-inventario.md` e
  `gestao-de-pessoas.md` a partir dos rótulos da §4 da spec-wiki; os enunciados
  da D05, D06, D08 e D09 dizem `retirada.md`, `devolucao.md`, `inventario.md` e
  `pessoas.md` (só a D07 já casava). Mesmo precedente da D01, em que
  `demo-estado.ts` venceu o `seed-demo.ts` da spec por ser mais específico — e
  aqui há um argumento a mais: o slug da página passa a bater com os outros três
  artefatos do mesmo processo (`01-retirada.bpmn`, `01-retirada.svg`,
  `images/retirada/`). Levantado como conflito antes da primeira edição; a
  decisão de renomear as quatro juntas foi do dono do repositório, para o `nav`
  não ficar misturado por quatro tarefas.
- **O passo a passo NÃO pode ser cortado por subtítulo, e o `--strict` não
  acusa.** Um `###` no meio da lista numerada a fecha e abre outra, e o
  Python-Markdown escreve a segunda **sem o atributo `start`**: os doze passos
  saíam 1‑4, 1‑4, 1‑4 na página publicada. O build saiu em 0 aviso com o defeito
  no ar — só ler o HTML gerado pegou. A regra virou comentário na §6 do
  [template](docs/contribuir/template-processo.md), porque quatro páginas ainda
  vão ser escritas a partir dele.
- **O diagrama BPMN é clicável, e isso também é do template agora.** Medido na
  página publicada: o SVG tem 1980px de largura e entra na coluna de texto com
  **688px**, ou 0,35 do tamanho — nenhum rótulo se lê. A regra 5 do guia de
  estilo (captura clicável, abrindo em tamanho cheio) vale igual para o diagrama,
  e sem ela a §5 vira uma mancha cinza. O template da D03 mostrava a forma não
  clicável; foi corrigido.
- **Caixa de admonição não gera âncora.** A pré-condição linkava
  `#por-que-eu-consigo-entrar-mas-nao-consigo-retirar`, esperando que o título
  do `!!! question` virasse `id` — não vira, e nem o `--strict` nem o Vale dizem
  nada. Conferido no HTML gerado e trocado pela âncora da seção. Quem for linkar
  uma regra específica precisa de um `##` de verdade, não de uma caixa.
- **"bpmn.io" entrou no `accept.txt` do Vale.** Sem a entrada, a primeira página
  a linkar o modelador reprova com *"Use 'BPMN' instead of 'bpmn'"* — o termo
  canônico casa **dentro** do nome próprio. A entrada mais longa vence, e as duas
  grafias passam a conviver: a notação em caixa alta, a ferramenta em caixa
  baixa. Exercitado nos dois sentidos depois da mudança, com um arquivo
  descartável: as quatro regras de grafia proibida continuam acusando, e
  `bpmn.io`, `BPMN`, `Unoesc` e `MkDocs` passam.
- **A quarta ramificação entrou no passo a passo, e ela não está na §2 do
  enunciado.** O enunciado lista três decisões; o diagrama da D04 tem quatro
  gateways, e o que faltava — "Todos ainda estavam livres?" — é a corrida de dois
  tablets pelo mesmo aparelho. Deixá-la de fora faria a página contradizer o
  diagrama que ela mesma publica. Exercitada de verdade: o `NOTE-06` sai do
  inventário no intervalo entre o toque e a confirmação, e a asserção que importa
  é a **negativa** — nada foi gravado, nem o `NOTE-05`, que continuava livre.
- **A página diz que a retirada não tem desfazer, e essa pergunta é a quarta
  caixa da §7.** É o resultado da varredura de reversibilidade: o enunciado
  descreve o gesto de ida e não o de volta. A resposta honesta não é "não dá" —
  é o processo seguinte, a devolução, e o texto manda para lá.
- **A recusa por teto de 10 itens foi provada por HTTP, não pela tela.** O
  cenário do `db:demo` tem nove unidades livres no total, então não há como
  selecionar onze pelo tablet — e a tela não impede a seleção, a recusa é só do
  servidor (decisão registrada na D04). Sem o degrau de protocolo, a linha da §8
  seria escrita de memória. O identificador da action foi **sondado**, e a
  primeira assinatura tentada ("Sessão perdida. Informe a matrícula novamente.")
  é respondida por **quatro** das seis actions: o roteiro ficava com a última e
  reprovava falando de empréstimo. A assinatura boa é "Selecione pelo menos um
  equipamento.", e o casamento único passou a ser exigido em vez de suposto.
- **A captura foi feita contra um banco separado, e o `dev.db` não foi tocado.**
  A receita do CONTRIBUTING manda `db:reset`, que apaga o banco de trabalho do
  dono do repositório. Apontar `DATABASE_URL` para `./dev-demo.db` resolve — o
  `dotenv` não sobrescreve variável já definida no ambiente. A receita ganhou
  essa variante, junto com duas armadilhas medidas: o `next dev` **recusa** subir
  um segundo servidor do mesmo projeto (o antigo serve o banco antigo, e precisa
  ser encerrado), e o indicador "Rendering …" do modo de desenvolvimento aparece
  em **toda** captura — ele mora num `<nextjs-portal>` fora da aplicação, não
  entra em asserção nenhuma, e some com uma linha antes de fotografar.
- **O `db:demo` não desfaz uma retirada feita pela tela**, e a afirmação
  contrária estava escrita no CONTRIBUTING. Ele faz `upsert` nos dez ids da faixa
  reservada e reescreve o status de todo equipamento, mas o `Emprestimo` que o
  tablet criou nasce com id próprio (9011+) e sobrevive. Metade se desfaz, que é
  o pior caso: o equipamento volta a `DISPONIVEL`, o empréstimo fica, e a captura
  seguinte mostra a pessoa com item na mão — com o `h1` trocando de "O que você
  vai levar?" para "O que você quer fazer?". Foi assim que apareceu. O texto foi
  corrigido, com a receita de recriar o banco.
- **O elenco das capturas foi escolhido, não sorteado.** "João Pedro de Almeida"
  é o caso da partícula minúscula da Tarefa 8.1 e não tem empréstimo aberto — o
  que dá o `h1` "O que você vai levar?" e a grade de três colunas limpa. Larissa
  Coutinho é inativa e tem só um item em `AGUARDANDO_BAIXA`, que **não** aparece
  em "Meus equipamentos": é a única forma de fotografar a tela de cadastro
  inativo sem uma lista ao lado disputando a atenção.
- **A categoria esgotada não existe no `db:demo`, e é montada pelo roteiro.**
  Nenhuma das três categorias fica sem unidade livre no cenário da D01. As duas
  unidades de Tablet vão para `MANUTENCAO`, a captura é tirada, e o mesmo script
  as devolve. Acrescentá-la ao `demo-estado.ts` foi descartado: o cenário é
  compartilhado pelas cinco páginas, e uma categoria permanentemente vazia
  estragaria a grade de todas as outras.
- **A ramificação da categoria esgotada tem duas formas, e as duas foram
  exercitadas.** A normal é o cartão que já nasce cinza, porque a contagem vem do
  login. A outra é a mesma decisão meio segundo depois: a contagem da grade
  envelhece, o cartão continua clicável, e a lista chega vazia com "Nenhuma
  unidade de Tablet está livre agora." A página documenta a primeira como passo e
  a segunda na §8, que é onde o leitor vai procurar pela frase que está na tela.

**Tarefa D06 — Processo 2, Devolução de equipamento (concluída):** a segunda
página de processo, em [docs/portal/devolucao.md](docs/portal/devolucao.md), com
as oito seções do template, o diagrama BPMN embutido, as nove capturas em
`docs/assets/images/devolucao/` e as ramificações no formato "Se SIM → / Se
NÃO →". `mkdocs build --strict`, `vale docs/` (17 arquivos), `npm run
docs:diagramas -- --verificar` (5 diagramas), `tsc` e `lint` em 0.

Verificação em cinco frentes, com o `dev.db` do dono do repositório **conferido
por md5** contra a linha de base no fim (idêntico — nunca foi tocado): o Fluxo 2
inteiro no navegador real por CDP, em 1280x800, nos três cenários — avulso (18
asserções), lote (10) e cadastro inativo (7); a corrida do modal aberto, em que o
empréstimo sai de `ATIVO` por fora da tela entre o toque e a confirmação (5); as
recusas por HTTP real contra as Server Actions (10), com o estado do banco
conferido **depois** para provar que nenhuma delas escreveu; e a página publicada
conferida contra o próprio sistema (29), com as mensagens de erro **extraídas** de
`src/app/actions.ts` em vez de digitadas. O banco de demonstração foi comparado
com a linha de base ao fim de cada cenário e voltou idêntico nas três vezes.

**Decisões da D06** (não refazer sem motivo):

- **A prova de que o equipamento não volta para a prateleira é a contagem da
  grade de categorias, lida depois de sair e entrar de novo.** Ler
  `Equipamento.status` no banco prova a linha; a contagem prova o que a próxima
  pessoa vê. E a releitura **tem que passar por um novo login**: o `Portal.tsx`
  não relê as categorias depois da devolução de propósito (a contagem não mudou),
  então afirmar sobre elas na mesma sessão mediria o cliente que não recarregou,
  e não o servidor. Medido: "Notebooks — 4 de 9 disponíveis" antes e depois, com
  o `NOTE-01` declarado devolvido no meio. A captura do passo 8 mostra isso na
  mesma imagem em que o aviso verde confirma a devolução, e a página aponta para
  ela — é o argumento inteiro em uma figura.
- **O passo "deixe o aparelho na bancada" é um passo do processo, e vem antes da
  confirmação.** Ele não está na sequência de telas do enunciado (que tem quatro
  cliques), mas é o único gesto que o sistema **não** consegue verificar: o modal
  existe para dizer que ele já aconteceu. Documentar só os cliques faria a página
  descrever a interface e perder o processo.
- **A escolha "um item ou todos" entrou no passo a passo, e ela não está na §2 do
  enunciado.** Mesmo precedente da D05: o gateway "Um item ou a lista inteira?"
  está no diagrama que a própria página publica, e omiti-lo faria o texto
  contradizer a figura. A ramificação usa "**Se for UM item** → / **Se forem
  TODOS** →" em vez de SIM/NÃO — a regra 3 do guia de estilo pede decisão
  explícita e nunca embutida na prosa, e uma escolha entre dois caminhos não é
  uma pergunta de sim ou não.
- **As duas capturas que sobraram viraram conteúdo, e a numeração foi refeita.**
  O modal do lote e o erro da corrida tinham sido tirados para asserção e não
  estavam na página; imagem órfã é exatamente o que a regra 7 do guia de estilo
  existe para impedir (ninguém sabe procurar por ela depois). As nove foram
  renumeradas para a **ordem de aparição na página**, que não é a ordem em que os
  roteiros rodaram.
- **A conferência final extrai as mensagens de erro do `src/app/actions.ts` em
  vez de compará-las com uma lista digitada.** Uma lista digitada envelhece em
  silêncio: alguém reescreve a frase no código, a tabela da §8 continua com a
  antiga, e o leitor que chegou buscando pela frase da tela não acha a linha. Com
  a extração, quem muda o código quebra a conferência. Mesmo argumento que fez o
  gerador da planilha modelo consumir `COLUNAS_CANONICAS` na Tarefa 9.
- **O degrau de protocolo não prova que a recusa chega à tela.** As dez chamadas
  por HTTP provaram que o servidor recusa; **quem decide em qual lugar da tela a
  mensagem aparece é o `Portal.tsx`** (o modal fecha, a lista é relida, e o erro
  vai para o alerta da seção), e isso só existe no navegador. Por isso a corrida
  do modal aberto é um degrau próprio, e não redundância: ela é a única
  verificação que cobre o roteamento do erro.
- **Os identificadores das Server Actions vieram do manifesto do servidor em
  execução, com o `exportedName` junto** — `.next/dev/server/server-reference-manifest.json`
  mapeia id para nome de função, o que dispensa a sondagem às cegas que a D05
  precisou fazer. A sondagem ficou mesmo assim, como asserção: cada id é
  confirmado por uma assinatura **única** antes de virar recusa, porque o
  manifesto pode estar defasado em relação ao processo no ar.
- **O `db:demo` não restaura o `status` de quem veio do seed**, e isso custou
  uma linha de restauração explícita. Ele faz `upsert` só nas suas onze pessoas;
  a Ana Souza (`0012345`), que é quem tem "Meus equipamentos" cheio, é do
  `PESSOAS_EXEMPLO` do seed — e o seed também não reescreve `status` de cadastro
  existente (regra da Tarefa 8). Inativá-la para fotografar a trava assimétrica é
  uma mudança que **nada desfaz sozinho**. Está escrito no CONTRIBUTING, ao lado
  da exceção irmã que a D05 mediu.
- **Nenhuma captura foi tirada contra o `dev.db`.** A receita da D05 (banco
  separado em `DATABASE_URL`, servidor na 3100) foi seguida, e o md5 do `dev.db`
  no fim é o mesmo do começo. É o que permite exercitar devolução de verdade sem
  esvaziar a lista de quem estava trabalhando no banco.
- **A §7 tem seis perguntas, e a sexta é a da reversibilidade.** "Cliquei em
  Devolver no item errado" não tem desfazer pelo tablet — o item sai da lista e
  entra na fila. A resposta honesta não é "não dá": é fazer valer o que foi
  declarado (levar o aparelho à bancada) e retirar de novo depois da baixa. Mesma
  varredura que produziu a quarta caixa da página da retirada.

**Tarefa D07 — Processo 3, Baixa física (concluída):** a primeira página da
trilha do painel, em [docs/painel/baixa-fisica.md](docs/painel/baixa-fisica.md),
com as oito seções do template, o diagrama BPMN embutido, as oito capturas em
`docs/assets/images/baixa-fisica/` e a conferência física como passo numerado.
`mkdocs build --strict`, `vale docs/` (17 arquivos), `npm run docs:diagramas --
--verificar` (5 diagramas), `tsc` e `lint` em 0.

Verificação em cinco frentes, com o `dev.db` do dono do repositório **conferido
por md5** contra a linha de base no fim (idêntico — nunca foi tocado): a baixa
avulsa no navegador real por CDP, em 1440x900, do login ao aviso verde (19
asserções); a prova de banco confrontada com a linha de base, item a item, nas
quatro baixas (16 e 28 asserções, em duas rodadas); o degrau de protocolo por
HTTP real contra as duas Server Actions, com as recusas e as duas pontas do teto
de 50 (13); o lote, a corrida e a fila vazia no navegador (15); e a página
publicada conferida contra o próprio código (104), mais a leitura visual dela
servida por HTTP (13). O cenário do `db:demo` foi restaurado ao fim de cada
rodada.

**Decisões da D07** (não refazer sem motivo):

- **A escolha entre um item e o lote entrou no passo a passo, e ela não está na
  §2 do enunciado.** O enunciado descreve quatro passos e não menciona o
  "Confirmar Todas as Devoluções"; o gateway "Um item ou a fila inteira?" está no
  diagrama que a própria página publica. Mesmo precedente da D05 e da D06:
  omiti-lo faria o texto contradizer a figura ao lado. A ramificação usa "Se for
  UM → / Se forem TODOS →" em vez de SIM/NÃO, porque escolher entre dois caminhos
  não é pergunta de sim ou não.
- **Duas palavras do enunciado não sobreviveram ao vocabulário da wiki.** Ele
  escreve "a declaração do usuário" e "a secretária"; `usuário` em minúscula é
  grafia proibida desde a D03 (naquele vocabulário a palavra quer dizer **login
  de administrador**), e neste projeto "a secretaria" é o setor, não a pessoa. O
  Vale pega a primeira e não pega a segunda — a segunda é convenção do
  [AGENTS.md](AGENTS.md), lida à mão.
- **A pergunta da reversibilidade é a quarta caixa da §7, e o enunciado não a
  pedia.** Ele cobre o clique repetido ("pode clicar sem medo") e não cobre o
  **item errado** — que é o gesto sem volta: confirmar o recebimento de um
  aparelho que não está na bancada encerra o empréstimo e o devolve à prateleira,
  e **não existe tela que reabra empréstimo encerrado**. A resposta honesta são
  três passos (achar o aparelho, mandar retirar de novo no tablet, ou marcar
  manutenção), e é o que justifica a existência do passo 7: conferir a etiqueta é
  mais barato que qualquer um dos três.
- **A nota de regressão da Tarefa 12 ficou NESTA página, num bloco recolhido.**
  A D07 manda pô-la aqui "ou na página de regras de negócio da D10", e a D10
  manda pô-la lá "se ela não tiver ficado" aqui — as duas devolvem a escolha uma
  para a outra, e a D10 ainda é um arquivo de uma linha. Link para página vazia
  não entrega nada ao leitor. O bloco é `???` (nasce fechado): a secretaria não
  esbarra nele, e quem for mexer no `darBaixa` acha. **A D10 não deve duplicá-la.**
- **A tela avisa "Continua em manutenção" e a página NÃO documenta esse caso,
  porque a interface da v1.0 não consegue produzi-lo.** O `darBaixa` tem o ramo
  (`liberados.count !== 1`) e o resumo do lote tem o campo `presas`, mas o
  `ORIGENS_PERMITIDAS` só deixa `MANUTENCAO` vir de `DISPONIVEL`: equipamento
  `EMPRESTADO` não tem botão nenhum no inventário. Documentar mandaria a
  secretaria procurar um caso que não acontece. Se um dia a Tarefa 13 (ou outra)
  abrir esse caminho, a linha entra na §8.
- **A prova de que só a baixa devolve o aparelho ao estoque é a contagem do
  tablet, não a linha do inventário.** Ler `Equipamento.status` prova a linha; a
  grade de categorias prova o que a próxima pessoa vê. Medido: "Notebooks — 4 de
  9 disponíveis" antes, **5 de 9** depois, com um novo login no portal entre as
  duas leituras (o `Portal.tsx` não relê as categorias sozinho — afirmar sobre
  elas na mesma sessão mediria o cliente, e não o servidor). Mesmo argumento da
  D06, do outro lado do ciclo.
- **A asserção que pegaria a regressão é NEGATIVA, e sai do enunciado.** "A
  `data_devolucao` permanece intacta" não tem linha de código para apontar: se
  alguém reintroduzir o `data_devolucao: new Date()` que a Tarefa 12 removeu,
  tudo continua verde — o empréstimo vai a `CONCLUIDO`, a `data_baixa` é
  preenchida, o equipamento é liberado. O script compara os dois carimbos com a
  linha de base tirada **antes** da primeira escrita. As quatro baixas desta
  sessão deram 304, 180, 120 e 60 min de prateleira; com a regressão dariam zero.
- **`querySelector('[role="status"]')` pega o gêmeo errado no painel.** São
  **duas** `Notificacao` no documento: uma no `ContaDoAdmin` da barra lateral
  (Tarefa 11) e outra na fila. A da barra vem antes no DOM e está sempre vazia,
  então a leitura "assim que o elemento existir" devolve string em branco — e o
  diagnóstico natural é culpar o produto. A âncora certa é `main [role="status"]`.
- **A recusa "Esse item já saiu da fila." aparece por ~241 ms, e isso foi
  medido.** O componente grava a mensagem na linha **e** chama `router.refresh()`
  na mesma transição; a mensagem pinta (69 de 91 leituras a viram) e some junto
  com a linha quando a árvore revalidada chega. A primeira medição disse "0
  leituras" e estava errada: a pausa de 250 ms que o driver dá depois do clique
  engolia a janela inteira. Por isso a página descreve o caso em texto e **não
  tem captura dele** — imagem de algo que dura um quarto de segundo prometeria
  ao leitor uma tela que ele não vai ver.
- **A recusa que FICA na linha é a de sessão encerrada**, e é ela que ilustra a
  §8. `SEM_SESSAO` não dispara releitura, então o alerta vermelho permanece
  embaixo do botão com a linha ainda na fila — que é exatamente o sinal que a
  secretaria precisa ler: nada foi conferido.
- **A tabela de erros é conferida EXTRAINDO as frases do código**, como a da D06,
  e a extração tem duas armadilhas que produziram falso negativo antes de virar
  regra: o texto de JSX chega **quebrado em várias linhas** (comparar byte a byte
  reprova frase que está na tela), e uma das mensagens é template com constante
  interpolada — `São no máximo ${MAXIMO_DE_BAIXAS_EM_LOTE} baixas por vez.` A
  conferência normaliza espaços e resolve a constante lendo o valor dela.
- **O formulário de login é `useActionState`, e os campos ocultos dele não são o
  `$ACTION_ID_<hash>` do caso simples.** São quatro — `$ACTION_REF_1`,
  `$ACTION_1:0`, `$ACTION_1:1` e `$ACTION_KEY`. Entrar por HTTP exige
  **reenviá-los como o HTML os traz**, e não montar o formato de memória. Os ids
  das duas actions de baixa vieram do manifesto do servidor no ar, e cada um foi
  confirmado por uma assinatura única antes de virar asserção ("Registro
  inválido." contra "Nada para confirmar.").
- **O teto de 50 do lote foi medido nos dois sentidos**: 51 ids são recusados com
  "São no máximo 50 baixas por vez.", 50 ids passam pela validação. A fronteira é
  só do servidor — a tela manda uma rodada de cada vez para a fila gigante
  encolher a cada clique, em vez de devolver o mesmo erro para sempre.

**Tarefa D08 — Processo 4, Gestão de inventário (concluída):** a segunda página
da trilha do painel, em [docs/painel/inventario.md](docs/painel/inventario.md),
com as oito seções do template, o diagrama BPMN embutido, as doze capturas em
`docs/assets/images/inventario/` e **cinco** procedimentos, cada um com a sua
sequência numerada. `mkdocs build --strict`, `vale docs/` (17 arquivos),
`npm run docs:diagramas -- --verificar` (5 diagramas), `tsc` e `lint` em 0.

Verificação em seis frentes, com o `dev.db` do dono do repositório **conferido
por md5** contra a linha de base no fim (idêntico — nunca foi tocado): as
premissas da exclusão de categoria por script, em cópia (10 asserções); os cinco
procedimentos no navegador real por CDP, em 1440x900, do login às capturas (43);
o degrau de protocolo por HTTP real contra as seis Server Actions, com e sem
cookie (44); a corrida que produz a recusa ao apagar categoria em uso, montada e
desfeita (9); a página publicada conferida contra o próprio código, com as
mensagens **extraídas** de `src/app/admin/actions.ts` e dos componentes (47); e a
página servida por HTTP e olhada no navegador (11). O banco de demonstração foi
comparado com a linha de base ao fim e voltou idêntico nas quatro tabelas.

**Decisões da D08** (não refazer sem motivo):

- **A tela dá um conselho que não funciona, e a página diz isso.** O detalhe da
  recusa ao apagar categoria em uso é "Inative os equipamentos dessa categoria
  antes de excluí-la" — e inativar **não** libera a exclusão: a contagem inclui
  o item inativo e o banco recusa igual (`P2003`). Medido nas duas camadas, por
  script e pelo transporte. Como não existe tela que mova um equipamento de
  categoria, e equipamento nunca é apagado, **categoria com equipamento é
  indeletável pelo painel**. A página cita a mensagem exata (é a chave de busca
  do leitor, e a regra 1 do guia de estilo manda citar a tela mesmo errada) e
  desmente o conselho na §7. Levantado como conflito antes da primeira edição; a
  decisão de documentar em vez de corrigir o produto foi do dono do repositório
  — **consertar a frase continua sendo tarefa de produto, e está em aberto.**
- **A página tem CINCO procedimentos, e o enunciado pedia quatro.** O diagrama
  `04-inventario.svg` que ela publica tem um ramo — "corrigir a etiqueta" — que
  os quatro do enunciado não cobrem. Mesmo precedente da D05, D06 e D07: página
  não pode contradizer a figura que ela mesma publica. Pelo lado inverso, a
  gestão de categorias **não** está no diagrama (decisão da D04), e a §5 diz isso
  em vez de deixar o leitor procurar.
- **Os cinco procedimentos são cinco listas que recomeçam em 1, e isso foi
  conferido no HTML gerado.** O comentário do template proíbe cortar a lista com
  subtítulo justamente porque o Python-Markdown escreve a segunda lista **sem**
  `start` — mas aqui as cinco são intencionais, e a §5 do enunciado pede
  "sequência numerada própria" para cada procedimento. A conferência mede o que
  o navegador pinta: cinco `<ol>`, nenhum com `start=`, começando em 1.
- **Caixa de admonição não gera âncora — e cinco links dependiam disso.** A regra
  já estava registrada na D05 e a página caiu nela mesmo assim: o
  `mkdocs build --strict` **passa em 0** com os links quebrados, porque o aviso é
  `INFO`. A solução foi plantar `<a id="..."></a>` antes de cada caixa que outra
  seção aponta; exercitado, o verificador de âncoras do MkDocs aceita. O `<a>`
  vira filho de um `<p>`, então o `nextElementSibling` **dele** é nulo — quem
  procurar a caixa na asserção precisa subir ao parágrafo.
- **A captura da lista é o grupo Notebook, e não a tabela inteira.** Os quatro
  status convivem nas dez linhas de `NOTE-01` a `NOTE-10` do `db:demo`, e a
  tabela completa dava 2515px de altura sem acrescentar informação. Foi preciso
  estender o recorte do driver para um intervalo de linhas.
- **A etiqueta e os botões quebram em duas linhas na tela real, em toda
  largura.** Medido em 1280, 1366, 1440, 1536, 1600, 1680 e 1920: a tabela trava
  em 1022px (o contêiner tem largura máxima), então a quebra não é artefato do
  recorte nem some em monitor maior. As capturas mostram a tela como ela é.
- **A ordem das categorias é a de criação, e apagar e recriar move a categoria
  para o fim.** `Categoria.id` é autoincremento e a grade do tablet ordena por
  ele: medido, uma categoria excluída e recriada com o mesmo nome voltou com id
  novo e depois de todas as outras. Virou pergunta da §7 — é o tipo de efeito que
  parece defeito para quem não sabe.
- **A recusa ao apagar categoria em uso só é alcançável pela corrida.** A tela
  não oferece o botão quando a categoria tem equipamento: no lugar dele aparece
  "11 equipamentos vinculados". A captura exigiu montar o cenário — categoria
  vazia no render, equipamento cadastrado por fora, clique na tela velha. E
  revelou um detalhe que a página documenta: **o diálogo continua aberto depois
  da recusa**, ainda dizendo que a categoria está vazia, porque o texto é do
  render anterior; o motivo fica na linha, atrás dele.
- **O toast tem três gêmeos com `role="status"` no painel, e o primeiro é o
  errado.** Além do da `ContaDoAdmin` que a D07 já registrou, o inventário tem o
  `<p role="status" sr-only>` da contagem de filtros — que vem antes no DOM e
  está **vazio** fora de filtro. `main [role='status']` produziu cinco falsos
  negativos seguidos. A âncora exclusiva é o botão "Fechar aviso", que só o toast
  com mensagem renderiza.
- **O número do diagrama foi medido, e não copiado da D07.** Lá o SVG tinha
  1980px e entrava a 0,35x; o `04-inventario.svg` tem 1230px e entra a **0,56x**
  em uma coluna de 688px. A frase da §5 foi corrigida — repetir o número da
  página anterior teria passado por todos os portões.
- **O `NOTE-11` que a verificação cadastra fica no cenário até a limpeza, e
  envenenou uma asserção.** O roteiro de navegador o cria para a captura do aviso
  verde; rodar o degrau de protocolo em seguida, sem limpar, fez o teste de chave
  estrangeira receber "A etiqueta NOTE-11 já existe." em vez da recusa esperada.
  Estado sujo se disfarça de defeito de produto.

**Tarefa D09 — Processo 5, Gestão de pessoas (concluída):** a última página de
processo e a terceira da trilha do painel, em
[docs/painel/pessoas.md](docs/painel/pessoas.md), com as oito seções do template,
o diagrama BPMN embutido, as onze capturas em `docs/assets/images/pessoas/` e
**quatro** procedimentos, cada um com a sua sequência numerada. Junto veio a
correção de um descasamento entre tela e servidor que a leitura do código
revelou — ver a primeira decisão abaixo. `mkdocs build --strict`,
`vale docs/` (17 arquivos), `npm run docs:diagramas -- --verificar` (5
diagramas), `tsc`, `lint` e `build` em 0, com as cinco rotas do painel ainda
dinâmicas (`ƒ`).

Verificação em seis frentes, com o `dev.db` do dono do repositório **conferido
por md5** contra a linha de base no fim (idêntico — nunca foi tocado): a planilha
suja passando pelos **módulos de produção** (`lerPlanilha` + `montarPlano`) em
Node, contra o banco de demonstração, com a asserção negativa de que a prévia não
escreve (é de lá que sai a tabela de antes/depois da §7); a importação inteira
pelo navegador real por CDP, em 1440x900, do arquivo à gravação (6 asserções); a
prova de banco confrontando o resultado com o que a prévia prometeu; a edição, a
troca de matrícula e o par inativar/reativar no navegador (13 asserções); a
página publicada conferida contra o **HTML gerado** — âncoras, listas numeradas,
imagens órfãs, as oito seções e o vocabulário (14 asserções); e a página servida
por HTTP e lida no navegador, incluindo a navegação pelos links da comparação nos
dois sentidos (10 asserções). O banco de demonstração foi comparado com a linha
de base ao fim e voltou idêntico.

**Decisões da D09** (não refazer sem motivo):

- **O campo Matrícula do diálogo de edição passou de `maxLength={20}` para
  `{15}`, e esta é a única tarefa da série de documentação que mexe em `src/`.**
  O servidor recusa acima de 15 (`MATRICULA_VALIDA`), então dava para digitar 16
  dígitos e só descobrir no **Salvar** — a tela prometendo um formato que a regra
  não aceita. Levantado como conflito antes da primeira edição, com a alternativa
  de só documentar (o precedente da D08); a decisão de corrigir foi do dono do
  repositório, e ela é a certa aqui porque o valor correto já estava escrito do
  outro lado — ao contrário do defeito da D08, que exige decidir o que a frase
  deveria dizer. Vai em commit próprio, como manda a regra de correção de defeito
  antigo.
- **`maxLength` não limita atribuição programática, e isso reprovou a primeira
  medição.** Escrever no `value` pelo setter nativo entrega 19 caracteres num
  campo de 15: o atributo só age no caminho de digitação de verdade. A asserção
  passou a usar `Input.insertText`, tecla a tecla, e aí o campo para em 15. Quem
  for medir teto de campo por roteiro precisa do caminho do teclado, senão mede o
  próprio roteiro.
- **A tabela de antes/depois da §7 saiu de uma execução, não de leitura do
  código.** As doze linhas são a saída real de `normalizarNome`,
  `normalizarPerfil`, `normalizarCursos` e `normalizarStatusPessoa` rodando
  contra o banco de demonstração. É o que o enunciado pede ("execute a importação
  suja e copie o resultado"), e é o que impede a tabela de envelhecer numa
  direção que ninguém percebe.
- **A planilha suja foi desenhada linha a linha, e cada uma prova uma regra.**
  Título de relatório na linha 1 e branco na 2 (o cabeçalho é achado na 3, e a
  numeração continua batendo com a do Excel); nome em caixa alta com partícula;
  perfil feminino e abreviado; curso invertido; cadastro novo; perfil fora da
  lista; matrícula com letra; matrícula **digitada como número** (o caso do zero à
  esquerda); e linha em branco no rodapé. O resultado tem os quatro contadores
  diferentes de zero — 1 cadastrar, 2 atualizar, 3 sem mudança, 3 com erro —, que
  é o que faz a captura da prévia ensinar a tela inteira em uma imagem.
- **A linha `inalterada` é o argumento da página, e não um detalhe.** Uma linha
  suja nos quatro campos (`JOÃO PEDRO DE ALMEIDA` / `ALUNO` / `ec, si`) volta como
  "sem mudança", porque o banco já guarda a forma canônica. É a prova de que
  reenviar a planilha do semestre não gera 180 atualizações — e virou uma pergunta
  própria da §7, porque quem vê "quase nada muda" desconfia que o arquivo não foi
  lido.
- **A comparação com o equipamento existe nas DUAS páginas, cada uma da sua
  ótica, e elas se cruzam por âncora.** A da D08 lidera pelo equipamento, a desta
  lidera pela pessoa; a linha final das duas é a mesma regra ("o registro tem que
  dizer a verdade sobre onde o aparelho está"). Levantado como conflito antes da
  primeira edição — duas tabelas são dois donos da mesma regra —, e a decisão foi
  do dono do repositório: quem lê a trilha do inventário não pode ser mandado
  para outra trilha para entender a dúvida que nasce ali. **Corrigir uma exige
  corrigir a outra.** A navegação nos dois sentidos foi exercitada no navegador.
- **Baixar a planilha modelo é procedimento, e não está no diagrama.** Ele é
  preparação, acontece antes de o processo começar e do lado da coordenação — o
  BPMN da D04 tem três caminhos e este não é um deles. A §5 diz isso, pelo mesmo
  motivo que a D08 declara a ausência da gestão de categorias: página não pode
  contradizer a figura que ela mesma publica, nem deixar o leitor procurando.
- **A pergunta da reversibilidade é "confirmei uma importação errada", e a
  resposta tem três casos com conselhos diferentes.** O enunciado cobre a prévia
  (o gesto de ida) e não cobre o de volta. O terceiro caso é o que ninguém
  deduz: campo que o arquivo **certo** não menciona não volta ao valor anterior,
  porque a importação só escreve nas colunas que o arquivo traz — e a lista "O que
  vai mudar" é a única vez em que o valor antigo aparece na tela.
- **Só onze capturas, e duas foram descartadas.** O recorte isolado da lista de
  erros e o da lista de mudanças eram pedaços da mesma tela que a captura da
  prévia já mostra inteira e legível. Imagem que repete outra custa rolagem e não
  informa; a regra 7 do guia de estilo existe para o caso inverso (imagem órfã),
  e as duas saem do mesmo princípio.
- **O `<code>` sai antes da asserção de vocabulário, como o Vale faz.** As três
  ocorrências de "ALUNO" na página estão entre crases — são o valor que a
  coordenação digita na planilha, e citá-las é o que faz a tabela de antes/depois
  ensinar alguma coisa. Uma asserção que só tirasse as tags reprovaria justamente
  a regra que o guia de estilo permite.
- **O diagrama entra a 0,50x, e o número foi medido nesta página.** O
  `05-pessoas.svg` tem 1380px e a coluna de texto tem 688px. A D08 media 0,56x e a
  D05, 0,35x — copiar o número da página anterior passa por todos os portões e
  mente para o leitor.

**Tarefa D10 — Páginas de referência (concluída):** as três páginas que ensinam
a *entender*, mais o completamento do glossário — [estados e
transições](docs/referencia/estados-e-transicoes.md) com as duas máquinas de
estado em Mermaid e a tabela cruzada, [regras de
negócio](docs/referencia/regras-de-negocio.md) com as dez regras em três partes
cada, [conta do administrador](docs/referencia/conta-do-administrador.md), e
sete verbetes novos no [glossário](docs/referencia/glossario.md) (16 → 23). O
`mkdocs.yml` ganhou o `custom_fences` do Mermaid e o `extra_javascript` com a
versão fixada. `mkdocs build --strict`, `vale docs/` (17 arquivos),
`npm run docs:diagramas -- --verificar` (5 diagramas), `tsc` e `lint` em 0.

Verificação em quatro frentes: os dois portões com a **cobertura conferida**, e
não só o código de saída; 90 asserções contra o **HTML gerado** (as 30 âncoras
das páginas de processo, as 12 células da tabela cruzada, os três itens de cada
regra, os sete verbetes e o critério que os promoveu); 11 asserções em navegador
real por CDP contra o site construído e servido por HTTP, incluindo a asserção
**negativa** de que a faixa `mermaid@11/` não é buscada; e a leitura visual dos
dois diagramas em recorte ampliado, que achou o defeito de legibilidade que
nenhum portão pegou. Nenhum processo ficou de pé e o repositório terminou com os
cinco arquivos pretendidos.

**Decisões da D10** (não refazer sem motivo):

- **Os nomes de arquivo do enunciado NÃO venceram, ao contrário da D05.** A D10
  escreve `estados.md` e `conta-administrador.md`; o repositório tem
  `estados-e-transicoes.md` e `conta-do-administrador.md` desde a D02. O que
  decidiu a D05 foi o slug casar com os artefatos irmãos do mesmo processo
  (`.bpmn`, `.svg`, pasta de imagens) — aqui não existe artefato irmão, os nomes
  atuais casam exatamente com o rótulo do `nav`, e **cinco páginas já linkavam**
  para `conta-do-administrador.md`. Renomear custaria reescrever cinco links por
  zero ganho de leitura. Levantado como conflito antes da primeira edição; a
  decisão foi do dono do repositório. **A D14 tem a mesma divergência em aberto**
  (ela diz `sobre/arquitetura.md`, o arquivo é `arquitetura-do-sistema.md`).
- **A regra "todo termo em negrito ou entre aspas tem verbete" é uma consulta, e
  foi executada antes de ser obedecida.** A varredura devolveu ~140 candidatos,
  e a composição do conjunto é que revelou o conflito: a maioria era ênfase de
  frase (**não**, **três**) e rótulo de botão (**Salvar**, **Cancelar**), e entre
  eles estavam os termos que a §3 do template e a primeira linha do próprio
  glossário mandam ficar na página de origem. O critério adotado é **termo de
  domínio presente em duas ou mais páginas de processo** — sete promovidos, com
  a contagem de páginas afirmada no roteiro para a próxima sessão não promover
  termo de página única. Rótulo de tela é o "glossário de UI" que a §9 da
  spec-wiki já atribui à **D12**.
- **O Material 9.7.7 NÃO empacota o Mermaid, e a URL embutida nele é uma faixa
  de versão.** Lido no bundle do tema, não suposto:
  `typeof mermaid=="undefined" ? _t("https://unpkg.com/mermaid@11/dist/mermaid.min.js") : $(void 0)`.
  A faixa `@11` é resolvida **no navegador de quem lê** (o unpkg dá 302 com cache
  de borda de 60 s), o que contraria frontalmente a regra de versão fixada do
  `docs-requirements.txt` — e contraria pior, porque uma 11.x nova redesenharia
  os dois diagramas sem nenhum commit aqui. A guarda do próprio tema é o ponto de
  extensão: o arquivo do unpkg termina em `globalThis["mermaid"] = ...`, então
  carregá-lo por `extra_javascript` define o global e o tema deixa de buscar a
  faixa. Custo aceito: ainda depende do unpkg no momento da leitura. Baixar os
  **3,41 MB** para dentro do repositório foi a alternativa descartada — é o único
  caminho que sobrevive ao unpkg sair do ar, e caro demais para dois diagramas.
- **A asserção que prova isso é NEGATIVA, e sem ela a mudança seria decorativa.**
  Ligar o `extra_javascript` e ver o diagrama aparecer não distingue "carregou a
  fixada" de "carregou as duas". O roteiro grava todas as requisições e afirma
  que **nenhuma** casa `mermaid@11/`. Exercitado: 1 requisição para a fixada, 0
  para a faixa.
- **"Renderiza" não se afirma pelo `<svg>`: o Material o põe em shadow root
  FECHADO** (`attachShadow({mode:"closed"})`, lido no bundle). Nada enxerga lá de
  dentro, e um roteiro que procurasse o SVG reprovaria um diagrama perfeito. O
  sinal honesto é o ciclo da operação — o `<pre class="mermaid">` é substituído
  por um `<div class="mermaid">` que passa a ter altura e largura.
- **O piso da asserção de altura é 150px, e o número veio de um defeito real.**
  Com `direction LR`, a máquina do empréstimo saiu com **47px** de altura numa
  coluna de 688px: o Mermaid encolhe para caber na largura, e quatro estados em
  linha viraram uma tira ilegível. `mkdocs build --strict`, o Vale e as 90
  asserções de HTML atravessaram isso sem piscar — o diagrama *estava* lá. Só a
  leitura visual pegou, que é a mesma lição que a D04 registrou para os BPMN.
  Sem `direction`, o mesmo diagrama dá 464px e se lê inteiro.
- **Os rótulos do diagrama do equipamento foram encurtados por medição, não por
  gosto.** "enviar para conserto" e "conserto pronto" se sobrepunham no par
  bidirecional `DISPONIVEL` ↔ `MANUTENCAO`; com "conserto" e "pronto" os oito
  rótulos ficam legíveis. `EMPRESTADO → DISPONIVEL` ficou "baixa física" e não
  "baixa" de propósito — "baixa" sozinha é ambígua com o verbete.
- **A nota de regressão do tempo de prateleira continua só na D07, e a D10
  linka.** O enunciado manda incluí-la "se ela não tiver ficado na página da
  D07"; ela ficou, e o AGENTS.md já registrava que a D10 não deve duplicá-la.
  Dizer a mesma coisa em dois lugares é como as duas versões passam a discordar.
- **A tabela cruzada tem 12 linhas, e o "sem lacuna" é afirmado por
  construção.** O roteiro monta o produto cartesiano dos três estados de
  empréstimo aberto (mais "Nenhum") pelas quatro situações do equipamento e
  compara com o que a tabela publica — em vez de contar linhas, que passaria com
  uma combinação repetida e outra faltando. `CONCLUIDO` **não** é uma linha: ele
  quer dizer "não há empréstimo aberto", e virou uma caixa explicando isso, que
  era a pergunta que a tabela deixava no ar.
- **A tabela de erros da conta roda com o escape do Vale, e o escape vale para a
  tabela inteira.** A citação literal "Informe o usuário e a senha." tem a
  palavra proibida em minúscula, e a regra 1 do guia de estilo manda transcrever
  a tela — é por essa frase que o leitor chega à linha. Comentário HTML **no
  meio** de uma tabela a encerra no Python-Markdown, então o escape não pode
  envolver uma linha só. Exercitado nos dois sentidos: o Vale acusou antes do
  escape, e uma violação plantada **depois** do `= YES` foi acusada de novo — o
  escopo fecha.
- **O botão é "Sair do painel", não "Sair".** Lido no componente, não de memória.
- **As duas armadilhas de captura foram reencontradas, e elas JÁ ESTAVAM
  escritas** na seção "Documentação" do [CONTRIBUTING.md](CONTRIBUTING.md)
  (linhas 276–284, registradas pela D09): o `clip` do Chrome é em coordenada de
  **documento** e o `getBoundingClientRect` é de **viewport**; e sem
  `captureBeyondViewport` o recorte abaixo da dobra sai **em branco no tamanho
  certo**, que se parece exatamente com "o diagrama não renderizou". Custaram
  dois falsos negativos seguidos aqui porque o roteiro de captura foi escrito do
  zero sem abrir aquela seção. **Antes de escrever qualquer roteiro de captura
  novo, leia a seção de captura do CONTRIBUTING** — a falha não foi de
  conhecimento, foi de consulta, e é a que mais se repete entre sessões.
- **"Renderizam no site publicado" foi verificado contra o site CONSTRUÍDO e
  servido por HTTP, e não contra o GitHub Pages.** O Pages nunca foi apontado
  para a `gh-pages` — é o item que a D02 deixou pendente por ser ajuste no
  GitHub e decisão do dono do repositório. O que se provou é que o artefato que a
  Action publica renderiza; que a URL do Pages responde continua **não visto**.

**Tarefa D11 — Home e guias de início rápido (concluída):** a porta de entrada
da wiki e as duas trilhas de persona — a [home](docs/index.md) com a escolha de
perfil em cartões, os atalhos das duas trilhas, a declaração de versão e onde
pedir ajuda; o [guia do estudante e professor](docs/inicio-rapido/estudante-e-professor.md)
(o tablet em cinco minutos, com as três dúvidas mais prováveis); e o
[guia da secretaria](docs/inicio-rapido/secretaria.md) (o painel em dez minutos,
com as duas inativações lado a lado). A home em inglês perdeu o parágrafo que
anunciava esta tarefa como pendente. `mkdocs build --strict` e `vale docs/` (17
arquivos) em 0.

Verificação em três frentes: 89 asserções contra o **HTML gerado** (a estrutura
do grid, os 48 links internos e 6 externos com as âncoras resolvidas uma a uma,
o teste de caminho e a declaração de versão no corpo da página); 30 asserções em
navegador real por CDP contra o site construído e servido por HTTP, em 1366x768;
e a leitura visual das quatro telas, mais a medida da tabela comparativa. O
conferidor de links foi **exercitado até reprovar** antes de ser aceito.

**Decisões da D11** (não refazer sem motivo):

- **A terceira dúvida do guia do estudante descrevia uma tela que o sistema não
  produz, e o título foi corrigido.** O enunciado prescreve, palavra por palavra,
  *"devolvi e o sistema ainda mostra o item comigo"* — mas `listarEmprestimosAtivos`
  filtra por `ATIVO`, então o item **sai** de "Meus equipamentos" no instante da
  declaração. O sintoma real é o vizinho e oposto: some da tela de quem devolveu
  e **permanece** na do painel, onde o inventário mostra "Devolução informada por
  … — aguarda conferência" (lido no `GestaoInventario.tsx`, não de memória). A
  seção virou **"Devolvi e o aparelho ainda consta comigo"** e abre desfazendo as
  duas metades, porque as duas leituras chegam ali. Escrever ao pé da letra teria
  publicado um manual mandando procurar na tela um item que não está lá — e
  nenhum portão acusaria: o texto está certo, o link resolve, o vocabulário passa.
- **O rótulo da home é "Sou estudante ou professor", contra a letra do
  enunciado, e o arquivo continua `estudante-e-professor.md`.** O enunciado
  escreve "Sou aluno ou professor" e nomeia `aluno-professor.md`; "aluno" é
  grafia proibida pelo vocabulário da D03. **Medido antes de decidir:** a frase
  exata do enunciado reprova no Vale (`3:5 error Avoid using 'aluno'`) e a
  corrigida passa — ou seja, obedecer derrubaria um portão do projeto. Vale
  também o precedente da D10: o nome do repositório vence quando casa com o
  rótulo do `nav` e não há artefato irmão que peça outro slug (ao contrário da
  D05). Levantado como conflito antes da primeira edição; a decisão foi do dono
  do repositório.
- **O `mkdocs build --strict` sai em 0 com âncora quebrada, e isso foi provado
  nesta sessão.** A D08 já tinha registrado que o aviso é `INFO`; aqui a regra
  foi exercitada de propósito — com `#ancora-que-nao-existe` plantada na home, o
  build saiu **0** e só o conferidor de HTML acusou. É por isso que a D11 tem um
  script que resolve os 48 links internos **contra os `id` do HTML gerado**, e
  não contra o markdown. Um portão que nunca negou nada não é portão.
- **O grid de cartões do Material se prova pelo estilo COMPUTADO, não pela
  classe.** Markdown certo com o CSS ausente vira lista comum, e o build sai em
  0 — a mesma armadilha do Mermaid na D10. As asserções leem `border-width`,
  `border-radius` e `display` do `li` no navegador. Detalhe que custou uma
  asserção errada: quem impede o marcador de lista **não** é `list-style-type`
  (que continua `disc`), é o `display:contents` na `<ul>` mais o `display:block`
  no `<li>`, que deixa de ser *list-item*. Conferido no CSS do tema instalado.
- **Nenhum atalho de ícone (`:material-…:`) foi usado, e há asserção contra
  isso.** O `pymdownx.emoji` **não** está no `mkdocs.yml`, então o atalho
  apareceria como texto literal na página publicada, com o build em 0. Ligar a
  extensão por causa de dois cartões seria acrescentar dependência de sintaxe a
  17 páginas que não pediram.
- **"Acima da dobra" foi medido, não estimado.** Em 1366x768: os cartões
  terminam em **500px** na home em português e **678px** na inglesa (que tem a
  caixa da nota de tradução antes), e os dois links de trilha em 479px e 657px.
  A folga da versão em inglês é menor de propósito — ela paga a caixa que a §7
  da spec-wiki exige — e é ela que precisa ser remedida se a D12 acrescentar
  texto acima dos cartões.
- **A home em inglês foi corrigida agora, embora `docs/en/` seja escopo da
  D12.** Ela dizia "This home page has not been written yet … (task D11)", o que
  vira mentira publicada no instante em que esta tarefa termina — e a D12 é a
  **tarefa de corte** da §9 da spec-wiki, então pode nunca acontecer. O que
  entrou é o mínimo: a escolha de perfil, os atalhos e a versão. A nota "About
  this translation", que a §7 exige na home em inglês, ficou intacta. Decisão do
  dono do repositório.
- **A cobertura do conferidor é derivada da árvore de origem, e não um número
  cravado.** A primeira versão exigia "pelo menos 34 páginas" e reprovou um site
  correto: são 16 `.md` em português, cada um gerando a página no PT e outra no
  `/en/` pelo `fallback_to_default`, mais o `404.html` do tema — 33. Número
  cravado envelhece na primeira página nova e vira falso negativo que se disfarça
  de defeito.
- **O teste de caminho passa com folga, e não por causa da home.** As cinco
  páginas de processo estão a **um** clique de qualquer lugar, pelo menu lateral
  — o `navigation.sections` da D02 deixa as três seções abertas. Os atalhos da
  home linkam para as cinco de novo, o que é redundância deliberada: quem chega
  pela home lê o corpo, não a barra.
- **Não há captura de tela nova.** O enunciado não pede nenhuma, e o guia rápido
  que repetisse as telas do passo a passo estaria repetindo o passo a passo — que
  é justamente o que a §4 manda não fazer. Por isso esta tarefa não encostou no
  `dev.db` nem no banco de demonstração, e não precisou da receita de captura do
  CONTRIBUTING.
- **A tabela das duas inativações fica no guia da secretaria, e não em
  Referência.** Ela já existe, mais completa, em
  [regras-de-negocio.md](docs/referencia/regras-de-negocio.md) — mas o enunciado
  pede as duas confusões "ditas lado a lado" para quem assumiu a função esta
  semana, e mandar essa pessoa para outra trilha no terceiro dia é o pedágio que
  o guia rápido existe para não cobrar. A versão daqui é a tabela de três
  colunas mais o *porquê* em uma frase; o resto está a um link. **Corrigir uma
  exige olhar a outra**, como já vale para a comparação da D08 e da D09.

**Tarefa D12 — Tradução para inglês (concluída):** a wiki espelhada em
`docs/en/` — a home, os dois guias de início rápido, as cinco páginas de
processo, as quatro de referência e os dois marcadores de "Sobre", mais o
[glossário de interface](docs/en/referencia/glossario-ui.md), que é a única
página que existe **só** em inglês. Nenhuma imagem foi duplicada: as 54
referências de captura e de diagrama apontam para `docs/assets/`, o mesmo
arquivo que o lado português usa. `mkdocs build --strict` e `vale docs/` em 0,
com o Vale declarando **31 arquivos** — que é o total de `.md` em `docs/`, ou
seja, a cobertura foi conferida e não suposta.

Verificação em três frentes: 478 asserções contra o **HTML gerado** (a árvore
item por item contra o `nav`, os 294 links e recursos internos com as âncoras
resolvidas uma a uma, as 54 imagens, os 40 rótulos de tela citados conferidos
contra o glossário de interface, e as oito seções do template nas cinco páginas
de processo); 27 asserções em navegador real por CDP contra o site construído e
servido por HTTP, em 1366x768; e a leitura visual das quatro telas novas, com
recorte ampliado dos dois diagramas Mermaid. O conferidor foi **exercitado até
reprovar** — âncora quebrada, rótulo fora do glossário e imagem duplicada
plantados de propósito — antes de ser aceito.

**Decisões da D12** (não refazer sem motivo):

- **A citação de rótulo é `**Devolver** (Return)`, e a spec-wiki foi corrigida
  para isso.** A §7 da [spec-wiki.md](spec-wiki.md) e o enunciado da D12 mandavam
  o inverso — `**Return** (Devolver)` —, mas a regra 1 do
  [guia de estilo](docs/contribuir/guia-de-estilo.md) (D03) e a nota da home em
  inglês (D11) já tinham publicado a forma invertida, **concordando entre si**. O
  argumento delas é de ergonomia: quem lê está com a tela em português na frente,
  e o negrito tem que ser a palavra que ele procura no botão. Levantado como
  conflito antes da primeira tradução; a decisão foi do dono do repositório, e a
  §7 da spec mais o enunciado foram corrigidos junto — dois donos da mesma regra
  de forma é como doze páginas nascem contradizendo o guia que elas mandam
  obedecer, sem nenhum portão acusar.
- **`contribuir/` NÃO foi traduzido, e fica no `fallback_to_default`.** A §3 do
  enunciado não lista as duas páginas; a §4 manda conferir o `nav` item por item,
  e elas estão lá. O desempate: o guia de estilo ensina a escrever **em
  português** (as grafias que o Vale proíbe, o vocabulário controlado) e o
  template é o esqueleto de página em português. Uma cópia em inglês seria o
  segundo dono da mesma regra de redação, e ela envelheceria sem ninguém notar.
  A home em inglês declara isso em uma linha, para o leitor não achar que faltou.
- **O glossário de interface fica FORA do `nav`, e isso foi medido.** Ele é a
  única página sem par em português, e o plugin aceitaria um `nav:` próprio para
  o locale `en` — ao custo de a árvore de 16 itens passar a existir em dois
  lugares no `mkdocs.yml`. Medido antes de decidir: página fora do `nav` é
  **INFO** e o `--strict` sai em 0; e o seletor de idioma dela degrada bem — o
  lado português aponta para a home, e não para uma URL inexistente, então não há
  link quebrado para o `lychee` da D13 achar. Ela é alcançada pela home e pelo
  glossário geral.
- **As páginas de "Sobre" foram traduzidas como marcador, e continuam
  marcadores.** A D14 é quem escreve as duas; traduzir as três linhas custa nada
  e evita duas páginas em português no meio da trilha inglesa. O número da tarefa
  no marcador em português dizia "D10" e estava errado desde a D02 — foi
  corrigido para D14 no mesmo passo, em commit próprio.
- **O rodapé é por idioma, e só a leitura visual pega isso.** O `copyright` do
  `mkdocs.yml` é global por padrão, então a nota de crédito da marca aparecia em
  português no pé de **toda** página em inglês. O `mkdocs build --strict` sai em
  0 e o Vale não olha template de tema — nenhuma das 478 asserções de HTML
  perguntava pelo rodapé. O plugin aceita `copyright` dentro do bloco do locale.
- **O diagrama BPMN é o mesmo arquivo, com a legenda em um bloco recolhido.** O
  enunciado recomendava não exportar um segundo SVG por processo, e a legenda
  resolve o resto: cada página de processo em inglês traz um `???` com a tabela
  rótulo → inglês, extraída dos **textos reais do SVG** e não escrita de memória.
  Nasce fechado, então não empurra o passo a passo para baixo.
- **O glossário de interface foi montado a partir dos rótulos extraídos das
  páginas, e o conferidor faz a pergunta inversa.** Uma lista escrita à mão
  divergiria na primeira página nova. A extração devolveu 40 rótulos distintos e
  **nenhum com duas traduções diferentes** — que é a prova de consistência que a
  §4 do enunciado pede, feita por construção em vez de por revisão.
- **Inglês americano, e não britânico.** A D11 tinha escrito "enrolment" na home;
  a D13 vai ligar o estilo Microsoft do Vale nas páginas em inglês, e aquele
  estilo é escrito para o americano. Deixar britânico agora é criar um passivo
  previsível para a tarefa seguinte. A ocorrência da D11 foi corrigida junto.
- **As mensagens de erro específicas de um processo NÃO são repetidas no
  glossário de interface.** Ele lista as nove que aparecem em mais de uma tela e
  aponta para a tabela §8 de cada página para o resto — mesma regra que o
  glossário geral já aplica ("termo que só aparece em uma página mora no
  glossário daquela página"). Duplicar as ~45 mensagens criaria dois donos de
  cada frase.
- **A folga da home em inglês foi consumida e teve que ser devolvida.** A D11
  mediu que ela era a página com menor margem acima da dobra (678px de 768) e
  registrou que a D12 precisaria remedi-la se acrescentasse texto acima dos
  cartões. Acrescentei dois parágrafos e o roteiro reprovou em **711px**; a nota
  foi encolhida e voltou a **657px**, o mesmo valor que a D11 media para os links
  de trilha. O aviso da sessão anterior é o que fez a correção ser encolher o
  texto em vez de afrouxar o limiar.
- **O `mkdocs build --strict` saiu em 0 com âncora quebrada, pela terceira vez.**
  A D08 registrou, a D11 provou de propósito, e aqui foi provado de novo com uma
  âncora plantada. É por isso que a conferência resolve os 294 links contra os
  `id` do **HTML gerado**, e não contra o markdown. Quem escrever a D13 precisa
  disto: o `lychee` é que vai fechar essa porta no CI.

**Próximos passos possíveis:** PWA do tablet (manifest e ícones já previstos no
`public/`), histórico de empréstimos concluídos no painel, um relatório para a
coordenação e — agora que existe conta individual — registrar **quem** deu baixa
em cada empréstimo (a Tarefa 10 criou a identidade, a 11 deu a cada pessoa uma
senha própria, a 12 passou a registrar **quando** a baixa aconteceu — e o
**quem** continua não existindo, porque `Emprestimo` não tem coluna de
administrador). O relatório de tempo de prateleira também não existe: a Tarefa 12
criou o dado, e ninguém ainda o lê. Nada disso está na spec — confirmar antes de
construir.

**Defeito de produto conhecido e ainda em aberto:** o detalhe da recusa ao
excluir categoria em uso (`AJUDA_DA_CATEGORIA_EM_USO`, em
[actions.ts](src/app/admin/actions.ts)) manda inativar os equipamentos, e isso
não libera a exclusão — medido na D08, cuja página documenta o comportamento
real. Ver as decisões da D08 para o porquê de a correção não ter entrado ali.

### Ambiente

- **Não existe mais `ADMIN_PASSWORD`** (Tarefa 10). As contas do painel estão na
  tabela `Administrador` e nascem com `npm run db:seed`, todas com a senha
  `Mudar@123` — **trocar antes de usar na secretaria**, e a partir da Tarefa 11
  isso se faz pelo próprio painel ("Alterar senha", no rodapé da barra lateral).
  O `.env` agora só tem `DATABASE_URL`.
- **`bcryptjs` (não `bcrypt`) e sem `@types/bcryptjs`.** O `bcryptjs` é
  JavaScript puro, sem compilação nativa — o que importa numa máquina Windows
  de secretaria sem toolchain de C++. E o pacote `@types/bcryptjs` que o
  enunciado da Tarefa 10 pedia é um **stub deprecado**: o próprio npm avisa que
  "bcryptjs provides its own type definitions, so you do not need this
  installed". Instalá-lo só somaria um pacote inútil.
- `npm audit` reporta 3 avisos "high" em `deepmerge-ts`, via `@prisma/config` —
  dependência **só de desenvolvimento**, sem exposição no app. **Não rode
  `npm audit fix --force`**: ele rebaixa o Prisma para 6.x e quebra este setup.
- **A dependência `xlsx` aponta para uma URL do CDN da SheetJS, e é de
  propósito.** O pacote no npm parou na 0.18.5 (2022), com duas advisories sem
  correção; a SheetJS distribui as versões novas apenas pelo próprio CDN. Trocar
  para `npm i xlsx` reinstala a versão vulnerável. Para atualizar, troque o
  número da versão na URL dentro do `package.json`.
- A porta 3000 desta máquina costuma estar ocupada por outro processo; o Next cai
  para 3001+ sozinho.
- **As ferramentas da wiki são Python e ficam fora do `package.json`** (D02):
  `mkdocs-material`, `mkdocs-static-i18n` e `mike`, com versões **fixadas** em
  `docs-requirements.txt` — o site é publicado por uma Action, e faixa de versão
  faria o build de amanhã ser outro sem que nenhum commit mudasse. O ambiente
  (`.venv-docs/`) e o `site/` gerado estão no `.gitignore`. Conferido com Python
  3.14.0, que é a versão que a Action também usa. **Esta máquina tem um MkDocs
  solto no Python 3.13**, e é ele que o `PATH` acha quando o ambiente não está
  ativado — ver a decisão da D02 sobre isso.
- **O Vale é a exceção: não é Python e não está no `docs-requirements.txt`**
  (D03). É um binário Go de ~44 MB, baixado do release oficial para `.tools/`,
  que está no `.gitignore`. O que **é** versionado é o [.vale.ini](.vale.ini) e o
  vocabulário em `.vale/styles/config/vocabularies/Wiki/`. Conferido com a
  v3.18.0; a receita está na seção "Documentação" do
  [CONTRIBUTING.md](CONTRIBUTING.md). Quem clonar o repositório e rodar
  `vale docs/` sem baixar o binário não tem erro de configuração — tem
  ferramenta ausente.
- **O bpmn-js também mora em `.tools/`, e pela mesma regra** (D04): é dependência
  da wiki, não do sistema, então não entra no `package.json`. O que é versionado
  é o [exportador](scripts/exportar-diagramas.mjs), as fontes `.bpmn` e os SVG.
  Conferido com a v18.6.2. Ele precisa do Chrome, que já é premissa deste
  repositório desde a Tarefa 2 (as verificações de interface usam o mesmo binário
  por CDP); em outra máquina, aponte o caminho em `CHROME_PATH`.
- **O Mermaid não está no `docs-requirements.txt`, e não está lá porque não é
  Python nem fica no repositório** (D10): ele é JavaScript e roda no navegador de
  quem lê. O Material **não o empacota** — o bundle do tema busca
  `https://unpkg.com/mermaid@11/...`, uma **faixa** de versão maior resolvida na
  hora da leitura. Por isso o `mkdocs.yml` carrega a versão exata
  (`mermaid@11.17.2`) por `extra_javascript`: o arquivo termina em
  `globalThis["mermaid"] = ...`, e a guarda do próprio tema
  (`typeof mermaid=="undefined"`) então não busca a faixa. **Ao subir o
  `mkdocs-material`, confira se essa URL mudou de versão maior dentro do bundle**
  — se mudar e o pino ficar para trás, o tema volta a buscar as duas.
- **`.tools/**` está nos `globalIgnores` do ESLint, e isso não é higiene.** O
  ESLint 9 de configuração plana **não lê o `.gitignore`**: no instante em que o
  bundle minificado do bpmn-js apareceu em `.tools/`, o `npm run lint` foi de 0
  para **2054 problemas** em código que não é nosso — medido, foi assim que
  apareceu. É a mesma armadilha que a D02 já tinha registrado para `.venv-docs/`
  e `site/`. Rode os portões do projeto **depois** de baixar qualquer ferramenta
  nova, mesmo que a tarefa não fale deles.
- `prisma/data/usuarios.csv` (planilha real, dados pessoais) está no `.gitignore`.
  Versione apenas `usuarios.example.csv`.
