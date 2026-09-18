# Tarefa 17: Índice de Manutenção e histórico de situação

Construir o quarto e último relatório declarado do painel — **Índice de
Manutenção** — e, para ele existir, a peça que o sistema não tem: um
**histórico das mudanças de situação** do equipamento (`DISPONIVEL`,
`MANUTENCAO`, `INATIVO`), gravado com **quem** fez e **quando**. Hoje
`Equipamento.status` guarda só o estado atual: ninguém sabe desde quando o
`NOTE-09` está em conserto, nem quantas vezes ele já foi.

**Pré-requisito: a Tarefa 16 executada** (está). O período, a exportação em
`.xlsx` e os dois componentes de gráfico são consumidos como estão — **nenhum
deles é reescrito**. A aba Manutenção deixa de ser o aviso "Relatório em
desenvolvimento..." e o componente `EmDesenvolvimento` some, porque não sobra
aba vazia.

## 0. Decisões já tomadas (sessões de alinhamento de 2026-09-17)

As quatro primeiras vêm da §0 da
[Tarefa 16](../concluidas/tarefa-16-ranking-de-consumo.md); as demais foram
debatidas e aprovadas pelo dono do repositório nesta sessão. **Não reabra sem
motivo novo**; o porquê está ao lado, porque é o que a próxima pessoa
reverteria com boa intenção.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Onde nasce o histórico | Tabela nova, gravada por **`alterarStatusEquipamento`**, com o `administrador_id` (§0 da T16) | É o único caminho de escrita das três situações do painel. Um lugar, uma regra |
| Histórico anterior | **Vazio antes da migration, sem linha de abertura** para quem já estiver em `MANUTENCAO`/`INATIVO` naquele dia (§0 da T16) | Inventar uma entrada com o carimbo da migration seria dado inventado dentro de uma métrica. A tela mostra "desde —" para esses, e a saída deles fica fora das durações |
| Índice em `data_retirada` | **De carona nesta migration**, mais `[equip_id, em]` na tabela nova (§0 da T16) | A 16 não teve migration; aqui há uma de qualquer jeito |
| Peças da 16 | `periodo.ts`, `exportar-xlsx.ts`, `GraficoDeSerie` — **consumidos, não reescritos** (§0 da T16) | Foram desenhados com esta tarefa como segundo consumidor |
| Modelo | **`MudancaDeStatus`**: uma linha por transição, com `de`, `para`, `em`, `administrador_id` **`Int?` + `onDelete: SetNull`** e `administrador_nome` (retrato na hora) | A recuperação de senha documentada é **apagar a conta e ressemear**. Com `Restrict`, o banco recusaria assim que a conta tivesse histórico; com `Cascade`, a senha esquecida apagaria o histórico; com `SetNull` sem retrato, o "quem" viraria "—". O retrato é semântica de auditoria: quem era, na hora |
| O que entra | **Só as transições do painel** (`DISPONIVEL` ↔ `MANUTENCAO` ↔ `INATIVO`). `EMPRESTADO` não | Retirada e baixa já moram em `Emprestimo`; duplicar seria dois donos do mesmo evento |
| Cartões | Em manutenção agora · Entradas no período · Tempo em manutenção (mediana) · **Índice de manutenção** (dias-equipamento parados ÷ dias-equipamento em circulação, em %) | "Quantas vezes quebra" e "quanto do estoque fica parado" são as duas perguntas da coordenação, e são perguntas diferentes |
| Regra de período | **Duas, escritas no tipo**: evento conta no período em que acontece; tempo conta pela **fatia** da estadia dentro do período — recortada em `de`, em `fim` **e em hoje** | Contar a estadia de 40 dias só no mês em que começou daria 0% no mês seguinte com o aparelho parado o mês inteiro. Um mês pela metade tem 17 dias no denominador, não 30 |
| Denominador do índice | **Estoque em circulação hoje** (tudo menos `INATIVO` — o mesmo do tablet e da Ocupação), dito numa linha na tela | Reconstituir quantos estavam em circulação em cada dia exigiria histórico anterior à migration |
| Tabela por equipamento | **Só quem teve entrada no período ou está em manutenção agora**, com o rodapé "N equipamentos sem manutenção no período" | Aqui zero é a norma, ao contrário do Consumo, onde "nunca sai" é argumento. Vinte linhas de zero escondem as três que importam |
| Gráfico | **Um só**: "Entradas em manutenção por dia/semana/mês" (`GraficoDeSerie`) | A tabela por categoria já traz o índice; com um ou dois eventos por semana, a pizza seria duas fatias |
| Quem aparece | **O nome do administrador aparece na tela e na planilha** | É o motivo declarado da Tarefa 10 (responsabilização). Capturas logadas como `secretario`; o `db:demo` grava o histórico com essa conta |
| `db:demo` | Estadias nos últimos 90 dias; **`EXT-05` de propósito sem linha de entrada**; apaga linhas fora da faixa 9001+ | A captura precisa mostrar o caso do dia da migration ("desde —"); e uma mudança feita pela tela em teste entraria na captura seguinte |
| Inventário | **Não muda de cara** (sem "em manutenção desde" no selo) | São 12 capturas da D08, e o relatório já responde "desde quando" |
| "Quem deu baixa" | **Fora de escopo**, mesmo com a migration à mão | Não existe tela de empréstimo concluído: seria coluna que ninguém lê. Enunciado próprio quando houver a tela de histórico |
| Versão | **A v1.2 fecha com esta tarefa** | É o último relatório declarado; "em andamento" está aberto desde a Tarefa 14. A tag `v1.2` é do dono, como a `v1.1` |
| Next 16.3.5 | **Não entra** | Sessão própria, curta, depois desta, com `build` e navegador refeitos |
| Rótulo | "Índice de Manutenção" fica como a Tarefa 13 nomeou | A wiki cita rótulo de tela literalmente |

