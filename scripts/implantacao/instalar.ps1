<#
  instalar.ps1 — instala o Sistema de Empréstimo de Equipamentos como serviço
  do Windows (Tarefa 18). É chamado pelo instalar.cmd, que pede administrador.

  O que ele faz, na ordem em que imprime:
    1. confere Git e Node ≥ 24 — e INSTALA os dois pelo winget se faltarem —
       e se a porta está livre
    2. cria C:\emprestimos\{dados,backups,consulta,logs,ferramentas} e ajusta
       as permissões: LocalService escreve em tudo; dados\ fica fechada para
       as contas comuns do PC
    3. escreve o .env com o caminho ABSOLUTO do banco (se ainda não existir)
    4. npm ci → migrations → seed só de administradores → build
    5. baixa o NSSM e registra o serviço "Emprestimos" (sobe no boot,
       reinicia se cair, log com rotação, conta LocalService)
    6. firewall, energia (sem suspender), tarefa agendada do backup, o atalho
       do painel na área de trabalho
    7. sobe o serviço, espera ele responder e roda o primeiro backup

  Rodar de novo é seguro: para o serviço, refaz tudo e preserva o banco e o
  .env. É também o jeito de reparar uma instalação.

  As permissões vêm ANTES do banco de propósito: uma instalação anterior com
  o arquivo do banco sem permissão (aconteceu — ver o comentário na etapa 2)
  precisa ser consertada antes de o migrate deploy tentar abri-lo.

  Duas variáveis de ambiente existem para a verificação, não para o uso normal:
    EMPRESTIMOS_RAIZ   troca C:\emprestimos por outra pasta
    EMPRESTIMOS_PORTA  troca a porta 3000
  E o parâmetro -SomenteAplicacao roda só os passos que não pedem administrador
  (pastas, .env, npm ci, banco, build e o download do NSSM) — é como o pipeline
  é conferido sem elevação. Com ele, Node e Git precisam já existir.

  Escrito para o PowerShell 5.1 que vem com o Windows: sem &&, sem ternário,
  sem ??. Salvo em UTF-8 COM BOM — sem o BOM o 5.1 lê os acentos como ANSI.
#>

param(
  [switch]$SomenteAplicacao
)

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------- constantes

$RAIZ = "C:\emprestimos"
if ($env:EMPRESTIMOS_RAIZ) { $RAIZ = $env:EMPRESTIMOS_RAIZ }

$PORTA = 3000
if ($env:EMPRESTIMOS_PORTA) { $PORTA = [int]$env:EMPRESTIMOS_PORTA }

$APP = Join-Path $RAIZ "app"
$DADOS = Join-Path $RAIZ "dados"
$LOGS = Join-Path $RAIZ "logs"
$FERRAMENTAS = Join-Path $RAIZ "ferramentas"
$BANCO = Join-Path $DADOS "emprestimos.db"
$NSSM = Join-Path $FERRAMENTAS "nssm.exe"
$NSSM_URL = "https://nssm.cc/release/nssm-2.24.zip"

$SERVICO = "Emprestimos"
$NOME_EXIBIDO = "Sistema de Emprestimos (Unoesc)"
$NOME_TAREFA = "Sistema de Emprestimos - Backup diario"
$NOME_REGRA = "Sistema de Emprestimos (porta $PORTA)"
$AREA_DE_TRABALHO = Join-Path $env:PUBLIC "Desktop"

# Onde o winget instala, para achar os programas na mesma execução em que
# foram instalados (a janela aberta ainda não vê o PATH novo).
$NODE_PADRAO = "C:\Program Files\nodejs\node.exe"
$GIT_PADRAO = "C:\Program Files\Git\cmd\git.exe"
$NODE_MINIMO = 24

# SIDs conhecidos: independem do idioma do Windows ("Usuários" x "Users").
$SID_LOCAL_SERVICE = "*S-1-5-19"
$SID_SYSTEM = "*S-1-5-18"
$SID_ADMINISTRADORES = "*S-1-5-32-544"

$script:LOG = $null
$script:ETAPA = 0

# ------------------------------------------------------------------ auxílio

function Etapa($texto) {
  $script:ETAPA += 1
  Write-Host ""
  Write-Host "=== $($script:ETAPA). $texto" -ForegroundColor Cyan
}

function Ok($texto) { Write-Host "    OK  $texto" -ForegroundColor Green }
function Info($texto) { Write-Host "        $texto" -ForegroundColor Gray }

function Falhar($mensagem) {
  Write-Host ""
  Write-Host "PAROU AQUI: $mensagem" -ForegroundColor Red
  if ($script:LOG) {
    Write-Host "Tudo que apareceu nesta janela está gravado em $($script:LOG)" -ForegroundColor Yellow
    Write-Host "Mande esse arquivo para quem mantém o sistema." -ForegroundColor Yellow
    try { Stop-Transcript | Out-Null } catch {}
  }
  exit 1
}

