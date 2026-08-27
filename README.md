# Sistema de Empréstimo de Equipamentos — Unoesc

MVP para gerenciar o empréstimo de equipamentos (notebooks, tablets, extensões) dos cursos de
Sistemas de Informação, Ciência da Computação e Engenharia da Computação.

O escopo, os fluxos de usuário e as regras de negócio estão em [spec.md](especificacoes/spec.md).

O sistema roda em rede local, hospedado no computador da secretaria, com duas frentes de acesso:

- **`/`** — Portal do Estudante/Professor (tablet): retirada e devolução na bancada.
- **`/admin`** — Painel Administrativo (desktop): fila de devoluções e gestão de inventário.

## Documentação

**A wiki do sistema está em <https://viccenzo-boff.github.io/sistema-emprestimo-equipamentos/>.**

Ela é o manual de quem **opera** o sistema, e cobre os cinco processos — retirada e devolução
no tablet, baixa física, inventário e cadastros no painel — cada um com diagrama BPMN, passo a
passo com capturas de tela e uma seção que explica **por que** o sistema se comporta daquele
jeito. Tem ainda glossário, as duas máquinas de estado, as regras de negócio consolidadas e dois
guias de início rápido, em português e inglês.

A wiki descreve a versão **`v1.0`**; a `main` pode estar à frente dela. A fonte fica em
[`docs/`](docs/), é construída com MkDocs Material e publicada por
[uma Action](.github/workflows/docs.yml) a cada `push` na `main`, depois de três portões de
qualidade. Quem for escrever uma página nova começa pelo
[guia de estilo](docs/contribuir/guia-de-estilo.md) e pelo
[template de processo](docs/contribuir/template-processo.md); a receita de ambiente e a de
captura de tela estão na seção "Documentação" do [CONTRIBUTING.md](CONTRIBUTING.md).

Duas páginas falam com quem chega pelo GitHub:
[Arquitetura do sistema](docs/sobre/arquitetura-do-sistema.md) e
[Como esta wiki foi feita](docs/sobre/como-esta-wiki-foi-feita.md) — o estudo de caso, com a
alternativa descartada em cada decisão.

## Stack

| Camada        | Tecnologia                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack)          |
| Estilização   | TailwindCSS 4                               |
| ORM           | Prisma 7 (driver adapter `better-sqlite3`)  |
| Banco         | SQLite (arquivo único `dev.db`)             |

## Como rodar

Requer Node.js 20.19+ (desenvolvido com 24.11).

```bash
npm install          # instala dependências e gera o Prisma Client
npm run db:migrate   # cria/atualiza o banco dev.db
npm run db:seed      # popula pessoas, inventário e administradores
npm run dev          # http://localhost:3000
```

Copie `.env.example` para `.env` e ajuste os valores antes do primeiro uso:

| Variável         | Função                                                     |
| ---------------- | ---------------------------------------------------------- |
| `DATABASE_URL`   | Caminho do arquivo SQLite, relativo à raiz do projeto.     |

