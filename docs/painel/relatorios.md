# 6. Relatórios

## 1. Objetivo do processo

Este processo transforma o que o sistema já registrou em um argumento: quantos
empréstimos passaram pelo balcão neste mês, quantos aparelhos estão fora da
prateleira agora, e o quanto cada categoria chegou perto de acabar.

Quando termina, a secretaria tem um número para levar à coordenação — e a
coordenação tem com que decidir se compra mais aparelho. É a única tela do
painel que não muda nada: ela só lê.

## 2. Pré-condições

- Você está com a sessão aberta no painel. Se não estiver, entre com seu login e
  senha — ver [Conta do administrador](../referencia/conta-do-administrador.md).
- Existe pelo menos uma categoria cadastrada. Sem nenhuma, a tela diz isso e
  manda para a aba **Categorias**.
- Os números são do **momento em que a página abre**. Para ver o efeito de uma
  baixa que você acabou de confirmar, recarregue a página.

## 3. Glossário do processo

Os termos que atravessam vários processos moram no
[glossário geral](../referencia/glossario.md):
[categoria](../referencia/glossario.md#categoria),
[manutenção](../referencia/glossario.md#manutencao),
[aposentadoria](../referencia/glossario.md#aposentadoria-item-inativo),
[bancada](../referencia/glossario.md#bancada) e
[empréstimo](../referencia/glossario.md#emprestimo).

Estes são só desta página:

| Termo                  | O que é                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Ocupação               | A fatia do estoque em circulação que **não** está na prateleira agora — emprestada ou em manutenção. Vai de 0% a 100%.                    |
| Estoque em circulação  | Todos os aparelhos da categoria **menos os aposentados**. É o que a prateleira pode oferecer, mesmo que uma parte esteja fora no momento. |
| Estoque Esgotado       | O selo vermelho: nenhuma unidade daquela categoria está disponível. Quem chegar ao tablet agora não leva nada.                            |
| Estoque Crítico        | O selo amarelo: sobraram uma ou duas unidades disponíveis.                                                                                |
| Empréstimos no Mês     | Quantas **retiradas** foram registradas desde o dia 1º. Conta o que saiu, não o que está fora.                                            |
| Equipamentos na Rua    | Quantos aparelhos estão fora da prateleira neste instante, somando os que estão com as pessoas e os que esperam conferência na bancada.   |

## 4. Papéis e responsabilidades

| Papel                  | Faz                                                                                                          | Não faz                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Secretaria             | Abre a aba, lê os números e leva à coordenação o que está esgotado ou crítico.                                   | Não corrige nada aqui. O que aparece errado nesta tela se conserta nas abas **Inventário** e **Fila de Devoluções**.       |
| Coordenação            | Decide a compra, a partir do que a secretaria mostra.                                                            | Não abre o painel. Ela não tem conta — o painel é da secretaria.                                                          |
| Painel (o computador)  | Soma o que está gravado, no instante em que a página abre.                                                       | Não guarda histórico do relatório, não manda aviso e não compara com o mês passado. Cada abertura é uma fotografia nova.   |
| Estudante ou professor | Nada. Não participa deste processo.                                                                              | Não vê esta tela. O que ele percebe é a consequência: a categoria que aparece esgotada aqui é a que ele acha vazia lá.     |

## 5. Passo a passo

Uma sequência só, do login ao número que sai desta tela.

1. Entre no painel com seu login e senha.
2. Clique em **Relatórios**, o último item do menu à esquerda.

    [![A tela de Relatórios com a aba Ocupação e picos de uso aberta: dois cartões no topo e as três categorias com suas barras](../assets/images/relatorios/01-relatorios-ocupacao.png)](../assets/images/relatorios/01-relatorios-ocupacao.png)

3. A aba **Ocupação e picos de uso** já vem aberta. Leia os dois cartões do
   topo: **Empréstimos no Mês** é o volume de trabalho que passou pelo balcão, e
   **Equipamentos na Rua** é o que está fora da prateleira agora.

    [![Os dois cartões do topo: 10 empréstimos no mês e 7 equipamentos na rua, com a quebra em 3 com as pessoas e 4 na bancada](../assets/images/relatorios/02-indicadores-do-mes.png)](../assets/images/relatorios/02-indicadores-do-mes.png)

4. Repare na segunda linha do cartão **Equipamentos na Rua**: ela separa os que
   estão **com as pessoas** dos que estão **na bancada aguardando conferência**.
   Só a segunda parcela depende de você — ela some quando a
   [baixa física](baixa-fisica.md) é confirmada.
5. Desça até **Esgotamento por categoria**. Cada linha é uma prateleira, com a
   barra mostrando a ocupação e, embaixo dela, a composição em números.

    [![As três categorias com suas barras: Notebooks em 56%, Tablets em 50% com o selo Estoque Crítico, e Extensões em 40%](../assets/images/relatorios/03-esgotamento-por-categoria.png)](../assets/images/relatorios/03-esgotamento-por-categoria.png)

6. Leia a linha da categoria da direita para a esquerda: **56% de ocupação
   (5 de 9)** quer dizer que, dos 9 notebooks em circulação, 5 não estão na
   prateleira. Os 5 se abrem embaixo: **4 emprestados · 1 em manutenção**.
7. Alguma categoria tem selo colorido ao lado dos números?

    - Se aparece **Estoque Esgotado** (vermelho) → não sobrou nenhuma unidade
      daquela categoria. Quem chegar ao tablet agora não leva nada. Confira a
      [Fila de Devoluções](baixa-fisica.md): se houver aparelho esperando
      conferência, confirmar o recebimento devolve unidade à prateleira na hora.
      Se a fila estiver vazia, o número é o argumento de compra.

        [![A linha dos Tablets com 100% de ocupação, 0 livres e o selo vermelho Estoque Esgotado](../assets/images/relatorios/04-estoque-esgotado.png)](../assets/images/relatorios/04-estoque-esgotado.png)

    - Se aparece **Estoque Crítico** (amarelo) → sobraram uma ou duas unidades.
      Vale avisar a coordenação antes de acabar, e conferir se algum aparelho em
      manutenção já pode voltar pela aba **Inventário**.
    - Se não aparece selo nenhum → aquela categoria tem três ou mais unidades
      livres. Nada a fazer.

8. As abas **Ranking de Consumo** e **Índice de Manutenção** ainda não têm
   relatório. Abrir uma delas mostra um aviso, e não um erro.

    [![A aba Ranking de Consumo selecionada, mostrando a caixa tracejada com o aviso de relatório em desenvolvimento](../assets/images/relatorios/05-aba-sem-relatorio.png)](../assets/images/relatorios/05-aba-sem-relatorio.png)

## 6. Regras que não são óbvias

<a id="por-que-a-ocupacao-conta-o-que-esta-em-manutencao"></a>

!!! question "Por que a ocupação conta o aparelho em manutenção junto com o emprestado?"

    Porque a pergunta que esta tela responde é **"sobra aparelho para quem
    chegar agora?"**, e para quem chega dá no mesmo: o notebook no conserto e o
    notebook na mochila de alguém estão igualmente fora da prateleira.

    A consequência é a que interessa: **100% de ocupação quer dizer exatamente
    "nenhuma unidade disponível"**, e é por isso que a barra cheia e o selo
    vermelho sempre aparecem juntos. Se a ocupação contasse só os emprestados,
    uma categoria com três aparelhos no conserto e o resto emprestado mostraria
    uma barra pela metade ao lado de um alerta dizendo que o estoque acabou — e
    as duas coisas estariam certas ao mesmo tempo.

    A composição embaixo da barra separa as duas parcelas, para a decisão não se
    perder: manutenção é aparelho que **pode voltar**, e empréstimo é aparelho
    que **vai voltar**.

<a id="por-que-o-aposentado-fica-fora-da-conta"></a>

!!! question "Por que o aparelho aposentado fica fora da conta?"

    Porque ele não volta. A
    [aposentadoria](../referencia/glossario.md#aposentadoria-item-inativo) é a
    saída definitiva de circulação — o aparelho continua no banco só para o
    histórico de empréstimos não perder a referência dele.

    Contá-lo no total faria a ocupação parecer menor do que é. Uma categoria com
    dez aparelhos, quatro deles aposentados, e os seis restantes emprestados,
    mostraria 60% de ocupação com a prateleira vazia.

    É a mesma conta que o tablet já faz: lá a grade diz "Notebooks — 4 de 9
    disponíveis" com dez notebooks cadastrados, porque um está aposentado. Os
    aposentados aparecem nesta tela entre parênteses, **fora da conta**, para os
    números continuarem fechando com a aba **Inventário** — que, ao contrário,
    mostra o patrimônio inteiro.

<a id="por-que-os-emprestimos-do-mes-nao-caem-quando-alguem-devolve"></a>

!!! question "Por que Empréstimos no Mês não diminui quando alguém devolve?"

    Porque ele conta **retiradas**, e uma retirada que aconteceu não desacontece.
    O número responde "quanto trabalho passou pelo balcão neste mês" e sobe até o
    dia 1º do mês seguinte, quando volta a zero.

    Quem responde "quanto está fora agora" é o cartão ao lado, **Equipamentos na
    Rua**. Os dois medem coisas diferentes de propósito: um é o movimento, o
    outro é o estoque.

<a id="por-que-o-numero-nao-bate-com-a-prateleira"></a>

!!! question "Contei os aparelhos no armário e o número não bate. O que está errado?"

    Quase sempre nada. São três diferenças possíveis, e todas são deliberadas:

    - **Os aposentados não entram na conta** — eles estão no armário e não estão
      em circulação. O total entre parênteses ao lado da linha diz quantos são.
    - **Os que estão na bancada contam como fora da prateleira.** O aparelho que
      alguém acabou de devolver no tablet ainda não voltou ao estoque: ele espera
      a [baixa física](baixa-fisica.md). Enquanto espera, está fisicamente no
      balcão e contabilmente fora.
    - **Os números são do instante em que a página abriu.** Uma retirada feita no
      tablet enquanto você lia a tela não aparece até a próxima abertura.

    Se a diferença não for nenhuma das três, o lugar de conferir item a item é a
    aba [Inventário](inventario.md).

<a id="por-que-uma-categoria-aparece-sem-unidades-em-circulacao"></a>

!!! question "Por que uma categoria aparece com Sem unidades em circulação, e não como esgotada?"

    Porque não há estoque para esgotar. Isso acontece em dois casos: a categoria
    acabou de ser criada e ainda não recebeu nenhum aparelho, ou todos os
    aparelhos dela foram aposentados.

    Marcá-la de vermelho seria pedir uma compra que ninguém pediu — e, pior,
    seria um vermelho permanente, que ensina o olho a ignorar os outros. A linha
    aparece sem barra, em texto cinza, e some da grade do tablet pelo mesmo
    motivo.

<a id="por-que-a-aba-volta-para-a-primeira"></a>

!!! question "Por que a aba volta para a primeira quando eu recarrego a página?"

    Porque a aba escolhida não entra no endereço. É uma escolha de projeto: o
    relatório inteiro já chega pronto quando a página abre, e trocar de aba não
    consulta o banco de novo — a troca é instantânea porque nada vai ao servidor.

    O preço é este: recarregar volta para **Ocupação e picos de uso**, e não
    existe link que abra direto numa aba específica. Para uma tela consultada de
    pé, em uma sessão, ninguém compartilha link de aba de relatório.

<a id="por-que-nao-da-para-comparar-com-o-mes-passado"></a>

!!! question "Por que não dá para ver o mês passado, nem exportar isto?"

    Porque o relatório é uma fotografia do agora, e esta é a primeira versão
    dele. O sistema guarda todos os empréstimos com as datas — o dado para
    comparar meses **existe** —, mas a tela que faria essa leitura ainda não foi
    construída.

    O mesmo vale para as abas **Ranking de Consumo** e **Índice de Manutenção**:
    os nomes estão no menu para dizer o que vem por aí, e o aviso dentro delas
    diz que ainda não vem.

## 7. Erros comuns e o que fazer

| Mensagem na tela                        | Causa                                                                                         | O que fazer                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Relatório em desenvolvimento..."       | Você abriu **Ranking de Consumo** ou **Índice de Manutenção**. Esses dois ainda não existem.     | Volte para **Ocupação e picos de uso**, que é a única aba com dados. Não é erro: a tela está avisando.        |
| "Nenhuma categoria cadastrada ainda."   | Não há categoria no sistema, então não há prateleira para medir.                                | Crie a primeira na aba **Categorias**. Sem categoria, o tablet também não mostra nada.                       |
| "Sem unidades em circulação"            | A categoria existe, mas não tem aparelho em circulação — nenhum cadastrado, ou todos aposentados. | Cadastre um aparelho nela pela aba **Inventário**, ou apague a categoria se ela não serve mais.              |
| A tela de login aparece no lugar do relatório | A sessão expirou enquanto a página estava aberta.                                          | Entre de novo. Nada se perde: esta tela não grava nada — ver [Conta do administrador](../referencia/conta-do-administrador.md). |
