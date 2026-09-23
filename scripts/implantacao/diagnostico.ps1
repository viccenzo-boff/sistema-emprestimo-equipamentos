<#
  diagnostico.ps1 — responde "por que o tablet não abre a página?" sem que
  ninguém precise ler log. É chamado pelo diagnostico.cmd, que pede
  administrador; não muda nada na máquina, só olha e escreve um relatório.

  Ele existe porque o instalador prova que o sistema responde em
  http://localhost:3000/ — e, até a instalação de 2026-09-23, era só isso que
  ele provava. Entre esse 200 e o tablet abrindo a página existem cinco coisas
  que falham caladas: o serviço cair depois da instalação, o servidor escutar
  só em 127.0.0.1, o endereço da máquina ter mudado (ou ser o de OUTRO
  computador, que foi o caso), a regra de firewall não valer no perfil da rede
  ativa, e o banco não abrir. Cada seção abaixo separa uma delas.

  A saída inteira é gravada em C:\emprestimos\logs\diagnostico-<data>.txt.
  É esse arquivo que se manda para quem mantém o sistema — e não os logs do
  npm em AppData, que não sabem nada sobre serviço, firewall ou rede.

  CUIDADO AO EDITAR: no PowerShell o nome de variável NÃO distingue caixa, e
  $SERVICO e $servico são a MESMA variável. A primeira versão deste arquivo
  fazia `$servico = Get-Service -Name $SERVICO` e imprimia na tela
  "O serviço 'System.ServiceProcess.ServiceController' está rodando", além de
  procurar o serviço no registro por um nome que já não existia — tudo sem um
  único erro. Por isso as constantes em caixa alta não têm nenhum parente
  minúsculo aqui dentro.

  Escrito para o PowerShell 5.1 que vem com o Windows: sem &&, sem ternário,
  sem ??. Salvo em UTF-8 COM BOM — sem o BOM o 5.1 lê os acentos como ANSI.
#>

$ErrorActionPreference = "Continue"

$RAIZ = "C:\emprestimos"
if ($env:EMPRESTIMOS_RAIZ) { $RAIZ = $env:EMPRESTIMOS_RAIZ }
$PORTA = 3000
if ($env:EMPRESTIMOS_PORTA) { $PORTA = [int]$env:EMPRESTIMOS_PORTA }

$APP = Join-Path $RAIZ "app"
$LOGS = Join-Path $RAIZ "logs"
$BANCO = Join-Path $RAIZ "dados\emprestimos.db"
$SERVICO = "Emprestimos"
$NOME_REGRA = "Sistema de Emprestimos (porta $PORTA)"

$script:listaDeProblemas = @()
$script:listaDeAvisos = @()
$script:listaDeEnderecos = @()

function Secao($texto) {
  Write-Host ""
  Write-Host "=== $texto" -ForegroundColor Cyan
}
function Bom($texto) { Write-Host "    OK    $texto" -ForegroundColor Green }
function Ruim($texto) {
  Write-Host "    ERRO  $texto" -ForegroundColor Red
  $script:listaDeProblemas += $texto
}
# Aviso não entra na conta de problemas de propósito: um relatório que termina
# em "encontrei 1 coisa para resolver" numa instalação perfeita ensina o leitor
# a ignorar o número, e aí o dia em que houver um erro de verdade ele também
# passa batido. Erro é o que impede o sistema de funcionar; aviso é o que vale
# a pena saber.
function Atencao($texto) {
  Write-Host "    ?     $texto" -ForegroundColor Yellow
  $script:listaDeAvisos += $texto
}
function Nota($texto) { Write-Host "          $texto" -ForegroundColor Gray }

# Pede uma página e devolve o código HTTP, ou o motivo de não ter respondido.
function Pedir($url, $segundos = 10) {
  try {
    $resposta = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $segundos
    return "" + $resposta.StatusCode
  } catch {
    if ($_.Exception.Response) { return "" + [int]$_.Exception.Response.StatusCode }
    return "sem resposta (" + $_.Exception.Message + ")"
  }
}

