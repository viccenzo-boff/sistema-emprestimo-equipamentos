# Tarefa 18: Implantação local no Windows 11

Fazer o sistema **rodar sozinho** no computador da coordenação — sem VS Code,
sem `npm run dev`, sem ninguém logado — e deixar escrito, num guia que uma
pessoa leiga consegue seguir, como instalar, operar, consultar o banco e
atualizar. É a primeira tarefa que mexe em **operação**, e não em produto: o
que ela entrega são scripts em `scripts/implantacao/`, uma bandeira no seed e
uma página da wiki. Nenhuma tela muda.

**Pré-requisito: a Tarefa 17 executada** (está). A v1.0 é o que se instala.

## 0. Decisões já tomadas (sessão de alinhamento de 2026-09-18)

O plano foi apresentado ao dono do repositório em 23 itens com recomendação;
ele aprovou **todos** em bloco ("pode fazer todas as suas recomendações") e
acrescentou uma exigência: **a base de produção nasce vazia** — só as contas
de administrador. **Não reabra sem motivo novo**; o porquê está ao lado.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Máquina | **O PC principal da coordenação**, no piloto; máquina dedicada só se as quedas vierem de "o PC estava desligado" | É o que a spec diz e custa zero. Como serviço do Windows, o sistema sobe **antes do login** — PC bloqueado não é problema, só PC desligado |
| Execução | **Serviço do Windows via NSSM**, rodando `next build` + `next start`, como `LocalService` | Sobe no boot, reinicia se cair, grava log. PM2 no Windows só sobe no logon; Docker Desktop sobe com a sessão do usuário e é uma camada a mais para diagnosticar num PC de secretaria |
| Porta | **3000** | É o padrão do projeto; 80 disputa com IIS e software de impressora |
| Pastas | `C:\emprestimos\{app,dados,backups,consulta,logs,ferramentas}`; o banco é **`dados\emprestimos.db`**, com `DATABASE_URL` **absoluto** no `.env` | O banco fora da pasta do código: re-clonar ou apagar `app\` não encosta nos dados, e "qual arquivo é o de verdade" deixa de ser pergunta. Provado em 2026-09-18: `file:C:/…` funciona no `migrate deploy` e no adapter |
| Seed em produção | **Bandeira `--somente-administradores`** (`npm run db:seed:producao`): só as quatro contas. **Sem categorias, sem equipamentos, sem pessoas** | Exigência do dono: a base nasce zerada. O seed normal insere 20 equipamentos e 4 pessoas fictícias sem condição — em produção isso vira inventário de mentira. As categorias nascem pelo painel, na ordem em que a coordenação as criar |
| Migration em produção | **`prisma migrate deploy`**, nunca `migrate dev` (`db:deploy` no `package.json`) | O `migrate dev` é de desenvolvimento e, num banco com drift, **propõe reset** |
| Rede | **Roteador próprio** da coordenação (topologia B): PC por cabo, tablets no Wi-Fi dele | O portal `/` é aberto por desenho (só matrícula): na rede do campus, qualquer aluno com o IP retira um notebook pelo celular. A rede tem que reproduzir o balcão físico. Reserva de IP no próprio roteador; zero TI |
| Firewall | Regra de entrada na porta 3000, **em todos os perfis** | O serviço roda sem sessão: o pop-up "permitir acesso" nunca aparece, a regra tem que ser explícita. `profile=any` porque a primeira rede nova é "Pública" no Windows 11 e o tablet não conectaria — a segurança vem da topologia, não do perfil |
| Tablets | **Carregador de parede** em suporte; rede por **Wi-Fi**; nada no USB do PC | USB de PC entrega 0,5–0,9 A e tablet quer 2–3 A — com a tela ligada, descarrega no cabo. E USB não põe o tablet na rede (tethering é o sentido contrário) |
| Quiosque | Fully Kiosk Browser (Android) ou Acesso Guiado (iPad); a "Fixação de tela" do Android é o grátis | O app já volta para a matrícula em 2 min sem toque; o navegador só precisa ficar preso na URL com a tela ligada. **PWA fica fora**: exige HTTPS |
| Persistência | Nada a fazer: o banco é arquivo, todo `commit` já está no disco | O que se perde no restart é só o contador de tentativas de login. Os riscos reais são script errado, `.env` sumir e disco morrer — e cada um tem fecho |
| Backup | **Tarefa Agendada diária às 19:00**, como SYSTEM, `scripts/implantacao/backup.mjs`: online backup do `better-sqlite3` para `backups\emprestimos-AAAA-MM-DD.db` (30 dias) **e** `consulta\emprestimos-consulta.db` no mesmo passo | Cópia consistente sem parar o serviço. O mesmo arquivo é o backup e a cópia de consulta |
| Acesso SQL | **DB Browser for SQLite sobre a cópia** em `consulta\`, em modo somente-leitura; `dados\` com ACL que só o serviço e administradores leem; **ninguém abre o banco vivo** | O `journal_mode` é `delete` e o `better-sqlite3` espera 5 s por lock antes de estourar `SQLITE_BUSY`: uma consulta longa no arquivo vivo derruba a retirada no tablet. A cópia resolve segurança e disponibilidade de uma vez. Prisma Studio é do dev |
| Consultas prontas | Pasta `scripts/implantacao/consultas/*.sql`, com o aviso do fuso (as datas estão em UTC) | Cobre "relatório que não existe" sem ninguém escrever SQL |
| Atualização | **`atualizar.cmd <tag>`**: backup → parar serviço → `git checkout <tag>` → `npm ci` → `db:deploy` → `build` → subir | Por tag, um `push` na `main` não muda o que está instalado. Serviço parado porque o `next build` reescreve `.next\` embaixo do servidor e a migration não pode disputar lock |
| Atalhos | Na **área de trabalho pública** (`C:\Users\Public\Desktop`): Painel, "Atualizar cópia para consulta", "Reiniciar o sistema" | Aparecem para todo usuário do PC; a área de trabalho do usuário pode estar no OneDrive |
| Onde documentar | **Página da wiki** `docs/instalacao/windows-11.md` (só em português, com fallback no `/en/` como `contribuir/`); ponteiro no README; valores da máquina (IP, senha do Wi-Fi) só em folha impressa, fora do Git | O repositório é público. O guia é para "qualquer pessoa" fazer a instalação — plateia de leigo, publicada |
| Scripts | **`.cmd` que se eleva e chama um `.ps1`** (`instalar`, `atualizar`, `desinstalar`) | Duplo clique para o leigo; PowerShell 5.1 para a lógica (transcript, `Get-NetTCPConnection`, tratamento de erro). Sem `&&` nem ternário: o PC da coordenação tem a 5.1 |

**Dependência nova: nenhuma.** NSSM e DB Browser são ferramentas da máquina,
não do projeto — o NSSM é baixado pelo próprio `instalar.ps1` para
`ferramentas\`. **Uma dependência mudou de faixa** — achado da verificação,
não do alinhamento: `better-sqlite3` de `^13.0.3` para `^12.6.0`, porque o
`npm ci` num clone limpo morria compilando a cópia 13 que nada usava (o
adapter carrega a própria 12.11.1). Registrado nas decisões da Tarefa 18 no
AGENTS.md, em commit próprio de defeito antigo.

## 1. Seed e scripts do `package.json`

* `prisma/seed.ts` ganha a bandeira **`--somente-administradores`**: com ela,
  os passos 1 (pessoas), 2 (categorias) e 3 (equipamentos) **não rodam**; só o
  4 (administradores) e o resumo. Idempotente como antes — senha de quem já
  existe não é tocada.
* `package.json`: `db:deploy` (`prisma migrate deploy`), `db:seed:producao`
  (`tsx prisma/seed.ts --somente-administradores`) e `engines.node >= 24`.

## 2. `scripts/implantacao/`

| Arquivo | O que faz |
| --- | --- |
| `instalar.cmd` → `instalar.ps1` | Exige administrador; confere Node ≥ 24 e Git; **recusa se a porta 3000 estiver ocupada** (diz qual programa); cria as pastas; escreve o `.env` absoluto se não existir; `npm ci` → `db:deploy` → `db:seed:producao` → `build`; baixa o NSSM se faltar; instala o serviço `Emprestimos` (`LocalService`, log com rotação, reinício automático); ACL em `C:\emprestimos` e em `dados\`; regra de firewall; energia (sem suspender); tarefa agendada do backup; atalhos; sobe o serviço e **espera responder**; roda o backup uma vez; imprime os IPs e as URLs do tablet e do painel. Tudo com transcript em `logs\instalacao-<data>.log` |
| `atualizar.cmd <tag>` → `atualizar.ps1` | A sequência da §0, com o serviço parado; mostra as tags disponíveis se a pedida não existir |
| `desinstalar.cmd` → `desinstalar.ps1` | Remove serviço, regra de firewall, tarefa agendada e atalhos. **Nunca apaga `dados\` nem `backups\`** — diz como apagar à mão |
| `backup.mjs` | Lê o `.env` do app, abre o banco só-leitura, `db.backup()` para as duas cópias, apaga backups com mais de 30 dias. Roda pelo Node do sistema |
| `consultas/*.sql` | Quatro consultas comentadas: quem está com o quê, retiradas do mês, histórico de um equipamento, devoluções com tempo de prateleira |

Uma variável de ambiente **`EMPRESTIMOS_RAIZ`** troca `C:\emprestimos` por
outro caminho — existe para a verificação, não para o leigo.

## 3. Documentação

* **`docs/instalacao/windows-11.md`**, nova seção "Instalação" no `nav` (com
  `nav_translations`), registro de leigo: o que você precisa, instalar Node e
  Git (`winget`), baixar o sistema, rodar `instalar.cmd`, o que ele imprime,
  primeiros passos no painel (senhas, categorias, equipamentos, pessoas), o
  tablet (mesma rede, URL, modo quiosque), o dia a dia, se der erro, a cópia de
  consulta e o DB Browser, atualizar, desinstalar. Passa nos três portões.
* Home em inglês: uma linha dizendo que o guia de instalação está em português.
* README: a seção "Como rodar" aponta para o guia como o caminho de produção.
* AGENTS.md: bloco da Tarefa 18 e a fila.

## 4. Verificação exigida

* `tsc`, `lint` (o `backup.mjs` entra no ESLint), `mkdocs build --strict`,
  `vale docs/`, `npm run docs:links` em 0.
* O `.ps1` **analisado** pelo parser do PowerShell 5.1 (sem executar) — o
  `instalar` exige administrador e a sessão não tem.
* O pipeline do `instalar` **executado à mão** num clone em pasta de
  verificação (`EMPRESTIMOS_RAIZ`): `npm ci` → `db:deploy` → `db:seed:producao`
  → `build` → `next start` numa porta livre → HTTP 200 no `/` e no `/admin` →
  o banco com **4 administradores e zero em todas as outras tabelas** →
  `backup.mjs` produzindo as duas cópias e abrindo a de consulta.
* O `dev.db` do dono conferido por md5 no fim.
* O `instalar.cmd` de verdade, com administrador, é rodado **pelo dono** nesta
  máquina — é ele quem faz o passo a passo do guia, com o tablet ao lado, e o
  resultado entra no AGENTS.md.

## 5. Fora de escopo

* PWA e HTTPS na rede local.
* Máquina dedicada, monitoramento, alerta por e-mail.
* Tradução do guia para o inglês (fallback, como `contribuir/`).
* Mover a tag `v1.0` e o `push` — continuam com o dono.
