# Especificação da Wiki: Documentação do Sistema de Empréstimo de Equipamentos

Este documento especifica a **documentação** do sistema, não o sistema. A
especificação do produto continua sendo [spec.md](spec.md) e continua mandando —
esta aqui manda sobre o conteúdo de `docs/`, e nada mais.

## 1. Objetivo

Publicar a documentação oficial do sistema como um site versionado, bilíngue e
construído no mesmo repositório do código, servindo a dois propósitos ao mesmo
tempo:

1. **Uso real:** a secretaria e os estudantes precisam de um manual. Hoje o
   conhecimento operacional está espalhado entre o [AGENTS.md](AGENTS.md), os
   enunciados de tarefa e a cabeça de quem construiu.
2. **Portfólio:** demonstrar, num artefato público e verificável, quatro
   competências — modelagem de processos em BPMN, redação técnica, engenharia de
   documentação (docs-as-code) e análise de produto.

O segundo propósito não pode degradar o primeiro. Se em algum ponto uma decisão
servir só ao portfólio e piorar o manual, o manual ganha.

## 2. Decisões já tomadas

Estas decisões vieram de uma sessão de levantamento e **não devem ser reabertas
sem motivo novo**. Estão aqui para que a próxima sessão não refaça o debate.

| Decisão             | Escolha                       | Por quê                                                                       |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| O que documentar    | Este sistema                  | É código próprio: zero risco de confidencialidade e capturas de tela reais    |
| Onde a wiki mora    | Mesmo repositório, `docs/`    | Doc e código no mesmo histórico é o que docs-as-code significa                |
| Versão documentada  | Tag `v1.0` congelada          | Documentar alvo em movimento produz captura de tela vencida                   |
| Idioma              | Bilíngue PT-BR + EN           | PT-BR é o público real; EN é alcance de portfólio                             |
| Interface em EN     | Não traduzir o sistema        | i18n do app é uma semana inteira e não cabe                                   |
| Fonte dos diagramas | `.bpmn` aberto                | ZIP do Bizagi não tem diff no Git nem abre sem instalar nada                  |
| Dados nas capturas  | Seed de demonstração fictício | Matrícula e nome de estudante real em captura pública é LGPD                  |
| Marca               | Unoesc mantida                | Contextualiza como sistema real — autorização concedida, ver §8               |
| Nº de processos     | 5                             | Cobrem os dois atores e as duas máquinas de estado; o sexto só somaria volume |

### 2.1 O que a `v1.0` inclui

A `v1.0` é o estado da `main` no momento em que a tag for criada: Tarefas 1 a 12
mais a 8.1. **A Tarefa 13 (Relatórios e Ocupação) fica de fora** — ela é só
enunciado, ainda não implementada.

Quando a Tarefa 13 entrar, ela vira `v1.1` e ganha uma sexta página de processo.
O `mike` publica as duas versões lado a lado; a wiki da `v1.0` não precisa ser
corrigida.

## 3. Escopo

### 3.1 Os cinco processos

| #   | Processo                 | Ator            | Rota                | Regra não óbvia que a página precisa explicar                            |
| --- | ------------------------ | --------------- | ------------------- | ------------------------------------------------------------------------ |
| 1   | Retirada de equipamento  | Estudante/Professor | `/`                 | Cada item retirado gera um `Emprestimo` **separado**                     |
| 2   | Devolução de equipamento | Estudante/Professor | `/`                 | Devolver é **declarar**; o equipamento não volta a `DISPONIVEL`          |
| 3   | Baixa física             | Secretaria      | `/admin`            | O ciclo só fecha aqui; a diferença de tempo é o tempo de prateleira      |
| 4   | Gestão de inventário     | Secretaria      | `/admin/inventario` | `INATIVO` é aposentadoria, não exclusão — o histórico aponta para o item |
| 5   | Gestão de pessoas        | Secretaria      | `/admin/pessoas`    | `INATIVO` de pessoa é **assimétrico**: trava retirada, libera devolução  |

### 3.2 Páginas de apoio

- **Início** — porta de entrada com escolha de perfil (estudante / secretaria)
- **Guia de Início Rápido do Estudante e Professor** — o tablet em 5 minutos
- **Guia de Início Rápido da Secretaria** — o painel em 10 minutos
- **Glossário** — matrícula, etiqueta, baixa, prateleira, categoria, perfil
- **Estados e transições** — as duas máquinas de estado, com diagrama
- **Regras de negócio** — consolidação do que hoje está no [AGENTS.md](AGENTS.md)
- **Conta do administrador** — login, logout, troca de senha, senha esquecida
- **Arquitetura do sistema** — stack, modelo de dados, decisões estruturais
- **Como esta wiki foi feita** — estudo de caso do processo de documentação

