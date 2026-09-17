# Tarefa 16: Ranking de Consumo, período e exportação

Construir o terceiro relatório do painel — **Ranking de Consumo** — e, junto com
ele, as duas peças que todo relatório com data precisa e que ainda não existem:
um **seletor de período** (dia, mês, ano ou intervalo) que vale para a tela
inteira, e a **exportação em .xlsx** do que está na tela. As duas nascem aqui,
com o primeiro consumidor real, e a Tarefa 17 (Índice de Manutenção) as consome
sem reescrever nada.

**Pré-requisito: as Tarefas 13 e 14 executadas** (estão). A aba Ocupação recebe
o período e um gráfico novo; a aba Satisfação **não muda**.

## 0. Decisões já tomadas (sessão de alinhamento de 2026-09-17)

Foram debatidas e aprovadas pelo dono do repositório. **Não reabra sem motivo
novo**; o porquê está ao lado, porque é o que a próxima pessoa reverteria com
boa intenção.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Estratégia | **Duas tarefas em sequência**: esta cria período e exportação com o Consumo; a 17 faz a Manutenção | A Manutenção exige schema novo (não há histórico de status de equipamento) e não deve travar o Consumo, que tem dado de sobra. Uma spec só seria tarefa de três sessões |
| Ranking de quê | **Equipamento, categoria e pessoa** | Pessoa entrou porque o dono prometeu essa informação à coordenação na entrega do MVP. É decisão de política da coordenação, não técnica — e está tomada |
| Métricas | Retiradas (contagem), **tempo de uso** (retirada → devolução declarada) e **tempo de prateleira** (devolução → baixa), os dois em **mediana** | `data_devolucao` e `data_baixa` existem desde a Tarefa 12 e nenhuma tela os lê. Mediana porque um notebook esquecido no fim de semana distorce a média |
| Período | Nos **`searchParams`** (`?de=AAAA-MM-DD&ate=AAAA-MM-DD`), lido no render | O período muda a **consulta**, não recorta dado que já desceu — estado de cliente (a escolha da Tarefa 7) não serve. Server Action seria POST público para uma leitura, contra a regra do painel |
| Aba na URL | **Sim** (`?aba=consumo`), revertendo a decisão da Tarefa 13 | Com o período na URL, trocar o período é uma navegação; sem a aba na URL, cada troca voltaria para a primeira aba. Agora há motivo real, e sai link compartilhável de graça |
| Seletor | **Um só, acima da barra de abas**, com quatro unidades: Dia · Mês · Ano · Período; padrão: o **mês corrente** | Quem compara consumo e manutenção do mesmo mês não configura duas vezes. Uma linha de filtro acima de tudo que ela escopa é o padrão de dashboard |
| Ocupação | O cartão "Empréstimos no mês" passa a obedecer ao período; entra o gráfico **"Retiradas por dia"** (barras ou linha) | O rótulo promete "picos de uso" e a aba não tinha série temporal nenhuma. A ocupação por categoria continua fotografia do agora — não existe "ocupação em 3 de agosto" |
| Satisfação | **Intocada**: ignora o período, mantém o CSV | Decisão da Tarefa 14 continua válida (dado é um inteiro por dia). Filtro por dia com uma resposta no dia deixaria a nota da única pessoa perguntada a um clique |
| Exportação | **.xlsx, gerado no navegador**, uma aba por tabela da tela mais uma aba crua **sem pessoa**; SheetJS já instalado | `xlsx` é dependência desde a Tarefa 8 e gera .xlsx desde a 9. Resolve o CSV de vírgula que o Excel em português abre numa coluna só. A aba crua sem nome dá o pivô sem o histórico nominal de cada pessoa sair do painel — o ranking já responde "quem" |
| Gráficos | **Recharts**, versão fixada — **dependência nova aprovada**; tipo de gráfico **por natureza do dado**, com seletor para o leitor; padrão barras | Barras o projeto faz em CSS; pizza e linha com eixo, legenda e tooltip à mão são ~400 linhas para manter. Pizza de "retiradas por dia" com 30 fatias não se lê, linha de ranking não significa nada — o seletor oferece só o que cabe |
| Índice em `data_retirada` | **Não nesta tarefa**; de carona na migration da 17 | Não haverá migration aqui, e o índice não será mensurável por anos (~1.300 linhas/ano) |
| Rótulo | "Ranking de Consumo" fica como a Tarefa 13 nomeou | A wiki cita rótulo de tela literalmente |
| Versão | A **v1.2 continua aberta**; a Tarefa 17 decide se fecha | Ver "Como a wiki é publicada" no CONTRIBUTING |