**Dependência nova: nenhuma.**

## 1. Banco de dados

* **Modelo novo em [schema.prisma](../../../prisma/schema.prisma)**, com o
  comentário de documentação no padrão dos outros (o porquê de cada campo que
  parece arbitrário):

  ```prisma
  model MudancaDeStatus {
    id                 Int       @id @default(autoincrement())
    equip_id           String
    de                 String
    para               String
    em                 DateTime  @default(now())
    administrador_id   Int?
    administrador_nome String

    equipamento   Equipamento    @relation(fields: [equip_id], references: [id], onDelete: Restrict, onUpdate: Cascade)
    administrador Administrador? @relation(fields: [administrador_id], references: [id], onDelete: SetNull, onUpdate: Cascade)

    @@index([equip_id, em])
  }
  ```

  `onUpdate: Cascade` em `equip_id` pelo mesmo motivo de `Emprestimo`: corrigir
  uma etiqueta leva o histórico junto. `Equipamento` e `Administrador` ganham
  o lado inverso da relação. **O `id` é autoincremento de verdade**, ao
  contrário da `Avaliacao`: isto é log de auditoria, e a ordem de gravação é
  informação, não vazamento.
* **`Emprestimo` ganha `@@index([data_retirada])`** — a carona prometida na
  §0 da Tarefa 16.
* **Migration gerada com `--create-only` contra uma CÓPIA do `dev.db`**, lida
  antes de aplicar (é `CREATE TABLE` + dois `CREATE INDEX`, sem reconstrução de
  tabela nem transformação de dado — se o SQL gerado fizer mais do que isso,
  pare e leia por quê) e **ensaiada na cópia** antes do arquivo real:
  `foreign_key_check` vazio, contagens das sete tabelas preservadas, os dois
  índices presentes em `sqlite_master`. O `migrate dev` aplica migration
  pendente antes de gerar a nova — confira a fila (são **oito** migrations
  hoje; a `20260917090000_conta_secretario` existe e o AGENTS.md ainda não a
  registrava).
