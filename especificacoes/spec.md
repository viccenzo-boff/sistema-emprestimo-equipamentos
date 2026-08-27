# Especificação do Produto: Sistema de Empréstimo de Equipamentos (MVP)

## 1. Visão Geral do Projeto
O objetivo deste projeto é construir um MVP para gerenciar o empréstimo de equipamentos (notebooks, tablets, extensões) para os cursos de Sistemas de Informação, Ciência da Computação e Engenharia da Computação da Unoesc. 

O sistema rodará em uma rede local, hospedado no computador Windows da secretaria, e será acessado por duas frentes:
1. **Portal do Aluno/Professor (Tablet):** Focado em usabilidade touch, rodando como PWA para retirada e devolução ágil na bancada.
2. **Painel Administrativo (Desktop):** Acessado pelos computadores da coordenação via navegador, focado na gestão de inventário e confirmação de devoluções físicas.

## 2. Stack Tecnológica
* **Framework:** Next.js (App Router)
* **Estilização:** TailwindCSS
* **Banco de Dados:** SQLite (escolhido pela portabilidade de arquivo único `.db`)
* **ORM:** Prisma

## 3. Modelagem de Dados (Schema)

O Prisma deve ser configurado com as seguintes tabelas e regras de negócio:

### Tabela: Pessoa
Armazena estudantes e professores (dados importados inicialmente via planilha).
* `matricula` (String, PK): Chave primária (string para preservar zeros à esquerda).
* `nome` (String): Nome completo.
* `perfil` (String): "ALUNO" ou "PROFESSOR".
* `cursos` (String): Cursos vinculados (ex: "Sistemas de Informação, Ciência da Computação").

> Chamava-se `Usuario` até a Tarefa 10, que a renomeou para `Pessoa`: com a chegada da tabela
> `Administrador`, "usuário" passou a querer dizer duas coisas — quem retira equipamento e quem
> opera o painel. A Tarefa 8 acrescentou a esta tabela o campo `status` ("ATIVO" | "INATIVO").

### Tabela: Equipamento
Armazena o inventário físico.
* `id` (String, PK): Identificador único da etiqueta (ex: "NOTE-01", "EXT-05").
* `tipo` (String): Categoria (ex: "Notebook", "Tablet", "Extensão").
* `status` (String): "DISPONIVEL", "EMPRESTADO" ou "MANUTENCAO".

### Tabela: Emprestimo
Registra os logs de movimentação (um log isolado por item).
* `id` (Int, PK, Auto-increment): Chave primária.
* `pessoa_id` (String, FK): Relacionamento com `Pessoa.matricula`. (Chamava-se `usuario_id` até a Tarefa 10.)
* `equip_id` (String, FK): Relacionamento com `Equipamento.id`.
* `data_retirada` (DateTime): Preenchido na criação.
* `data_devolucao` (DateTime, Nullable): Preenchido quando o usuário **declara** a devolução no tablet (`ATIVO` -> `AGUARDANDO_BAIXA`). (Até a Tarefa 12 a baixa da secretaria sobrescrevia este campo; hoje ele guarda a declaração e nada mais escreve nele.)
* `data_baixa` (DateTime, Nullable): Preenchido quando a secretaria **confere fisicamente** o equipamento (`AGUARDANDO_BAIXA` -> `CONCLUIDO`). A diferença para `data_devolucao` é o tempo de prateleira. (Tarefa 12; nulo nos empréstimos concluídos antes dela.)
* `status` (String): 
  * "ATIVO": O usuário está com o equipamento.
  * "AGUARDANDO_BAIXA": O usuário informou no tablet que devolveu, mas a secretaria ainda não recolheu fisicamente.
  * "CONCLUIDO": A secretaria conferiu e guardou o equipamento.

## 4. Fluxos de Usuário e Regras de Negócio

### Fluxo 1: Retirada de Equipamento (Rota `/` - Tablet)
* **Design:** Cores institucionais da Unoesc (gradiente evolutivo com as cores da logo-unoesc-colorido.png no fundo), botões grandes, limpos e otimizados para toque (sem teclados virtuais desnecessários).
* **Passos:**
  1. Usuário digita a matrícula.
  2. O sistema exibe categorias (Notebooks, Extensões, etc.).
  3. Ao clicar na categoria, exibe apenas os equipamentos com status `DISPONIVEL`.
  4. O usuário seleciona os itens (por número da etiqueta) e confirma.
  5. O sistema gera **logs individuais** na tabela `Emprestimo` (status `ATIVO`) e muda o status dos `Equipamentos` para `EMPRESTADO`.

### Fluxo 2: Devolução pelo Usuário (Rota `/` - Tablet)
* **Passos:**
  1. Usuário acessa com a matrícula e visualiza seus itens com status `ATIVO`.
  2. Clica no botão "Devolver" do item desejado.
  3. **Alerta Crítico:** O sistema exibe um modal dizendo *"Atenção: Deixe o equipamento na bancada. Confirma a devolução?"*.
  4. Ao confirmar, o status do `Emprestimo` muda para `AGUARDANDO_BAIXA`. (O equipamento **não** volta a ficar disponível ainda).

### Fluxo 3: Painel Administrativo (Rota `/admin` - Desktop)
* **Segurança:** A rota `/admin` é protegida por **contas individuais de administrador** (tabela `Administrador`, senha em hash bcrypt), criadas pelo `prisma/seed.ts`. Continua valendo a parte de "não utilizar sistema de autenticação complexo": não há cadastro de administrador pela interface, nem papéis, nem recuperação de senha por e-mail.

> Até a Tarefa 10 era uma senha mestre única em `ADMIN_PASSWORD` no `.env`,
> como esta seção pedia. A troca veio da própria Tarefa 10, pelo princípio de
> responsabilização: com senha única, "quem confirmou o recebimento deste
> equipamento?" não tinha resposta possível. A variável `ADMIN_PASSWORD` **não
> existe mais**.
>
> A Tarefa 11 acrescentou o **Logout** e a troca da **própria** senha por um
> modal no painel. Isso não afrouxa a regra acima: continua não havendo cadastro
> de administrador pela interface, nem papéis, nem recuperação por e-mail — quem
> troca a senha precisa saber a senha atual, e senha esquecida ainda se resolve
> apagando a linha no `db:studio` e ressemeando.
* **Funcionalidades:**
  1. **Fila de Devoluções:** Uma visualização em destaque mostrando todos os empréstimos `AGUARDANDO_BAIXA`. A secretária pega o equipamento na bancada e clica em "Confirmar Recebimento". O `Emprestimo` vai para `CONCLUIDO` e o `Equipamento` volta para `DISPONIVEL`.
  2. **Gestão de Inventário:** Mudar o status de equipamentos para `MANUTENCAO` (removendo-os da visão do tablet) ou cadastrar novos.
  3. **Visão Geral:** Ver quem está com qual equipamento no momento (logs `ATIVO`).

## 5. Diretrizes para a IA (Claude)
* Siga rigorosamente a arquitetura de dados descrita usando Prisma.
* Crie um script de Seed (`seed.ts`) para facilitar a importação inicial da planilha de alunos/professores fornecida pela coordenação.
* Pense na componentização do React/Next.js para reaproveitamento de código.
* Priorize o tratamento de erros visuais amigáveis (ex: "Matrícula não encontrada").