# Roda um programa externo e devolve o código de saída. O $ErrorActionPreference
# vai a Continue só aqui: com Stop, um aviso no stderr do npm derrubaria tudo.
# A saída do programa vai direto para a tela (Out-Host): sem isso ela viraria
# parte do valor devolvido pela função, junto com o código — regra do
# PowerShell, e custou um "npm ci terminou com erro (código <571 pacotes>)".
#
# O 2>&1 NÃO é enfeite, e a ausência dele custou uma viagem inteira. Sem ele o
# stderr do programa vai direto para o console, sem passar pelo PowerShell — e
# o Start-Transcript só grava o que passa pelo PowerShell. Medido nesta máquina
# em 2026-09-22: de duas linhas de stderr de um programa de teste, a
# transcrição guardava ZERO; com o 2>&1, guarda as duas, e o código de saída
# sobrevive igual nos dois casos. Foi exatamente isso que aconteceu na primeira
# instalação no computador da coordenação: o npm ci falhou, o instalador disse
# "leia as linhas acima", e o arquivo que o guia manda enviar não tinha uma
# palavra do motivo — porque o motivo do npm sai todo em stderr.
#
# O ForEach desembrulha o ErrorRecord: no 5.1 cada linha de stderr de programa
# nativo chega embrulhada, e o ToString() dela devolve
# "System.Management.Automation.RemoteException" em vez do texto (medido). O
# texto de verdade está em TargetObject. O $LASTEXITCODE sobrevive ao 2>&1; o
# $? não sobrevive, e é por isso que ninguém o lê aqui.
function Executar($exe, [string[]]$argumentos) {
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $exe @argumentos 2>&1 | ForEach-Object {
    if ($_ -is [System.Management.Automation.ErrorRecord]) {
      if ($null -ne $_.TargetObject) { [string]$_.TargetObject } else { $_.Exception.Message }
    } else { $_ }
  } | Out-Host
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = $anterior
  return $codigo
}

# Tenta abrir uma conexão com um servidor, com prazo. Serve para dizer QUAL
# servidor não responde, em vez de deixar a pessoa adivinhando. O prazo é
# explícito porque o Test-NetConnection do Windows pode demorar bem mais que
# isso quando o pacote é descartado em silêncio por um firewall.
function AlcancaServidor($nome, $porta, $milissegundos = 6000) {
  $cliente = $null
  try {
    $cliente = New-Object System.Net.Sockets.TcpClient
    $tentativa = $cliente.BeginConnect($nome, $porta, $null, $null)
    if ($tentativa.AsyncWaitHandle.WaitOne($milissegundos, $false) -and $cliente.Connected) {
      $cliente.EndConnect($tentativa)
      return $true
    }
    return $false
  } catch {
    return $false
  } finally {
    if ($cliente) { $cliente.Close() }
  }
}

# Quando um comando do npm falha, o motivo costuma estar em dois lugares que
# ninguém vai procurar de pé no balcão: o log que o próprio npm grava, e a
# lista de servidores que ele precisou alcançar.
#
# Este projeto baixa de QUATRO endereços diferentes, e não só do registro do
# npm: o pacote xlsx aponta para uma URL do CDN da SheetJS (decisão da Tarefa
# 8 — a versão do registro é a vulnerável), e o better-sqlite3 baixa o binário
# já compilado de um release do GitHub. Numa rede institucional é comum um
# passar e outro não; a mensagem do npm nem sempre diz qual, e a diferença
# entre "a internet caiu" e "o firewall bloqueia um host" é a diferença entre
# esperar e abrir chamado.
function DiagnosticoDoNpm {
  Write-Host ""
  Write-Host "  ---- diagnóstico automático: por que o npm parou ----" -ForegroundColor Yellow

  $pastaDeLogs = $null
  foreach ($cache in @($env:npm_config_cache, (Join-Path $env:LOCALAPPDATA "npm-cache"), (Join-Path $env:APPDATA "npm-cache"))) {
    if ($cache) {
      $possivel = Join-Path $cache "_logs"
      if (Test-Path $possivel) { $pastaDeLogs = $possivel; break }
    }
  }

  if ($pastaDeLogs) {
    $ultimo = Get-ChildItem -Path $pastaDeLogs -Filter "*.log" -ErrorAction SilentlyContinue |
              Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($ultimo) {
      Write-Host "  O npm gravou o detalhe em $($ultimo.FullName)." -ForegroundColor Yellow
      Write-Host "  Últimas 40 linhas desse arquivo:" -ForegroundColor Yellow
      Get-Content -Path $ultimo.FullName -Tail 40 -ErrorAction SilentlyContinue |
        ForEach-Object { Write-Host "    | $_" }
    } else {
      Write-Host "  O npm não deixou nenhum log em $pastaDeLogs." -ForegroundColor Yellow
    }
  } else {
    Write-Host "  Não encontrei a pasta de logs do npm nesta máquina." -ForegroundColor Yellow
  }

  Write-Host ""
  Write-Host "  Servidores que a instalação precisa alcançar (porta 443):" -ForegroundColor Yellow
  $servidores = @(
    @("registry.npmjs.org",             "as bibliotecas do sistema"),
    @("cdn.sheetjs.com",                "a leitura de planilhas (xlsx), que vem de fora do npm"),
    @("github.com",                     "o banco de dados (better-sqlite3)"),
    @("objects.githubusercontent.com",  "o arquivo do banco de dados em si")
  )
  $algumBloqueado = $false
  foreach ($servidor in $servidores) {
    if (AlcancaServidor $servidor[0] 443) {
      Write-Host "    responde       $($servidor[0])  -  $($servidor[1])" -ForegroundColor Green
    } else {
      Write-Host "    NAO RESPONDE   $($servidor[0])  -  $($servidor[1])" -ForegroundColor Red
      $algumBloqueado = $true
    }
  }

  Write-Host ""
  if ($algumBloqueado) {
    Write-Host "  Algum servidor acima não respondeu. Numa rede de instituição isso" -ForegroundColor Yellow
    Write-Host "  costuma ser o firewall ou o proxy. Peça à TI para liberar os" -ForegroundColor Yellow
    Write-Host "  endereços marcados, ou rode a instalação numa rede sem bloqueio" -ForegroundColor Yellow
    Write-Host "  (um celular compartilhando internet resolve): depois do npm ci a" -ForegroundColor Yellow
    Write-Host "  instalação não precisa mais desses servidores." -ForegroundColor Yellow
  } else {
    Write-Host "  Todos os servidores responderam, então não é falta de internet." -ForegroundColor Yellow
    Write-Host "  Se o log acima falar em certificado (as siglas SELF_SIGNED_CERT_IN_CHAIN" -ForegroundColor Yellow
    Write-Host "  ou UNABLE_TO_GET_LOCAL_ISSUER_CERT), o caso é o proxy da rede abrindo" -ForegroundColor Yellow
    Write-Host "  as conexões para inspecionar: o Windows confia nele e o npm não." -ForegroundColor Yellow
    Write-Host "  A saída é a TI informar o certificado da instituição, ou instalar" -ForegroundColor Yellow
    Write-Host "  por uma rede sem esse proxy." -ForegroundColor Yellow
  }
  Write-Host "  -----------------------------------------------------" -ForegroundColor Yellow
  Write-Host ""
}

