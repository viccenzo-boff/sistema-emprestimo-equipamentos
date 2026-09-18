<#
  instalar.ps1 — instala o Sistema de Empréstimo de Equipamentos como serviço
  do Windows (Tarefa 18). É chamado pelo instalar.cmd, que pede administrador.

  O que ele faz, na ordem em que imprime:
    1. confere Node ≥ 24, Git e se a porta está livre
    2. cria C:\emprestimos\{dados,backups,consulta,logs,ferramentas}
    3. escreve o .env com o caminho ABSOLUTO do banco (se ainda não existir)
    4. npm ci → migrations → seed só de administradores → build
    5. baixa o NSSM e registra o serviço "Emprestimos" (sobe no boot,
       reinicia se cair, log com rotação, conta LocalService)
    6. permissões: LocalService escreve em C:\emprestimos; dados\ fica fechada
       para as contas comuns do PC
    7. firewall, energia (sem suspender), tarefa agendada do backup, atalhos
    8. sobe o serviço, espera ele responder e roda o primeiro backup

  Rodar de novo é seguro: para o serviço, refaz tudo e preserva o banco e o
  .env. É também o jeito de reparar uma instalação.

  Duas variáveis de ambiente existem para a verificação, não para o uso normal:
    EMPRESTIMOS_RAIZ   troca C:\emprestimos por outra pasta
    EMPRESTIMOS_PORTA  troca a porta 3000
  E o parâmetro -SomenteAplicacao roda só os passos que não pedem administrador
  (2 a 4 e o download do NSSM) — é como o pipeline é conferido sem elevação.

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

# Roda um programa externo e para se ele devolver erro. O $ErrorActionPreference
# vai a Continue só aqui: com Stop, um aviso no stderr do npm derrubaria tudo.
function Rodar($descricao, $exe, [string[]]$argumentos) {
  Write-Host "    > $descricao" -ForegroundColor White
  Info "$exe $($argumentos -join ' ')"
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $exe @argumentos
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = $anterior
  if ($codigo -ne 0) {
    Falhar "'$descricao' terminou com erro (código $codigo). Leia as linhas acima."
  }
}

function AcharNode {
  $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $padrao = "C:\Program Files\nodejs\node.exe"
  if (Test-Path $padrao) { return $padrao }
  return $null
}

# ------------------------------------------------------- 1. pré-requisitos

Write-Host ""
Write-Host "Sistema de Emprestimo de Equipamentos - instalacao" -ForegroundColor White
Write-Host "Pasta: $RAIZ   Porta: $PORTA" -ForegroundColor Gray

Etapa "Conferindo o que a máquina precisa ter"

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

$node = AcharNode
if (-not $node) {
  Falhar "Node.js não encontrado. Instale-o (passo 1 do guia) e abra uma janela nova antes de rodar este instalador de novo."
}
$versaoNode = (& $node -v).Trim()
$majorNode = [int]($versaoNode -replace "^v(\d+).*$", '$1')
if ($majorNode -lt 24) {
  Falhar "O Node instalado é o $versaoNode; o sistema precisa do 24 ou mais novo. Instale a versão LTS atual (passo 1 do guia)."
}
$pastaNode = Split-Path $node
$npm = Join-Path $pastaNode "npm.cmd"
if (-not (Test-Path $npm)) { Falhar "Achei o Node em $node mas não o npm ao lado dele." }
Ok "Node $versaoNode em $node"

$git = Get-Command git.exe -ErrorAction SilentlyContinue
if (-not $git) {
  Falhar "Git não encontrado. Instale-o (passo 1 do guia) e abra uma janela nova."
}
Ok "Git em $($git.Source)"

# A porta: se for o nosso próprio serviço de uma instalação anterior, ele é
# parado (o npm ci precisa dos arquivos livres). Qualquer outro programa faz o
# instalador parar e dizer qual é — o caso típico é um 'npm run dev' aberto.
$servicoExistente = Get-Service -Name $SERVICO -ErrorAction SilentlyContinue
if ($servicoExistente -and $servicoExistente.Status -ne "Stopped") {
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

# --------------------------------------------------------------- 2. pastas

Etapa "Criando as pastas em $RAIZ"

foreach ($pasta in @($RAIZ, $DADOS, (Join-Path $RAIZ "backups"), (Join-Path $RAIZ "consulta"), $LOGS, $FERRAMENTAS)) {
  New-Item -ItemType Directory -Force -Path $pasta | Out-Null
}
Ok "app, dados, backups, consulta, logs, ferramentas"

$script:LOG = Join-Path $LOGS ("instalacao-" + (Get-Date -Format "yyyy-MM-dd-HHmmss") + ".log")
Start-Transcript -Path $script:LOG | Out-Null
Info "Esta janela está sendo gravada em $($script:LOG)"

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
  Write-Host "-SomenteAplicacao: parando antes do serviço, permissões, firewall, energia, tarefa e atalhos." -ForegroundColor Yellow
  Stop-Transcript | Out-Null
  exit 0
}

# -------------------------------------------------------------- 6. serviço

Etapa "Registrando o serviço do Windows '$NOME_EXIBIDO'"

$binNext = Join-Path $APP "node_modules\next\dist\bin\next"
$erroServico = Join-Path $LOGS "servico.err.log"
$saidaServico = Join-Path $LOGS "servico.log"

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

if (Get-Service -Name $SERVICO -ErrorAction SilentlyContinue) {
  Stop-Service -Name $SERVICO -Force -ErrorAction SilentlyContinue
  Nssm @("remove", $SERVICO, "confirm")
  Info "Registro anterior removido; registrando de novo."
}

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

# ----------------------------------------------------------- 7. permissões

