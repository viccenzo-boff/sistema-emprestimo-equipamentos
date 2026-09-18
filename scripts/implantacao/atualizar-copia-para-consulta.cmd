@echo off
rem Copia o banco de agora para a pasta de consulta (e faz o backup do dia).
rem E o que a coordenacao roda antes de abrir a copia no DB Browser for SQLite.
rem Pede administrador sozinho: a pasta dados\ e fechada para contas comuns.
rem (Texto sem acento de proposito: codificacao do cmd.)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

for %%I in ("%~dp0..\..\..") do set "RAIZ=%%~fI"
set "NODE=%ProgramFiles%\nodejs\node.exe"
if not exist "%NODE%" set "NODE=node"

echo Copiando o banco para a pasta de consulta...
"%NODE%" "%~dp0backup.mjs"
echo.
if %errorlevel% neq 0 (
  echo Nao deu certo. Se a copia estiver aberta no DB Browser, feche-o e tente de novo.
) else (
  echo Pronto. Abra %RAIZ%\consulta\emprestimos-consulta.db no DB Browser for SQLite
  echo com "Abrir banco de dados somente leitura".
)
echo.
pause
