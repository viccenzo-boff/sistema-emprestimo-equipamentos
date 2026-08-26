<!--
TEMPLATE DE PÁGINA DE PROCESSO

As instruções de uso estão no bloco visível logo abaixo, e não aqui, de
propósito: duas cópias da mesma instrução divergem na primeira correção que
só uma delas receber. Aqui ficam só os comentários seção a seção.

TODO LINK DESTE ARQUIVO COMEÇA POR `../`, e isso não é estilo: o template
existe para ser copiado para docs/portal/ ou docs/painel/, e link relativo
simples (`guia-de-estilo.md`) passa daqui e QUEBRA lá — derrubando o
`mkdocs build --strict` de quem só queria começar uma página. `../contribuir/`
resolve certo dos dois lugares. Isso foi medido: a primeira versão do template
usava o link curto e reprovou na verificação.
-->

!!! info "Como usar este arquivo"

    Este é o esqueleto de toda página de processo desta wiki. Copie o arquivo,
    troque o título e substitua cada linha em itálico pelo conteúdo real:

    ```bash
    cp docs/contribuir/template-processo.md docs/painel/novo-processo.md
    ```

    **Cada seção carrega um comentário HTML** dizendo o que entra e o que não
    entra nela. Eles não aparecem na página — abra o arquivo pelo lápis de
    editar, no topo à direita, para lê-los. Apague-os junto com este bloco.

    A regra que vale para o arquivo inteiro: **seção que não se aplica é
    removida, nunca preenchida com "não se aplica"**. Uma seção vazia custa a
    mesma rolagem que uma cheia e não devolve nada — e ensina o leitor a pular
    seções, inclusive as que importam.

    As regras de redação — voz, citação de rótulo, ramificação, nome de imagem
    — estão no [guia de estilo](../contribuir/guia-de-estilo.md).

# N. Nome do processo

<!--
O título começa com o número do processo, para casar com o nav e com a
spec-wiki §3.1. Exemplo: "3. Baixa física".
-->

## 1. Objetivo do processo

<!--
Duas ou três frases: o que este processo resolve, para quem, e o que muda no
mundo quando ele termina.

NÃO entra aqui: descrição de tela, nome de botão, nome de campo. Se a frase
só faz sentido para quem já viu o sistema, ela está no lugar errado.
-->

*O que este processo resolve, em duas ou três frases.*

## 2. Pré-condições

<!--
O que precisa ser verdade ANTES de começar. Lista curta, cada item
verificável por quem vai executar.

Exemplos do tipo certo: "o cadastro está ativo", "há pelo menos um
equipamento DISPONIVEL na categoria", "a secretaria está com sessão aberta
no painel".

NÃO entra aqui: passo do processo. Pré-condição é estado, não ação.
-->

- *Estado que precisa ser verdade antes do primeiro passo.*

## 3. Glossário do processo

<!--
SÓ os termos que aparecem NESTA página e que o leitor pode não conhecer.
Termo que atravessa vários processos mora no glossário geral
(docs/referencia/glossario.md) — aqui entra o link, não a cópia.

Duas definições do mesmo termo em lugares diferentes divergem na primeira
correção que só uma delas receber.
-->

| Termo   | O que é                       |
| ------- | ----------------------------- |
| *Termo* | *Definição em uma linha.*     |

## 4. Papéis e responsabilidades

<!--
Quem executa cada parte. Neste sistema são dois papéis: quem opera o tablet
(estudante ou professor) e quem opera o painel (secretaria).

Diga também o que cada papel NÃO faz — é a metade que evita a pergunta
"então por que não apareceu para mim?".
-->

| Papel   | Faz            | Não faz            |
| ------- | -------------- | ------------------ |
| *Papel* | *O que faz.*   | *O que não faz.*   |

## 5. Diagrama BPMN

<!--
SVG exportado e commitado, com link para o .bpmn fonte. O leitor vê o
diagrama sem instalar nada; quem for editar baixa o XML.

O DIAGRAMA É CLICÁVEL, pela mesma regra 5 do guia de estilo que vale para a
captura de tela — e aqui ela pesa mais. Medido na D05: um BPMN de 1980px de
largura entra na coluna de texto a 688px, ou 0,35 do tamanho, e nenhum
rótulo se lê. Sem o link para si mesmo, a seção 5 vira uma mancha cinza.

    [![Diagrama BPMN do processo](../assets/diagramas/<processo>.svg)](../assets/diagramas/<processo>.svg)

    [Baixar o arquivo .bpmn](../processos-fonte/<processo>.bpmn)

O texto alternativo descreve o caminho principal do diagrama em uma frase —
um SVG sem alternativo é uma imagem vazia para quem usa leitor de tela.
-->

*O SVG do diagrama, com link para o `.bpmn` fonte.*

