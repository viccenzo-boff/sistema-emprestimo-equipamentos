@echo off
rem Instala o Sistema de Emprestimo de Equipamentos como servico do Windows.
rem Duplo clique basta: este arquivo pede administrador sozinho e chama o
rem instalar.ps1, que faz o trabalho e explica cada passo na tela.
rem (Texto sem acento de proposito: o cmd usa outra codificacao.)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1"
echo.
echo (Pode fechar esta janela.)
pause
