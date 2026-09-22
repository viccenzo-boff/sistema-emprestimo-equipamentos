# Tarefa 20: HTTPS na rede local (e o install do PWA no Android)

Pôr o sistema atrás de **`https://`** na rede da coordenação, com certificado
de uma autoridade própria instalada uma vez em cada tablet. É uma tarefa de
**operação**, como a Tarefa 18: o que ela entrega são mudanças em
`scripts/implantacao/` e no guia da wiki. **Nenhum arquivo de `src/` é
tocado. Nenhuma tela muda. Nenhuma tabela muda.**

**Pré-requisitos: a Tarefa 18 executada** (está) e a
**[Tarefa 19](tarefa-19-tela-cheia-no-tablet.md) executada** — é ela que
entrega o manifest e os ícones que esta tarefa faz valer no Android.

**Quando:** **depois da entrega à coordenação** (decisão do dono,
2026-09-22). Subir um serviço novo, uma autoridade certificadora e um passo
por tablet às vésperas da entrega é o tipo de mudança que quebra na hora
errada.

## 0. Por que esta tarefa existe — e o motivo não é o PWA

São dois ganhos, e o segundo é o que a justifica sozinho.

1. **O install do PWA no Android.** O Chrome só oferece "Instalar aplicativo"
   para páginas servidas pelo protocolo `https://`
   ([MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).
   Com HTTPS, Android e iPad passam a ter o **mesmo gesto e o mesmo
   resultado**, e o Fully Kiosk deixa de ser obrigatório.
2. **Hoje a senha do secretário viaja em texto claro no Wi-Fi.** O
   `POST` do login, o cookie de sessão e as telas com nome, matrícula e curso
   de estudante trafegam sem cifra. Qualquer aparelho na mesma rede lê. O
   sistema guarda dado pessoal de terceiros numa instituição de ensino —
   isto é defeito, não refinamento, e existiria mesmo que ninguém quisesse
   PWA nenhum.

## 1. Decisões já tomadas (sessão de alinhamento de 2026-09-22)

O dono aprovou dividir a Tarefa 19 e fazer esta depois da entrega. **Não
reabra sem motivo novo**; o porquê está ao lado.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Terminador TLS | **Caddy**, binário único em `ferramentas\`, com versão fixada, baixado pelo `instalar.ps1` — mesmo padrão do NSSM | Tem **autoridade certificadora interna embutida** (`tls internal`): emite o certificado sozinho, com validade curta, e **renova sozinho** enquanto estiver no ar. As alternativas todas descarregam a renovação num humano |
| Por que não certificado feito à mão (`openssl`, `mkcert`) | **Descartado** | A Apple limita certificado de raiz instalada pelo usuário a **825 dias** ([suporte da Apple](https://support.apple.com/en-us/102028)) — e o `mkcert` emite com 2 anos e 3 meses, acima do limite. Um certificado que expira em 2028 é um sistema que para de abrir num dia em que ninguém vai lembrar do que foi feito hoje |
| Por que não nginx / TLS direto no Node | **Descartado** | nginx não tem CA e volta ao problema acima. TLS no Node exigiria servidor custom, perdendo o `next start` que o serviço do Windows executa — e a renovação continuaria manual |
| Nome no certificado | **O IP reservado da máquina**, mais `localhost`, mais `127.0.0.1` | É o endereço que o guia já ensina e que o tablet já digita. A **reserva de DHCP** virou passo obrigatório na Tarefa 19, então o IP é estável por construção. Se mudar assim mesmo, rodar o `instalar.cmd` de novo reemite |
| Por que não `emprestimos.local` | **Descartado** | Resolver `.local` exige mDNS funcionando em três sistemas: iPadOS resolve nativamente, Windows 11 também, e no Android a história é irregular. Seria uma peça nova que tem que funcionar em todo aparelho para o sistema abrir, trocada por um problema (IP instável) que a reserva de DHCP já resolve |
| Portas | **443** (HTTPS, aberta no firewall) e **80** (aberta, só redireciona e serve a página do certificado). A **3000 deixa de ser aberta na rede**: o `next start` passa a escutar só em `127.0.0.1` | Sem fechar a 3000, o caminho em texto claro continua de pé ao lado do cifrado, e um tablet acabaria com o ícone gravado no endereço errado. O endereço do tablet fica `https://192.168.0.10/` — sem porta, mais curto de digitar |
| Como o certificado chega ao tablet | O Caddy **serve o arquivo da raiz em `http://<ip>/certificado`**, por HTTP simples | É o único caminho sem cabo, sem e-mail e sem nuvem: a pessoa digita o endereço no tablet e baixa. **Tem um custo, e ele fica escrito no guia:** quem estivesse na rede podendo interceptar poderia servir outra raiz. Na topologia da T18 (roteador próprio da coordenação) isso é aceito; é também como qualquer CA local é distribuída |
| Cookie de sessão | **Continua `secure: false`.** Esta tarefa não abre `src/` | A proteção vem da cifra no fio mais a porta 3000 fechada na rede — não sobra endereço `http://` para o cookie vazar. Ligar `secure` quebraria o login **em silêncio** se alguém um dia voltasse para HTTP: o navegador simplesmente não manda o cookie, a tela devolve o login de novo, e não há erro em lugar nenhum |
| Serviço do Windows | **Um segundo serviço**, `EmprestimosProxy`, via NSSM, como `LocalService`, igual ao primeiro | Mesmo padrão, mesmo log, mesmo reinício automático. O serviço do Next não muda de forma — só ganha `-H 127.0.0.1` nos `AppParameters` |
| Caminho de volta | Bandeira **`-SemHttps`** no `instalar.ps1`, e o `desinstalar.ps1` removendo os dois serviços e as três regras de firewall | Se o certificado der problema no dia da aula, tem que haver um gesto que devolve o sistema ao estado da T18 sem ninguém editar script. A volta reabre a 3000 e reverte o `-H` |
| Ícone já instalado | O guia manda **remover e adicionar de novo** o ícone de qualquer tablet que tenha instalado antes | O `start_url` guarda o endereço da instalação. Depois desta tarefa ele é outro, e o ícone velho abre em erro de conexão |

**Dependência nova do projeto: nenhuma.** O Caddy é ferramenta da máquina,
como o NSSM — não entra no `package.json` nem no `docs-requirements.txt`, e
mora em `ferramentas\`, fora do Git.

## 2. Premissas a provar ANTES de escrever código

Nada abaixo foi medido nesta máquina. Cada item é um pré-requisito do
desenho, e se um falhar a §1 muda — **prove primeiro, escreva depois**, e
registre o número medido no relatório.

1. **O Caddy emite certificado para um endereço IP** com a CA interna, e o IP
   aparece no SAN. Há relato de problema com IP externo
   ([caddy#5479](https://github.com/caddyserver/caddy/issues/5479)); o caso
   aqui é IP privado. Se não emitir, a decisão do nome no certificado cai e
   `.local` volta à mesa.
2. **A validade do certificado folha é curta e a renovação é automática** —
   leia a validade emitida, não a documentação.
3. **O arquivo da raiz é exportável** do diretório de dados do Caddy, e é o
   mesmo que o navegador precisa.
4. **O Chrome no Android confia numa CA instalada pelo usuário** e, com ela
   instalada, **oferece "Instalar aplicativo"** — é a premissa que sustenta o
   ganho 1 da §0. Atenção ao ler fonte na internet: o caso conhecido de
   "Android ignora CA do usuário" é sobre **aplicativos** (API 24+, sem
   `networkSecurityConfig`), e não sobre o navegador. Só um aparelho de
   verdade responde.
5. **O iPad aceita o perfil** e o "Confiança total" aparece em
   **Ajustes → Geral → Sobre → Ajustes de Confiança em Certificados**.
6. **O `next start -H 127.0.0.1` sobe pelo NSSM** e o Caddy alcança.

Os itens 4 e 5 **precisam dos aparelhos do dono**. Se faltarem no dia, a
tarefa fecha como **"concluída, menos os degraus do tablet"**, dito no
AGENTS.md — o mesmo recorte que a T18 fez com o `instalar.cmd`.

## 3. `scripts/implantacao/` — o que muda

| Arquivo | Mudança |
| --- | --- |
| `instalar.ps1` | Baixa o Caddy para `ferramentas\` (versão fixada, como o NSSM); escreve `ferramentas\Caddyfile` a partir de um modelo versionado, substituindo o IP detectado; registra o serviço `EmprestimosProxy`; acrescenta `-H 127.0.0.1` aos `AppParameters` do serviço do Next; firewall: abre 443 e 80, **remove** a regra da 3000; exporta a raiz para `ferramentas\certificado\` e a deixa servida; o atalho do painel passa a `https://localhost/admin`; a espera do fim confere **200 em `https://localhost/` e em `https://localhost/admin`**, e não mais na 3000; o quadro final imprime o endereço novo e o endereço do certificado. Bandeira `-SemHttps` desfaz tudo isto |
| `Caddyfile` (novo, versionado) | Modelo com o IP como marcador. Proxy reverso para `127.0.0.1:3000`, `tls internal`, e a rota HTTP que serve o arquivo da raiz em `/certificado` |
| `atualizar.ps1` | Para e sobe **os dois** serviços, na ordem certa (proxy por último a subir, primeiro a parar) |
| `desinstalar.ps1` | Remove os dois serviços e as três regras de firewall. **Continua nunca apagando `dados\` nem `backups\`** |
| `reiniciar.cmd` | Reinicia os dois serviços |

O `backup.mjs` e as consultas **não mudam** — nada ali fala com a rede.

## 4. Documentação

* [`docs/instalacao/windows-11.md`](../../../docs/instalacao/windows-11.md):
  * O endereço do tablet passa a ser `https://192.168…/` em toda a página.
  * **Passo novo, antes do Passo 5: "Instalar o certificado no tablet"**,
    em dois blocos de registro leigo. **iPad:** Safari em
    `http://<ip>/certificado` → **Permitir** → **Ajustes → Perfil
    Baixado → Instalar** → **Ajustes → Geral → Sobre → Ajustes de Confiança
    em Certificados** → ligar. **Android:** baixar o mesmo endereço →
    **Ajustes → Segurança → Criptografia e credenciais → Instalar um
    certificado → Certificado CA** → aceitar o aviso.
  * Passo 5 ganha o bloco **Android com "Instalar aplicativo"** (menu ⋮ do
    Chrome), e o Fully Kiosk passa de obrigatório a alternativa — com uma
    linha dizendo o que ele ainda faz a mais (subir no boot, manter a tela
    ligada, recarregar sozinho).
  * A frase da Tarefa 19 sobre o Chrome não oferecer "Instalar" **sai**.
  * Quem já instalou o ícone: **remover e adicionar de novo**.
  * "Se der errado": *"O tablet diz que a conexão não é particular"* → o
    certificado não foi instalado, ou foi instalado e falta a confiança
    total (iPad); *"O tablet abria e parou depois de trocar o roteador"* →
    rodar o `instalar.cmd` de novo.
  * No bloco recolhido "Para quem mantém o sistema": onde mora a raiz, que
    a renovação é automática, e o que `-SemHttps` faz.
* CONTRIBUTING: uma linha dizendo que o desenvolvimento **continua em
  `http://localhost:3000`** — o HTTPS é da instalação, não da máquina de
  quem desenvolve.
* AGENTS.md: bloco da Tarefa 20, a fila, e a correção das duas frases que
  hoje dizem que PWA exige HTTPS *e service worker* e que a rede do
  secretário é HTTP (a decisão do cookie `secure: false` passa a ter outro
  motivo — o da §1 — e precisa ser reescrita, não apagada).

## 5. Verificação exigida

* `tsc`, `lint`, `mkdocs build --strict`, `vale docs/`,
  `npm run docs:links` em 0. O `build` não é afetado, mas roda.
* Os `.ps1` analisados pelo parser do PowerShell 5.1.
* As seis premissas da §2, cada uma com o número medido no relatório.
* Pipeline completo em clone limpo, em pasta de verificação
  (`EMPRESTIMOS_RAIZ`, porta alternativa): `instalar.ps1` até o fim, com
  **200 em `https://localhost/` e `/admin`**, e a 3000 **recusando conexão
  vinda do IP da rede** (é a prova de que o caminho em texto claro fechou —
  asserção negativa, e é a que pega o desenho pela metade).
* `instalar.ps1 -SemHttps` devolvendo o sistema ao estado da T18, e o
  `instalar.ps1` normal em seguida devolvendo ao HTTPS — a ida e a volta,
  não só a ida.
* O `desinstalar.ps1` removendo os dois serviços e as três regras.
* **Nos aparelhos do dono:** certificado instalado pelo endereço `/certificado`;
  no **Android**, o Chrome oferece **Instalar aplicativo**, o ícone abre
  **sem barra**, e a retirada inteira funciona; no **iPad**, o ícone
  continua abrindo sem barra depois da troca de endereço. Os dois com o
  tablet voltando à matrícula em 2 min.
* O `dev.db` do dono conferido por md5 no fim.

## 6. Fora de escopo

* Qualquer arquivo de `src/` — inclusive o `secure` do cookie, que fica como
  está pelo motivo da §1.
* Certificado público (Let's Encrypt), domínio próprio, DNS.
* HSTS, cifras, ajuste fino de TLS: a rede é fechada e o navegador é
  atualizado.
* Service worker e modo offline — continuam fora, como na Tarefa 19.
* HTTPS na máquina de desenvolvimento.