Informação que só o dono tinha, e que calibrou as decisões: **5 a 6 retiradas
por dia útil** (≈ 1.300 por ano — o "ano inteiro" cabe no render, e não há
problema de performance a resolver); quem lê abre o .xlsx no Excel e pronto;
não existe registro paralelo de manutenção para importar.

## 1. O período (seletor e URL)

* **URL canônica**: `/admin/relatorios?aba=consumo&de=2026-09-01&ate=2026-09-30`.
  `de` e `ate` em `AAAA-MM-DD` (o formato de `diaLocal`), **`ate` inclusivo** —
  o servidor converte para `[inicioDoDia(de), inicioDoDia(ate) + 1 dia)` e
  compara pelo Prisma com `Date`, como a Tarefa 13 (**não** escreva SQL cru
  sobre `data_retirada` sem refazer a prova da fronteira — o `+00:00` no texto
  do SQLite erra nas duas formas óbvias).
* **A URL carrega datas resolvidas, nunca "este mês"**: um link guardado hoje
  tem que mostrar setembro em novembro. Sem `de`/`ate`, o padrão é o mês
  corrente, e a URL **não** é reescrita (nada de redirect a cada abertura).
* **Quatro unidades, cada uma com o seu controle nativo** — sem biblioteca de
  calendário, como o projeto não tem nenhuma:
  * **Dia** → `<input type="date">`; **Mês** → `<input type="month">`;
    **Ano** → `<select>` com os anos que têm empréstimo (mais o corrente);
    **Período** → dois `<input type="date">` e um botão **Aplicar**.
  * Dia, Mês e Ano aplicam na mudança do próprio campo; Período precisa do
    Aplicar, porque dois campos aplicados um a um navegariam no meio da
    edição.
  * **A unidade selecionada é derivada da URL, não guardada**: exatamente um
    dia → Dia; exatamente um mês de calendário → Mês; exatamente um ano → Ano;
    o resto → Período. Uma fonte de verdade só.
* **Validação no servidor, em [periodo.ts](../../../src/lib/periodo.ts) (módulo
  puro, novo)**: data que não existe, `de > ate` ou formato errado caem no
  padrão **com um aviso inline** ("Período inválido. Mostrando o mês atual.").
  Não é erro 400: quem colou um link torto ainda vê o relatório. Sem teto de
  intervalo — a escala não pede.
* **O período aplicado aparece por extenso** ao lado dos números, formatado no
  servidor (regra de datas do painel): "17 de setembro de 2026", "setembro de
  2026", "2026", "3 de agosto a 17 de setembro de 2026". Em relatório, o leitor
  precisa ver a que janela o número se refere.
* **Posição**: uma linha, alinhada à esquerda, **acima da barra de abas**, e
  nunca dentro de um cartão. Refaça a medida da Tarefa 14 em 1440, 1366, 1280,
  1024 e 900 px com a linha nova: a barra de abas já tinha 633 de 656 px em
  1024.
* **Trocar o período mantém o quadro**: `router.push` dentro de
  `useTransition`; enquanto o servidor responde, o conteúdo fica com opacidade
  reduzida e `aria-busy`. **Sem `loading.tsx`** — esqueleto piscando é o
  anti-padrão, e o relatório anterior continua legível até o novo chegar.
