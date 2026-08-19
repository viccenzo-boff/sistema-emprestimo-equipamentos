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
  sufixo: `px-0!`, não `!px-0`).
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
- **O `<select>` é não-controlado.** O React 19 limpa o formulário sozinho
  quando a action termina; com `value` controlado o DOM volta ao `defaultValue`
  e o React continua achando que o valor escolhido está lá — e o `FormData` lê o
  DOM. Isso foi observado no navegador antes de virar bug de produção: depois de
  cadastrar TAB-99 com "Tablet" escolhido, o campo já aparecia em branco.
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

**Próximos passos possíveis:** PWA do tablet (manifest e ícones já previstos no
`public/`), histórico de empréstimos concluídos no painel e um relatório para a
coordenação. Nada disso está na spec — confirmar antes de construir.

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