Não há senha de painel em variável de ambiente: as contas do `/admin` ficam na tabela
`Administrador` e nascem com `npm run db:seed` (veja [Acesso ao painel](#acesso-ao-painel-admin)).

### Scripts

| Comando              | Ação                                                        |
| -------------------- | ----------------------------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento.                                |
| `npm run build`      | Build de produção.                                          |
| `npm start`          | Servidor de produção (usado na máquina da secretaria).      |
| `npm run lint`       | ESLint.                                                     |
| `npm run db:migrate` | Cria e aplica migrations.                                   |
| `npm run db:seed`    | Importa pessoas, inventário e administradores (idempotente). |
| `npm run db:sanear`  | Mostra (e com `-- --aplicar`, grava) a normalização dos cadastros já existentes. |
| `npm run db:studio`  | Prisma Studio, para inspecionar o banco.                    |
| `npm run db:reset`   | **Apaga o banco** e reaplica as migrations.                 |

## Importar a planilha de estudantes e professores

Exporte a planilha da coordenação como CSV e salve em `prisma/data/pessoas.csv`:

```csv
matricula,nome,perfil,cursos
0012345,Ana Souza,Estudante,Sistemas de Informação
9001,Prof. Daniel Rocha,Professor,"Sistemas de Informação, Ciência da Computação"
```

Formato: veja [`prisma/data/pessoas.example.csv`](prisma/data/pessoas.example.csv). O
importador aceita `,` ou `;` como separador, lida com o BOM que o Excel em pt-BR gera, preserva
zeros à esquerda na matrícula e reconhece variações do cabeçalho (`Matrícula`, `Nome Completo`).
Linhas sem matrícula ou sem nome são ignoradas e reportadas.

Desde a Tarefa 8.1 os valores passam por uma **sanitização** antes de serem gravados, tanto aqui
quanto na importação de `.xlsx` pelo painel — as regras vivem em
[`src/lib/sanitizacao.ts`](src/lib/sanitizacao.ts):

| Campo    | O que a planilha pode trazer            | O que vai para o banco             |
| -------- | --------------------------------------- | ---------------------------------- |
| `nome`   | `ANA MARIA DE SOUZA`, `an@a2 souza`     | `Ana Maria de Souza`, `Ana Souza`  |
| `perfil` | `aluno`, `Alunos`, `prof.`, `Docente`   | `Estudante` ou `Professor`         |
| `cursos` | `EC, SI`, `ciencia da computacao`       | ordem fixa: SI, CC, EC, resto A–Z  |

As partículas ficam minúsculas (`de`, `da`, `dos`); o ponto de `Prof.` e o apóstrofo de `D'Ávila`
são preservados. Curso fora do mapa oficial (`Direito`, `Pedagogia`) é mantido, normalizado, no
fim da lista. Perfil irreconhecível (`Servidor`) **reprova a linha** na importação do painel; no
`db:seed` ele vira `Estudante` com aviso no console, porque um script de terminal sem prévia não
pode deixar o banco pela metade.

Depois rode `npm run db:seed`. O script é idempotente: reexecutar atualiza os dados cadastrais
sem duplicar registros e sem reverter o status de equipamentos já emprestados.

Para usar um arquivo em outro caminho:

```bash
PESSOAS_CSV=C:/planilhas/alunos.csv npm run db:seed
```

> O arquivo `prisma/data/pessoas.csv` contém dados pessoais e está no `.gitignore`.
> Não versione a planilha real.

## Estrutura

```text
especificacoes/
  spec.md                    a especificação do produto; manda sobre o sistema
  spec-wiki.md               a especificação da wiki; manda sobre docs/
  tarefas/pendentes/         enunciados ainda não executados
  tarefas/concluidas/        enunciados já executados, guardados como histórico
docs/                        a wiki (MkDocs); ver "Documentação" acima
prisma/
  schema.prisma              modelos Pessoa, Administrador, Categoria, Equipamento, Emprestimo
  migrations/                histórico de migrations
  seed.ts                    importação da planilha + inventário inicial
  data/pessoas.example.csv   formato esperado da planilha
src/
  app/                       rotas (App Router)
  app/actions.ts             Server Actions do portal do tablet
  app/admin/                 painel: fila (/admin), ativos, inventário
  app/admin/actions.ts       Server Actions do painel
  app/globals.css            paleta institucional e estilos base
  assets/brand/              identidade visual (logo da Unoesc)
  components/portal/         telas do portal (matrícula, categorias, itens)
  components/admin/          telas do painel (casca, fila, tabelas, login)
  components/ui/             primitivas reutilizadas (Botao, Alerta, ícones)
  lib/prisma.ts              instância única do Prisma Client
  lib/sessao-admin.ts        login por conta e cookie de sessão do /admin
  lib/consultas-admin.ts     leituras do painel (fila, ativos, inventário)
  lib/tipos.ts               tipos compartilhados entre actions e telas
  lib/texto.ts               ajustes de texto em português
  generated/prisma/          Prisma Client gerado (não versionado)
public/                      assets de URL fixa (ver "Imagens e assets")
prisma.config.ts             configuração da CLI do Prisma
dev.db                       banco SQLite (não versionado)
```

## Imagens e assets

Existem dois lugares para arquivos de imagem, e a escolha entre eles é sempre a mesma pergunta:
**algo externo precisa acessar esse arquivo por uma URL fixa?**

| Lugar | Quando usar | Como referenciar |
| ----- | ----------- | ---------------- |
| `src/assets/` | Imagem exibida por um componente: logo, ícone, foto de equipamento. | Import estático |
| `public/` | Arquivo que precisa de URL fixa e previsível: favicon, ícones do PWA, imagem de compartilhamento, PDF para download. | Caminho literal (`/arquivo.png`) |

Na dúvida, use `src/assets/`. O import estático é melhor em três pontos concretos:

```tsx
import logoUnoesc from "@/assets/brand/logo-unoesc-colorido.png";

<Image src={logoUnoesc} alt="Unoesc" className="h-10 w-auto" priority />;
```

- **Largura e altura vêm do arquivo**, então a imagem não distorce nem causa salto de layout.
- **Renomear ou apagar o arquivo quebra o build**, em vez de virar um 404 silencioso em produção
  — que é exatamente o tipo de erro que ninguém percebe até o tablet estar na bancada.
- O arquivo servido recebe **hash no nome**, permitindo cache permanente no navegador.

### Organização dentro de `src/assets/`

Uma subpasta por finalidade, não por tipo de arquivo:

```text
src/assets/
  brand/         identidade visual: logo e suas variações
  equipamentos/  fotos dos equipamentos (quando houver)
```

Nomes em kebab-case, descrevendo o conteúdo e depois a variação:
`logo-unoesc-colorido.png`, `logo-unoesc-monocromatico.png`. Assim as variações de um mesmo
recurso ficam juntas na listagem alfabética.

Prefira SVG para logos e ícones (escala sem perda e pesa menos). A logo atual é PNG porque foi o
formato fornecido pela coordenação — se um SVG aparecer, ele substitui o PNG no mesmo lugar.

## Acesso ao painel `/admin`

O painel pede **usuário e senha** (Tarefa 10). As contas ficam na tabela `Administrador`, com a
senha guardada como **hash bcrypt** — nunca em texto. Quem acerta recebe um cookie de sessão
`sessao_admin` que vale **8 horas** (um turno) e é `HttpOnly`.

As quatro contas padrão nascem com `npm run db:seed`:

| Usuário      | Nome       |
| ------------ | ---------- |
| `secretaria` | Secretaria |
| `cidi`       | Cidi       |
| `jeanzao`    | Jeanzão    |
| `viccenzo`   | Viccenzo   |

Todas com a senha inicial **`Mudar@123`** — troque antes de usar na secretaria. A troca é feita
pelo próprio painel: **Alterar senha**, no rodapé da barra lateral (Tarefa 11). O modal pede a
senha atual, a nova e a confirmação; a nova precisa ter **pelo menos 8 caracteres** e no máximo
72 bytes (é onde o bcrypt trunca — acentos contam 2 e emojis contam 4).

> Não há tela de cadastro de administrador neste MVP, por decisão da Tarefa 10 — e, por
> consequência, **não há "esqueci minha senha"**. Para **recuperar** uma senha esquecida, apague a
> linha no `npm run db:studio` e rode `npm run db:seed` de novo: ele recria a conta com a senha
> padrão e **não** mexe na senha das contas que já existem.

O cookie não guarda a senha nem o hash: guarda `id`, `nome` e prazo de validade, mais uma
assinatura HMAC-SHA256 dos três — cuja **chave é o próprio hash bcrypt daquele administrador**.
Na prática:

- Não dá para forjar uma sessão, trocar o nome exibido, nem esticar o prazo.
- Trocar a senha de alguém — ou apagar a conta — derruba a sessão **daquela pessoa, e só dela**.
- Reiniciar o servidor **não** derruba quem está logado (a chave é o banco, não um segredo sorteado
  no boot).
- Não existe segredo de sessão no `.env` para alguém esquecer de configurar.
- Depois de 5 tentativas erradas seguidas **no mesmo usuário**, a sexta é bloqueada por 1 minuto.
  O contador é por login: quem erra a própria senha não tranca o painel para os colegas. O campo
  "Senha atual" do modal de troca tem o mesmo freio, contado **por conta** e separado do login.
- **Trocar a própria senha reemite o cookie desta aba e derruba as outras.** Quem trocou continua
  trabalhando; a mesma conta aberta em outro computador cai na requisição seguinte. É consequência
  direta de a chave da assinatura ser o hash — e é a forma de expulsar quem ficou logado na máquina
  do turno anterior.
- "Usuário ou senha inválidos" é uma mensagem só, e o tempo de resposta é o mesmo nos dois casos —
  dizer qual metade errou entregaria metade da credencial.
- O login **não diferencia maiúscula de minúscula**, e espaços em volta são ignorados. Importa
  porque acrescentar uma conta pelo `db:studio` é digitar à mão: uma linha gravada como
  `Coordenacao` ficaria inalcançável se a busca fosse sensível à caixa.

A verificação é refeita em cada página e em cada Server Action do painel — Server Action é
endpoint POST público, e esconder o botão na tela não fecha a porta.

> `secure` está desligado no cookie de propósito: o sistema roda em **HTTP** na rede local. Se um
> dia for publicado com HTTPS, ligue a flag em [`src/lib/sessao-admin.ts`](src/lib/sessao-admin.ts).

## Modelo de dados

Conforme a seção 3 de [spec.md](especificacoes/spec.md), mais o que as tarefas 6, 8, 8.1 e 10 acrescentaram:

- **Pessoa** — `matricula` (PK, string para preservar zeros à esquerda), `nome` (Title Case),
  `perfil` (`Estudante` | `Professor`), `cursos` (em ordem hierárquica), `status`
  (`ATIVO` | `INATIVO`). Chamava-se `Usuario` até a Tarefa 10; o perfil era `ALUNO`/`PROFESSOR`
  em caixa alta até a Tarefa 8.1, que passou a gravá-lo já na forma exibida.
- **Administrador** — `id`, `nome`, `usuario` (único), `senha` (hash bcrypt). As contas do painel.
- **Categoria** — `id`, `nome` (único). Virou tabela na Tarefa 6: enquanto era uma String no
  `Equipamento`, cada grafia ("notebook", "Notebook") abria uma categoria nova no tablet. A
  ordem dos cartões no portal é a ordem do `id`, e não uma lista no código.
- **Equipamento** — `id` (PK, etiqueta como `NOTE-01`), `categoria_id` (FK obrigatória, com
  `onDelete: Restrict` — é o banco que recusa apagar categoria em uso), `status`
  (`DISPONIVEL` | `EMPRESTADO` | `MANUTENCAO` | `INATIVO`). O `INATIVO` chegou na Tarefa 6 e é
  aposentadoria, não exclusão: o item some do tablet e continua na lista do inventário, com
  botão de reativar.
- **Emprestimo** — um registro por item movimentado: `pessoa_id`, `equip_id`, `data_retirada`,
  `data_devolucao`, `data_baixa`, `status` (`ATIVO` | `AGUARDANDO_BAIXA` | `CONCLUIDO`). Os três
  marcadores de tempo têm donos distintos: a retirada no tablet, a **declaração** da devolução no
  tablet (`data_devolucao`) e a **conferência física** na secretaria (`data_baixa`, Tarefa 12) —
  a diferença entre os dois últimos é o tempo que o equipamento passou na bancada.

O status `AGUARDANDO_BAIXA` é o que separa "a pessoa disse que devolveu" de "a secretaria
recolheu o equipamento": enquanto o empréstimo está nesse estado, o equipamento **não** volta a
ficar disponível.
