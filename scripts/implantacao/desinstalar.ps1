<#
  desinstalar.ps1 — tira o serviço, a regra de firewall, a tarefa agendada e
  os atalhos que o instalar.ps1 criou (Tarefa 18). É chamado pelo
  desinstalar.cmd, que pede administrador.

  NUNCA apaga dados\ (o banco), backups\ nem consulta\. Quem quiser apagar
  tudo, apaga a pasta C:\emprestimos à mão depois — e a tela diz isso.

  Serve para dois casos: desmontar uma instalação de teste no próprio
  computador, e tirar o sistema de uma máquina que vai ser devolvida. Os
  ajustes de energia (não suspender) ficam como estão — são preferência do
  computador, não do sistema.

  Escrito para o PowerShell 5.1, salvo em UTF-8 com BOM.
#>

$ErrorActionPreference = "Stop"

$RAIZ = "C:\emprestimos"
if ($env:EMPRESTIMOS_RAIZ) { $RAIZ = $env:EMPRESTIMOS_RAIZ }
$PORTA = 3000
if ($env:EMPRESTIMOS_PORTA) { $PORTA = [int]$env:EMPRESTIMOS_PORTA }

$NSSM = Join-Path $RAIZ "ferramentas\nssm.exe"
$SERVICO = "Emprestimos"
$NOME_TAREFA = "Sistema de Emprestimos - Backup diario"
$NOME_REGRA = "Sistema de Emprestimos (porta $PORTA)"
$AREA_DE_TRABALHO = Join-Path $env:PUBLIC "Desktop"

function Ok($texto) { Write-Host "    OK  $texto" -ForegroundColor Green }
function Info($texto) { Write-Host "        $texto" -ForegroundColor Gray }

$ehAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $ehAdmin) {
  Write-Host "Rode o desinstalar.cmd com o botão direito → 'Executar como administrador'." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Desinstalando o Sistema de Emprestimos de $RAIZ" -ForegroundColor White
Write-Host ""

# Serviço
if (Get-Service -Name $SERVICO -ErrorAction SilentlyContinue) {
  Stop-Service -Name $SERVICO -Force -ErrorAction SilentlyContinue
  if (Test-Path $NSSM) {
    $anterior = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $NSSM remove $SERVICO confirm 2>&1 | Out-Null
    $ErrorActionPreference = $anterior
  } else {
    & sc.exe delete $SERVICO | Out-Null
  }
  Ok "Serviço '$SERVICO' removido"
} else {
  Info "Serviço '$SERVICO' não existia"
}

# Firewall
if (Get-NetFirewallRule -DisplayName $NOME_REGRA -ErrorAction SilentlyContinue) {
  Remove-NetFirewallRule -DisplayName $NOME_REGRA
  Ok "Regra de firewall '$NOME_REGRA' removida"
} else {
  Info "Regra de firewall não existia"
}

# Tarefa agendada
if (Get-ScheduledTask -TaskName $NOME_TAREFA -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $NOME_TAREFA -Confirm:$false
  Ok "Tarefa agendada '$NOME_TAREFA' removida"
} else {
  Info "Tarefa agendada não existia"
}

# Atalhos
foreach ($nome in @("Painel de Emprestimos.url", "Atualizar copia para consulta.cmd", "Reiniciar o sistema.cmd")) {
  $atalho = Join-Path $AREA_DE_TRABALHO $nome
  if (Test-Path $atalho) { Remove-Item -Force $atalho; Ok "Atalho '$nome' removido" }
}

Write-Host ""
Write-Host "Pronto. O que FICOU, de propósito:" -ForegroundColor Yellow
Write-Host "  $RAIZ\dados\      (o banco de dados)"
Write-Host "  $RAIZ\backups\    (as cópias diárias)"
Write-Host "  $RAIZ\consulta\   (a cópia de consulta)"
Write-Host "  $RAIZ\app\        (o código)"
Write-Host "Se quiser apagar tudo, apague a pasta $RAIZ inteira — não há mais nada rodando nela."
Write-Host ""
exit 0
