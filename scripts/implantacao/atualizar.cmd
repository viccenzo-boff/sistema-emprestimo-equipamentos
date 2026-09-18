@echo off
rem Atualiza o Sistema de Emprestimo de Equipamentos para uma versao (tag).
rem Duplo clique: pede administrador sozinho, mostra as versoes disponiveis
rem e pergunta qual instalar. Rode fora do expediente: o sistema fica uns
rem minutos fora do ar. (Texto sem acento de proposito: codificacao do cmd.)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0atualizar.ps1"
echo.
echo (Pode fechar esta janela.)
pause