* **Trocar de aba NÃO vai ao servidor.** A aba entra na URL por
  `window.history.replaceState` (o *shallow routing* do App Router, que
  atualiza `useSearchParams` sem buscar RSC — confira em
  `node_modules/next/dist/docs/` antes de escrever). Os quatro painéis
  continuam no DOM, escondidos pelo atributo `hidden`, e a regra da Tarefa 13
  continua: **nenhuma classe de `display` naquele elemento**. A `AbasDeRelatorios`
  passa a **inicializar** a aba pela URL e deixa de ser a dona do estado;
  `aba` inválida cai na primeira.

*Atenção Claude: em Next 16 `searchParams` é uma `Promise` — leia o guia
instalado. O `periodo.ts` é puro de propósito (sem `next/headers`, sem Prisma):
a Tarefa 17 e os scripts de verificação o importam do terminal.*

## 2. Ranking de Consumo — o relatório

Tudo em [consultas-admin.ts](../../../src/lib/consultas-admin.ts), no render,
como os dois relatórios anteriores — **não é Server Action**.
`montarRelatorioDeConsumo(periodo)` recebe o período já interpretado.

* **O que entra no período é a RETIRADA**: um empréstimo pertence ao período em
  que `data_retirada` cai, e só a esse. Devolução fora do período não muda a
  atribuição. Regra única, escrita no tipo.
* **Quatro cartões** (o `CartaoDeResumo` de sempre): Retiradas no período ·
  Pessoas distintas · Tempo de uso (mediana) · Tempo de prateleira (mediana).
* **Três rankings**, cada um uma tabela com uma coluna de barra em linha
  (a barra CSS da Tarefa 13, proporcional ao maior da tabela — é a forma
  "tabela + gráfico" que cabe quando há mais de sete linhas):
  * **Por equipamento**: etiqueta (mono, como sempre), categoria, situação
    atual, retiradas, uso mediano. **Todo equipamento em circulação entra,
    inclusive com zero** — "nunca sai da prateleira" é argumento de compra
    tanto quanto "está sempre fora", e as linhas de zero vão ao fim, em
    `tinta-tenue`. Inativo não entra (mesma regra do tablet).
  * **Por categoria**: nome, retiradas, **fatia** do total (%), uso mediano.
    Todas as categorias, com zero incluído; ordem por retiradas, desempate
    pela ordem de `id`.
  * **Por pessoa**: nome, matrícula, perfil, retiradas, uso mediano. **Só quem
    retirou ao menos uma vez** — o cadastro tem centenas de linhas e a lista de
    zeros seria o roster inteiro. Ordem por retiradas, desempate por nome.
* **Um gráfico com seletor**: **"Retiradas por categoria"** — barras
  horizontais **ou pizza** (§4). É a única composição parte-do-todo da tela, e
  a única onde pizza faz sentido.
* **Tempo de uso**: `data_devolucao − data_retirada`, só nos empréstimos que
  já têm `data_devolucao`; os `ATIVO` contam na retirada e ficam fora da
  mediana. **Tempo de prateleira**: `data_baixa − data_devolucao`, só nos
  `CONCLUIDO` com os dois carimbos — os seis anteriores à Tarefa 12 têm
  `data_baixa` nula e **se excluem sozinhos**, que é o motivo de ela ser nula.
  Formato: `formatarDuracao` novo em [texto.ts](../../../src/lib/texto.ts)
  ("2 h 15 min", "3 dias 4 h"), no servidor.
* **A consulta carrega as linhas do período e agrega em Node — exceção
  declarada à regra "conte no banco".** O Prisma não soma diferença de datas,
  e mediana exige a lista; a ~1.300 linhas por ano a leitura custa
  milissegundos. A lista de equipamentos e a de categorias vêm das próprias
  tabelas (o `groupBy` não devolve linha para grupo vazio — Tarefa 13), e o
  nome da pessoa vem de `Pessoa` no momento da leitura.
* **Estado vazio**: período sem retirada mostra uma frase própria em cada
  tabela e no gráfico ("Nenhuma retirada entre 3 e 9 de agosto de 2026."), e
  os cartões mostram 0 e "—" (mediana sem amostra não é zero).