# Como Executar, mas para se o programa devolver erro.
function Rodar($descricao, $exe, [string[]]$argumentos) {
  Write-Host "    > $descricao" -ForegroundColor White
  Info "$exe $($argumentos -join ' ')"
  $codigo = Executar $exe $argumentos
  if ($codigo -ne 0) {
    if ($exe -like "*npm*") { DiagnosticoDoNpm }
    Falhar "'$descricao' terminou com erro (código $codigo). Leia as linhas acima."
  }
}

# A saída do nssm não é lida (ele escreve em UTF-16 quando redirecionado); o
# que se confere é o código de saída e, no fim, o registro do Windows.
function Nssm([string[]]$argumentos) {
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $NSSM @argumentos 2>&1 | Out-Null
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = $anterior
  if ($codigo -ne 0) { Falhar "nssm $($argumentos -join ' ') devolveu o código $codigo." }
}

function AcharNode {
  $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  if (Test-Path $NODE_PADRAO) { return $NODE_PADRAO }
  return $null
}

function AcharGit {
  $cmd = Get-Command git.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  if (Test-Path $GIT_PADRAO) { return $GIT_PADRAO }
  return $null
}

function VersaoMaiorDoNode($node) {
  $versao = (& $node -v).Trim()
  return [int]($versao -replace "^v(\d+).*$", '$1')
}

# Instala (ou atualiza) um programa pelo winget, o instalador que vem com o
# Windows 11. `install` num pacote já instalado tenta a atualização.
function InstalarPeloWinget($id, $nome) {
  if ($SomenteAplicacao) {
    Falhar "$nome não está instalado. Com -SomenteAplicacao o instalador não instala nada; instale $nome antes."
  }
  $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
  if (-not $winget) {
    Falhar "$nome não está instalado e o winget (instalador do Windows) não foi encontrado. Instale $nome pela loja ou pelo site oficial e rode o instalador de novo."
  }
  Rodar "Instalar $nome pelo winget (baixa da internet; pode levar alguns minutos)" $winget.Source @(
    "install", "--id", $id, "-e", "--silent",
    "--accept-package-agreements", "--accept-source-agreements"
  )
}

# ------------------------------------------------------- 1. pré-requisitos

Write-Host ""
Write-Host "Sistema de Emprestimo de Equipamentos - instalacao" -ForegroundColor White
Write-Host "Pasta: $RAIZ   Porta: $PORTA" -ForegroundColor Gray

Etapa "Conferindo o que a máquina precisa ter (e instalando o que faltar)"

$ehAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $ehAdmin -and -not $SomenteAplicacao) {
  Falhar "Este instalador precisa ser executado como administrador. Feche esta janela, clique com o botão direito em instalar.cmd e escolha 'Executar como administrador'."
}

if ($RAIZ -match " ") {
  Falhar "A pasta de instalação ($RAIZ) não pode ter espaço no nome."
}