# Test-Path LANÇA "Acesso negado" em vez de devolver $false quando a conta não
# enxerga o arquivo — e a pasta dados\ é fechada para as contas comuns de
# propósito. Sem esta separação o relatório dizia "não achei o banco" para uma
# instalação perfeita, rodado sem administrador. Devolve: existe / negado /
# ausente.
function EstadoDoArquivo($caminho) {
  try {
    if (Test-Path -LiteralPath $caminho -ErrorAction Stop) { return "existe" }
    return "ausente"
  } catch [System.UnauthorizedAccessException] {
    return "negado"
  } catch {
    if ("$($_.Exception.GetType().Name)" -like "*UnauthorizedAccess*") { return "negado" }
    return "ausente"
  }
}

New-Item -ItemType Directory -Force -Path $LOGS | Out-Null
$arquivoDoRelatorio = Join-Path $LOGS ("diagnostico-" + (Get-Date -Format "yyyy-MM-dd-HHmmss") + ".txt")
Start-Transcript -Path $arquivoDoRelatorio | Out-Null

$ehAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host ""
Write-Host "Sistema de Emprestimo de Equipamentos - diagnostico" -ForegroundColor White
Write-Host "$(Get-Date -Format 'dd/MM/yyyy HH:mm')   computador: $env:COMPUTERNAME   pasta: $RAIZ   porta: $PORTA" -ForegroundColor Gray
if (-not $ehAdmin) {
  Write-Host "(rodando SEM administrador: algumas linhas vao dizer 'sem permissao'. Use o diagnostico.cmd.)" -ForegroundColor Yellow
}

# ------------------------------------------------------------ 1. instalação

Secao "1. A instalação existe nesta máquina?"

if (Test-Path $APP) { Bom "A pasta $APP existe" } else { Ruim "A pasta $APP NÃO existe - o sistema nunca foi instalado aqui. Rode o instalar.cmd." }

$marcaDoBuild = Join-Path $APP ".next\BUILD_ID"
if (Test-Path $marcaDoBuild) {
  Bom "O sistema está compilado (.next de $((Get-Item $marcaDoBuild).LastWriteTime.ToString('dd/MM/yyyy HH:mm')))"
} else {
  Ruim "Não achei $APP\.next - o 'next build' não terminou. Rode o instalar.cmd de novo."
}

$arquivoEnv = Join-Path $APP ".env"
if (Test-Path $arquivoEnv) {
  Nota ((Get-Content $arquivoEnv | Where-Object { $_ -like "DATABASE_URL=*" }) -join " ")
} else {
  Ruim "Não achei $arquivoEnv - o sistema não sabe onde fica o banco."
}

$estadoDoBanco = EstadoDoArquivo $BANCO
if ($estadoDoBanco -eq "existe") {
  $itemDoBanco = Get-Item -LiteralPath $BANCO -ErrorAction SilentlyContinue
  if ($itemDoBanco) {
    Bom ("Banco em $BANCO (" + [math]::Round($itemDoBanco.Length / 1KB) + " KB, mexido em " + $itemDoBanco.LastWriteTime.ToString("dd/MM/yyyy HH:mm") + ")")
  } else {
    Bom "Banco em $BANCO"
  }
} elseif ($estadoDoBanco -eq "negado") {
  Nota "O banco existe e esta conta não tem permissão de ver a pasta dados\ - é assim que a instalação deixa. Rode pelo diagnostico.cmd para ler os detalhes."
} else {
  Ruim "Não achei o banco em $BANCO."
}

# --------------------------------------------------------------- 2. serviço

Secao "2. O serviço está ligado?"