### 3.3 Fora de escopo

- Traduzir a interface do sistema
- Documentar a Tarefa 13 (Relatórios) — fica para a `v1.1`
- Documentação de API ou de contribuição de código (o [README.md](README.md) e o
  [AGENTS.md](AGENTS.md) já cobrem quem vai mexer no código)
- Vídeo, GIF animado ou tour interativo

## 4. Arquitetura de informação

```text
Início
├── Guia de Início Rápido
│   ├── Estudante e Professor
│   └── Secretaria
├── Processos do Portal
│   ├── 1. Retirada de equipamento
│   └── 2. Devolução de equipamento
├── Processos do Painel
│   ├── 3. Baixa física
│   ├── 4. Gestão de inventário
│   └── 5. Gestão de pessoas
├── Referência
│   ├── Glossário
│   ├── Estados e transições
│   ├── Regras de negócio
│   └── Conta do administrador
├── Sobre
│   ├── Arquitetura do sistema
│   └── Como esta wiki foi feita
└── Contribuir
    ├── Guia de estilo
    └── Template de processo
```

A separação Portal / Painel não é organizacional, é **de audiência**: quem opera
o tablet nunca precisa abrir a trilha do painel, e vice-versa. A home existe para
mandar cada pessoa para a sua trilha na primeira tela.

**"Contribuir" entrou nesta árvore na D03**, que é a tarefa a quem a D02 deixou
a decisão. O que decidiu foi a §6.2: tudo que mora em `docs/` vira página
publicada, e nota de trabalho vai para o `CONTRIBUTING.md`, fora do site. O guia
de estilo e o template são conteúdo do site — quem escreve a próxima página
precisa dos dois abertos ao lado, e mandar essa pessoa clonar o repositório para
ler uma regra de redação é um pedágio sem motivo. A seção fica por último de
propósito: ela não serve a quem veio operar o sistema.

## 5. Template de página de processo

Toda página de processo tem estas oito seções, nesta ordem. **Seção que não se
aplica é omitida, nunca preenchida com "não se aplica".**

1. **Objetivo do processo** — o que ele resolve, em duas ou três frases
2. **Pré-condições** — o que precisa ser verdade antes de começar
3. **Glossário do processo** — só os termos que aparecem nesta página
4. **Papéis e responsabilidades** — quem executa cada parte
5. **Diagrama BPMN** — SVG renderizado, com link para o `.bpmn` fonte
6. **Passo a passo** — numerado, com ramificações de decisão e capturas de tela
7. **Regras que não são óbvias** — o *porquê* por trás do comportamento
8. **Erros comuns e o que fazer** — mensagem de erro → causa → solução

A seção 7 é a razão de ser desta wiki. Manual de software costuma descrever a
tela; ela descreve a **decisão de produto**. Exemplo do tom esperado:

> **Por que o equipamento não fica disponível assim que eu devolvo?**
>
> Porque devolver no tablet é uma declaração, não uma conferência. Enquanto o
> empréstimo está em `AGUARDANDO_BAIXA`, o aparelho está fisicamente na bancada
> mas ninguém da secretaria o recolheu ainda. Se ele voltasse para `DISPONIVEL`
> nesse momento, o tablet ofereceria a outro estudante um equipamento que continua
> em cima da bancada.

## 6. Stack de documentação

| Peça               | Ferramenta                 | Observação                                           |
| ------------------ | -------------------------- | ---------------------------------------------------- |
| Gerador            | MkDocs Material            | Tema já conhecido; não gastar prazo aprendendo outro |
| Bilíngue           | `mkdocs-static-i18n`       | PT-BR na raiz, EN em `/en/`                          |
| Versionamento      | `mike`                     | `v1.0` publicada; futuras convivem                   |
| Modelagem          | Camunda Modeler ou bpmn.io | Salva `.bpmn` (XML padrão OMG)                       |
| Diagrama publicado | SVG exportado, commitado   | O leitor vê sem instalar nada                        |
| Linter de texto    | Vale                       | Ver ressalva abaixo                                  |
| Links quebrados    | `lychee`                   | Roda no CI                                           |
| Publicação         | GitHub Actions → Pages     | `push` na `main` publica                             |
| Dados de demo      | `prisma/demo-estado.ts`    | Pessoas fictícias para as capturas                   |

### 6.1 Ressalva sobre o Vale