$esperado = Join-Path $APP "scripts\implantacao"
$atual = (Resolve-Path $PSScriptRoot).Path.TrimEnd("\")
if ($atual -ine $esperado.TrimEnd("\")) {
  Falhar "O sistema precisa estar na pasta $APP, e este arquivo está em $atual. Siga o passo 'Baixar o sistema' do guia: o comando git clone termina com $APP."
}

# Git: o atualizar.ps1 depende dele. Quem chegou aqui por 'git clone' já o
# tem; quem baixou a pasta de outro jeito, não.
$git = AcharGit
if (-not $git) {
  InstalarPeloWinget "Git.Git" "Git"
  $git = AcharGit
  if (-not $git) { Falhar "O winget terminou, mas o Git não apareceu em $GIT_PADRAO. Feche esta janela e rode o instalador de novo." }
}
Ok "Git em $git"

# Node: instala se faltar, atualiza se for mais velho que o mínimo. O
# better-sqlite3 baixa o binário pré-compilado por versão de Node; fora da
# faixa ele cai na compilação em C++, que esta máquina não tem.
$node = AcharNode
if (-not $node) {
  InstalarPeloWinget "OpenJS.NodeJS.LTS" "Node.js"
  $node = AcharNode
  if (-not $node) { Falhar "O winget terminou, mas o Node não apareceu em $NODE_PADRAO. Feche esta janela e rode o instalador de novo." }
}
if ((VersaoMaiorDoNode $node) -lt $NODE_MINIMO) {
  Info "O Node instalado é o $(& $node -v); o sistema precisa do $NODE_MINIMO ou mais novo. Atualizando."
  InstalarPeloWinget "OpenJS.NodeJS.LTS" "Node.js"
  $node = AcharNode
  if ((VersaoMaiorDoNode $node) -lt $NODE_MINIMO) {
    Falhar "Mesmo depois da atualização o Node continua no $(& $node -v). Desinstale o Node antigo em 'Aplicativos instalados' e rode o instalador de novo."
  }
}
$versaoNode = (& $node -v).Trim()
$pastaNode = Split-Path $node
$npm = Join-Path $pastaNode "npm.cmd"
if (-not (Test-Path $npm)) { Falhar "Achei o Node em $node mas não o npm ao lado dele." }
Ok "Node $versaoNode em $node"

# Achar o node.exe resolve as chamadas DESTE script — e só elas. Todo script de
# ciclo de vida de pacote é lançado pelo npm como `cmd.exe /d /s /c node ...`,
# que procura o node no PATH herdado: o preinstall do prisma, o install do
# better-sqlite3 e o postinstall 'prisma generate' do próprio projeto (sem ele
# não existe src\generated\prisma num clone novo, e o build não compila).
#
# Quando o winget acaba de instalar o Node, a janela aberta ainda não vê o PATH
# novo — a mesma razão por que $NODE_PADRAO existe. Aí o instalador acha o node,
# seguia em frente, e o `npm ci` morria com "'node' não é reconhecido como um
# comando interno ou externo". Aconteceu no computador da coordenação em
# 2026-09-23, e o pior não foi a falha: o instalador culpa a internet quando o
# npm falha, então a tela mandava conferir a conexão de uma máquina conectada.
#
# Mexer no $env:PATH vale para este processo e para os filhos dele. O PATH
# gravado no Windows não é alterado — nada aqui sobrevive ao fechar a janela.
$pastaGit = Split-Path $git
foreach ($pastaDeProgramas in @($pastaNode, $pastaGit)) {
  if (-not $env:PATH.ToLower().Contains($pastaDeProgramas.ToLower())) {
    $env:PATH = "$pastaDeProgramas;$env:PATH"
    Info "PATH desta execução: acrescentei $pastaDeProgramas"
  }
}

# A porta: se for o nosso próprio serviço de uma instalação anterior, ele é
# parado (o npm ci precisa dos arquivos livres). Qualquer outro programa faz o
# instalador parar e dizer qual é — o caso típico é um 'npm run dev' aberto.
$servicoExistente = Get-Service -Name $SERVICO -ErrorAction SilentlyContinue
if ($servicoExistente -and $servicoExistente.Status -ne "Stopped" -and -not $SomenteAplicacao) {
  Info "O serviço $SERVICO já existe e está rodando: parando para reinstalar."
  Stop-Service -Name $SERVICO -Force
  Start-Sleep -Seconds 3
}

$ocupada = Get-NetTCPConnection -LocalPort $PORTA -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($ocupada) {
  $processo = Get-Process -Id $ocupada.OwningProcess -ErrorAction SilentlyContinue
  $nomeProcesso = "desconhecido"
  $caminhoProcesso = ""
  if ($processo) { $nomeProcesso = $processo.ProcessName; $caminhoProcesso = $processo.Path }
  Falhar "A porta $PORTA já está sendo usada pelo programa '$nomeProcesso' (PID $($ocupada.OwningProcess)) $caminhoProcesso. Feche esse programa e rode o instalador de novo. Se for o 'npm run dev' do VS Code, pare-o com Ctrl+C no terminal dele."
}
Ok "Porta $PORTA livre"

# ---------------------------------------------------- 2. pastas e permissões

Etapa "Criando as pastas em $RAIZ e ajustando as permissões"

foreach ($pasta in @($RAIZ, $DADOS, (Join-Path $RAIZ "backups"), (Join-Path $RAIZ "consulta"), $LOGS, $FERRAMENTAS)) {
  New-Item -ItemType Directory -Force -Path $pasta | Out-Null
}
Ok "app, dados, backups, consulta, logs, ferramentas"

$script:LOG = Join-Path $LOGS ("instalacao-" + (Get-Date -Format "yyyy-MM-dd-HHmmss") + ".log")
Start-Transcript -Path $script:LOG | Out-Null
Info "Esta janela está sendo gravada em $($script:LOG)"

if (-not $SomenteAplicacao) {
  # LocalService precisa escrever em toda a instalação: o banco em dados\, os
  # logs, e o cache que o Next mantém em app\.next. A entrada é herdável
  # ((OI)(CI)) e o Windows a propaga para o que já existe e para o que for
  # criado depois.
  Rodar "Dar escrita ao LocalService em $RAIZ" "icacls" @($RAIZ, "/grant", "${SID_LOCAL_SERVICE}:(OI)(CI)M", "/Q")

  # dados\ deixa de herdar: só o serviço, o SYSTEM (o backup agendado) e os
  # administradores enxergam o banco vivo. Quem consulta usa consulta\.
  #
  # As entradas vão SÓ NA PASTA, e os arquivos de dentro são resetados para
  # herdar dela. Não é frescura: a primeira versão aplicava as três entradas
  # com /T, e as marcas (OI)(CI) chegando num ARQUIVO são descartadas pelo
  # Windows — o emprestimos.db ficou com a lista de permissões VAZIA, e nem
  # o administrador nem o serviço conseguiam abri-lo ("unable to open
  # database file"). Medido em 2026-09-18, na primeira instalação de verdade.
  Rodar "Fechar $DADOS para as contas comuns" "icacls" @($DADOS, "/inheritance:r", "/grant:r", "${SID_LOCAL_SERVICE}:(OI)(CI)M", "${SID_SYSTEM}:(OI)(CI)F", "${SID_ADMINISTRADORES}:(OI)(CI)F", "/Q")

  $filhos = Get-ChildItem -Path $DADOS -Force -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($filhos) {
    $codigo = Executar "icacls" @((Join-Path $DADOS "*"), "/reset", "/T", "/Q")
    if ($codigo -ne 0) {
      # Um arquivo que ficou sem lista de permissões só é alterável pelo dono.
      # O administrador toma posse e tenta de novo.
      Info "Um arquivo em $DADOS estava sem permissões; tomando posse para consertar."
      Executar "takeown" @("/F", (Join-Path $DADOS "*"), "/A") | Out-Null
      Rodar "Fazer os arquivos de $DADOS herdarem as permissões da pasta" "icacls" @((Join-Path $DADOS "*"), "/reset", "/T", "/Q")
    }
  }
  Ok "LocalService escreve em $RAIZ; $DADOS fechada para contas comuns"

  # Atalhos que versões anteriores deixavam na área de trabalho e hoje moram
  # em scripts\implantacao (decisão do dono: só o painel fica à vista).
  foreach ($antigo in @("Atualizar copia para consulta.cmd", "Reiniciar o sistema.cmd")) {
    $caminhoAntigo = Join-Path $AREA_DE_TRABALHO $antigo
    if (Test-Path $caminhoAntigo) { Remove-Item -Force $caminhoAntigo; Info "Atalho antigo removido: $antigo" }
  }
}

# ----------------------------------------------------------------- 3. .env

Etapa "Apontando o sistema para o banco em $BANCO"

$env_ = Join-Path $APP ".env"
if (Test-Path $env_) {
  Ok ".env já existe — mantido como está (é ele que diz onde o banco fica)"
  Info (Get-Content $env_ | Where-Object { $_ -like "DATABASE_URL=*" })
} else {
  $urlDoBanco = "file:" + ($BANCO -replace "\\", "/")
  # ASCII de propósito: o arquivo só tem uma linha sem acento, e o Next lê UTF-8
  # ou ASCII igual — um BOM aqui faria a primeira variável começar com lixo.
  Set-Content -Path $env_ -Value "DATABASE_URL=`"$urlDoBanco`"" -Encoding ASCII
  Ok "Escrito: DATABASE_URL=`"$urlDoBanco`""
}

# ------------------------------------------------ 4. dependências e build

Etapa "Instalando as dependências (leva alguns minutos e precisa de internet)"

Push-Location $APP
try {
  Rodar "Baixar as bibliotecas do sistema (npm ci)" $npm @("ci", "--no-audit", "--no-fund")
  Ok "Bibliotecas instaladas"

  Etapa "Preparando o banco de dados"
  Rodar "Criar ou atualizar as tabelas (prisma migrate deploy)" $npm @("run", "-s", "db:deploy")
  Rodar "Criar as contas do painel (seed só de administradores)" $npm @("run", "-s", "db:seed:producao")
  Ok "Banco pronto em $BANCO"

  Etapa "Compilando o sistema para produção (leva um ou dois minutos)"
  Rodar "Compilar (next build)" $npm @("run", "-s", "build")
  Ok "Compilado"
} finally {
  Pop-Location
}

# ---------------------------------------------------------------- 5. NSSM

Etapa "Baixando o NSSM (o programa que transforma o sistema em serviço do Windows)"

if (Test-Path $NSSM) {
  Ok "Já estava em $NSSM"
} else {
  $zip = Join-Path $FERRAMENTAS "nssm.zip"
  $extraido = Join-Path $FERRAMENTAS "nssm-extraido"
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $NSSM_URL -OutFile $zip -UseBasicParsing
  } catch {
    Falhar "Não consegui baixar $NSSM_URL ($($_.Exception.Message)). Baixe o arquivo manualmente em outro computador, abra o .zip, copie win64\nssm.exe para $FERRAMENTAS e rode o instalador de novo."
  }
  if (Test-Path $extraido) { Remove-Item -Recurse -Force $extraido }
  Expand-Archive -Path $zip -DestinationPath $extraido -Force
  $exe = Get-ChildItem -Path $extraido -Recurse -Filter "nssm.exe" | Where-Object { $_.FullName -like "*\win64\*" } | Select-Object -First 1
  if (-not $exe) { Falhar "O .zip do NSSM não trouxe win64\nssm.exe." }
  Copy-Item $exe.FullName $NSSM
  Remove-Item -Recurse -Force $extraido
  Remove-Item -Force $zip
  Ok "NSSM em $NSSM"
}

if ($SomenteAplicacao) {
  Write-Host ""
  Write-Host "-SomenteAplicacao: parando antes do serviço, firewall, energia, tarefa e atalho." -ForegroundColor Yellow
  Stop-Transcript | Out-Null
  exit 0
}

# -------------------------------------------------------------- 6. serviço

Etapa "Registrando o serviço do Windows '$NOME_EXIBIDO'"

if (Get-Service -Name $SERVICO -ErrorAction SilentlyContinue) {
  Stop-Service -Name $SERVICO -Force -ErrorAction SilentlyContinue
  Nssm @("remove", $SERVICO, "confirm")
  Info "Registro anterior removido; registrando de novo."
}

$binNext = Join-Path $APP "node_modules\next\dist\bin\next"
$erroServico = Join-Path $LOGS "servico.err.log"
$saidaServico = Join-Path $LOGS "servico.log"

Nssm @("install", $SERVICO, $node)
Nssm @("set", $SERVICO, "AppParameters", "$binNext start -p $PORTA")
Nssm @("set", $SERVICO, "AppDirectory", $APP)
Nssm @("set", $SERVICO, "DisplayName", $NOME_EXIBIDO)
Nssm @("set", $SERVICO, "Description", "Servidor local do sistema de emprestimo de equipamentos. Nao pare este servico: o tablet e o painel dependem dele.")
Nssm @("set", $SERVICO, "Start", "SERVICE_AUTO_START")
Nssm @("set", $SERVICO, "AppStdout", $saidaServico)
Nssm @("set", $SERVICO, "AppStderr", $erroServico)
Nssm @("set", $SERVICO, "AppRotateFiles", "1")
Nssm @("set", $SERVICO, "AppRotateOnline", "1")
Nssm @("set", $SERVICO, "AppRotateBytes", "5000000")
Nssm @("set", $SERVICO, "AppExit", "Default", "Restart")
Nssm @("set", $SERVICO, "AppRestartDelay", "5000")
Nssm @("set", $SERVICO, "AppEnvironmentExtra", "NODE_ENV=production")

# LocalService: uma conta do Windows sem senha e com poucos direitos. Se um dia
# alguém achar uma brecha no servidor, ela vale o que essa conta pode fazer —
# e não o que o SYSTEM pode. 'sc' no PowerShell é apelido de Set-Content; por
# isso sc.exe, e o espaço depois de 'obj=' é obrigatório.
Rodar "Definir a conta do serviço (LocalService)" "sc.exe" @("config", $SERVICO, "obj=", "NT AUTHORITY\LocalService")

$parametrosGravados = (Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\$SERVICO\Parameters" -Name AppParameters).AppParameters
if ($parametrosGravados -ne "$binNext start -p $PORTA") {
  Falhar "O NSSM gravou os parâmetros de um jeito inesperado: '$parametrosGravados'."
}
Ok "Serviço '$SERVICO' registrado: $node $parametrosGravados"

# --------------------------------------------- 7. firewall, energia, backup

Etapa "Liberando a porta $PORTA no firewall do Windows"

# O serviço roda sem ninguém logado, então o pop-up "permitir acesso" nunca
# aparece — a regra tem que ser explícita. Vale para todos os perfis de rede
# porque uma rede nova nasce como "Pública" no Windows 11, e o tablet não
# conectaria; quem limita quem alcança o sistema é a rede (roteador próprio da
# coordenação), não o perfil.
Remove-NetFirewallRule -DisplayName $NOME_REGRA -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName $NOME_REGRA -Direction Inbound -Action Allow -Protocol TCP -LocalPort $PORTA -Profile Any | Out-Null
Ok "Regra '$NOME_REGRA' criada"

Etapa "Impedindo o computador de suspender (a tela pode desligar; o sistema, não)"

Executar "powercfg" @("/change", "standby-timeout-ac", "0") | Out-Null
Executar "powercfg" @("/change", "hibernate-timeout-ac", "0") | Out-Null
# Notebook: fechar a tampa não desliga. Num desktop o ajuste não existe e o
# comando reclama — o código de saída é ignorado de propósito.
Executar "powercfg" @("/setacvalueindex", "SCHEME_CURRENT", "SUB_BUTTONS", "LIDACTION", "0") | Out-Null
Executar "powercfg" @("/setactive", "SCHEME_CURRENT") | Out-Null
Ok "Suspensão e hibernação desligadas na tomada"

Etapa "Agendando o backup diário (19:00, todo dia, mesmo sem ninguém logado)"

$scriptBackup = Join-Path $APP "scripts\implantacao\backup.mjs"
$acao = New-ScheduledTaskAction -Execute $node -Argument "`"$scriptBackup`""
$gatilho = New-ScheduledTaskTrigger -Daily -At "19:00"
$conta = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName $NOME_TAREFA -Action $acao -Trigger $gatilho -Principal $conta -Settings $ajustes -Force | Out-Null
Ok "Tarefa '$NOME_TAREFA' registrada (se o PC estiver desligado às 19:00, roda quando ligar)"

# ---------------------------------------------------------------- 8. atalho

Etapa "Criando o atalho do painel na área de trabalho (de todos os usuários do PC)"

# Só o painel fica à vista — decisão do dono. Reiniciar o sistema e atualizar a
# cópia de consulta são os .cmd de scripts\implantacao, e o guia diz onde estão.
$painel = Join-Path $AREA_DE_TRABALHO "Painel de Emprestimos.url"
Set-Content -Path $painel -Encoding ASCII -Value @(
  "[InternetShortcut]",
  "URL=http://localhost:$PORTA/admin"
)
Ok "Painel de Emprestimos"

# --------------------------------------------------------- 9. subir e testar

Etapa "Ligando o serviço e esperando ele responder"

Nssm @("start", $SERVICO)

$respondeu = $false
$limite = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $limite) {
  try {
    $resposta = Invoke-WebRequest -Uri "http://localhost:$PORTA/" -UseBasicParsing -TimeoutSec 5
    if ($resposta.StatusCode -eq 200) { $respondeu = $true; break }
  } catch {}
  Start-Sleep -Seconds 3
}

if (-not $respondeu) {
  Write-Host ""
  Write-Host "O serviço não respondeu em 90 segundos. Últimas linhas do log de erro:" -ForegroundColor Yellow
  if (Test-Path $erroServico) { Get-Content $erroServico -Tail 30 }
  if (Test-Path $saidaServico) { Get-Content $saidaServico -Tail 10 }
  Falhar "O sistema não subiu. O estado do serviço é '$((Get-Service $SERVICO).Status)'."
}
Ok "http://localhost:$PORTA/ respondeu 200"

# A página inicial é estática e responderia mesmo com o banco inacessível; o
# painel de login lê a tabela de administradores, então é ele que prova que o
# serviço consegue abrir o banco.
$respostaAdmin = Invoke-WebRequest -Uri "http://localhost:$PORTA/admin" -UseBasicParsing -TimeoutSec 15
if ($respostaAdmin.StatusCode -ne 200) {
  Falhar "O painel respondeu $($respostaAdmin.StatusCode) em vez de 200."
}
if (Test-Path $erroServico) {
  $errosRecentes = Get-Content $erroServico -Tail 20 | Where-Object { $_ -match "SQLITE_CANTOPEN|unable to open database" }
  if ($errosRecentes) {
    Falhar "O serviço subiu mas não consegue abrir o banco ($BANCO): $($errosRecentes -join ' | '). Rode o instalador de novo; ele conserta as permissões da pasta dados."
  }
}
Ok "http://localhost:$PORTA/admin respondeu 200 e o serviço leu o banco"

# ------------------------------------------------------- 10. acesso pela rede

# Os dois testes acima são por localhost, e localhost NÃO prova o que o tablet
# precisa: ele não sai pela placa de rede e não passa pelo firewall de entrada.
# Até a versão anterior o instalador parava aqui e imprimia o quadro verde
# "INSTALADO" — dizendo que o sistema estava no ar sem nunca ter falado com ele
# por um endereço da rede. Foi o que aconteceu na coordenação em 2026-09-23: a
# instalação terminou em verde e a página não abriu em http://192.168.0.105:3000.
#
# O que dá para conferir de dentro desta máquina são três coisas: em qual
# endereço o servidor escuta, se cada IP responde, e se o firewall está
# aceitando regras de entrada. O que NÃO dá está escrito no fim do bloco, e
# está escrito de propósito — um teste que mente sobre o próprio alcance é
# pior que nenhum.

Etapa "Conferindo o acesso pela rede (é por aqui que o tablet entra)"

# 1. Em que endereço o servidor escuta. Se aparecer só 127.0.0.1 aqui, alguém
#    pôs um -H no AppParameters do serviço: nenhum tablet alcançaria, e o quadro
#    verde seria mentira. É o único caso deste bloco que derruba a instalação.
#
#    O "::" na lista é ACEITO, e a aceitação é medida, não teórica: a ajuda do
#    Next diz que o padrão de `next start` é 0.0.0.0, mas o que o Windows mostra
#    num serviço rodando de verdade é `::` sozinho (medido em 2026-09-23 no
#    serviço desta instalação: Get-NetTCPConnection devolve uma linha só, `::`).
#    É soquete de pilha dupla — o mesmo teste confirmou 200 em http://<IPv4
#    da máquina>:3000/. Quem "corrigir" esta condição para aceitar só 0.0.0.0
#    faz o instalador reprovar toda instalação boa.
$escutas = @()
try {
  $escutas = @(Get-NetTCPConnection -LocalPort $PORTA -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty LocalAddress -Unique)
} catch {}
if ($escutas.Count -gt 0) {
  Info "O servidor escuta em: $($escutas -join ', ')  (porta $PORTA)"
  $emTodasAsPlacas = $false
  foreach ($endereco in $escutas) {
    if ($endereco -eq "0.0.0.0" -or $endereco -eq "::") { $emTodasAsPlacas = $true }
  }
  if (-not $emTodasAsPlacas) {
    Falhar "O servidor está escutando só em $($escutas -join ', ') — em nenhuma placa de rede. Nenhum tablet consegue alcançá-lo. Confira se o AppParameters do serviço ganhou um '-H' (o esperado é '$binNext start -p $PORTA')."
  }
  Ok "Escuta em todas as placas de rede, e não só em localhost"
}

# 2. Cada endereço IPv4 da máquina, um a um, com o nome da placa ao lado. O
#    nome da placa é o que separa o Wi-Fi da coordenação de um adaptador
#    virtual (WSL, Docker, VirtualBox) — os três aparecem aqui como 172.x ou
#    192.168.x e enganam quem só vê o número.
$enderecos = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" })

$algumRespondeu = $false
foreach ($endereco in $enderecos) {
  $alcancou = $false
  try {
    $resposta = Invoke-WebRequest -Uri "http://$($endereco.IPAddress):$PORTA/" -UseBasicParsing -TimeoutSec 8
    if ($resposta.StatusCode -eq 200) { $alcancou = $true }
  } catch {}
  if ($alcancou) {
    $algumRespondeu = $true
    Ok "http://$($endereco.IPAddress):$PORTA/ respondeu 200   (placa: $($endereco.InterfaceAlias))"
  } else {
    Write-Host "    NAO RESPONDEU  http://$($endereco.IPAddress):$PORTA/   (placa: $($endereco.InterfaceAlias))" -ForegroundColor Red
  }
}
if (-not $algumRespondeu -and $enderecos.Count -gt 0) {
  Write-Host "    Nenhum endereço da rede respondeu, embora o localhost responda." -ForegroundColor Red
  Write-Host "    Mande o registro desta instalação para quem mantém o sistema." -ForegroundColor Yellow
}

# 3. O firewall. A regra criada na etapa anterior é ignorada quando o perfil da
#    rede está com "bloquear todas as conexões de entrada" — a regra existe, a
#    tela do firewall a mostra, e mesmo assim nada entra. AllowInboundRules vem
#    como texto True/False/NotConfigured; só o False explícito é bloqueio.
try {
  foreach ($perfil in (Get-NetFirewallProfile -ErrorAction SilentlyContinue)) {
    if ("$($perfil.Enabled)" -eq "True" -and "$($perfil.AllowInboundRules)" -eq "False") {
      Write-Host "    ATENCAO  O perfil de firewall '$($perfil.Name)' está com 'bloquear todas as conexões de entrada' ligado." -ForegroundColor Red
      Write-Host "             Ele ignora a regra que este instalador criou. Desligue em: Segurança do" -ForegroundColor Yellow
      Write-Host "             Windows > Firewall e proteção de rede > $($perfil.Name) > desmarcar a opção." -ForegroundColor Yellow
    }
  }
} catch {}

# 4. O perfil de cada rede conectada. Uma rede nova nasce "Pública" no Windows
#    11; a regra vale para todos os perfis de propósito, então isto é
#    informação para o diagnóstico, e não um erro.
try {
  foreach ($rede in (Get-NetConnectionProfile -ErrorAction SilentlyContinue)) {
    Info "Rede '$($rede.Name)' na placa '$($rede.InterfaceAlias)': perfil $($rede.NetworkCategory)"
  }
} catch {}

Write-Host ""
Write-Host "    O que este teste NAO prova, e ninguem consegue provar desta maquina:" -ForegroundColor Yellow
Write-Host "    conectar no proprio IP a partir do proprio computador nao atravessa o" -ForegroundColor Yellow
Write-Host "    firewall de ENTRADA como um tablet atravessa, e nao passa pelo roteador." -ForegroundColor Yellow
Write-Host "    Se as linhas acima responderam 200 e mesmo assim o tablet nao abre, o" -ForegroundColor Yellow
Write-Host "    problema esta ENTRE os dois: Wi-Fi diferente, isolamento de clientes no" -ForegroundColor Yellow
Write-Host "    roteador, ou o firewall. O teste que vale e abrir a pagina no CELULAR," -ForegroundColor Yellow
Write-Host "    ligado no MESMO Wi-Fi que o tablet vai usar." -ForegroundColor Yellow

Etapa "Fazendo o primeiro backup e a primeira cópia de consulta"
Rodar "backup.mjs" $node @($scriptBackup)

# ----------------------------------------------------------------- resumo

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host " INSTALADO. O sistema já está no ar e sobe sozinho com o Windows." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Painel (neste computador):  http://localhost:$PORTA/admin"
# O nome da placa vai junto do número: quando a máquina tem Wi-Fi e cabo, ou um
# adaptador virtual, "anote o endereço que começa com 192.168" não basta — são
# dois, e só um deles é a rede em que o tablet está.
foreach ($endereco in $enderecos) {
  Write-Host ""
  Write-Host " Pela placa '$($endereco.InterfaceAlias)':"
  Write-Host "   No tablet / outro PC:     http://$($endereco.IPAddress):${PORTA}/         (portal)"
  Write-Host "                             http://$($endereco.IPAddress):${PORTA}/admin    (painel)"
}
if ($enderecos.Count -gt 1) {
  Write-Host ""
  Write-Host " Sao $($enderecos.Count) enderecos porque este computador tem mais de uma placa de rede." -ForegroundColor Yellow
  Write-Host " Use o da placa que esta no MESMO Wi-Fi do tablet - o nome aparece acima." -ForegroundColor Yellow
}
Write-Host ""
Write-Host " Contas do painel: secretario, cidi, jeanzao, viccenzo — senha inicial Mudar@123"
Write-Host " TROQUE as senhas hoje, pelo próprio painel (Alterar senha, no pé da barra lateral)."
Write-Host ""
Write-Host " Banco de dados:     $BANCO"
Write-Host " Backups (30 dias):  $RAIZ\backups\"
Write-Host " Cópia de consulta:  $RAIZ\consulta\emprestimos-consulta.db"
Write-Host " Logs:               $LOGS\"
Write-Host " Reiniciar / copiar para consulta / atualizar: os .cmd em $APP\scripts\implantacao\"
Write-Host ""
Write-Host " Se o tablet não abrir a página: confira se ele está no MESMO Wi-Fi que este"
Write-Host " computador, e tente o endereço com o IP acima. O guia tem o restante."
Write-Host ""
# O caminho da transcrição só aparecia no começo da execução (cinza, etapa 2) e
# na mensagem de falha. Quem chega ao fim e descobre o problema DEPOIS — o
# tablet que não abre — já rolou a janela para longe daquela linha, e manda o
# que encontra sozinho: os logs do npm, que não dizem nada sobre serviço,
# firewall ou rede. Aconteceu em 2026-09-23. A linha fica no quadro verde
# porque é o quadro que continua na tela.
Write-Host " Registro desta instalacao: $($script:LOG)"
Write-Host " Se algo nao funcionar, mande ESSE arquivo - ele tem as 10 etapas acima."
Write-Host ""

Stop-Transcript | Out-Null
exit 0