## 6. Passo a passo

<!--
Numerado. UM PASSO, UMA AÇÃO — passo com "e então" vira dois passos.

NÃO CORTE UMA SEQUÊNCIA COM SUBTÍTULOS. Um `###` no meio do passo a passo
fecha a lista e abre outra, e o Python-Markdown escreve a segunda sem o
atributo `start` — os passos saem 1, 2, 3, 4, 1, 2, 3, 4 na página publicada.
O `mkdocs build --strict` passa em 0 do mesmo jeito; foi preciso ler o HTML
gerado para ver. Se UMA sequência ficar longa, agrupe pelo texto do próprio
passo, nunca por título.

A exceção é a página que cobre VÁRIOS PROCEDIMENTOS independentes (a D08 tem
cinco, a D09 tem quatro). Aí cada procedimento é uma sequência própria que
COMEÇA EM 1 de propósito, e o `###` é o que separa uma da outra — recomeçar é
o comportamento desejado, não o defeito. A diferença entre os dois casos é se
o leitor executa tudo de uma vez ou escolhe um caminho.

Nos dois casos, confira no HTML gerado: cada `<ol>` da seção 6 tem que ter o
número de `<li>` que você escreveu, e nenhum deve carregar `start=`.

Ramificação SEMPRE explícita:

    3. O cadastro está ativo?
       - Se SIM → ... Siga para o passo 4.
       - Se NÃO → ... Procure a secretaria.

Rótulo de tela citado literalmente, em negrito, com a grafia exata.

Captura clicável, abrindo em tamanho cheio:

    [![Descrição do que a tela mostra](../assets/images/<processo>/03-acao.png)](../assets/images/<processo>/03-acao.png)

Nome de imagem: NN-acao-descrita.png, numerado na ordem do passo.
Nenhum dado pessoal real na captura — nem borrado.
-->

1. *Uma ação por passo, no imperativo.*

## 7. Regras que não são óbvias

<!--
ESTA É A SEÇÃO QUE JUSTIFICA A WIKI. Manual de software descreve a tela;
esta seção descreve a DECISÃO DE PRODUTO — o porquê por trás do
comportamento.

O formato é pergunta que o leitor realmente faz, seguida da resposta que
explica a razão. Não é "o botão X faz Y": é "por que o botão X não faz Z".

O teste: se a resposta pode ser deduzida olhando a tela, ela não pertence a
esta seção. Se a resposta explica algo que a tela esconde de propósito, ela
pertence.

CAIXA DE ADMONIÇÃO NÃO GERA ÂNCORA. Um `!!! question "Por que X?"` não vira
um `id` no HTML, então `[ver a regra](#por-que-x)` é um link quebrado — e o
`mkdocs build --strict` PASSA EM 0 assim mesmo, porque o aviso sai como INFO,
não como WARNING. Isso derrubou a D05 e derrubou a D08 de novo.

Se outra seção precisa apontar para uma pergunta específica, plante o âncora
à mão, na linha de cima e com uma linha em branco no meio:

    <a id="por-que-x-nao-faz-y"></a>

    !!! question "Por que X não faz Y?"

Sem isso, o alvo possível é só a seção inteira (`#7-regras-que-nao-sao-obvias`).
Nos dois casos, confira o link no HTML gerado — o aviso do markdownlint sobre
âncora acentuada no editor é falso positivo, e a saída do build não basta.

A fonte destas regras é a seção "Regra de negócio que não é óbvia pelo
código" do AGENTS.md e a spec.md. NÃO INVENTE — traduzir para linguagem de
usuário final é o trabalho; reinventar não é.

O exemplo abaixo fica no template como calibração de tom. Apague-o e escreva
os do seu processo.
-->

!!! question "Por que o equipamento não fica disponível assim que eu devolvo?"

    Porque devolver no tablet é uma **declaração**, não uma conferência.
    Enquanto o empréstimo está em `AGUARDANDO_BAIXA`, o aparelho está
    fisicamente na bancada mas ninguém da secretaria o recolheu ainda. Se ele
    voltasse para `DISPONIVEL` nesse momento, o tablet ofereceria a outro
    estudante um equipamento que continua em cima da bancada.

## 8. Erros comuns e o que fazer

<!--
Uma linha por erro, nas três colunas: a mensagem EXATA que aparece na tela,
a causa, e o que fazer.

A mensagem é a chave de busca do leitor — ele chega aqui com a frase da tela
na mão. Reescrevê-la, resumi-la ou traduzi-la quebra justamente a busca que
trouxe a pessoa até esta linha.

Erro que ninguém nunca viu não entra. Esta seção cresce com o uso real.
-->

| Mensagem na tela | Causa     | O que fazer |
| ---------------- | --------- | ----------- |
| *"Texto exato."* | *Motivo.* | *Solução.*  |