* **Nenhuma linha é semeada pela migration.** Equipamento que já estiver em
  `MANUTENCAO` ou `INATIVO` no dia fica sem entrada — ver §3 para como a tela
  e o cálculo tratam isso.
* **O `dev-demo.db` desta máquina também recebe a migration**
  (`DATABASE_URL="file:./dev-demo.db" npx prisma migrate deploy`), antes do
  `db:demo` da §5.

*Atenção Claude: `npm run db:migrate` **e** `npm run db:generate` — o Prisma 7
não gera o client sozinho. E o `dev.db` do dono recebe a migration só no fim,
por decisão dele, como nas Tarefas 14 e 16; até lá tudo corre contra cópia e
contra o `dev-demo.db`.*

## 2. A action que grava o histórico

[alterarStatusEquipamento](../../../src/app/admin/actions.ts) muda de forma,
e não só ganha um `insert`:

* **`sessaoAdmin()` no lugar de `temSessaoAdmin()`** — o booleano não carrega
  o `id`. `administrador_id` e `administrador_nome` vêm da sessão (o nome que
  ela devolve já é o do banco, regra da Tarefa 10).
* **Leitura da origem, `updateMany` filtrado pelas origens permitidas e
  `create` do histórico dentro de um `$transaction` só**, nesta ordem, e o
  `create` **só se `count === 1`**. O `de` gravado é o status lido dentro da
  transação — `DISPONIVEL` e `INATIVO` aceitam duas origens cada, e o valor
  lido antes, fora dela, poderia ser o de outra aba. O adapter
  `better-sqlite3` serializa as transações; conte com isso e não invente
  trava.
* As três recusas que já existem (`EQUIPAMENTO_EM_USO` nas duas formas,
  `STATUS_INVALIDO` por origem) **não gravam nada**: histórico é de mudança
  que aconteceu.
* `darBaixa`, `confirmarRetirada`, o seed e o `db:demo` continuam escrevendo
  `Equipamento.status` direto, **sem** histórico — o `EMPRESTADO` não entra
  (§0), e os dois scripts não são o painel. O `db:demo` grava as linhas dele
  explicitamente (§5).

*Atenção Claude: `ORIGENS_PERMITIDAS` não muda. E `revalidatePath` continua
depois da transação, como está.*

## 3. Índice de Manutenção — o relatório

Tudo em [consultas-admin.ts](../../../src/lib/consultas-admin.ts), no render,
como os três anteriores — **não é Server Action**.
`montarRelatorioDeManutencao(periodo)` recebe o `Periodo` já interpretado; o
tipo `RelatorioDeManutencao` vai para [tipos.ts](../../../src/lib/tipos.ts) e o
componente é `RelatorioDeManutencao.tsx`, ao lado dos irmãos. A página acrescenta
a quinta consulta ao `Promise.all` e a `AbasDeRelatorios` ganha a prop
`manutencao`; `EmDesenvolvimento` é apagado.

### 3.1 A estadia, e as duas regras de período

* **Estadia** = uma linha `para = MANUTENCAO` (a entrada) até a próxima linha
  do mesmo equipamento com `de = MANUTENCAO` (a saída — para `DISPONIVEL` ou
  `INATIVO`). Sem saída, a estadia está **aberta**. Montada em Node a partir
  das linhas do equipamento ordenadas por `em`, como a agregação do Consumo.
* **Regra de evento**: uma entrada pertence ao período em que `em` cai. Só
  ela é "entrada no período".
* **Regra de tempo**: cada estadia contribui com a **fatia** que cai dentro de
  `[de, fim)`, recortada também em **hoje** (`min(fim, agora)`): uma estadia
  que começou antes do período e continua conta o período inteiro; uma que
  começou ontem conta um dia. Com o período todo no futuro, o denominador é
  zero e o índice é "—".
* **As duas regras moram no tipo**, escritas, com o exemplo do aparelho parado
  40 dias — é a frase que impede alguém de "unificar" as duas na Tarefa 18.