* O `EmDesenvolvimento` da aba Manutenção passa a nomear **os três** relatórios
  que existem.

## 3. Ocupação — o que muda

* O cartão **"Empréstimos no mês"** vira **"Retiradas no período"**, com o
  período por extenso embaixo, e conta pelo `de`/`ate`.
* Entra o gráfico **"Retiradas por dia"** (barras **ou linha**, §4), entre os
  cartões e a lista de categorias. **Grão automático pelo tamanho do
  intervalo**: por dia até 31 dias, por semana (segunda a domingo) até 182,
  por mês acima — o título do gráfico diz o grão. Dias sem retirada aparecem
  com zero, não somem: o buraco **é** a informação.
* **A ocupação por categoria continua sendo o agora**, e uma linha diz isso
  ("Situação atual do estoque; o período acima não muda esta lista"). Sem a
  frase, o leitor lê as barras como se fossem do período.

## 4. Gráficos (Recharts)

* **`recharts` 3.x com versão fixada** (3.10.1 na data desta spec; confira a
  corrente e o `peerDependencies` com React 19). `npm audit` antes e depois,
  com o número no registro. Leia a documentação da versão instalada antes de
  escrever — a 3 mudou a forma de responsividade em relação à 2.
* **Só os componentes de gráfico importam a biblioteca**, em
  `src/components/admin/graficos/`, montados por `next/dynamic` com
  `ssr: false` e um espaço reservado **da mesma altura** (sem salto de layout).
  **Meça** que o pacote inicial de `/admin/inventario` e de `/admin` não
  carrega o Recharts nem o SheetJS — a mesma prova da Tarefa 9.
* **Dois componentes**, reutilizáveis pela Tarefa 17:
  * `GraficoDeSerie` — barras ↔ linha. Um eixo só. **Nunca eixo duplo.**
  * `GraficoDeComposicao` — barras horizontais ↔ pizza. **Pizza com no máximo
    6 fatias**: acima disso as menores viram "Outras". Rótulo direto com o
    percentual nas fatias que cabem; o resto fica na legenda e no tooltip.
* **O seletor de visualização** é um controle segmentado por gráfico
  (`aria-pressed`), padrão **barras**, estado de cliente — **não entra na
  URL** (é preferência, não consulta) e persiste em `localStorage` por gráfico,
  dentro de `try/catch`, para o leitor não escolher de novo a cada visita.
* **Cor segue a entidade**: cada categoria tem a cor fixada pela ordem de
  `Categoria.id`, num módulo `cores-de-grafico.ts` com **seis** tons e a regra
  escrita: uma categoria a menos no período não repinta as outras. A série de
  uma cor só usa `marca-azul`. **Valide por cálculo, não a olho**: contraste
  ≥ 3:1 de cada tom sobre `superficie`, e separação entre tons adjacentes
  ≥ 8 (ΔE em OKLab × 100) sob simulação de protanopia, deuteranopia e
  tritanopia — script descartável na verificação, com os números no registro.
  Se o Recharts não aceitar `var(--color-…)` em `fill`, o hex vai numa
  constante ao lado do token, com o comentário de que os dois têm que bater.
* **Texto usa os tokens de texto** (`tinta`, `tinta-suave`), nunca a cor da
  série. Grade e eixos são linhas finas na cor `borda`, sólidas. Tooltip em
  hover **e** em foco de teclado; valor em destaque, nome da série depois.
  Legenda sempre que houver duas ou mais séries; **nenhum número em todo
  ponto** — rótulo direto só no extremo. `prefers-reduced-motion` desliga a
  animação.
* **Todo gráfico tem tabela gêmea**: a composição já tem a tabela por
  categoria ao lado; a série ganha um `<details>` "Ver como tabela". Tooltip
  enriquece, nunca é o único caminho até o número.

*Atenção Claude: a ordem das classes do Tailwind 4 continua sendo a do CSS
gerado. O contêiner do gráfico precisa de altura que inclua a faixa do eixo X —
plot com altura fixa que exclui os rótulos ganha uma rolagem interna minúscula
dentro do cartão.*