$servicoEncontrado = Get-Service -Name $SERVICO -ErrorAction SilentlyContinue
$processoDoServico = $null
if (-not $servicoEncontrado) {
  Ruim "O serviço '$SERVICO' NÃO está registrado. A instalação parou antes do fim - rode o instalar.cmd de novo e leia a última linha vermelha."
} else {
  if ($servicoEncontrado.Status -eq "Running") {
    Bom "O serviço '$SERVICO' está rodando"
  } else {
    Ruim "O serviço '$SERVICO' está '$($servicoEncontrado.Status)'. Rode o reiniciar.cmd (nesta mesma pasta)."
  }
  $registroDoServico = Get-CimInstance -ClassName Win32_Service -Filter "Name='$SERVICO'" -ErrorAction SilentlyContinue
  if ($registroDoServico) {
    Nota "Sobe com o Windows: $($registroDoServico.StartMode)   conta: $($registroDoServico.StartName)"
    if ($registroDoServico.StartMode -ne "Auto") {
      Atencao "O serviço não está em início automático: depois de desligar o computador ele não volta sozinho."
    }
  }
  $parametrosDoServico = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\$SERVICO\Parameters" -ErrorAction SilentlyContinue
  if ($parametrosDoServico) {
    Nota "Comando: $($parametrosDoServico.Application) $($parametrosDoServico.AppParameters)"
    Nota "Pasta:   $($parametrosDoServico.AppDirectory)"
  }
}

# ----------------------------------------------------------------- 3. porta

Secao "3. Alguém está escutando na porta $PORTA, e em qual endereço?"

$escutasNaPorta = @(Get-NetTCPConnection -LocalPort $PORTA -State Listen -ErrorAction SilentlyContinue)
if ($escutasNaPorta.Count -eq 0) {
  Ruim "Ninguém escuta na porta $PORTA. O servidor não está no ar."
} else {
  $escutaEmTodasAsPlacas = $false
  foreach ($escuta in $escutasNaPorta) {
    $processoDaEscuta = Get-Process -Id $escuta.OwningProcess -ErrorAction SilentlyContinue
    $nomeDoProcesso = "desconhecido"
    if ($processoDaEscuta) {
      $nomeDoProcesso = $processoDaEscuta.ProcessName
      $processoDoServico = $processoDaEscuta
    }
    Nota "escutando em $($escuta.LocalAddress) porta $($escuta.LocalPort)  (processo $nomeDoProcesso, PID $($escuta.OwningProcess))"
    if ($escuta.LocalAddress -eq "0.0.0.0" -or $escuta.LocalAddress -eq "::") { $escutaEmTodasAsPlacas = $true }
  }
  if ($escutaEmTodasAsPlacas) {
    # "::" é o normal aqui, e não um defeito: medido em 2026-09-23, o serviço
    # com `next start -p 3000` aparece com uma linha só, "::", e mesmo assim
    # responde 200 pelo endereço IPv4 da máquina — é soquete de pilha dupla.
    Bom "O servidor escuta em todas as placas de rede (0.0.0.0 ou ::), e não só neste computador"
  } else {
    Ruim "O servidor escuta SÓ neste computador (127.0.0.1). Nenhum tablet vai abrir. Rode o instalar.cmd de novo."
  }
}

# -------------------------------------------------- 4. responde aqui dentro?

Secao "4. Este computador abre o sistema?"

$codigoDoPortal = Pedir "http://localhost:$PORTA/"
if ($codigoDoPortal -eq "200") { Bom "http://localhost:$PORTA/ respondeu 200 (portal do tablet)" }
else { Ruim "http://localhost:$PORTA/ respondeu '$codigoDoPortal'. O servidor não está atendendo." }

$codigoDoPainel = Pedir "http://localhost:$PORTA/admin" 20
if ($codigoDoPainel -eq "200") { Bom "http://localhost:$PORTA/admin respondeu 200 (painel - e portanto o banco abriu)" }
else { Ruim "http://localhost:$PORTA/admin respondeu '$codigoDoPainel'. O painel é quem lê o banco; veja a seção 8." }

# -------------------------------------------------------------- 5. endereço

Secao "5. Qual é o endereço DESTE computador na rede?"

$enderecosDaMaquina = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" })