* **O que o histórico não tem, não conta, e a tela diz isso**: uma saída sem
  entrada (o aparelho que já estava em conserto no dia da migration) não vira
  estadia — fica fora da mediana e contribui **zero** ao índice, mesmo que o
  aparelho tenha passado o período inteiro parado. Equipamento em `MANUTENCAO`
  agora sem estadia aberta aparece com "desde —". A alternativa (contar desde
  o começo do período) inventaria dias; o texto da §6 da wiki explica o
  buraco em vez de escondê-lo.

### 3.2 Cartões (o `CartaoDeResumo` de sempre)

* **Em manutenção agora** — `N de M` em circulação. Fotografia, pelo
  `Equipamento.status`, **fora do período**; a linha de detalhe diz "situação
  atual; o período acima não muda este número" (a frase da Ocupação).
* **Entradas em manutenção** no período (regra de evento).
* **Tempo em manutenção** — mediana das estadias **concluídas** cuja entrada
  cai no período; as abertas contam na entrada e ficam fora da mediana (o
  `ATIVO` do Consumo). `formatarDuracao` no servidor ("3 dias 4 h"); "—" sem
  amostra.
* **Índice de manutenção** — dias-equipamento em manutenção dentro do período
  (regra de tempo, somada sobre todas as estadias de todos os equipamentos em
  circulação) ÷ (equipamentos em circulação hoje × dias do período até hoje),
  em inteiro de 0 a 100 com a regra de arredondamento da Tarefa 13 (nunca
  fecha nem zera o que não está fechado nem zerado). A linha de detalhe diz
  o denominador: "sobre os 20 equipamentos em circulação hoje". Os aposentados
  ficam fora do numerador e do denominador.

### 3.3 Tabelas

* **Por equipamento**: etiqueta (mono), categoria, situação atual (o
  `SeloStatus`), entradas, dias em manutenção no período (uma casa, `Intl`
  pt-BR), última entrada (data, ou "desde —" no caso do §3.1), quem (o
  `administrador_nome` da última entrada). **Só quem teve entrada no período
  ou está em manutenção agora.** Ordem: em manutenção agora primeiro, depois
  por entradas, desempate por dias, depois pela ordem do inventário. Rodapé:
  "N equipamentos sem manutenção no período" — a linha que faz a soma fechar
  com o cartão.
* **Por categoria**: todas, com zero: nome, em circulação, entradas, dias em
  manutenção, índice (%, com a barra em linha da Tarefa 13 — a mesma cor
  fixada por `Categoria.id` do Consumo), tempo mediano. Ordem por índice,
  desempate por `id`. É a tabela que responde "qual prateleira mais para".
* **Histórico**: **todas** as transições do período — inclusive
  inativar e reativar, que não são manutenção: data e hora (`dataHora`
  do painel), etiqueta, de → para (rótulos da tela, com uma seta), quem.
  Mais recente primeiro. É a tabela de auditoria, e a única do painel que
  responde "quem inativou o `NOTE-10`". Cabe embaixo das duas outras, sem
  `<details>`: a um ou dois eventos por semana, um mês são dez linhas.

### 3.4 Gráfico e estado vazio

* **"Entradas em manutenção por dia/semana/mês"** — `GraficoDeSerie`, com o
  grão de `graoDaSerie` e os baldes de `baldesDaSerie`, exatamente como
  "Retiradas por dia" na Ocupação (o título diz o grão; dias sem entrada
  aparecem com zero). Barras ↔ linha pelo seletor de visualização que já
  existe, com a preferência guardada sob chave própria. Tabela gêmea no
  `<details>` "Ver como tabela", como lá.
