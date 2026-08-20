# Sistema de Empréstimo de Equipamentos — Unoesc

MVP para gerenciar o empréstimo de equipamentos (notebooks, tablets, extensões) dos cursos de
Sistemas de Informação, Ciência da Computação e Engenharia da Computação.

O escopo, os fluxos de usuário e as regras de negócio estão em [spec.md](spec.md).

O sistema roda em rede local, hospedado no computador da secretaria, com duas frentes de acesso:

- **`/`** — Portal do Aluno/Professor (tablet): retirada e devolução na bancada.
- **`/admin`** — Painel Administrativo (desktop): fila de devoluções e gestão de inventário.

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
| `npm run db:studio`  | Prisma Studio, para inspecionar o banco.                    |
| `npm run db:reset`   | **Apaga o banco** e reaplica as migrations.                 |

## Importar a planilha de alunos e professores

Exporte a planilha da coordenação como CSV e salve em `prisma/data/pessoas.csv`:

```csv
matricula,nome,perfil,cursos
0012345,Ana Souza,ALUNO,Sistemas de Informação
9001,Prof. Daniel Rocha,PROFESSOR,"Sistemas de Informação, Ciência da Computação"
```

Formato: veja [`prisma/data/pessoas.example.csv`](prisma/data/pessoas.example.csv). O
importador aceita `,` ou `;` como separador, lida com o BOM que o Excel em pt-BR gera, preserva
zeros à esquerda na matrícula e reconhece variações do cabeçalho (`Matrícula`, `Nome Completo`).
Linhas sem matrícula ou sem nome são ignoradas e reportadas.

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

Todas com a senha inicial **`Mudar@123`** — troque antes de usar na secretaria.

> Não há tela de cadastro de administrador neste MVP, por decisão da Tarefa 10. Para **trocar uma
> senha**, edite o hash pelo `npm run db:studio`. Para **recuperar** uma senha esquecida, apague a
> linha no Studio e rode `npm run db:seed` de novo — ele recria a conta com a senha padrão e
> **não** mexe na senha das contas que já existem.

O cookie não guarda a senha nem o hash: guarda `id`, `nome` e prazo de validade, mais uma
assinatura HMAC-SHA256 dos três — cuja **chave é o próprio hash bcrypt daquele administrador**.
Na prática:

- Não dá para forjar uma sessão, trocar o nome exibido, nem esticar o prazo.
- Trocar a senha de alguém — ou apagar a conta — derruba a sessão **daquela pessoa, e só dela**.
- Reiniciar o servidor **não** derruba quem está logado (a chave é o banco, não um segredo sorteado
  no boot).
- Não existe segredo de sessão no `.env` para alguém esquecer de configurar.
- Depois de 5 tentativas erradas seguidas **no mesmo usuário**, a sexta é bloqueada por 1 minuto.
  O contador é por login: quem erra a própria senha não tranca o painel para os colegas.
- "Usuário ou senha inválidos" é uma mensagem só, e o tempo de resposta é o mesmo nos dois casos —
  dizer qual metade errou entregaria metade da credencial.

A verificação é refeita em cada página e em cada Server Action do painel — Server Action é
endpoint POST público, e esconder o botão na tela não fecha a porta.

> `secure` está desligado no cookie de propósito: o sistema roda em **HTTP** na rede local. Se um
> dia for publicado com HTTPS, ligue a flag em [`src/lib/sessao-admin.ts`](src/lib/sessao-admin.ts).

## Modelo de dados

Conforme a seção 3 de [spec.md](spec.md), mais o que as tarefas 6, 8 e 10 acrescentaram:

- **Pessoa** — `matricula` (PK, string para preservar zeros à esquerda), `nome`, `perfil`
  (`ALUNO` | `PROFESSOR`), `cursos`, `status` (`ATIVO` | `INATIVO`). Chamava-se `Usuario` até a
  Tarefa 10.
- **Administrador** — `id`, `nome`, `usuario` (único), `senha` (hash bcrypt). As contas do painel.
- **Equipamento** — `id` (PK, etiqueta como `NOTE-01`), `tipo`, `status`
  (`DISPONIVEL` | `EMPRESTADO` | `MANUTENCAO`).
- **Emprestimo** — um registro por item movimentado: `pessoa_id`, `equip_id`, `data_retirada`,
  `data_devolucao`, `status` (`ATIVO` | `AGUARDANDO_BAIXA` | `CONCLUIDO`).

O status `AGUARDANDO_BAIXA` é o que separa "a pessoa disse que devolveu" de "a secretaria
recolheu o equipamento": enquanto o empréstimo está nesse estado, o equipamento **não** volta a
ficar disponível.