if ($enderecosDaMaquina.Count -eq 0) {
  Ruim "Este computador não tem endereço de rede. Ele está conectado ao Wi-Fi ou ao cabo?"
} else {
  foreach ($enderecoDaPlaca in $enderecosDaMaquina) {
    $perfilDaRede = Get-NetConnectionProfile -InterfaceIndex $enderecoDaPlaca.InterfaceIndex -ErrorAction SilentlyContinue
    $nomeDaRede = "(sem rede identificada)"
    $tipoDaRede = "?"
    if ($perfilDaRede) { $nomeDaRede = $perfilDaRede.Name; $tipoDaRede = $perfilDaRede.NetworkCategory }
    Nota "$($enderecoDaPlaca.IPAddress)   placa: $($enderecoDaPlaca.InterfaceAlias)   rede: $nomeDaRede ($tipoDaRede)"
    $script:listaDeEnderecos += [string]$enderecoDaPlaca.IPAddress
  }
  if ($enderecosDaMaquina.Count -gt 1) {
    Atencao "Esta máquina tem mais de um endereço. O tablet precisa usar o da placa que está na MESMA rede que ele."
  }
}

# ---------------------------------------------- 6. responde pelo endereço?

Secao "6. O sistema responde pelo endereço da rede?"

if ($script:listaDeEnderecos.Count -eq 0) {
  Atencao "Sem endereço de rede, não há o que testar."
} else {
  foreach ($enderecoParaTestar in $script:listaDeEnderecos) {
    $codigoDoEndereco = Pedir "http://${enderecoParaTestar}:$PORTA/"
    if ($codigoDoEndereco -eq "200") { Bom "http://${enderecoParaTestar}:$PORTA/ respondeu 200" }
    else { Ruim "http://${enderecoParaTestar}:$PORTA/ respondeu '$codigoDoEndereco'" }
  }
  Nota "Este teste sai deste próprio computador: prova que o servidor atende pelo"
  Nota "endereço da rede, e NÃO prova que o firewall deixa outro aparelho entrar."
  Nota "Quem prova isso é o tablet (ou um celular no mesmo Wi-Fi) abrindo a página."
}

# -------------------------------------------------------------- 7. firewall

Secao "7. O firewall deixa o tablet entrar?"

$regraDoFirewall = Get-NetFirewallRule -DisplayName $NOME_REGRA -ErrorAction SilentlyContinue
if (-not $regraDoFirewall) {
  Ruim "A regra de firewall '$NOME_REGRA' não existe. Rode o instalar.cmd de novo."
} else {
  if ("$($regraDoFirewall.Enabled)" -eq "True") { Bom "A regra '$NOME_REGRA' existe e está ligada (perfis: $($regraDoFirewall.Profile))" }
  else { Ruim "A regra '$NOME_REGRA' existe mas está DESLIGADA." }
}

# Numa máquina de instituição a regra pode existir e não valer nada: o perfil
# com "bloquear todas as conexões de entrada" ignora as regras, e uma política
# de domínio pode proibir regras criadas na própria máquina. Os dois campos
# vêm como texto True/False/NotConfigured; só o False explícito é bloqueio.
$categoriasEmUso = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue | Select-Object -ExpandProperty NetworkCategory)
foreach ($perfilDoFirewall in @(Get-NetFirewallProfile -ErrorAction SilentlyContinue)) {
  $marcaDeAtivo = ""
  foreach ($categoria in $categoriasEmUso) {
    if ("$categoria" -eq "$($perfilDoFirewall.Name)" -or ("$categoria" -eq "DomainAuthenticated" -and "$($perfilDoFirewall.Name)" -eq "Domain")) {
      $marcaDeAtivo = "   <- perfil da rede em uso agora"
    }
  }
  Nota "perfil $($perfilDoFirewall.Name): firewall=$($perfilDoFirewall.Enabled) entrada=$($perfilDoFirewall.DefaultInboundAction) permite_regras=$($perfilDoFirewall.AllowInboundRules) regras_locais=$($perfilDoFirewall.AllowLocalFirewallRules)$marcaDeAtivo"
  if ($marcaDeAtivo -ne "") {
    if ("$($perfilDoFirewall.AllowInboundRules)" -eq "False") {
      Ruim "O perfil '$($perfilDoFirewall.Name)' está com 'bloquear todas as conexões de entrada': a regra existe e é ignorada. Desligue em Segurança do Windows > Firewall e proteção de rede."
    }
    if ("$($perfilDoFirewall.AllowLocalFirewallRules)" -eq "False") {
      Ruim "Uma política da instituição proíbe regras de firewall criadas nesta máquina. Só a TI consegue liberar a porta $PORTA, ou o computador precisa ficar numa rede própria da coordenação."
    }
  }
}