Os estilos prontos do Vale (Microsoft, Google) são escritos para inglês. **Não
existe estilo pronto de qualidade para PT-BR.** Portanto:

- **Nas páginas em inglês:** Vale com o estilo Microsoft, completo.
- **Nas páginas em português:** apenas um `Vocab` próprio, garantindo grafia
  consistente dos termos do projeto (matrícula, baixa, empréstimo, etiqueta,
  prateleira) e proibindo os sinônimos que confundem — "usuário" para falar de
  estudante, por exemplo, que o [AGENTS.md](AGENTS.md) já proíbe no código.

Prometer lint de estilo em português seria inventar capacidade que a ferramenta
não tem. O vocabulário controlado é real e resolve o problema que importa:
duas páginas discordarem do nome da mesma coisa.

**A D03 escreveu esse vocabulário e ele decidiu uma palavra desta spec:** quem
retira equipamento é **estudante**, nunca "aluno". O motivo é de tela — a
Tarefa 8.1 trocou "Aluno" por "Estudante" no painel inteiro, e é "Estudante" o
valor de `Pessoa.perfil`. Uma wiki que dissesse "aluno" mandaria o leitor
procurar um filtro que tem outro nome. As ocorrências desta spec foram
corrigidas junto, e "aluno" está na lista de grafias proibidas.

### 6.2 Onde ficam os arquivos

```text
docs/
├── index.md
├── inicio-rapido/
├── portal/
├── painel/
├── referencia/
├── contribuir/                 ← guia de estilo e template
├── sobre/
├── assets/
│   ├── brand/                 ← logo da instituição (autorizada, §8)
│   ├── stylesheets/marca.css  ← a paleta do sistema aplicada ao tema
│   ├── images/<processo>/     ← capturas de tela
│   └── diagramas/<processo>.svg
├── en/                         ← espelho, mesma estrutura de pastas
└── processos-fonte/            ← os .bpmn, versionados
mkdocs.yml
.vale.ini
docs-requirements.txt
.github/workflows/docs.yml      ← publica no Pages a cada push na main
CONTRIBUTING.md                 ← notas de trabalho, fora do site
```

O `docs/en/` **repete os nomes de pasta do português**. Traduzir nome de
diretório quebra o pareamento do `mkdocs-static-i18n` e o seletor de idioma
perde a página.

Nota de trabalho — receita de captura, como montar o ambiente Python, como
ligar o Pages — vai no `CONTRIBUTING.md` (aberto pela D01, e com a seção de
ambiente e publicação escrita pela D02). Nada disso entra em `docs/`: tudo que
mora lá vira página publicada.

As capturas seguem a regra de assets que o [README.md](README.md) já estabelece
para o código: nome descritivo, nunca UUID. O wiki anterior do autor usava UUID e
isso tornou impossível saber o que uma imagem mostra sem abrir.

## 7. Regras de conteúdo

- **Textos de interface citados literalmente**, entre aspas e com a grafia exata
  da tela — inclusive quando a tela estiver errada. Corrigir no texto e não na
  tela faz o leitor procurar um botão que não existe.
- **Na versão em inglês, citar o rótulo real entre parênteses**: *click **Return**
  (Devolver)*. As capturas continuam em português e isso precisa ser declarado
  uma vez, na home em inglês.
- **Um passo, uma ação.** Passo que contém "e então" vira dois passos.
- **Ramificação de decisão sempre explícita**, no formato "Se SIM → ... / Se NÃO
  → ...", nunca embutida na prosa.
- **Toda captura de tela é clicável e abre em tamanho cheio** — o comportamento
  do wiki anterior, que resolveu um problema real de legibilidade em tela de
  passo a passo.
- **Nenhum dado pessoal real em captura de tela.** Sem exceção, nem borrado.

## 8. Pré-requisitos e riscos

| #   | Item                                                         | Situação                      | Plano B                                                      |
| --- | ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------ |
| 1   | **Autorização da Unoesc** para uso público do nome e da logo | **Concedida** (2026-08-24)    | Não é mais preciso: o plano B era instituto fictício neutro  |
| 2   | Seed de demonstração pronto antes da primeira captura        | Feito (D01)                   | Nenhum: é bloqueante, LGPD não negocia                       |
| 3   | Tag `v1.0` criada antes de qualquer captura                  | Feito (D01), sem publicar     | Nenhum                                                       |
| 4   | Ferramenta BPMN escolhida e testada                          | A fazer (D04)                 | bpmn.io roda no navegador, sem instalação                    |

