# Como esta wiki foi feita

Esta página não é um diário. Ela registra as **decisões** que produziram a wiki
que você está lendo, e cada uma vem com a alternativa que foi descartada e o
motivo — porque decisão sem alternativa descartada é propaganda, e propaganda
não ajuda ninguém a repetir o trabalho.

Onde houve medição, o número está junto. Vários deles contradizem o que parecia
óbvio antes de medir.

## Antes: onde o conhecimento morava

Quando a documentação começou, o repositório tinha quatro documentos e nenhum
deles falava com quem opera o sistema:

| Documento | Escrito para | O que respondia |
| --- | --- | --- |
| `README.md` | Quem instala e roda o código | Como subir o projeto, quais scripts existem |
| `AGENTS.md` | Quem altera o código | Por que cada decisão técnica foi tomada |
| `spec.md` | Quem especificou o produto | O que o sistema deve fazer |
| 24 enunciados de tarefa | Quem construiu cada pedaço | O que aquela tarefa pedia |

O `CONTRIBUTING.md` existia com **zero byte**. A pasta `docs/` não existia.

Ou seja: quem estivesse de pé na bancada com um tablet na frente, ou na
secretaria com a fila de devoluções aberta, não tinha onde procurar. O
conhecimento operacional estava inteiro na cabeça de quem construiu — e a única
forma de consultá-lo era perguntar.

## As decisões

### 1. Modelar em BPMN antes de escrever a primeira página

**A decisão.** Os cinco processos foram desenhados em BPMN antes de qualquer
página de passo a passo existir. Os diagramas vieram primeiro; o texto veio
depois, a partir deles.

**A alternativa descartada.** Escrever o passo a passo primeiro e desenhar o
diagrama depois, a partir do texto pronto — que é a ordem natural, porque
escrever é mais rápido que modelar.

**O motivo.** Modelar obriga a achar as ramificações enquanto ainda é barato
mudar de ideia. O texto escrito primeiro vira **narração de tela**: descreve o
caminho feliz, que é o que a pessoa que escreve tem na cabeça, e as decisões
ficam embutidas na prosa. O diagrama não deixa: um losango sem as duas saídas
nomeadas é visivelmente um buraco.

Isso deu resultado três vezes. Nas páginas da [retirada](../portal/retirada.md),
da [devolução](../portal/devolucao.md) e da
[baixa física](../painel/baixa-fisica.md), o diagrama tinha uma ramificação que
o enunciado da tarefa **não listava** — a corrida de dois tablets pelo mesmo
aparelho, a escolha entre devolver um item e devolver a lista inteira, e a
escolha entre uma baixa e a fila toda. As três entraram no passo a passo porque
a figura estava ali, na mesma página, contradizendo o texto.

### 2. Descrever a decisão de produto, e não a tela

**A decisão.** Toda página de processo tem uma seção chamada
"Regras que não são óbvias", e ela explica **por que** o sistema se comporta
daquele jeito — não o que clicar.

**A alternativa descartada.** O manual comum: as oito telas, na ordem, com uma
captura em cada uma. É mais rápido de escrever e envelhece junto com a
interface.

**O motivo.** Quem procura o manual raramente está perdido em *como* clicar.
Está perdido em *por que* o sistema fez o que fez — e essa resposta não está na
tela.

O exemplo mais ilustrativo é a devolução em duas fases. Quando alguém devolve um
aparelho no tablet, ele **não** volta a ficar disponível:

> Devolver no tablet é uma **declaração**, não uma conferência. Enquanto o
> empréstimo está aguardando baixa, o aparelho está fisicamente na bancada mas
> ninguém da secretaria o recolheu ainda. Se ele voltasse para disponível nesse
> momento, o tablet ofereceria a outra pessoa um equipamento que continua em
> cima da bancada.

Um manual de tela descreveria isso como "o equipamento aparece na fila de
devoluções" e pronto. A pessoa que abrisse o inventário procurando o notebook
que acabou de ser devolvido continuaria achando que o sistema errou. A regra
inteira está em [baixa física](../painel/baixa-fisica.md) e em
[estados e transições](../referencia/estados-e-transicoes.md).

