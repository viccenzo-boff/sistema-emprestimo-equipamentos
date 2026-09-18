<#
  atualizar.ps1 — troca a versão instalada do sistema por uma tag do
  repositório (Tarefa 18). É chamado pelo atualizar.cmd, que pede administrador.

  A sequência, sempre nesta ordem:
    1. backup do banco (com o serviço ainda no ar — o backup é online)
    2. parar o serviço
    3. git fetch --tags e git checkout <tag>
    4. npm ci → migrations (migrate deploy, nunca migrate dev) → build
    5. subir o serviço e esperar ele responder

  Por tag, e não por 'main': um push na main durante a semana não muda o que
  está instalado. Instalar uma versão é um gesto deliberado, com nome.

  O serviço fica parado durante o build e as migrations de propósito: o
  'next build' reescreve app\.next embaixo do servidor que está rodando, e a
  migration não pode disputar o banco com ninguém. São dois ou três minutos
  sem sistema — rode fora do expediente.

  Se algo falhar depois do checkout, o sistema fica parado e a tela diz o
  que fazer: rodar de novo com a tag anterior devolve o código; o backup do
  passo 1 devolve o banco (copie-o por cima de dados\emprestimos.db com o
  serviço parado).

  Escrito para o PowerShell 5.1 (sem &&, ternário ou ??), salvo em UTF-8 com BOM.
#>

param(
  [string]$Tag
)

$ErrorActionPreference = "Stop"

$RAIZ = "C:\emprestimos"
if ($env:EMPRESTIMOS_RAIZ) { $RAIZ = $env:EMPRESTIMOS_RAIZ }
$PORTA = 3000
if ($env:EMPRESTIMOS_PORTA) { $PORTA = [int]$env:EMPRESTIMOS_PORTA }

$APP = Join-Path $RAIZ "app"
$LOGS = Join-Path $RAIZ "logs"
$NSSM = Join-Path $RAIZ "ferramentas\nssm.exe"
$SERVICO = "Emprestimos"
$script:LOG = $null

function Etapa($texto) { Write-Host ""; Write-Host "=== $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "    OK  $texto" -ForegroundColor Green }
function Info($texto) { Write-Host "        $texto" -ForegroundColor Gray }

function Falhar($mensagem) {
  Write-Host ""
  Write-Host "PAROU AQUI: $mensagem" -ForegroundColor Red
  if ($script:LOG) {
    Write-Host "Tudo que apareceu nesta janela está gravado em $($script:LOG)" -ForegroundColor Yellow
    try { Stop-Transcript | Out-Null } catch {}
  }
  exit 1
}

function Rodar($descricao, $exe, [string[]]$argumentos) {
  Write-Host "    > $descricao" -ForegroundColor White
  Info "$exe $($argumentos -join ' ')"
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $exe @argumentos
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = $anterior
  if ($codigo -ne 0) { Falhar "'$descricao' terminou com erro (código $codigo). Leia as linhas acima." }
}

function Nssm([string[]]$argumentos) {
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $NSSM @argumentos 2>&1 | Out-Null
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = $anterior
  if ($codigo -ne 0) { Falhar "nssm $($argumentos -join ' ') devolveu o código $codigo." }
}

# ------------------------------------------------------------ pré-requisitos

$ehAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $ehAdmin) { Falhar "Rode o atualizar.cmd com o botão direito → 'Executar como administrador'." }

if (-not (Test-Path (Join-Path $APP ".env"))) { Falhar "Não achei uma instalação em $APP. Rode o instalar.cmd primeiro." }
if (-not (Test-Path $NSSM)) { Falhar "Não achei $NSSM. Rode o instalar.cmd primeiro." }
if (-not (Get-Service -Name $SERVICO -ErrorAction SilentlyContinue)) { Falhar "O serviço $SERVICO não existe. Rode o instalar.cmd primeiro." }

$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = "C:\Program Files\nodejs\node.exe" }
if (-not (Test-Path $node)) { Falhar "Node.js não encontrado." }
$npm = Join-Path (Split-Path $node) "npm.cmd"
$git = (Get-Command git.exe -ErrorAction SilentlyContinue).Source
if (-not $git) { Falhar "Git não encontrado." }

New-Item -ItemType Directory -Force -Path $LOGS | Out-Null
$script:LOG = Join-Path $LOGS ("atualizacao-" + (Get-Date -Format "yyyy-MM-dd-HHmmss") + ".log")
Start-Transcript -Path $script:LOG | Out-Null

Push-Location $APP
try {
  # ------------------------------------------------------------- a tag

  Etapa "Buscando as versões disponíveis"
  Rodar "git fetch --tags" $git @("fetch", "--tags", "--force", "--quiet")
  $tags = @(& $git tag -l --sort=-v:refname)
  $atualInstalada = (& $git describe --tags --always).Trim()
  Info "Instalada agora: $atualInstalada"
  Info "Disponíveis: $($tags -join ', ')"

  if (-not $Tag) {
    Write-Host ""
    $Tag = Read-Host "Qual versão instalar? (digite exatamente como na lista acima, por exemplo v1.1)"
  }
  $Tag = $Tag.Trim()
  if (-not $Tag) { Falhar "Nenhuma versão informada." }
  if ($tags -notcontains $Tag) { Falhar "A versão '$Tag' não existe. As disponíveis são: $($tags -join ', ')." }

  # ------------------------------------------------------------ backup

  Etapa "Fazendo backup do banco antes de qualquer coisa"
  Rodar "backup.mjs" $node @((Join-Path $APP "scripts\implantacao\backup.mjs"))

  # ------------------------------------------------------------- parar

  Etapa "Parando o serviço (o sistema fica fora do ar até o fim desta atualização)"
  Stop-Service -Name $SERVICO -Force
  $limite = (Get-Date).AddSeconds(30)
  while ((Get-Service $SERVICO).Status -ne "Stopped" -and (Get-Date) -lt $limite) { Start-Sleep -Seconds 1 }
  if ((Get-Service $SERVICO).Status -ne "Stopped") { Falhar "O serviço não parou em 30 segundos." }
  Ok "Parado"

  # ---------------------------------------------------------- checkout

  Etapa "Trocando o código para a versão $Tag"
  # --force descarta alteração local em arquivo versionado: nesta máquina
  # ninguém edita código, e o 'prisma generate' do npm ci reescreve
  # src/generated, que é versionado — sem --force o checkout recusaria.
  Rodar "git checkout $Tag" $git @("checkout", "--force", "--quiet", $Tag)
  Ok "Código em $((& $git describe --tags --always).Trim())"

  # ---------------------------------------------- dependências e banco

  Etapa "Instalando dependências, atualizando o banco e compilando"
  Rodar "npm ci" $npm @("ci", "--no-audit", "--no-fund")
  Rodar "prisma migrate deploy" $npm @("run", "-s", "db:deploy")
  Rodar "next build" $npm @("run", "-s", "build")
  Ok "Pronto para subir"
} finally {
  Pop-Location
}

# ---------------------------------------------------------------- subir

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
  $erroServico = Join-Path $LOGS "servico.err.log"
  if (Test-Path $erroServico) { Get-Content $erroServico -Tail 30 }
  Falhar "O sistema não voltou em 90 segundos. Para voltar à versão anterior: atualizar.cmd com a tag $atualInstalada."
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host " ATUALIZADO para $Tag. O sistema está no ar de novo." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host " Painel: http://localhost:$PORTA/admin"
Write-Host " Backup feito antes da troca: $RAIZ\backups\"
Write-Host ""

Stop-Transcript | Out-Null
exit 0
