# Tarefa 14: Avaliação anônima no fim da retirada

Coletar, no tablet, como a pessoa se sentiu com a retirada — um toque num
rostinho, sem palavras além de uma pergunta —, sem irritar quem retira todo dia,
sem guardar quem votou, e com um QR code para quem quiser relatar um problema em
texto. O resultado aparece no painel como um indicador simples.

**Pré-requisito: a Tarefa 13 (Relatórios) executada antes.** O indicador desta
tarefa é uma aba nova dentro do `/admin/relatorios` que a 13 cria; sem ela, seria
um sexto item de menu para uma tela que se olha uma vez por mês. Decisão do dono
do repositório em 2026-09-14, opção (a) entre três.

## 0. Decisões já tomadas (sessão de descoberta de 2026-09-14)

Foram debatidas e aprovadas pelo dono do repositório. **Não reabra sem motivo
novo**; o porquê de cada uma está ao lado, porque é o que a próxima pessoa
reverteria com boa intenção.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Escala | **4 rostos, sem neutro**, no padrão dos terminais HappyOrNot | O neutro vira depósito de indiferença (20–30 % das respostas); 4 força um lado. Escolha explícita do dono, contra a leitura inicial de 5 |
| Pior nota | Rosto **triste**, nunca bravo | Escala de um eixo só (valência). Raiva é outra dimensão (ativação + culpa), ninguém aperta "bravo" num tablet compartilhado com a secretaria a dois metros, e a ponta baixa esvazia |
| Onde mora | Dentro da **tela de sucesso** que já existe (`TelaSucesso.tsx`), que se fecha sozinha em 15 s | Custo do pedido cai a quase zero: não é etapa, o "Concluir" já é o "pular", o auto-fechamento já é o "ignorar" |
| Frequência | **30 dias por pessoa**; constante no código, não configuração | Regra autossustentável: `now()` contra uma coluna, sem cron, sem calendário, sem serviço externo. Padrão de mercado para repesquisar a mesma pessoa é 30–90 dias |
| Pular conta como pedido | Sim — o carimbo é gravado quando os rostos **aparecem**, não quando alguém responde | Sem isso, quem ignora é justamente quem vê a pesquisa em toda retirada |
| Anonimato | Grava **só nota e dia**, sem perfil, sem matrícula, sem hora | Carimbo com segundos cruza trivialmente com `Emprestimo.data_retirada`; perfil identificaria o professor do dia. A wiki declara o limite de população pequena em vez de prometer mais |
| Painel | Média + n + taxa de resposta + distribuição em 4 barras, dois recortes fixos, **com "Baixar CSV"**, sem filtros | O dado é um inteiro de 1 a 4 por dia; filtro é código para manter num sistema que vai ficar anos parado. O CSV dá o pivô no Excel para quem quiser cruzar |
| QR code | Aponta para um **formulário externo** (Google Forms, conta institucional do setor), URL **configurável no painel**, QR **gerado no servidor** por biblioteca pura | O celular do estudante **não alcança** o computador da secretaria (rede local, HTTP) — formulário interno seria um QR morto. URL no banco porque "anos sem atualização" corta dos dois lados: se o link mudar, não pode exigir deploy |
| Escopo | Só a **retirada**; a devolução não pergunta | A devolução é dois toques; o adesivo com o mesmo QR ao lado do tablet cobre o resto |
| BPMN 01 | **Não muda** | A pesquisa é opcional e não altera o resultado do processo — mesmo critério que deixou o tempo limite de inatividade fora do diagrama (D04) |
| Versão | Abre a **v1.2** da wiki; a v1.1 fecha com a Tarefa 13 | Ver a seção "Como a wiki é publicada" do CONTRIBUTING: quatro lugares a mexer na troca de ciclo |

Informação que só o dono tinha, e que calibrou as decisões: **~5 retiradas por
dia**; a suíte institucional deve ser Google (ele vai confirmar antes de criar o
formulário); quem lê o resultado e com que frequência "só na implantação".

## 1. Os rostos (interface do tablet)