### 3. A documentação no mesmo repositório do código

**A decisão.** A wiki mora em `docs/`, no repositório do sistema, e é publicada
por uma ação que roda a cada envio para a branch principal.

**A alternativa descartada.** Um repositório separado só para a documentação.
Ele dá um artefato mais limpo de linkar, com histórico próprio e sem os
enunciados de tarefa no meio.

**O motivo.** Documentação e código no mesmo histórico é o que permite a
**mudança de regra e a correção do manual caberem no mesmo commit**. Em
repositórios separados, os dois passos existem, o segundo depende de alguém
lembrar, e é sempre o segundo que fica para depois. A wiki que descreve a versão
anterior do produto é pior que wiki nenhuma, porque ela tem a autoridade de um
documento oficial e o conteúdo de um boato.

Aconteceu ao contrário nesta série, e é a prova de que o arranjo funciona: ao
escrever a página de [gestão de pessoas](../painel/pessoas.md), a leitura do
código revelou que o campo de matrícula do painel aceitava 16 dígitos enquanto o
servidor recusava acima de 15. A correção do produto e a página que a descreve
saíram na mesma sessão.

### 4. Documentar uma versão congelada

**A decisão.** A wiki descreve a `v1.0`, uma etiqueta fixa no histórico. O
seletor de versão no alto da página existe para que versões futuras convivam
com ela, em vez de substituí-la.

**A alternativa descartada.** Documentar a branch principal, que é o estado mais
recente e o que a secretaria de fato usa.

**O motivo.** Captura de tela de alvo em movimento **nasce vencida**. A branch
principal continua andando: um botão muda de lugar e as 49 capturas desta wiki
passam a mostrar uma tela que não existe mais, sem que ninguém perceba, porque
imagem não tem verificador. Congelar transforma isso em uma decisão explícita —
quando a próxima versão do produto sair, alguém publica a wiki dela ao lado, e a
`v1.0` continua correta sobre a `v1.0`.

O preço é conhecido e está declarado na [home](../index.md): se a tela na sua
frente tiver um botão que nenhuma página daqui menciona, é porque você está em
uma versão mais nova.

### 5. Dado de demonstração em vez de borrar a imagem

**A decisão.** Nenhuma captura mostra pessoa real. O cenário fotografado é
montado por um script — 15 pessoas fictícias, 10 empréstimos, 20 equipamentos —
que recria sempre o mesmo estado.

**A alternativa descartada.** Fotografar o banco real e borrar nome e matrícula
nas imagens.

**O motivo.** São três problemas, e o borrão resolve zero deles. Borrão de
imagem **falha** com mais frequência do que se imagina, e uma matrícula tem
poucos dígitos — o que sobra é um quebra-cabeça pequeno. Borrão fica **feio**, e
uma tela cheia de retângulos cinzas é ilegível justamente onde a captura
precisava ensinar. E, principalmente, borrão não resolve o problema de origem:
o dado pessoal continua tendo estado na tela e no arquivo de imagem, e basta uma
captura esquecida para vazar.

O script tem um segundo efeito que só apareceu no uso: ele é **idempotente**.
Depois de exercitar uma tela clicando nos botões de verdade, rodá-lo de novo
devolve o enquadramento — o que torna possível fotografar o mesmo cenário em
sessões diferentes, com semanas de distância, e obter a mesma imagem.

O elenco fictício também foi escolhido, e não sorteado: uma pessoa com **dois**
aparelhos, porque os botões de lote só aparecem a partir de dois; uma pessoa
inativa **que está na fila de devoluções**, porque é a regra assimétrica em
imagem; um nome com partícula minúscula, porque é o caso que a normalização de
nomes trata.

### 6. Vocabulário controlado em vez de lint de estilo em português

<!-- vale Vale.Avoid = NO -->

**A decisão.** O corretor de texto confere uma lista de grafias proibidas nas
páginas em português — "usuário" para falar de estudante, "aluno", "o sistema
irá" — e o estilo Microsoft completo apenas nas páginas em inglês.

<!-- vale Vale.Avoid = YES -->

**A alternativa descartada.** Ligar um estilo pronto também em português, como
se faz em inglês.