## 5. Exportação em .xlsx

* Módulo puro novo, [exportar-xlsx.ts](../../../src/lib/exportar-xlsx.ts):
  recebe `{ abas: [{ titulo, cabecalho, linhas }] }` e devolve `ArrayBuffer`
  (o `type: "array"` do SheetJS devolve `ArrayBuffer`, não `Uint8Array` —
  medido na Tarefa 9). Largura de coluna sim; estilo de célula não (é recurso
  pago, sairia do arquivo em silêncio). Nome de aba com no máximo 31
  caracteres e sem `/\?*[]`. **`TIPO_XLSX` muda de dono** para este módulo, e
  `planilha-modelo.ts` passa a importá-lo — uma constante, um dono.
* **Gerado no navegador**, a partir das linhas que já desceram no render, com
  `import()` dinâmico do SheetJS no clique — o padrão da Tarefa 9. Sem Route
  Handler: seria padrão novo no projeto para uma escala que não pede.
* **Um botão por aba com período**: "Baixar planilha (.xlsx)" em Consumo e em
  Ocupação. Satisfação mantém o CSV. Nome do arquivo com o período:
  `consumo-2026-09-01-a-2026-09-30.xlsx`, `ocupacao-…`.
* **Consumo** sai com quatro abas: `Equipamentos`, `Categorias`, `Pessoas`
  (as três tabelas da tela, coluna a coluna) e `Retiradas` — uma linha por
  empréstimo do período com etiqueta, categoria, retirada, devolução
  declarada, baixa, situação, uso e prateleira, **sem nome nem matrícula**.
  **Ocupação** sai com `Categorias` (a fotografia, com a data e hora da
  leitura na primeira linha) e `Retiradas por dia`.
* **Número é número**: contagens e durações vão como número, as durações em
  **minutos** com o cabeçalho dizendo ("Uso mediano (min)") — a coordenação
  vai somar e tirar média no Excel, e "2 h 15 min" como texto não soma. Datas
  como texto `AAAA-MM-DD HH:MM` no fuso da máquina.
* O clique não recarrega a tela, e o arquivo chega ao disco com os bytes de um
  .xlsx: assinatura de ZIP nos quatro primeiros bytes, e a volta pelo
  `XLSX.read` em Node, como a Tarefa 9 provou.

## 6. Banco de dados

**Nenhuma migration.** O índice em `data_retirada` fica para a Tarefa 17. O
`db:demo` ganha **empréstimos concluídos espalhados pelos últimos 90 dias
úteis** (uns 40, sorteio determinístico como o das avaliações, com durações e
prateleiras variadas, três ou quatro pessoas concentrando as retiradas) — sem
isso, a captura do gráfico é uma barra só. Na faixa de ids reservada, idempotente
como o resto do script; registre no CONTRIBUTING que a sequência do SQLite avança
junto.

## 7. Documentação (a wiki tem spec própria: `especificacoes/spec-wiki.md`)

* [spec.md](../../spec.md): reescrever o parágrafo do item 4 da §4 — o Consumo
  existe, o período e a exportação existem, a Manutenção continua declarada e
  não construída (Tarefa 17).
* `docs/painel/relatorios.md` (PT e EN): o seletor de período no passo a passo
  (antes de escolher a aba); a aba Consumo com os três rankings e o gráfico; o
  botão de exportar e o que cada aba do arquivo traz; a **§6 muda em quatro
  regras** — a aba e o período agora ficam na URL (o parágrafo do "preço" da
  Tarefa 13 sai), o que entra no período é a retirada, mediana e não média, e
  "Satisfação não usa o período"; §7 ganha "Período inválido"; a linha da
  tabela de erros sobre "Relatório em desenvolvimento" passa a falar só da
  Manutenção. Capturas novas em `docs/assets/images/relatorios/`: o seletor
  nas quatro unidades, a aba Consumo, os dois gráficos **nos dois tipos**, o
  aviso de período inválido; a `05-aba-sem-relatorio.png` é refeita porque o
  texto mudou.