* **Quatro rostos, SVG próprio** em [icones.tsx](../../../src/components/ui/icones.tsx),
  no mesmo traço dos ícones existentes. **Não use emoji**: ele renderiza
  diferente em cada sistema (o "levemente triste" do Android e o do Windows têm
  intensidades diferentes) e quatro emojis de fontes distintas não formam uma
  escala de passos iguais.
* **Só a boca muda**, em passos iguais de curvatura: franzido forte, franzido
  leve, sorriso leve, sorriso largo. Mesmo tamanho, mesmos olhos.
* **Cor sequencial**, para o "bater o olho": vermelho (o tom de `erro` do
  tema), laranja/âmbar, o verde da logo (`#3aaa35` — serve para preenchimento
  grande, é exatamente o caso previsto para ele) e `marca-verde-forte`. A boca
  carrega o significado sozinha; cor nunca é o único canal.
* **Alvo de toque ≥ 64 px** (a regra do projeto); recomenda-se 88–96 px com
  espaçamento generoso, os quatro numa linha.
* **Palavras**: uma linha só — `Como foi a retirada?` — e nada embaixo dos
  rostos. Rótulo só em `sr-only`, um por rosto: "Muito ruim", "Ruim", "Bom",
  "Muito bom" (são os valores 1, 2, 3 e 4).
* **Um toque grava e encerra.** Sem botão de enviar: ao tocar, os rostos dão
  lugar a um "Obrigado!" curto (≈1 s) e a tela volta ao início. O "Concluir" e
  o contador de 15 s continuam existindo e continuam sendo o "pular".
* **Posição**: entre o parágrafo "Pode retirar da bancada…" e o botão
  "Concluir". **Meça em 1280 x 800 (paisagem) e 800 x 1280** com dois itens
  retirados, rostos e QR: o documento tem que caber na janela e o "Concluir"
  tem que terminar acima da borda. Se não couber, o arranjo muda (rostos e QR
  lado a lado, por exemplo) — não se encolhe o alvo de toque.

*Atenção Claude: a tela de sucesso já é um componente cliente com um relógio de
15 s. A pesquisa entra nela por props, não por contexto novo. Quem decide se os
rostos aparecem é o servidor (item 3), e a tela só recebe `avaliacao: { id } |
null`.*

## 2. A regra de frequência

* `Pessoa.avaliacao_pedida_em DateTime?` — o dia em que os rostos foram
  mostrados a essa pessoa pela última vez, **truncado ao dia** (00:00 local).
  Nome em snake_case, como o resto do schema.
* Constante `INTERVALO_ENTRE_AVALIACOES_DIAS = 30`, ao lado de
  `MAXIMO_ITENS_POR_RETIRADA`, com o porquê no comentário. Não é configuração de
  painel.
* **A decisão é do servidor, dentro de `confirmarRetirada`**, na mesma
  transação que grava os empréstimos: se `avaliacao_pedida_em` é nulo ou está a
  30 dias ou mais, grava o dia de hoje na pessoa, cria a linha de `Avaliacao`
  (item 3) e devolve o `id` dela junto com os dados da retirada. Senão, devolve
  `avaliacao: null`. Uma ida ao banco; o cliente não decide nada.
* A primeira retirada de uma pessoa pergunta. Não há "pular a primeira".

## 3. Banco de dados

Duas mudanças, as duas **aditivas** (`CREATE TABLE` + `ALTER TABLE ADD COLUMN`,
sem reconstrução — como a migration da Tarefa 12). Gere com `--create-only`,
leia o SQL, ensaie em cópia do `dev.db` antes do arquivo real.

```prisma
/// Uma linha por vez que os rostos apareceram. `nota` nula = apareceram e a
/// pessoa não respondeu (é o que dá a taxa de resposta). Não há matrícula,
/// perfil nem hora aqui, de propósito — ver o comentário no enunciado.
model Avaliacao {
  id   Int     @id @default(autoincrement())
  /// 1 = Muito ruim, 2 = Ruim, 3 = Bom, 4 = Muito bom. Nula até o toque.
  nota Int?
  /// "AAAA-MM-DD" no fuso da máquina. Dia, não instante.
  dia  String
}
```