**O motivo.** **Não existe estilo pronto de qualidade para português**, e a
tentativa de usar um foi medida: em uma página de prova com quatro frases,
**15 dos 19 alertas** eram o corretor ortográfico de inglês perguntando "você
quis mesmo dizer 'tabela'?". Um portão que erra três em cada quatro vezes é um
portão que a próxima pessoa desliga inteiro — e aí não sobra nem o pouco que
funcionava.

<!-- vale Vale.Avoid = NO -->

O que restou é pequeno e resolve o problema que importa: **duas páginas
discordarem do nome da mesma coisa**. E ele decidiu uma palavra do projeto —
quem retira equipamento é *estudante*, nunca "aluno", porque é "Estudante" o que
o painel mostra desde que o termo foi trocado no sistema. Uma wiki que dissesse
"aluno" mandaria o leitor procurar um filtro que tem outro nome.

<!-- vale Vale.Avoid = YES -->

### 7. Portões que reprovam, e três coisas que eles mediram

**A decisão.** Três verificações rodam a cada envio, em etapas separadas, e a
publicação **depende** das três passarem: a construção do site em modo estrito,
o corretor de texto, e o conferidor de links sobre o site construído.

**A alternativa descartada.** Rebaixar as regras incômodas a aviso, em vez de
desligá-las com o motivo escrito ao lado. Aviso não quebra nada e deixa todo
mundo em paz.

**O motivo.** Aviso que ninguém lê é ruído, e ruído soterra o erro real. Com o
estilo de inglês ligado por inteiro, o corretor apontava **570 erros** — dos
quais **569 vinham de três regras de voz** que contrariam decisões já publicadas
desta wiki. Rebaixar as três a aviso significaria 569 linhas por execução sobre
assuntos já decididos, e o único erro verdadeiro no meio delas. As três foram
**desligadas com o motivo escrito**, as outras 44 ficaram em força total, e o
erro real foi corrigido no texto.

As três medições que mudaram o desenho dos portões:

- **A construção em modo estrito passa com âncora quebrada.** Ela classifica
  "este documento não tem a âncora `#x`" como informação, e o modo estrito só
  promove *aviso* a erro — o site sobe com o link quebrado impresso na saída.
  Isso foi medido quatro vezes, em quatro tarefas diferentes, antes de virar
  regra. É por isso que existe um terceiro portão.
- **O conferidor de links roda sobre o site construído, não sobre os arquivos
  de origem.** Sobre a origem ele produzia **60 alertas falsos**: 57 porque
  calcula a âncora de cada título preservando o acento, enquanto o gerador do
  site normaliza para ASCII — obedecer ao portão quebraria os links no site de
  verdade.
- **Um portão pode ficar verde sem ter olhado nada.** Ao configurar o corretor
  de texto, o primeiro padrão de caminho casava a primeira pasta e **nenhuma
  abaixo dela**: a ferramenta dizia "0 arquivos" e **saía com sucesso**. Esse
  verde é indistinguível do verde de um projeto limpo. Desde então, a primeira
  asserção sobre qualquer verificador novo é **quantos arquivos ele examinou**,
  e não o código de saída dele.

### 8. Documentar um defeito em vez de corrigi-lo

**A decisão.** Uma mensagem do painel dá um conselho que não funciona. Ao tentar
excluir uma categoria que ainda tem equipamento, a tela sugere inativar os
equipamentos primeiro — e inativar **não** libera a exclusão. A página de
[gestão de inventário](../painel/inventario.md) cita a mensagem com a grafia
exata e, logo abaixo, desmente o conselho.

**A alternativa descartada.** Corrigir a frase no produto, que é uma linha de
código.

**O motivo.** A wiki descreve a versão `v1.0`, e a regra de escrita desta wiki é
citar a tela **inclusive quando a tela está errada** — porque é pela frase que a
pessoa chega à página, e corrigir no texto faria o leitor procurar uma mensagem
que não existe. Corrigir o produto é uma tarefa de produto, com o seu próprio
ciclo de verificação; ela continua em aberto e está registrada como tal.

