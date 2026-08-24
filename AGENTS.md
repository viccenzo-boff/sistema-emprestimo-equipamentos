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

**Próximos passos possíveis:** PWA do tablet (manifest e ícones já previstos no
`public/`), histórico de empréstimos concluídos no painel, um relatório para a
coordenação e — agora que existe conta individual — registrar **quem** deu baixa
em cada empréstimo (a Tarefa 10 criou a identidade, a 11 deu a cada pessoa uma
senha própria, a 12 passou a registrar **quando** a baixa aconteceu — e o
**quem** continua não existindo, porque `Emprestimo` não tem coluna de
administrador). O relatório de tempo de prateleira também não existe: a Tarefa 12
criou o dado, e ninguém ainda o lê. Nada disso está na spec — confirmar antes de
construir.

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
- `prisma/data/usuarios.csv` (planilha real, dados pessoais) está no `.gitignore`.
  Versione apenas `usuarios.example.csv`.