* **Por que dia e não instante:** um carimbo com segundos cruza com
  `Emprestimo.data_retirada` e revela quem deu a nota 1. Com dia, quem lê o
  banco sabe *quem foi perguntado naquele dia* e *quais notas saíram naquele
  dia*, não o pareamento — exceto no dia em que uma pessoa só foi perguntada.
  Isso é limitação inerente a população pequena, e a wiki diz isso.
* **Por que a linha nasce antes da resposta:** dá a taxa de resposta de graça
  (respondidas ÷ pedidas — a métrica que denuncia fadiga antes da reclamação)
  e dá um token de uso único para a gravação (item 4).
* **Sem `perfil`.** Decisão explícita; acrescentar depois é uma coluna.
* `db:demo` ganha linhas de `Avaliacao` (uns 60 dias, distribuição plausível,
  algumas com `nota` nula) para a captura da aba — na faixa de ids reservada,
  idempotente como o resto do script. O `db:seed` **não** cria avaliação.

## 4. Server Actions

* `confirmarRetirada` passa a devolver também `avaliacao: { id: number } | null`
  e `qr: { svg: string; url: string } | null` (item 6). A rota `/` continua
  estática; ler o banco na página só para o QR não compensa tornar a rota
  dinâmica.
* Nova: `registrarAvaliacao(avaliacaoId, nota)`. Valida `nota` em `{1,2,3,4}`
  (use `Set`/`Map`, nunca objeto literal — a chave vem de um POST público);
  grava com `updateMany({ where: { id, nota: null }, data: { nota } })` e exige
  `count === 1`. É o padrão de concorrência que o projeto já usa: o `nota: null`
  faz a linha ser de uso único, e a repetição é recusada sem erro aparecer na
  tela. Não recebe matrícula — não precisa.
* Risco aceito e registrado: o `id` é sequencial, e um cliente hostil na rede
  local poderia chutar uma linha ainda não respondida nos 15 s em que ela vive.
  O dano é um voto poluído num KPI de satisfação, e a mesma pessoa poderia
  tocar o rosto no tablet. Não construa token para isso.

## 5. Painel — aba "Satisfação" em `/admin/relatorios`

* Quarta aba, depois das três da Tarefa 13. Mesmo padrão de abas.
* Conteúdo, com dois recortes fixos ("Últimos 30 dias" e "Desde o início"):
  * **Média** na escala 1–4, uma casa decimal;
  * **Respostas** (n) e **taxa de resposta** (respondidas ÷ pedidas, em %);
  * **Distribuição**: quatro barras horizontais, uma por rosto, com o rosto e a
    contagem — Tailwind puro, sem biblioteca de gráfico (a mesma restrição da
    Tarefa 13).