A decisão vale como princípio: **a wiki não conserta o sistema por escrito.**
Quando ela encontra um defeito, o registro é honesto e o conserto vira trabalho
declarado.

## O teste que vale mais que os três portões

Nenhum portão pega uma página que está toda certa e mesmo assim não serve. Por
isso o critério final da wiki não é uma ferramenta: é entregá-la a alguém que
nunca viu o sistema e pedir uma retirada usando **só** ela.

A passada feita aqui seguiu a página da retirada ao pé da letra, fazendo apenas
o que ela manda e usando apenas os rótulos que ela cita. Os 17 pontos conferidos
bateram: cada botão citado existe com a grafia exata, e a sequência leva do
teclado da matrícula até o aparelho na mão.

O que ela achou foi uma coisa só, e é o tipo de coisa que só a leitura acha:

> A página prometia que "a grade de categorias aparece". Ela aparece — mas para
> quem **já está com um aparelho** a tela é outra: o título muda, a lista do que
> já está no seu nome entra à esquerda, e a grade divide o espaço com ela. Em um
> tablet em pé, a grade começa em 752px de uma tela de 1280px, abaixo de uma
> lista que a página nunca mencionou.

Ninguém fica travado — a grade está visível sem rolar nas duas orientações, e o
número acima é o que prova isso. Mas é meio segundo de "esta é a tela certa?"
para o caso mais comum do balcão, que é justamente quem já tem alguma coisa e
veio buscar mais uma. A página ganhou uma ramificação explícita para os dois
casos.

!!! note "O teste completo continua pendente"

    A passada acima foi feita por quem construiu o sistema, seguindo a própria
    página. Isso encontra rótulo errado e passo que falta; **não** encontra o
    pressuposto que quem escreveu nem sabe que tem. Só uma pessoa de fora acha
    isso, e essa parte do critério ainda não foi executada.

## O que ficou de fora

Honestidade sobre escopo vale mais que lista de conquistas.

- **Não há sexta página de processo.** A funcionalidade de relatórios e ocupação
  está especificada e **não** foi construída — a wiki descreve o que existe, e
  ela não existe. Quando entrar, vira uma versão nova, publicada ao lado desta.
- **A interface do sistema continua só em português.** A wiki é bilíngue; o
  produto não. Traduzir a interface é uma semana de trabalho que não cabia, e a
  solução foi um **glossário de interface** na trilha em inglês, com cada rótulo
  de tela e o que ele significa. Quem lê em inglês está com uma tela em
  português na frente, e por isso o rótulo real vem em negrito e a tradução
  entre parênteses — nunca o contrário.
- **As duas páginas de "Contribuir" não foram traduzidas**, e é deliberado: elas
  ensinam a escrever **em português**, com as grafias que o corretor proíbe.
  Uma cópia em inglês seria um segundo dono da mesma regra de redação.
- **Não há vídeo, GIF animado nem tour interativo.** Estavam fora de escopo
  desde o começo: envelhecem pior que captura de tela e não têm diff no
  histórico.
- **O tempo de prateleira é medido e não é lido por ninguém.** O sistema grava
  quando a devolução foi declarada e quando a secretaria conferiu, mas não
  existe tela que mostre a diferença. O dado está lá, esperando o relatório.
- **Não se registra quem deu a baixa.** O sistema sabe **quando** cada
  conferência aconteceu e passou a ter contas individuais, mas o empréstimo não
  guarda qual conta confirmou o recebimento.
- **A mensagem errada do inventário continua errada**, pelo motivo da decisão 8.

## Depois: o que existe hoje

| O que | Quanto |
| --- | --- |
| Páginas | 16 em português, 15 em inglês |
| Palavras | Cerca de 26.600 em português, 30.100 em inglês |
| Processos documentados | 5, com as oito seções cada |
| Diagramas BPMN | 5 fontes `.bpmn` versionadas, com o SVG derivado delas por comando |
| Capturas de tela | 49, nenhuma com dado de pessoa real |
| Portões no CI | 3, e a publicação depende dos três |

O número que importa não está na tabela: **quem chega com uma dúvida operacional
agora tem onde procurar**, e a resposta explica a decisão em vez de descrever o
botão.
