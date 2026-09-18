@echo off
rem Reinicia o servico do Sistema de Emprestimos. Para quando o tablet mostra
rem erro de conexao e o computador esta ligado. Pede administrador sozinho.
rem (Texto sem acento de proposito: codificacao do cmd.)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

for %%I in ("%~dp0..\..\..") do set "RAIZ=%%~fI"
set "NSSM=%RAIZ%\ferramentas\nssm.exe"

if not exist "%NSSM%" (
  echo Nao achei %NSSM%. O sistema foi instalado com o instalar.cmd?
  pause
  exit /b 1
)

echo Reiniciando o Sistema de Emprestimos...
"%NSSM%" restart Emprestimos
echo.
echo Aguarde uns 15 segundos e abra o painel de novo.
echo Se continuar sem responder, reinicie o computador. Se ainda assim nao voltar,
echo mande a pasta %RAIZ%\logs para quem mantem o sistema.
echo.
pause