# ------------------------------------------------------------------ 8. logs

Secao "8. O que os logs dizem"

$logDeErroDoServico = Join-Path $LOGS "servico.err.log"
if (Test-Path $logDeErroDoServico) {
  $ultimasLinhas = @(Get-Content $logDeErroDoServico -Tail 15 -ErrorAction SilentlyContinue)
  if ($ultimasLinhas.Count -eq 0) {
    Bom "servico.err.log está vazio - o servidor não reclamou de nada"
  } else {
    # Um erro gravado ANTES de o servidor atual subir é resíduo de uma
    # instalação passada, e não o estado de agora. Sem esta separação o
    # relatório acusa um SQLITE_CANTOPEN de cinco dias atrás numa máquina em
    # que o painel acabou de responder 200 na seção 4.
    #
    # A comparação NÃO pode ser "escrito antes de o servidor subir", e isso foi
    # medido: o NSSM abre o arquivo de erro toda vez que inicia o serviço, o
    # que atualiza a data de modificação para o mesmo segundo em que o node
    # nasceu, sem acrescentar uma linha. Nesta máquina, em 2026-09-23: node
    # criado às 11:00:50, servico.err.log modificado às 11:00:50 — e o conteúdo
    # inteiro (458 bytes, 12 linhas) é de 2026-09-18. Por isso a folga de cinco
    # segundos: o que denuncia erro de hoje é o arquivo ter crescido DEPOIS da
    # subida, e não no instante dela.
    $ehResiduo = $false
    $escritoEm = (Get-Item $logDeErroDoServico).LastWriteTime
    $subiuEm = $null
    if ($processoDoServico) {
      try { $subiuEm = $processoDoServico.StartTime } catch { $subiuEm = $null }
      if (-not $subiuEm) {
        # Sem administrador, ler StartTime de um processo do LocalService dá
        # acesso negado; o CIM responde a mesma coisa para conta comum.
        $processoPorCim = Get-CimInstance Win32_Process -Filter "ProcessId=$($processoDoServico.Id)" -ErrorAction SilentlyContinue
        if ($processoPorCim) { $subiuEm = $processoPorCim.CreationDate }
      }
    }
    if ($subiuEm) {
      if ($escritoEm -le $subiuEm.AddSeconds(5)) { $ehResiduo = $true }
    }
    Nota "Últimas linhas de $logDeErroDoServico (gravadas em $($escritoEm.ToString('dd/MM/yyyy HH:mm'))):"
    foreach ($linhaDoLog in $ultimasLinhas) { Write-Host "          | $linhaDoLog" }
    $linhasDeBanco = $ultimasLinhas | Where-Object { $_ -match "SQLITE_CANTOPEN|unable to open database" }
    if ($ehResiduo) {
      Bom "O arquivo não cresceu desde que o servidor subiu ($($subiuEm.ToString('dd/MM/yyyy HH:mm'))) - essas linhas são resíduo de antes, e não o estado de hoje"
    } elseif (-not $subiuEm) {
      Atencao "Não consegui saber a que horas o servidor subiu, então não dá para dizer se as linhas acima são de hoje ou resíduo. Rode pelo diagnostico.cmd, como administrador."
    } elseif ($linhasDeBanco) {
      Ruim "O servidor não consegue abrir o banco AGORA. Rode o instalar.cmd de novo: ele conserta as permissões da pasta dados."
    }
  }
} else {
  Atencao "Não achei $logDeErroDoServico - o serviço nunca chegou a subir?"
}

