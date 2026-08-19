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
  `equip_id`, `data_retirada`, `categoria_id`). Não "corrija" para camelCase —
  o enunciado da Tarefa 6 pedia `categoriaId`, e a convenção do projeto venceu
  por decisão explícita.
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

`INATIVO` é a aposentadoria do equipamento, e existe porque **equipamento não é
apagado**: `Emprestimo.equip_id` aponta para ele, e um DELETE levaria junto o
histórico do semestre passado. O item inativo some do tablet (nem nas contagens
entra) e continua na lista do inventário, em cinza, com botão de reativar.
Categoria, ao contrário, pode ser apagada de verdade — nenhum `Emprestimo`
aponta para ela —, mas só quando está vazia, e quem recusa é o banco.

**`Usuario.status` tem o mesmo nome e uma regra diferente do `Equipamento`.**
Usuário também nunca é apagado (`Emprestimo.usuario_id` aponta para ele, e o
banco recusa o DELETE com P2003), mas o `INATIVO` dele é **assimétrico**:
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

- **A sessão é um HMAC do prazo de validade, com a senha mestre como chave.** O
  cookie não carrega a senha, não dá para esticar o prazo (ele está dentro da
  assinatura) e trocar `ADMIN_PASSWORD` derruba todas as sessões. Como a chave é
  o `.env` e não um segredo sorteado no boot, reiniciar o servidor não desloga
  ninguém. `secure` fica **falso** de propósito: a rede da secretaria é HTTP, e
  com a flag ligada o navegador descartaria o cookie.
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
`Usuario.status`, a leitura nativa de planilha do Excel com a biblioteca `xlsx`
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
- **`perfil` e `status` são listas fechadas, e a recusa é por linha.** "prof",
  "alunos" e "estudante" não passam: um perfil adivinhado errado muda quem pode
  o quê e não deixa rastro. A prévia mostra a linha reprovada com o valor que
  veio, e quem corrige é a planilha. Uma célula ruim no meio de trezentas não
  derruba a importação das outras 299.
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

**Próximos passos possíveis:** PWA do tablet (manifest e ícones já previstos no
`public/`), histórico de empréstimos concluídos no painel e um relatório para a
coordenação. Nada disso está na spec — confirmar antes de construir.

### Ambiente

- `ADMIN_PASSWORD` no `.env` é um **placeholder** (`unoesc-admin`). Trocar antes
  de usar na secretaria.
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
- `prisma/data/usuarios.csv` (planilha real, dados pessoais) está no `.gitignore`.
  Versione apenas `usuarios.example.csv`.