* **Estado vazio** com frase própria quando não há nenhuma linha ("Nenhuma
  avaliação ainda. Os rostos aparecem no tablet ao fim da retirada, uma vez a
  cada 30 dias por pessoa.").
* **"Baixar planilha"**: CSV com `dia,nota` de todas as linhas (nota vazia para
  as não respondidas), gerado no navegador como a planilha modelo da Tarefa 9
  (import dinâmico; não pese a tela que abre todo dia).
* **Nunca** mostra voto individual nem qualquer coisa por pessoa.

## 6. QR code e a URL configurável

* Nova tabela mínima de configuração:

  ```prisma
  /// Chave-valor para o que precisa mudar sem deploy. Hoje só uma chave.
  model Configuracao {
    chave String @id
    valor String
  }
  ```

  Chave `url_formulario_feedback`. Sem linha, ou com valor vazio, **o QR não
  aparece** e nada quebra.
* **Onde se edita**: um cartão "Formulário de sugestões" dentro da própria aba
  Satisfação — campo URL, "Salvar", e a prévia do QR ao lado. Valide que é uma
  URL `https://`. Não crie tela de configurações nova.
* **QR gerado no servidor**, em SVG, com a biblioteca `qrcode` (JavaScript
  puro, sem rede; **dependência nova aprovada**). Nunca uma API externa de
  imagem — é mais um serviço que morre.
* Na tela de sucesso: QR pequeno (≥ 160 px, para o celular ler a 30–40 cm) com
  uma linha: `Sugestão ou problema? Aponte a câmera do celular.` O formulário é
  Google Forms numa **conta institucional do setor** (nunca pessoal), sem
  coletar e-mail; isso é procedimento, e vai para o CONTRIBUTING e para a wiki.
* Recomendação fora do software, para a wiki: imprimir o mesmo QR num adesivo ao
  lado do tablet.

## 7. Documentação (a wiki tem spec própria: `especificacoes/spec-wiki.md`)

* [spec.md](../../spec.md): nota na §3 (as duas tabelas e a coluna) e no Fluxo 1
  (o passo opcional), no mesmo padrão das notas das Tarefas 8–12.
* `docs/portal/retirada.md` (PT e EN): passo novo no passo a passo ("os rostos
  podem aparecer; tocar é opcional"), captura nova em
  `docs/assets/images/retirada/`, uma pergunta na §7 ("por que não apareceu
  hoje?" → 30 dias) e a linha da §8 se houver recusa visível. **O BPMN 01 não
  muda.**
* `docs/painel/`: a aba Satisfação entra na página de relatórios que a Tarefa
  13 criar (não é um sexto processo); captura da aba com o `db:demo`.
* `docs/referencia/regras-de-negocio.md` (PT e EN): a regra dos 30 dias e a
  promessa exata do anonimato — o painel nunca mostra voto individual, o banco
  não guarda quem votou, e no dia com uma retirada só quem lê o banco infere.
* `docs/referencia/glossario.md`, `docs/en/referencia/glossario-ui.md`: os
  rótulos novos ("Como foi a retirada?", "Muito ruim"… "Muito bom", "Baixar
  planilha", "Formulário de sugestões").
* `docs/inicio-rapido/estudante-e-professor.md` (PT e EN): uma frase — é
  opcional.
* `docs/sobre/arquitetura-do-sistema.md` (PT e EN): as duas tabelas no diagrama
  Mermaid do modelo.
* `README.md`: modelo de dados; `CONTRIBUTING.md`: a receita do formulário
  institucional e a troca de ciclo para a v1.2 (workflow, `set-default`, as
  duas homes).
* Vocabulário: na wiki, quem avalia é "estudante e professor" — "usuário" em
  minúscula é grafia proibida pelo Vale.

## 8. Verificação exigida

A escada de sempre, e estes degraus em particular:

* **Premissas (Fase B)**: `qrcode` produz SVG sem tocar a rede; `updateMany`
  com `nota: null` recusa a segunda gravação; o truncamento ao dia usa o fuso da
  máquina e bate com o `dia` da `Avaliacao`.
* **Migration** ensaiada em cópia: ids preservados, `foreign_key_check` vazio.
* **Protocolo (HTTP real)**: `registrarAvaliacao` com nota 5, com `"constructor"`,
  com id inexistente e com id já respondido — as quatro recusadas; a quinta,
  válida, gravada. `confirmarRetirada` duas vezes com a mesma matrícula no mesmo
  dia: a segunda volta `avaliacao: null`.
* **Navegador (CDP, sem instalar dependência)**: a tela de sucesso **cabe** nas
  duas orientações com dois itens, rostos e QR; o toque grava e a tela volta ao
  início; sem toque, o auto-fechamento conta como pedido (a linha fica com
  `nota` nula e a pessoa não é perguntada de novo); a aba Satisfação com o
  `db:demo`; o download do CSV chegando ao disco; a URL vazia escondendo o QR.
* **Wiki**: `mkdocs build --strict`, `vale docs/`, `npm run docs:links` e
  `npm run docs:diagramas -- --verificar` em 0.
* O `dev.db` do dono **não é tocado**: capturas e verificação contra o
  `dev-demo.db` da receita do CONTRIBUTING.

## 9. Fora de escopo

* Perguntar na devolução.
* Perfil, matrícula ou hora na avaliação.
* Filtros, comparação de períodos, gráfico de linha.
* Formulário de texto dentro do sistema.
* Configurar o intervalo pelo painel.