$ultimaTranscricao = Get-ChildItem -Path $LOGS -Filter "instalacao-*.log" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($ultimaTranscricao) {
  Nota "Última instalação: $($ultimaTranscricao.Name) ($($ultimaTranscricao.LastWriteTime.ToString('dd/MM/yyyy HH:mm')))"
  $conteudoDaTranscricao = Get-Content $ultimaTranscricao.FullName -ErrorAction SilentlyContinue
  if ($conteudoDaTranscricao -match "INSTALADO") {
    Bom "Essa instalação chegou ao fim (a tela mostrou INSTALADO)"
  } else {
    Ruim "Essa instalação NÃO chegou ao fim. As últimas linhas dela:"
    foreach ($linhaDaTranscricao in @($conteudoDaTranscricao | Select-Object -Last 20)) { Write-Host "          | $linhaDaTranscricao" }
  }
} else {
  Atencao "Não achei nenhum log de instalação em $LOGS."
}

# --------------------------------------------------------------- 9. versão

Secao "9. Qual versão está instalada"

$caminhoDoGit = (Get-Command git.exe -ErrorAction SilentlyContinue).Source
if (-not $caminhoDoGit) {
  if (Test-Path "C:\Program Files\Git\cmd\git.exe") { $caminhoDoGit = "C:\Program Files\Git\cmd\git.exe" }
}
if ($caminhoDoGit -and (Test-Path (Join-Path $APP ".git"))) {
  Push-Location $APP
  try {
    Nota "versão: $((& $caminhoDoGit describe --tags --always 2>$null))   commit: $((& $caminhoDoGit rev-parse --short HEAD 2>$null))"
  } finally { Pop-Location }
} else {
  Atencao "Não consegui ler a versão (git ou pasta .git ausente)."
}

# ---------------------------------------------------------------- resumo

Write-Host ""
Write-Host "================================================================" -ForegroundColor White
if ($script:listaDeProblemas.Count -eq 0) {
  Write-Host " NADA ERRADO NESTE COMPUTADOR." -ForegroundColor Green
  Write-Host "================================================================" -ForegroundColor White
  Write-Host ""
  if ($script:listaDeEnderecos.Count -gt 0) {
    Write-Host " ENDERECO CERTO PARA O TABLET (deste computador):" -ForegroundColor Green
    foreach ($enderecoFinal in $script:listaDeEnderecos) {
      Write-Host "   http://${enderecoFinal}:$PORTA/" -ForegroundColor Green
    }
    Write-Host ""
  }
  Write-Host " O sistema está no ar e atende pelo endereço da rede. Se mesmo assim"
  Write-Host " o tablet não abre, o problema está ENTRE os dois:"
  Write-Host ""
  Write-Host "   1. o endereço digitado é o DESTE computador? (é o de cima, e não"
  Write-Host "      o de outra máquina que também roda o sistema)"
  Write-Host "   2. o tablet está no mesmo Wi-Fi que este computador?"
  Write-Host "   3. o endereço tem  http://  na frente e  :$PORTA  no fim?"
  Write-Host "   4. o Wi-Fi da instituição pode separar os aparelhos entre si (é"
  Write-Host "      comum em rede de visitante). Teste com um celular no MESMO"
  Write-Host "      Wi-Fi: se o celular também não abrir, é a rede, e não o sistema."
} else {
  Write-Host " ENCONTREI $($script:listaDeProblemas.Count) COISA(S) PARA RESOLVER:" -ForegroundColor Red
  Write-Host "================================================================" -ForegroundColor White
  Write-Host ""
  $numeroDoProblema = 0
  foreach ($problema in $script:listaDeProblemas) {
    $numeroDoProblema += 1
    Write-Host " $numeroDoProblema. $problema" -ForegroundColor Yellow
  }
}
if ($script:listaDeAvisos.Count -gt 0) {
  Write-Host ""
  Write-Host " Vale saber (nao impede o sistema de funcionar):" -ForegroundColor Yellow
  foreach ($aviso in $script:listaDeAvisos) {
    Write-Host "   - $aviso" -ForegroundColor Gray
  }
}
Write-Host ""
Write-Host " Este relatório foi gravado em:"
Write-Host "   $arquivoDoRelatorio"
Write-Host " Mande ESSE arquivo para quem mantém o sistema (não os logs do npm)."
Write-Host ""

Stop-Transcript | Out-Null
exit 0