* **Estado vazio**: período sem entrada mostra a frase própria nas tabelas
  por equipamento e por categoria e no gráfico ("Nenhuma entrada em
  manutenção entre 3 e 9 de agosto de 2026."), os cartões de entradas e
  mediana mostram 0 e "—", e o de índice mostra 0% **só se** houver
  denominador. "Em manutenção agora" e o Histórico não dependem disso — o
  primeiro é fotografia, o segundo pode ter uma inativação no período sem
  nenhuma manutenção.
* **A aba não some da URL nem muda de posição**: `manutencao` continua o
  quarto valor de `ABA_DE_RELATORIO`.

*Atenção Claude: o painel da aba continua no DOM sob `hidden`, e a regra da
Tarefa 13 continua — nenhuma classe de `display` naquele elemento. O gráfico
nasce com 100 px de largura enquanto o painel está oculto e se ajusta ao
aparecer (medido na 16); não monte sob condição.*

## 4. Exportação em .xlsx

* **"Baixar planilha (.xlsx)"** na aba, pelo `BotaoBaixarXlsx` de sempre, com
  as abas prontas no render: `Equipamentos`, `Categorias` e `Historico` (o log
  cru do período: data e hora por `dataHoraDePlanilha`, etiqueta,
  categoria, de, para, quem). Nome do arquivo por
  `nomeDoArquivoDeRelatorio("manutencao", de, ate)`.
* **Número é número**: entradas como inteiro; dias em manutenção como número
  com uma casa, cabeçalho "Dias em manutenção"; índice como número de 0 a
  100, cabeçalho "Índice (%)"; mediana em **minutos**, cabeçalho "Tempo
  mediano (min)", como o Consumo. O "desde —" sai como célula vazia.
* A prova é a da Tarefa 9: assinatura de ZIP nos quatro primeiros bytes, e a
  volta pelo `XLSX.read` em Node com as três abas e as contagens da tela.

## 5. `db:demo`

* **Estadias de manutenção nos últimos 90 dias**: dez a doze, sorteio
  determinístico (mulberry32, semente fixa, como as avaliações e os
  empréstimos da 16), durações de 1 a 20 dias, **dois ou três aparelhos
  concentrando** (o `NOTE-03` quebrando três vezes é a linha que a captura
  precisa). Cada estadia é o par de linhas `DISPONIVEL → MANUTENCAO` e
  `MANUTENCAO → DISPONIVEL`, com `em` recalculado a cada execução (a regra
  "o mesmo estado, não os mesmos milissegundos" da D01).
* **As duas atuais**: `NOTE-09` com a entrada há alguns dias (estadia aberta,
  "desde" preenchido); **`EXT-05` sem linha de entrada, de propósito** — é o
  caso do dia da migration, e a captura tem que mostrar o "desde —".
* **Os aposentados** (`NOTE-10`, `TAB-05`) ganham a linha `→ INATIVO`, em
  datas diferentes dentro dos 90 dias, para o Histórico ter uma transição que
  não é manutenção.
* **Quem**: a conta `secretario`, achada por `usuario` — **nunca por id**. Se
  ela não existir (seed não rodou), o script recusa com a frase que diz o
  comando, como faz com as travas de dado real.
* **Faixa de ids reservada** (9001+), `upsert` idempotente, e **as linhas
  fora da faixa são apagadas** — como as avaliações, e ao contrário dos
  empréstimos (limitação da D05): uma mudança de situação feita pela tela
  durante um teste entraria no Histórico da captura seguinte. Registre no
  CONTRIBUTING, ao lado da nota sobre a sequência de ids.
* A guarda de coerência existente ganha uma cláusula: aparelho com estadia
  aberta tem que estar em `EM_MANUTENCAO`, e vice-versa — menos o `EXT-05`,
  que é a exceção declarada no próprio script.

## 6. Documentação (a wiki tem spec própria: `especificacoes/spec-wiki.md`)

* [spec.md](../../spec.md): §3 ganha a tabela `MudancaDeStatus` no bloco de
  citação das tabelas posteriores, com os campos e o porquê da FK nula e do
  retrato; **e a entrada do `Equipamento` é corrigida** — ela ainda lista
  `tipo` e três status, sem `categoria_id` nem `INATIVO`, desde a Tarefa 6
  (defeito antigo, **commit próprio**). §4, item 4: o Índice de Manutenção
  existe; a frase "continua declarada e não construída" sai.
* `docs/painel/relatorios.md` (PT e EN): a aba Manutenção no passo a passo,
  **no lugar do passo 21** (que dizia que ela não tinha relatório); os quatro
  cartões, as três tabelas e o gráfico; o botão de exportar e o que cada aba
  do arquivo traz; a §6 ganha três regras — "o histórico começa na instalação
  desta versão: o que estava em manutenção antes aparece sem 'desde'", "quem
  fez fica registrado, com o nome", e "as duas regras de período"; a §7 ganha
  "Por que o índice de agosto é zero se o `NOTE-09` passou agosto inteiro
  parado?" (a resposta é o §3.1); a linha "Relatório em desenvolvimento..."
  **sai** da tabela de erros; a captura `20-aba-sem-relatorio.png` é
  **apagada** e as novas entram a partir de 20, pela ordem de aparição (a
  aba é a última da página, então nada antes dela é renumerado).
* `docs/referencia/regras-de-negocio.md` (PT e EN): regra nova, depois das
  duas do equipamento — "toda mudança de situação feita no painel fica
  registrada com quem e quando", com **o que fica de fora** (o `EMPRESTADO`,
  o que aconteceu antes da migration, o seed e o demo) e o que acontece com
  o registro quando a conta é apagada para recuperar a senha (o nome fica, o
  vínculo não).
