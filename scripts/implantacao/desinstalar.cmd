@echo off
rem Remove o servico, a regra de firewall, a tarefa agendada e os atalhos.
rem NAO apaga o banco nem os backups. Duplo clique: pede administrador sozinho.
rem (Texto sem acento de proposito: codificacao do cmd.)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0desinstalar.ps1"
echo.
echo (Pode fechar esta janela.)
pause