* `docs/referencia/regras-de-negocio.md` (PT e EN): o ranking por pessoa é
  exposição deliberada, decidida pela coordenação em 2026-09-17, e **não
  altera** a promessa de anonimato da Avaliação — as duas regras ficam lado a
  lado para ninguém achar que uma contradiz a outra.
* `docs/en/referencia/glossario-ui.md`: os rótulos novos ("Dia", "Mês", "Ano",
  "Período", "Aplicar", "Retiradas no período", "Retiradas por dia",
  "Retiradas por categoria", "Barras", "Linha", "Pizza", "Baixar planilha
  (.xlsx)", "Ver como tabela").
* `docs/inicio-rapido/secretario.md` (PT e EN): uma frase sobre o período.
* `docs/sobre/arquitetura-do-sistema.md` (PT e EN): o Recharts entra na lista
  de dependências, com o porquê; o modelo de dados não muda.
* `README.md`: a dependência; `CONTRIBUTING.md`: o `db:demo` estendido e a
  nota sobre a sequência de ids.
* Vocabulário: "usuário" em minúscula continua proibido; quem lê o relatório é
  "o secretário" e "a coordenação".

## 8. Verificação exigida

A escada de sempre, com o `dev.db` do dono **conferido por md5** no fim, e
estes degraus em particular:

* **Premissas (Fase B)**: a fronteira do período pelo Prisma nas duas pontas
  (o primeiro instante de `de` entra, o último de `ate` entra, o primeiro
  instante do dia seguinte fica de fora), contra o texto `+00:00` do SQLite;
  `history.replaceState` atualiza `useSearchParams` **sem** requisição ao
  servidor (conte as requisições de RSC no navegador — zero na troca de aba,
  uma na troca de período); o Recharts com `ssr: false` não produz erro de
  hidratação; `XLSX.write` com quatro abas volta íntegro pelo `XLSX.read`.
* **Protocolo (HTTP real)**: a rota com `de`/`ate` sem cookie vai para o
  login; com data inexistente, `de > ate` e formato errado, responde o padrão
  **com o aviso** no HTML; `aba` inválida cai na primeira.
* **Navegador (CDP, sem instalar dependência)**: cada unidade do seletor muda a
  URL e os números; o Período exige o Aplicar; **F5 mantém período e aba**; o
  seletor de visualização troca o tipo e a escolha sobrevive a uma recarga; o
  download chega ao disco e é lido de volta; o estado vazio em um período sem
  retirada; a medida das cinco larguras com a linha do seletor; o contraste
  dos seis tons e do texto sobre eles pelo pixel do `<canvas>` (o
  `getComputedStyle` devolve `lab()` neste Chrome); a separação sob CVD por
  cálculo.
* **Pacote**: o pacote inicial de `/admin/inventario` não carrega Recharts nem
  SheetJS — medido, com os tamanhos no registro.
* **Aritmética**: a mediana e os dois tempos conferidos contra um cálculo
  independente sobre o `dev-demo.db` (script descartável), inclusive a
  exclusão dos `ATIVO` da mediana de uso e dos `data_baixa` nulos da de
  prateleira.
* **Wiki**: `mkdocs build --strict`, `vale docs/`, `npm run docs:links` e
  `npm run docs:diagramas -- --verificar` em 0.
* Capturas e verificação contra o `dev-demo.db` da receita do CONTRIBUTING.

## 9. Fora de escopo

* Índice de Manutenção e o histórico de status de equipamento (Tarefa 17).
* Índice em `data_retirada` (carona na migration da 17).
* Comparação com o período anterior (delta, seta de tendência).
* Picos por hora do dia ou por dia da semana.
* Filtro por categoria, por pessoa ou por perfil dentro do relatório.
* Período ou gráfico na aba Satisfação.
* PDF, impressão, agendamento ou envio por e-mail.
* Preferência de gráfico guardada no servidor.
* Route Handler de exportação.