* `docs/referencia/estados-e-transicoes.md` (PT e EN): uma frase abaixo do
  diagrama do equipamento — as três transições do painel deixam rastro; as
  duas do ciclo de empréstimo já estão em `Emprestimo`.
* `docs/referencia/conta-do-administrador.md` (PT e EN): a recuperação de
  senha ganha a consequência — o histórico que aquela conta gravou fica com o
  nome e perde o vínculo.
* `docs/painel/inventario.md` (PT e EN): uma frase no procedimento "Mandar
  para manutenção" — "fica registrado, com o seu nome e a hora, no relatório
  Índice de Manutenção". Sem captura nova: a tela não mudou.
* `docs/en/referencia/glossario-ui.md`: os rótulos novos ("Em manutenção
  agora", "Entradas em manutenção", "Tempo em manutenção", "Índice de
  manutenção", "Histórico", "Entradas em manutenção por dia", "desde —",
  "sem manutenção no período"). `docs/referencia/glossario.md` (PT e EN):
  verbete **Estadia em manutenção** se o termo aparecer em duas páginas, pela
  regra da D10.
* `docs/sobre/arquitetura-do-sistema.md` (PT e EN) e `README.md`: o modelo de
  dados ganha a tabela (o diagrama Mermaid inclusive).
* `docs/inicio-rapido/secretario.md` (PT e EN): uma frase — o que você faz no
  inventário aparece no relatório com o seu nome.
* **Fechar a v1.2**: os quatro lugares da tabela "Como a wiki é publicada" do
  [CONTRIBUTING.md](../../../CONTRIBUTING.md) vão para a coluna da direita
  (`--title "v1.2"`, `set-default v1.2`, e as duas homes dizem só "descreve a
  versão v1.2", com o que ela acrescentou: avaliação, Consumo, período,
  exportação, Manutenção), e o parágrafo acima da tabela passa a dizer que a
  `v1.2` fechou com a Tarefa 17. **A tag `v1.2` é do dono**, como a `v1.1`.
  A abertura da `v1.3` é da próxima tarefa que mudar o produto.
* `CONTRIBUTING.md`: o `db:demo` estendido (§5) e a limpeza fora da faixa.
* Vocabulário: "usuário" em minúscula continua proibido; quem muda a situação
  é "o secretário", quem lê é "a coordenação".

## 7. Verificação exigida

A escada de sempre, com o `dev.db` do dono **conferido por md5** no fim (ele
só recebe a migration, e só quando o dono disser), e estes degraus em
particular:

* **Premissas (Fase B)**: a migration ensaiada em cópia (§1); `SetNull` de
  verdade — apagar um administrador com histórico em cópia deixa a linha com
  `administrador_id` nulo e o nome intacto, e o `foreign_key_check` vazio;
  `onUpdate: Cascade` — renomear uma etiqueta leva as linhas do histórico
  junto; a transação da action **não** grava histórico quando o `updateMany`
  conta zero (provoque a corrida: mude o status por fora entre a leitura e o
  clique).
* **Protocolo (HTTP real)**: `alterarStatusEquipamento` sem cookie recusa e
  não grava; com sessão, cada uma das cinco transições permitidas grava
  **uma** linha com `de`, `para` e o `administrador_id` da conta logada; as
  recusas (`EQUIPAMENTO_EM_USO`, `STATUS_INVALIDO`, `"constructor"` como
  destino) gravam **zero**; a rota com período sem cookie vai para o login.
* **Aritmética**: as duas regras de período conferidas contra um cálculo
  independente sobre o `dev-demo.db` (script descartável, pelo driver): a
  fatia recortada em `de`, em `fim` e em hoje; a estadia que atravessa a
  fronteira do período contando nos dois lados; a saída sem entrada
  (`EXT-05`) fora da mediana e com zero no índice; a estadia aberta contando
  na entrada e fora da mediana; o índice com denominador zero num período
  futuro; e a mediana contra o `formatarDuracao`.
* **Navegador (CDP, sem instalar dependência)**: a aba Manutenção com os
  números batendo com o banco; o "desde —" do `EXT-05` na tela; o Histórico
  com a inativação e a manutenção lado a lado; o seletor de visualização;
  o download chegando ao disco e lido de volta com as três abas; o estado
  vazio em um período sem entrada com o cartão "agora" ainda preenchido;
  **as cinco larguras** (1440, 1366, 1280, 1024 e 900 px) com as três tabelas
  novas — a Tarefa 16 mediu a barra de abas e os campos, não uma aba com três
  tabelas, e a Observação 118 do log diz por que a medida antiga não cobre;
  o contraste do texto sobre a barra do índice pelo pixel do `<canvas>`.
* **Um clique de verdade no inventário**, logado como `secretario`: mandar um
  aparelho para manutenção, ver a linha aparecer no relatório com o nome e a
  hora, trazer de volta, ver a estadia fechada — e desfazer pelo `db:demo`,
  que apaga as linhas fora da faixa.
* **Pacote**: o pacote inicial de `/admin/inventario` continua sem Recharts e
  sem SheetJS (a action mudou, o componente não — mas meça).
* **Wiki**: `mkdocs build --strict`, `vale docs/`, `npm run docs:links` e
  `npm run docs:diagramas -- --verificar` em 0.
* Capturas e verificação contra o `dev-demo.db` da receita do CONTRIBUTING,
  com a migration aplicada nele antes.

*Atenção Claude: leia a seção de captura do CONTRIBUTING antes de escrever o
roteiro (o `clip` em coordenada de documento e o `captureBeyondViewport` já
custaram falsos negativos em duas sessões), e `clicarAte` não serve para envio
de formulário nem para o botão de status — um clique e a espera do efeito.*

## 8. Fora de escopo

* "Quem deu baixa" em `Emprestimo` (enunciado próprio, com a tela de
  histórico de concluídos).
* "Em manutenção desde" no selo do inventário.
* Linha de abertura na migration para quem já está em manutenção.
* Histórico do `EMPRESTADO` (já é o `Emprestimo`).
* Motivo ou observação da manutenção (campo de texto ao mudar a situação).
* Comparação com o período anterior, picos por hora ou dia da semana, filtro
  por categoria dentro do relatório — os mesmos da §9 da Tarefa 16.
* Subir o Next para a 16.3.5 (sessão própria).
* Abrir a `v1.3`.