O item 1 era o único risco externo do projeto — dependia de terceiro. **A
autorização foi confirmada pelo dono do repositório em 2026-08-24, antes da
D02**, que é a tarefa que a esperava: por isso o site já nasceu com o nome
"Sistema de Empréstimo de Equipamentos — Unoesc", com a logo real no cabeçalho
e com a nota de crédito no rodapé. O plano B (instituto fictício neutro) fica
registrado apenas como histórico — se um dia a autorização for revogada, o que
muda é `site_name`, `copyright` e o arquivo em `docs/assets/brand/`.

## 9. Fases e tarefas

Os enunciados vivem em `tarefa-doc-NN-<nome>.md`, com prefixo próprio para não
embaralhar com as tarefas de produto — que já vão na 13.

### Fase 0 — Fundação

| #   | Tarefa                          | Entrega                                                 |
| --- | ------------------------------- | ------------------------------------------------------- |
| D01 | Congelar `v1.0` e semear demo   | Tag `v1.0`; `prisma/seed-demo.ts` com pessoas fictícias |
| D02 | Esqueleto MkDocs + i18n + Pages | Site vazio no ar, PT/EN, deploy a cada push             |
| D03 | Guia de estilo e template       | Template de processo, glossário base, `.vale.ini`       |

### Fase 1 — Trilha do Portal

| #   | Tarefa                         | Entrega                          |
| --- | ------------------------------ | -------------------------------- |
| D04 | Modelagem BPMN dos 5 processos | 5 `.bpmn` + SVG exportado        |
| D05 | Processo 1 — Retirada          | Página PT completa, com capturas |
| D06 | Processo 2 — Devolução         | Página PT completa, com capturas |

### Fase 2 — Trilha do Painel

| #   | Tarefa                    | Entrega                                       |
| --- | ------------------------- | --------------------------------------------- |
| D07 | Processo 3 — Baixa física | Página PT + a regra das duas fases            |
| D08 | Processo 4 — Inventário   | Página PT + a regra da aposentadoria          |
| D09 | Processo 5 — Pessoas      | Página PT + a regra da inativação assimétrica |

### Fase 3 — Referência e acabamento

| #   | Tarefa                        | Entrega                                      |
| --- | ----------------------------- | -------------------------------------------- |
| D10 | Páginas de referência         | Glossário, estados, regras, conta do admin   |
| D11 | Home e guias de início rápido | Duas personas                                |
| D12 | Tradução para inglês          | Todas as páginas em `/en/` + glossário de UI |
| D13 | CI de qualidade               | Vale + `lychee` + build no Actions           |
| D14 | Estudo de caso                | "Como esta wiki foi feita" + seção no README |

**Estimativa: ~68h**, ou cerca de 34h por semana em duas semanas.

**Se o prazo apertar, o corte é a D12 (tradução).** Ela sai inteira sem deixar
buraco: a wiki fica completa em português e o inglês entra depois. Cortar
qualquer outra tarefa deixa lacuna visível.

## 10. Critérios de conclusão

A wiki está pronta quando:

- [ ] As 5 páginas de processo têm as 8 seções, com diagrama BPMN e capturas
- [ ] Nenhuma captura de tela contém dado pessoal real
- [ ] O site publica sozinho a cada `push` na `main`
- [ ] `lychee` não encontra link quebrado
- [ ] O Vale passa nas páginas em inglês e o vocabulário passa nas em português
- [ ] A versão `v1.0` está publicada pelo `mike` e declarada na home
- [ ] Os 5 `.bpmn` estão versionados e abrem no bpmn.io
- [ ] O estudo de caso explica as decisões, não só o resultado
- [ ] Um leitor que nunca viu o sistema consegue fazer uma retirada só com a wiki

O último critério é o único que importa de verdade. Os outros são meios.

## 11. Diretrizes para a IA

- **Esta spec manda sobre `docs/`. A [spec.md](spec.md) manda sobre o resto.**
  Em conflito, a spec do produto vence — a wiki descreve o sistema, não o define.
- **Nunca invente comportamento.** Antes de descrever um passo, execute o fluxo
  no navegador contra o `dev.db` ou leia o código que o implementa. Documentação
  escrita de memória é a que envelhece sem ninguém perceber.
- **As regras de negócio já estão escritas** na seção "Regra de negócio que não é
  óbvia pelo código" do [AGENTS.md](AGENTS.md). Traduzir para linguagem de
  usuário final é o trabalho; reinventar não é.
- **Uma tarefa por vez**, com os commits organizados na `main` ao final e sem
  `push` por conta própria — o ciclo normal do projeto, descrito no
  [AGENTS.md](AGENTS.md).