Etapa "Ajustando as permissões das pastas"

# LocalService precisa escrever em toda a instalação: o banco em dados\, os
# logs, e o cache que o Next mantém em app\.next.
Rodar "Dar escrita ao LocalService em $RAIZ" "icacls" @($RAIZ, "/grant", "${SID_LOCAL_SERVICE}:(OI)(CI)M", "/Q")

# dados\ deixa de herdar: só o serviço, o SYSTEM (o backup agendado) e os
# administradores enxergam o banco vivo. Quem consulta usa consulta\.
Rodar "Fechar $DADOS para as contas comuns" "icacls" @($DADOS, "/inheritance:r", "/grant:r", "${SID_LOCAL_SERVICE}:(OI)(CI)M", "${SID_SYSTEM}:(OI)(CI)F", "${SID_ADMINISTRADORES}:(OI)(CI)F", "/T", "/Q")
Ok "LocalService escreve em $RAIZ; $DADOS fechada para contas comuns"

# --------------------------------------------- 8. firewall, energia, backup

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

$anterior = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& powercfg /change standby-timeout-ac 0 | Out-Null
& powercfg /change hibernate-timeout-ac 0 | Out-Null
# Notebook: fechar a tampa não desliga. Num desktop o ajuste não existe e o
# comando reclama — por isso a saída vai para o nada.
& powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0 2>$null | Out-Null
& powercfg /setactive SCHEME_CURRENT 2>$null | Out-Null
$ErrorActionPreference = $anterior
Ok "Suspensão e hibernação desligadas na tomada"

Etapa "Agendando o backup diário (19:00, todo dia, mesmo sem ninguém logado)"

$scriptBackup = Join-Path $APP "scripts\implantacao\backup.mjs"
$acao = New-ScheduledTaskAction -Execute $node -Argument "`"$scriptBackup`""
$gatilho = New-ScheduledTaskTrigger -Daily -At "19:00"
$conta = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName $NOME_TAREFA -Action $acao -Trigger $gatilho -Principal $conta -Settings $ajustes -Force | Out-Null
Ok "Tarefa '$NOME_TAREFA' registrada (se o PC estiver desligado às 19:00, roda quando ligar)"

# --------------------------------------------------------------- 9. atalhos

Etapa "Criando os atalhos na área de trabalho (de todos os usuários do PC)"

$painel = Join-Path $AREA_DE_TRABALHO "Painel de Emprestimos.url"
Set-Content -Path $painel -Encoding ASCII -Value @(
  "[InternetShortcut]",
  "URL=http://localhost:$PORTA/admin"
)

# Os dois .cmd pedem administrador sozinhos (o backup lê dados\, que ficou
# fechada; o reinício mexe em serviço). Texto sem acento: o cmd usa outra
# codificação e mostraria lixo.
$copia = Join-Path $AREA_DE_TRABALHO "Atualizar copia para consulta.cmd"
Set-Content -Path $copia -Encoding ASCII -Value @(
  "@echo off",
  "net session >nul 2>&1 || (powershell -NoProfile -Command `"Start-Process -FilePath '%~f0' -Verb RunAs`" & exit /b)",
  "echo Copiando o banco para a pasta de consulta...",
  "`"$node`" `"$scriptBackup`"",
  "echo.",
  "echo Pronto. Abra $RAIZ\consulta\emprestimos-consulta.db no DB Browser for SQLite (Abrir somente leitura).",
  "pause"
)

$reiniciar = Join-Path $AREA_DE_TRABALHO "Reiniciar o sistema.cmd"
Set-Content -Path $reiniciar -Encoding ASCII -Value @(
  "@echo off",
  "net session >nul 2>&1 || (powershell -NoProfile -Command `"Start-Process -FilePath '%~f0' -Verb RunAs`" & exit /b)",
  "echo Reiniciando o Sistema de Emprestimos...",
  "`"$NSSM`" restart $SERVICO",
  "echo.",
  "echo Aguarde uns 15 segundos e abra o painel de novo.",
  "echo Se continuar sem responder, reinicie o computador. Se ainda assim nao voltar, mande a pasta $LOGS para quem mantem o sistema.",
  "pause"
)
Ok "Painel de Emprestimos · Atualizar copia para consulta · Reiniciar o sistema"

# --------------------------------------------------------- 10. subir e testar

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

Etapa "Fazendo o primeiro backup e a primeira cópia de consulta"
Rodar "backup.mjs" $node @($scriptBackup)

# ----------------------------------------------------------------- resumo

$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -ExpandProperty IPAddress

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host " INSTALADO. O sistema já está no ar e sobe sozinho com o Windows." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Painel (neste computador):  http://localhost:$PORTA/admin"
foreach ($ip in $ips) {
  Write-Host " No tablet / outro PC:       http://${ip}:${PORTA}/         (portal)"
  Write-Host "                             http://${ip}:${PORTA}/admin    (painel)"
}
Write-Host ""
Write-Host " Contas do painel: secretario, cidi, jeanzao, viccenzo — senha inicial Mudar@123"
Write-Host " TROQUE as senhas hoje, pelo próprio painel (Alterar senha, no pé da barra lateral)."
Write-Host ""
Write-Host " Banco de dados:     $BANCO"
Write-Host " Backups (30 dias):  $RAIZ\backups\"
Write-Host " Cópia de consulta:  $RAIZ\consulta\emprestimos-consulta.db"
Write-Host " Logs:               $LOGS\"
Write-Host ""
Write-Host " Se o tablet não abrir a página: confira se ele está no MESMO Wi-Fi que este"
Write-Host " computador, e tente o endereço com o IP acima. O guia tem o restante."
Write-Host ""

Stop-Transcript | Out-Null
exit 0
