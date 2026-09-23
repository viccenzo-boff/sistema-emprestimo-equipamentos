@echo off
rem Diagnostico do Sistema de Emprestimos: descobre por que o tablet nao abre
rem a pagina. Nao muda nada - so olha e escreve um relatorio em
rem C:\emprestimos\logs\diagnostico-<data>.txt. Duplo clique basta: este
rem arquivo pede administrador sozinho.
rem (Texto sem acento de proposito: o cmd usa outra codificacao.)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0diagnostico.ps1"
echo.
pause
