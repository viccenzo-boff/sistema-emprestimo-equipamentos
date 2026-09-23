# Instalar no Windows 11

Este guia põe o sistema para rodar **sozinho** num computador com Windows 11:
ele liga junto com o Windows, sem ninguém precisar abrir nada, e o tablet
alcança a tela de retirada pelo Wi-Fi. No fim, você tem também um backup
automático todo dia e uma cópia do banco para consultar sem risco.

Foi escrito para quem nunca instalou um sistema. Cada passo diz o que fazer e
o que vai aparecer na tela. Se algo sair diferente, a seção
[Se der errado](#se-der-errado) tem a resposta.

**Tempo:** 30 a 40 minutos, a maior parte esperando o instalador.

## O que você precisa

- Um computador com **Windows 11**, ligado na tomada, em que você consiga
  clicar em **Executar como administrador**.
- Internet nesse computador durante a instalação (depois dela o sistema
  funciona sem internet).
- O tablet conectado no **mesmo Wi-Fi** que o computador (ou o computador no
  cabo do mesmo roteador que dá o Wi-Fi ao tablet).
- Cerca de 2 GB livres no disco.

!!! warning "Se este computador já tem o sistema rodando pelo VS Code"
    O instalador usa a porta 3000. Se houver um `npm run dev` aberto num
    terminal, feche-o antes (Ctrl+C na janela dele) — senão o instalador para
    no primeiro passo e diz qual programa está ocupando a porta.

## Passo 1 — Instalar o Git

O Git é o programa que baixa o sistema (e, depois, as atualizações). O
Windows 11 tem um instalador de linha de comando, o `winget`, que o instala
com uma linha. O outro programa de que o sistema depende, o **Node.js**, o
instalador do Passo 3 instala sozinho se faltar — não precisa fazer nada.

1. Clique com o **botão direito** no botão **Iniciar** e escolha
   **Terminal (Admin)**. Aparece uma pergunta do Windows pedindo permissão:
   clique em **Sim**.
2. Copie a linha abaixo, cole na janela (botão direito cola) e aperte
   **Enter**:

    ```powershell
    winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
    ```

    O que aparece: uma barra de progresso e, no fim, **Instalado com êxito**.
    Se aparecer *"Nenhuma atualização disponível"* ou *"já está instalado"*,
    está tudo certo — o programa já existia.

3. **Feche a janela do Terminal.** Não pule isto: a janela aberta ainda não
   sabe que o Git foi instalado, e o próximo passo abre uma nova.

## Passo 2 — Baixar o sistema

1. Abra o **Terminal (Admin)** de novo (botão direito em **Iniciar**).
2. Cole esta linha e aperte **Enter**:

    ```powershell
    git clone https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos C:\emprestimos\app
    ```

    O que aparece: algumas linhas de *"Receiving objects"* e, no fim, o
    cursor de volta. Isso cria a pasta `C:\emprestimos\app` com o sistema
    dentro.

A pasta precisa ser **exatamente** `C:\emprestimos\app` — o instalador
confere e recusa outra.

## Passo 3 — Rodar o instalador

1. Abra o **Explorador de Arquivos** e vá até
   `C:\emprestimos\app\scripts\implantacao`.
2. Clique com o **botão direito** em **instalar.cmd** e escolha
   **Executar como administrador**. Clique em **Sim** na pergunta do Windows.
3. Espere. Abre uma janela que explica cada etapa e leva de **5 a 10
   minutos** — a etapa *"Instalando as dependências"* é a mais demorada e
   parece parada; não é.

O que a janela faz, na ordem em que imprime:

| Etapa | O que acontece |
| --- | --- |
| 1. Conferindo o que a máquina precisa ter | Acha o Git e o Node — **instala o Node se faltar**, ou o atualiza se for antigo — e confere se a porta 3000 está livre |
| 2. Pastas e permissões | `C:\emprestimos\dados`, `backups`, `consulta`, `logs`, `ferramentas`; a pasta `dados` fica fechada para as contas comuns do computador |
| 3. Apontando para o banco | Cria o arquivo que diz onde o banco de dados mora |
| 4–6. Dependências, banco, compilação | Baixa as bibliotecas, cria as tabelas, cria as contas do painel e prepara o sistema para produção |
| 7. NSSM | Baixa o programa que transforma o sistema em serviço do Windows |
| 8. Serviço | Registra o serviço **Sistema de Emprestimos (Unoesc)** — é ele que liga com o Windows |
| 9–11. Firewall, energia, backup | Libera a porta 3000, impede o computador de suspender, agenda o backup diário das 19:00 |
| 12. Atalho | **Painel de Emprestimos** na área de trabalho, para todo mundo que usa o computador |
| 13. Ligando | Sobe o sistema, espera ele responder e confere que ele consegue ler o banco |
| 14. Primeiro backup | A primeira cópia em `backups` e em `consulta` |

No fim aparece um quadro verde **INSTALADO** com os endereços, agrupados pelo
nome da placa de rede (`Wi-Fi`, `Ethernet`). **Anote o endereço da placa que
está na mesma rede do tablet** — é esse que o tablet vai usar.

!!! warning "O endereço é deste computador, e não de qualquer um"
    Um computador com cabo **e** Wi-Fi aparece com dois endereços, os dois
    começando com `http://192.168` — e só um deles está na rede do tablet. E
    se o sistema já estiver instalado em outra máquina, o endereço dela não
    abre nada aqui: são dois sistemas diferentes, cada um com o seu banco.
    Na dúvida, rode o **diagnostico.cmd** (ver
    [Se der errado](#se-der-errado)): ele imprime o endereço certo deste
    computador.

!!! tip "Se a janela parar com PAROU AQUI em vermelho"
    Leia a frase: ela diz o motivo e o que fazer. Corrija e rode o
    **instalar.cmd** de novo — pode rodar quantas vezes precisar; ele não
    apaga nada. Tudo que apareceu na janela fica gravado em
    `C:\emprestimos\logs`; se precisar de ajuda, mande esse arquivo.

## Passo 4 — Preparar o painel

O banco nasce **vazio**: só as quatro contas do painel existem. Categorias,
equipamentos e pessoas entram pelo próprio painel.

1. Na área de trabalho, abra **Painel de Emprestimos**.
2. Entre com **Usuário** `secretario` e **Senha** `Mudar@123`.
3. Troque a senha agora: no pé da barra lateral, **Alterar senha**. Faça o
   mesmo nas outras contas que forem ser usadas (`cidi`, `jeanzao`,
   `viccenzo` — todas nascem com `Mudar@123`). A página
   [Conta do administrador](../referencia/conta-do-administrador.md) explica
   o que acontece com quem esquece a senha.
4. Crie as categorias em **Categorias**, **nesta ordem**: `Notebook`,
   `Tablet`, `Extensão`. A ordem em que você as cria é a ordem em que
   aparecem no tablet.
5. Cadastre os equipamentos em **Inventário**, com a etiqueta exatamente como
   está no adesivo do aparelho — [4. Gestão de inventário](../painel/inventario.md).
6. Importe as pessoas em **Pessoas**, pela planilha —
   [5. Gestão de pessoas](../painel/pessoas.md). O botão
   **Baixar planilha modelo** dá o arquivo no formato certo.

## Requisitos do tablet

Nem todo tablet roda o sistema. O aparelho precisa de um navegador recente —
não por capricho: as telas usam recursos gráficos que navegadores antigos
simplesmente não conhecem.

| Tablet | O que precisa |
| --- | --- |
| **iPad** | **iPadOS 16.4 ou mais novo** (março de 2023) |
| **Android** | **Chrome 111 ou mais novo** — ele se atualiza sozinho pela Play Store, então basta o tablet aceitar as atualizações |

**Como conferir no iPad:** **Ajustes → Geral → Sobre → Versão**.

Aceitam o iPadOS 16.4 estes modelos — qualquer um deles serve:

- **iPad** da 5ª geração (2017) em diante;
- **iPad mini** 5 em diante;
- **iPad Air** 3 em diante;
- **qualquer iPad Pro**.

!!! warning "Como um tablet velho demais se apresenta"
    A página abre, mas **como texto puro**: sem cores, sem botões, com a
    letra de jornal e a logo enorme. O teclado numérico aparece como uma
    fileira de retângulos cinzentos que não respondem ao toque.

    Não é defeito da instalação e não tem conserto pelo computador — é o
    navegador do tablet que não entende as telas. Use um aparelho da lista
    acima.

## Passo 5 — Fixar o endereço do computador no roteador

**Faça isto antes de mexer no tablet.** Roteadores costumam trocar de tempos
em tempos o número que dão a cada computador. Quando isso acontece, o
endereço que você anotou no Passo 3 deixa de valer e o tablet para de abrir
a página.

O problema é que ninguém liga uma coisa à outra: o tablet funciona por
semanas e um dia para, sem dizer o motivo.

1. Entre na página de configuração do roteador (o endereço e a senha costumam
   estar numa etiqueta embaixo dele).
2. Procure a reserva de endereço — o nome do ajuste varia: **reserva de
   DHCP**, **IP estático**, **address reservation**.
3. Reserve, para este computador, o endereço anotado no Passo 3.

Se a rede for da instituição, peça isso ao suporte de TI — informe o nome do
computador e o endereço que o instalador mostrou.

## Passo 6 — O tablet

Primeiro confira que o tablet alcança o sistema:

1. Conecte o tablet no **mesmo Wi-Fi** do computador.
2. Abra o navegador (Safari, no iPad; Chrome, no Android) e digite o
   endereço anotado no Passo 3 — por exemplo `http://192.168.0.10:3000/`.
   Aparece a tela **Digite sua matrícula**.
3. Digite uma matrícula cadastrada e toque em **Continuar**. Se a tela
   seguinte aparecer, o tablet está falando com o computador.

Agora deixe o tablet **preso nessa tela**, com a tela sempre ligada. O
sistema volta sozinho para a matrícula depois de 2 minutos sem toque; o que
falta é a tela não apagar e o aparelho não sair da página.

### No iPad

1. Com o endereço aberto no Safari, toque no botão **Compartilhar** (o
   quadrado com a seta para cima, na barra de cima).
2. Escolha **Adicionar à Tela de Início**. O nome sugerido é
   **Empréstimos** — mantenha. Toque em **Adicionar**.
3. Feche o Safari e abra o sistema **pelo ícone** que apareceu na tela de
   início. Ele abre **sem barra de endereço e sem os botões do navegador**:
   a tela inteira é o portal.
4. Em **Ajustes → Tela e Brilho → Bloqueio Automático**, escolha **Nunca**.
   Deixe o tablet no carregador.
5. Em **Ajustes → Acessibilidade → Acesso Guiado**, ligue e defina um
   código. Abra o sistema pelo ícone e clique três vezes no botão lateral
   para prender a tela.

!!! note "Se o endereço do sistema mudar um dia"
    O ícone guarda o endereço que estava aberto na hora em que foi criado.
    Se o endereço mudar — porque a reserva do Passo 5 não foi feita, ou
    porque o sistema passou a usar outro endereço —, o ícone para de abrir.
    **Remova o ícone e adicione de novo**, com o endereço novo.

### No Android

1. Instale o **Fully Kiosk Browser** pela Play Store. Nas configurações
   dele, em **Web Content Settings → Start URL**, coloque o endereço; em
   **Device Management**, ligue **Keep Screen On** e **Launch on Boot**. A
   licença custa uns poucos euros por tablet, uma vez.
2. A alternativa gratuita é a **fixação de tela** do próprio Android:
   procure por **Fixar** nas configurações de segurança, ligue, abra o
   Chrome no endereço e fixe-o. A barra de endereço continua visível.

O Chrome **ainda não oferece "Instalar aplicativo"** para este sistema, e
não é erro de instalação: o Chrome só instala páginas servidas por
`https://`, e na rede local o sistema é servido por `http://`. Enquanto for
assim, quem dá a tela cheia no Android é o Fully Kiosk Browser.

### Um cuidado que não tem a ver com o sistema

**Carregador na tomada, não no computador.** A entrada USB de um computador
não dá carga suficiente para um tablet com a tela ligada o dia inteiro — ele
descarrega mesmo no cabo. Use o carregador original num suporte.

## O dia a dia

Não há nada para fazer de manhã. O computador só precisa estar **ligado** —
pode estar bloqueado, com a tela apagada, sem ninguém conectado. Se for
reiniciado (queda de luz, atualização do Windows à noite), o sistema volta
sozinho.

Na área de trabalho fica um atalho só, **Painel de Emprestimos**, que abre o
painel neste computador (de outro computador da mesma rede, use o endereço
`http://192.168…:3000/admin`). Os outros gestos do dia a dia são arquivos da
pasta `C:\emprestimos\app\scripts\implantacao` — duplo clique neles, e eles
pedem permissão de administrador sozinhos:

| Arquivo | Para quê |
| --- | --- |
| **reiniciar.cmd** | Se o tablet mostrar erro de conexão com o computador ligado. Leva uns 15 segundos |
| **diagnostico.cmd** | Descobre por que o tablet não abre a página. Não muda nada: só olha e escreve um relatório |
| **atualizar-copia-para-consulta.cmd** | Copia o banco de agora para a pasta de consulta (ver [abaixo](#consultar-o-banco-de-dados)) |

## Consultar o banco de dados

Para um relatório que o painel não tem, a coordenação consulta **uma cópia**
do banco — nunca o banco de verdade. A cópia é refeita toda noite às 19:00 e
sempre que alguém roda o **atualizar-copia-para-consulta.cmd**. Nada que se
faça nela chega ao sistema: pode consultar, filtrar, exportar e até apagar
por engano que o tablet não sente.

1. Instale o **DB Browser for SQLite** (gratuito). No **Terminal (Admin)**:

    ```powershell
    winget install --id DBBrowserForSQLite.DBBrowserForSQLite -e --accept-package-agreements --accept-source-agreements
    ```

2. Em `C:\emprestimos\app\scripts\implantacao`, dê duplo clique em
   **atualizar-copia-para-consulta.cmd** e clique em **Sim** na pergunta do
   Windows.
3. Abra o DB Browser. Em **Arquivo**, escolha **Abrir banco de dados somente
   leitura** (*Open Database Read Only*) e aponte para
   `C:\emprestimos\consulta\emprestimos-consulta.db`.
4. Para ver uma tabela: aba **Navegar dados** (*Browse Data*).
5. Para uma pergunta pronta: aba **Executar SQL** (*Execute SQL*), ícone de
   pasta **Abrir arquivo SQL**, e escolha um arquivo de
   `C:\emprestimos\app\scripts\implantacao\consultas` — há um para "quem
   está com o quê agora", um para as retiradas do mês, um para o histórico
   de uma etiqueta e um para as devoluções com o tempo na bancada. Aperte
   **Executar** (Ctrl+Enter).
6. Para levar ao Excel: **Salvar os resultados → Exportar para CSV**, e abra
   o arquivo pelo Excel em **Dados → De Texto/CSV**.

!!! info "As datas estão em UTC"
    O banco guarda as horas 3 horas à frente de Brasília. As consultas
    prontas já convertem; quem escrever a própria consulta usa
    `datetime(coluna, 'localtime')`. O arquivo `LEIA-ME.md` da pasta de
    consultas explica isso e mais dois detalhes.

A pasta `C:\emprestimos\dados` — onde mora o banco de verdade — fica fechada
para as contas comuns do computador, de propósito. Não há motivo para abri-la.

## Backup

Todo dia às 19:00 o sistema grava uma cópia do banco em
`C:\emprestimos\backups`, com a data no nome, e guarda os últimos 30 dias.
Se o computador estiver desligado às 19:00, a cópia é feita quando ele ligar.

O que o backup automático **não** faz é sair do computador. Uma vez por
semana, copie a pasta `C:\emprestimos\backups` para um pendrive ou para o
OneDrive — se o disco do computador morrer, é essa cópia que salva o
semestre.

## Atualizar o sistema

Quando sair uma versão nova, quem mantém o sistema avisa o nome dela
(por exemplo `v1.1`). Fora do horário de atendimento:

1. Em `C:\emprestimos\app\scripts\implantacao`, botão direito em
   **atualizar.cmd** → **Executar como administrador**.
2. A janela mostra as versões disponíveis e pergunta qual instalar. Digite o
   nome e aperte **Enter**.
3. Espere uns 3 minutos. O sistema fica fora do ar durante a troca e volta
   sozinho no fim, com um quadro verde **ATUALIZADO**.

Antes de trocar qualquer coisa, o atualizador faz um backup. Se a versão nova
der problema, rode de novo e digite a versão anterior.

## Desinstalar

Botão direito em **desinstalar.cmd** (na mesma pasta) → **Executar como
administrador**. Ele tira o serviço, a regra do firewall, o backup agendado e
os atalhos. **Não apaga o banco nem os backups**: quem quiser apagar tudo,
apaga a pasta `C:\emprestimos` depois.

## Se der errado

**Antes de procurar na tabela, rode o `diagnostico.cmd`.** Ele está em
`C:\emprestimos\app\scripts\implantacao`, pede permissão de administrador
sozinho e não muda nada no computador: só confere, em nove passos, tudo que
precisa estar certo para o tablet abrir a página — o serviço, a porta, o
endereço de cada placa de rede, o firewall, o banco e os registros. No fim ele
lista o que encontrou e diz o endereço certo deste computador.

O relatório fica gravado em `C:\emprestimos\logs\diagnostico-<data>.txt`. **É
esse arquivo que se manda para quem mantém o sistema** — e não os registros do
npm que ficam na pasta `AppData`, que não sabem nada sobre serviço, rede ou
firewall.

| O que aparece | O que fazer |
| --- | --- |
| O instalador para em **A porta 3000 já está sendo usada** | Feche o programa que ele nomeia (em geral um `npm run dev` num terminal) e rode de novo |
| O instalador para em **Git não encontrado** | O Terminal foi aberto antes de instalar o Git. Feche todas as janelas de Terminal e rode o instalador de novo |
| O instalador para em **O winget terminou, mas o Node não apareceu** | Feche a janela e rode o instalador de novo — na segunda vez ele encontra o Node que acabou de instalar |
| O instalador para em **'Baixar as bibliotecas do sistema' terminou com erro** | Quase sempre é internet. Confira a conexão e rode de novo; ele continua de onde parou |
| O tablet mostra **Não é possível acessar esse site** | Rode o **diagnostico.cmd** e leia o fim do relatório: ele diz se o problema é deste computador e qual é o endereço certo. Se ele não achar nada, o problema está entre os dois aparelhos — confira se o endereço digitado é o **deste** computador, se o tablet está no mesmo Wi-Fi, e se o endereço tem `http://` na frente e `:3000` no fim. Um celular no mesmo Wi-Fi é o teste mais rápido: se o celular também não abrir, é a rede, e não o sistema |
| A página abre no tablet **como texto puro**, sem cores, e o teclado não responde | O navegador do tablet é antigo demais. Veja [Requisitos do tablet](#requisitos-do-tablet) — não há conserto pelo computador |
| O tablet abria e parou de abrir depois de uns dias | O endereço do computador mudou. Faça a reserva do [Passo 5](#passo-5-fixar-o-endereco-do-computador-no-roteador); no iPad, remova o ícone da tela de início e adicione de novo, já com o endereço certo |
| O painel diz **Usuário ou senha inválidos** para todo mundo | Depois de cinco erros, a conta espera 1 minuto. Se a senha foi esquecida, a [Conta do administrador](../referencia/conta-do-administrador.md) diz como recuperar |
| O **atualizar-copia-para-consulta.cmd** diz que não conseguiu gravar | A cópia está aberta no DB Browser. Feche-o e rode de novo |
| Nada disso | Rode o **diagnostico.cmd** e mande a pasta `C:\emprestimos\logs` inteira para quem mantém o sistema — ela tem o relatório do diagnóstico, o registro de cada instalação e os registros do servidor |

??? note "Para quem mantém o sistema"

    O que o instalador monta, para quem precisar mexer por baixo:

    | Peça | Onde |
    | --- | --- |
    | Código | `C:\emprestimos\app` (clone do repositório; `git describe --tags` diz a versão) |
    | Banco | `C:\emprestimos\dados\emprestimos.db`, apontado por `app\.env` com caminho absoluto (`DATABASE_URL="file:C:/emprestimos/dados/emprestimos.db"`) |
    | Serviço | `Emprestimos`, registrado pelo NSSM (`ferramentas\nssm.exe`), conta `NT AUTHORITY\LocalService`, comando `node node_modules\next\dist\bin\next start -p 3000`, reinício automático 5 s após queda |
    | Logs | `C:\emprestimos\logs\servico.log` e `servico.err.log` (rotação em 5 MB), mais um transcript por instalação e por atualização |
    | Backup | Tarefa agendada **Sistema de Emprestimos - Backup diario** (19:00, como SYSTEM) rodando `scripts\implantacao\backup.mjs` |
    | Firewall | Regra de entrada **Sistema de Emprestimos (porta 3000)**, TCP, todos os perfis |
    | Permissões | `LocalService` com modificação em `C:\emprestimos`; `dados\` sem herança, só `LocalService`, `SYSTEM` e Administradores — **as entradas ficam na pasta e os arquivos herdam** (aplicar `(OI)(CI)` num arquivo com `/T` deixa o arquivo sem nenhuma permissão) |
    | Gestos do dia a dia | `reiniciar.cmd`, `diagnostico.cmd` e `atualizar-copia-para-consulta.cmd`, em `scripts\implantacao`; só o atalho do painel vai à área de trabalho |
    | Diagnóstico | `diagnostico.cmd` não muda nada. Confere serviço, porta e endereço de escuta, resposta em `localhost` e em cada IPv4, regra de firewall e o perfil da rede ativa (uma política de domínio com `AllowLocalFirewallRules=False` anula a regra sem erro nenhum), `servico.err.log`, o último `instalacao-*.log` e a versão. Grava `diagnostico-<data>.txt` na pasta de logs |

    **Restaurar um backup:** em **Serviços**, pare **Sistema de Emprestimos
    (Unoesc)**; copie o arquivo de `backups\` por cima de
    `dados\emprestimos.db`; inicie o serviço. Migrations são aplicadas no
    `atualizar`, nunca no restore — restaure sempre um backup da mesma
    versão ou anterior.

    **Trocar a porta:** defina a variável de ambiente `EMPRESTIMOS_PORTA`
    antes de rodar o `instalar.ps1` — ela troca a porta do serviço, da regra
    do firewall e dos atalhos. `EMPRESTIMOS_RAIZ` troca `C:\emprestimos`.
    As duas existem para a verificação; a coordenação usa o padrão.

    **Por que a cópia, e não abrir o banco vivo somente leitura:** SQLite não
    tem contas; "somente leitura" seria só o modo do DB Browser, e mesmo
    uma leitura segura um lock compartilhado que bloqueia o `commit` do
    serviço. O `journal_mode` deste projeto é `delete` e o `better-sqlite3`
    espera 5 s por lock antes de estourar `SQLITE_BUSY` — uma consulta longa
    no arquivo vivo derruba a retirada no tablet naquele instante. O
    `backup.mjs` usa a API de online backup, que produz cópia consistente
    sem parar o serviço.

    **Por que serviço do Windows e não PM2 ou Docker:** o serviço sobe no
    boot, antes de qualquer login. O PM2 no Windows só sobe no logon de um
    perfil; o Docker Desktop sobe com a sessão de quem entrou e é uma camada
    a mais para diagnosticar num computador de coordenação.
