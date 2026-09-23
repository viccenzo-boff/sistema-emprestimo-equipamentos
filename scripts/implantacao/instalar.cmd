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

rem O codigo de saida e lido e dito em portugues. Ate 2026-09-23 este arquivo
rem terminava com um "pause" igual nos dois casos: quem fechou a janela sem
rem rolar para cima nao tinha como saber se tinha visto o quadro verde ou o
rem "PAROU AQUI" vermelho. Foi assim que uma instalacao que parou no npm ci
rem virou "aparentemente deu certo".
set "RESULTADO=%errorlevel%"
echo.
if "%RESULTADO%"=="0" (
  echo ============================================================
  echo  A INSTALACAO TERMINOU BEM.
  echo.
  echo  Anote o endereco http://...:3000/ que aparece acima. E ele
  echo  que vai no tablet, e ele e DESTE computador: o endereco de
  echo  outra maquina nao abre nada aqui.
  echo ============================================================
) else (
  echo ============================================================
  echo  A INSTALACAO NAO TERMINOU  [codigo %RESULTADO%]
  echo.
  echo  Role esta janela para cima e leia a linha vermelha que
  echo  comeca com PAROU AQUI: ela diz o que falta.
  echo.
  echo  O registro completo esta na pasta C:\emprestimos\logs,
  echo  no arquivo instalacao-AAAA-MM-DD-HHMMSS.log mais recente.
  echo  E esse arquivo que se manda para quem mantem o sistema.
  echo ============================================================
)
echo.
pause
