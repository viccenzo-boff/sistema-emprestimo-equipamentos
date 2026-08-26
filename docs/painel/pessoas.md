# 5. Gestão de pessoas

## 1. Objetivo do processo

Este processo mantém a lista de quem pode retirar equipamento igual à lista da
coordenação: quem entrou no semestre é cadastrado, quem saiu é tirado de
circulação, e o dado digitado errado é corrigido.

Quando termina, o tablet reconhece a matrícula de quem chega ao balcão — e não
reconhece a de quem não deveria estar lá. Nada nesta tela apaga história: um
cadastro que sai de circulação continua no sistema, porque o histórico de
empréstimos aponta para ele.

## 2. Pré-condições

- Você está com a sessão aberta no painel. Se não estiver, entre com seu login e
  senha — ver [Conta do administrador](../referencia/conta-do-administrador.md).
- **Para importar:** a planilha está em `.xlsx` (Pasta de Trabalho do Excel) e
  tem uma coluna de matrícula. As outras quatro colunas são opcionais.
- **A planilha está conferida antes de sair da coordenação.** A importação
  escreve em cima do que já está no sistema, e não tem desfazer — ver a
  [regra sobre a prévia](#por-que-a-importacao-mostra-uma-previa-antes-de-gravar).
- Para corrigir um cadastro à mão, basta a lista. Não é preciso a pessoa estar
  presente, nem o cadastro estar ativo.

## 3. Glossário do processo

Os termos que atravessam vários processos moram no
[glossário geral](../referencia/glossario.md):
[matrícula](../referencia/glossario.md#matricula),
[perfil](../referencia/glossario.md#perfil),
[cadastro inativo](../referencia/glossario.md#cadastro-inativo-pessoa),
[empréstimo](../referencia/glossario.md#emprestimo) e
[etiqueta](../referencia/glossario.md#etiqueta).

Estes são só desta página — são as partes da tela que os passos citam pelo nome:

| Termo             | O que é                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Cadastros         | A tabela da aba **Pessoas**, uma linha por estudante ou professor, com os ativos em cima.                                   |
| Planilha modelo   | O arquivo vazio que o painel gera, com os cabeçalhos que a importação sabe ler. É o ponto de partida da planilha da coordenação. |
| Prévia            | A lista do que a importação **vai** fazer, mostrada antes de qualquer escrita: cadastrar, atualizar, sem mudança e com erro. |
| Situação          | A coluna que diz se o cadastro está **Ativo** ou **Inativo**. Ela decide quem consegue retirar equipamento no tablet.       |
| Linha ignorada    | Uma linha da planilha que a prévia reprovou. O resto do arquivo entra normalmente; ela não.                                 |

## 4. Papéis e responsabilidades

| Papel                  | Faz                                                                                                                             | Não faz                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Coordenação            | Entrega a planilha com quem está matriculado no semestre. É dela que sai a lista.                                               | Não abre o painel. O contato dela com o sistema é o arquivo.                                                                               |
| Secretaria             | Baixa o modelo, confere a prévia, confirma a importação, corrige cadastro à mão e decide quem sai de circulação.                | Não apaga cadastro — não existe essa ação, e a [regra abaixo](#por-que-nao-existe-um-botao-de-excluir-cadastro) explica por quê.            |
| Painel (o computador)  | Lê a planilha, corrige a grafia sozinho, mostra o que vai mudar antes de mudar, e recusa a linha que não dá para aproveitar.    | Não adivinha. Perfil que não é Estudante nem Professor reprova a linha em vez de escolher um.                                               |
| Estudante ou professor | Nada. Não participa deste processo.                                                                                            | Não vê esta tela. O que ele percebe é indireto: a matrícula passar — ou não — no tablet.                                                    |

## 5. Diagrama BPMN

[![Diagrama BPMN da gestão de pessoas: a secretaria abre a aba Pessoas e escolhe entre importar a planilha, corrigir um cadastro ou ativar e inativar; na importação o sistema confere se o arquivo é mesmo uma planilha, lê as linhas, sanitiza e mostra a prévia, e só grava depois da confirmação.](../assets/diagramas/05-pessoas.svg)](../assets/diagramas/05-pessoas.svg)

Clique no diagrama para abri-lo em tamanho cheio — na largura da página ele
entra com cerca de metade do tamanho, e os rótulos ficam apertados.

Repare que a **prévia é uma etapa do processo**, e não um detalhe da tela: entre
ler o arquivo e gravar existe uma decisão de quem está no balcão. Enquanto ela
não for tomada, nada foi escrito.

**Baixar a planilha modelo não está no diagrama**, de propósito: é preparação
que acontece antes de o processo começar, e do lado da coordenação. O
procedimento 1 do passo a passo cobre esse pedaço.

[Baixar o arquivo `.bpmn`](../processos-fonte/05-pessoas.bpmn) — a fonte do
diagrama, que abre no [bpmn.io](https://bpmn.io) sem instalar nada.

## 6. Passo a passo

São quatro procedimentos, cada um com a sua sequência. Todos começam na aba
**Pessoas**, no menu à esquerda.

A tela abre com as contagens no alto, o cartão **Importar planilha** no meio e a
lista de cadastros embaixo.

[![A lista de cadastros filtrada por "computa": a barra de busca, os dois seletores de filtro, sete linhas ativas e duas inativas em cinza, a linha "Mostrando 9 de 15 cadastros" e o botão Limpar filtros.](../assets/images/pessoas/01-lista-de-cadastros.png)](../assets/images/pessoas/01-lista-de-cadastros.png)

Repare que **a linha inativa continua na lista**, mais apagada que as vizinhas e
com o botão **Ativar** no lugar do **Inativar**. E que uma delas — Larissa
Coutinho — está inativa **e** com um aparelho na mão: é a regra que a
[seção 7 explica](#inativei-alguem-que-esta-com-um-equipamento-isso-e-um-problema).

### Baixar a planilha modelo e preenchê-la

1. Abra a aba **Pessoas**.

2. Clique em **Baixar planilha modelo**, dentro do cartão **Importar planilha**.

    [![O cartão Importar planilha: o texto explicando as cinco colunas, o botão Baixar planilha modelo, o aviso sobre o zero à esquerda e a área pontilhada de escolher o arquivo.](../assets/images/pessoas/02-baixar-planilha-modelo.png)](../assets/images/pessoas/02-baixar-planilha-modelo.png)

    O arquivo `modelo_importacao_pessoas.xlsx` cai na pasta de downloads. A
    página **não** recarrega, e nada do que estava na tela se perde.

3. Abra o arquivo no Excel.

    Ele vem vazio, com uma linha só: os cinco cabeçalhos que a importação sabe
    ler.

    | Coluna      | Obrigatória? | O que aceita                                    |
    | ----------- | ------------ | ----------------------------------------------- |
    | `matricula` | **Sim**      | Só números, até 15 dígitos                      |
    | `nome`      | Não          | Nome completo                                   |
    | `perfil`    | Não          | Estudante ou Professor, em qualquer grafia      |
    | `cursos`    | Não          | Um ou vários, separados por vírgula             |
    | `status`    | Não          | `ATIVO` ou `INATIVO`                            |

4. Formate a coluna `matricula` como **Texto**, antes de digitar qualquer coisa.

    Este passo não é enfeite. Em formato Geral, o Excel guarda `0012345` como o
    número `12345` — e o zero à esquerda some **dentro do arquivo**, onde nada
    aqui o recupera. Ver a
    [regra sobre o zero à esquerda](#a-matricula-perdeu-os-zeros-da-frente-o-que-aconteceu).

5. Preencha uma linha por pessoa.

    Não se preocupe com maiúscula, acento ou abreviação de curso: o sistema
    corrige a grafia sozinho ao gravar. Ver a
    [tabela de antes e depois](#por-que-o-sistema-mudou-o-que-eu-digitei-na-planilha).

6. Salve como **Pasta de Trabalho do Excel (.xlsx)**.

    A importação recusa `.xls` e `.csv`, e recusa também um arquivo com a
    extensão `.xlsx` e outro conteúdo por dentro.

### Importar a planilha

1. Abra a aba **Pessoas**.

2. Clique na área pontilhada e escolha o arquivo.

    Também dá para arrastar o `.xlsx` até ali. O nome e o tamanho aparecem
    dentro da área depois de escolhido.

    [![A área de soltar com o arquivo matriculados-2026-2.xlsx escolhido, mostrando 17 KB e os botões Trocar arquivo e Analisar planilha.](../assets/images/pessoas/03-planilha-escolhida.png)](../assets/images/pessoas/03-planilha-escolhida.png)

3. Clique em **Analisar planilha**.

    **Nada é gravado neste passo.** O painel lê o arquivo, compara com o que já
    está no sistema e monta a lista do que aconteceria.

4. Leia os quatro contadores.

    [![A prévia da importação: os cartões Cadastrar 1, Atualizar 2, Sem mudança 3 e Com erro 3; a linha Colunas lidas com as cinco colunas; o bloco vermelho com as três linhas que serão ignoradas; e a lista O que vai mudar, campo a campo.](../assets/images/pessoas/04-previa-antes-de-gravar.png)](../assets/images/pessoas/04-previa-antes-de-gravar.png)

    | Cartão          | O que ele conta                                                        |
    | --------------- | ---------------------------------------------------------------------- |
    | **Cadastrar**   | Matrículas que ainda não existem e vão nascer.                         |
    | **Atualizar**   | Cadastros que existem e vão mudar em pelo menos um campo.              |
    | **Sem mudança** | Cadastros que já estão exatamente assim. Não entram na lista de baixo. |
    | **Com erro**    | Linhas que serão ignoradas. O resto do arquivo entra normalmente.      |

5. Confira a linha **Colunas lidas**.

    Ela diz quais das cinco colunas o painel encontrou no arquivo. Coluna que
    não está lá é campo que o sistema **preserva** como está — a importação não
    apaga o que a planilha não menciona.

6. Leia o bloco vermelho, se houver.

    Cada linha reprovada traz o número da linha **como o Excel a numera**, a
    matrícula e o motivo. É essa lista que você usa para corrigir o arquivo.

7. Alguma linha foi reprovada?

    - **Se SIM** → decida agora: corrigir o arquivo e voltar ao passo 2, ou
      seguir sem elas. Confirmar grava o resto e ignora as reprovadas; reimportar
      depois não duplica o que já entrou.
    - **Se NÃO** → siga para o passo 8.

8. Leia a lista **O que vai mudar**, campo a campo.

    Cada linha mostra o valor antigo riscado e o novo ao lado. É a última
    chance de perceber que o arquivo é o do semestre errado.

9. Clique em **Confirmar importação**.

10. Confira o aviso verde.

    [![O cartão Importar planilha depois da gravação, com a área de soltar vazia de novo e um aviso verde dizendo "Importação concluída: 1 cadastro criado e 2 atualizados", com o detalhe de que 3 linhas foram ignoradas por erro.](../assets/images/pessoas/05-importacao-concluida.png)](../assets/images/pessoas/05-importacao-concluida.png)

    Ele conta o que de fato foi gravado — "Importação concluída: 1 cadastro
    criado e 2 atualizados." A lista de cadastros abaixo já está atualizada.

### Editar um cadastro, inclusive a matrícula

1. Ache a pessoa na lista.

    A busca aceita nome, matrícula ou curso, e ignora acento: "computa" encontra
    quem está em Ciência da Computação e em Engenharia da Computação. Os dois
    seletores ao lado filtram por perfil e por situação.

    [![A barra de filtros: o campo de busca com a palavra "computa" digitada, o seletor Todos os perfis e o seletor Todas as situações.](../assets/images/pessoas/06-busca-e-filtros.png)](../assets/images/pessoas/06-busca-e-filtros.png)

2. Confira que a linha é a certa.

    Embaixo do nome vêm a matrícula e os cursos. Se a pessoa estiver com algum
    aparelho, uma terceira linha diz quais.

    [![A linha de Ana Souza: o nome, a matrícula 0012345, o curso, a legenda "Está com NOTE-01, TAB-01", o selo Estudante, o selo verde Ativo e os botões Editar e Inativar.](../assets/images/pessoas/07-linha-com-acoes.png)](../assets/images/pessoas/07-linha-com-acoes.png)

3. Clique em **Editar**, na linha daquela pessoa.

    [![O diálogo Editar cadastro, com os campos Matrícula (já selecionado), Nome completo, Perfil, Situação e Cursos, e os botões Cancelar e Salvar.](../assets/images/pessoas/08-modal-de-edicao.png)](../assets/images/pessoas/08-modal-de-edicao.png)

4. Corrija o que estiver errado.

    Os cinco campos são obrigatórios aqui — ao contrário da planilha, quem abriu
    o diálogo está com o cadastro inteiro na frente, e um campo apagado é
    apagamento de propósito.

5. Para trocar a matrícula, digite o número novo no campo **Matrícula**.

    Ele já vem com o valor atual selecionado: dá para digitar por cima. O campo
    só aceita números e para em 15 dígitos, que é o que o teclado do tablet
    consegue digitar.

6. Clique em **Salvar**.

7. Confira o aviso.

    [![O aviso verde no alto da tela: "A matrícula 0056789 agora é 0056790. O histórico de empréstimos foi junto."](../assets/images/pessoas/09-matricula-corrigida.png)](../assets/images/pessoas/09-matricula-corrigida.png)

    A segunda frase é o ponto: **o histórico acompanha a troca**. Todo
    empréstimo daquela pessoa — aberto ou concluído — passa a apontar para o
    número novo. Nada fica para trás.

### Inativar e reativar um cadastro

1. Ache a pessoa na lista.

2. Clique em **Inativar**, na linha dela.

3. A pessoa está com algum equipamento?

    - **Se NÃO** → o cadastro é inativado na hora, sem diálogo nenhum. Siga para
      o passo 6.
    - **Se SIM** → um aviso aparece dizendo o que ela está levando. Siga para o
      passo 4.

4. Leia o aviso antes de confirmar.

    [![O diálogo Inativar cadastro: o nome e a matrícula de Ana Souza no topo, um alerta âmbar dizendo que ela ainda está com 2 equipamentos e nomeando NOTE-01 e TAB-01, e o texto explicando que a devolução continua liberada no tablet.](../assets/images/pessoas/10-aviso-de-inativacao-com-emprestimo.png)](../assets/images/pessoas/10-aviso-de-inativacao-com-emprestimo.png)

    Ele nomeia as etiquetas — "NOTE-01, TAB-01" — e a contagem é lida do
    servidor no momento do clique, não do momento em que a tela abriu.

5. Clique em **Inativar**, no diálogo.

    Inativar aqui é **permitido de propósito**, e a explicação está na
    [seção 7](#inativei-alguem-que-esta-com-um-equipamento-isso-e-um-problema).
    O empréstimo continua aberto e continua aparecendo em **Empréstimos
    Ativos**.

6. Confira a linha na lista.

    [![A linha de Henrique Vasques depois da inativação: fundo cinza, o nome em tom mais claro, o selo Inativo sem cor e os botões Editar e Ativar.](../assets/images/pessoas/11-cadastro-inativo-na-lista.png)](../assets/images/pessoas/11-cadastro-inativo-na-lista.png)

    Ela continua ali, mais apagada, com o selo **Inativo** e o botão **Ativar**
    no lugar do **Inativar**. O aviso no alto confirma — "Henrique Vasques foi
    inativado e não consegue mais retirar equipamento."

7. Para trazer a pessoa de volta, clique em **Ativar** na mesma linha.

    Um clique, sem diálogo: reativar não é gesto perigoso. O aviso diz
    "Henrique Vasques está ativo e já pode retirar equipamento.", e a matrícula
    volta a funcionar no tablet na mesma hora.

## 7. Regras que não são óbvias

<a id="por-que-a-importacao-mostra-uma-previa-antes-de-gravar"></a>

!!! question "Por que a importação mostra uma prévia antes de gravar?"

    Porque **a importação não tem desfazer**, e ela escreve em muitos cadastros
    de uma vez.

    Um arquivo errado — o do semestre passado, o de outro curso, o que alguém
    editou pela metade — sobrescreveria centenas de linhas em um clique. Um
    relatório depois do fato só contaria o estrago.

    A prévia é o único momento em que o estrago ainda não aconteceu. Ela mostra,
    campo a campo, o valor que sai e o valor que entra. Se a lista não for a que
    você esperava, **Trocar arquivo** custa um clique; a alternativa custa uma
    tarde refazendo cadastro.

    A gravação também é tudo-ou-nada: se algo falhar no meio, nada é escrito. Não
    existe importação aplicada pela metade.

<a id="por-que-o-sistema-mudou-o-que-eu-digitei-na-planilha"></a>

!!! question "Por que o sistema mudou o que eu digitei na planilha?"

    Porque a planilha é digitada por gente, e gente escreve a mesma coisa de
    muitas formas. Sem uma passagem de limpeza, "ANA MARIA DE SOUZA" e "ana maria
    de souza" viram dois jeitos de escrever a mesma pessoa, e a busca do painel
    encontra um e perde o outro.

    A limpeza acontece **na gravação**, e você não precisa formatar nada à mão:

    | O que você digita na planilha | O que o sistema grava                                        |
    | ----------------------------- | ------------------------------------------------------------ |
    | `JOÃO PEDRO DE ALMEIDA`       | João Pedro de Almeida                                        |
    | `isabela moraes`              | Isabela Moraes                                               |
    | `MARIANA  COSTA-DE-LIMA`      | Mariana Costa de Lima                                        |
    | `PROF. MARINA BASTOS`         | Prof. Marina Bastos                                          |
    | `ALUNO`, `Alunos`, `aluna`, `discente` | Estudante                                           |
    | `Professora`, `PROF.`, `docente` | Professor                                                 |
    | `SI`                          | Sistemas de Informação                                       |
    | `cc`                          | Ciência da Computação                                        |
    | `ec, si`                      | Sistemas de Informação, Engenharia da Computação             |
    | `ec, cc`                      | Ciência da Computação, Engenharia da Computação              |
    | `Administração, si`           | Sistemas de Informação, Administração                        |
    | `ativo`, `Ativo`              | ATIVO                                                        |

    Três detalhes que a tabela mostra e vale nomear:

    - **A partícula fica minúscula.** "de", "da", "dos" no meio do nome não
      recebem maiúscula — é como o cartório escreve e como você lê o nome na
      fila de devoluções.
    - **O ponto de "Prof." sobrevive.** É o que faz o tablet cumprimentar
      "Prof. Marina" em vez de cumprimentar um título.
    - **Os cursos saem sempre na mesma ordem**: Sistemas de Informação, Ciência
      da Computação, Engenharia da Computação, e depois o resto em ordem
      alfabética. Por isso `ec, cc` e `cc, ec` gravam a mesma coisa — e por isso
      a busca não depende de como a coordenação digitou.

    **Curso que o sistema não conhece é mantido**, não descartado. "Direito" e
    "Administração" entram como foram escritos e vão para o fim da lista. Só a
    ordem é decidida pelo sistema; o conteúdo é seu.

<a id="reenviei-a-mesma-planilha-e-ele-diz-que-nada-muda"></a>

!!! question "Reenviei a mesma planilha e a prévia diz que quase nada muda. Está funcionando?"

    Está — e é justamente por causa da limpeza acima.

    O cartão **Sem mudança** conta os cadastros que já estão exatamente como a
    planilha os descreve. Como o sistema grava sempre na forma canônica, uma
    linha escrita `JOÃO PEDRO DE ALMEIDA` com perfil `ALUNO` e cursos `ec, si`
    bate com "João Pedro de Almeida / Estudante / Sistemas de Informação,
    Engenharia da Computação" que já está lá — quatro diferenças de grafia, zero
    diferenças de conteúdo.

    Isso é o que permite reenviar a planilha inteira todo semestre sem
    esforço: das 180 linhas, aparecem na lista só as que realmente mudam. Uma
    prévia que dissesse "180 atualizações" seria uma prévia que ninguém leria.

    O número do cartão é a prova de que o arquivo **foi** lido. Se ele estiver
    zerado junto com os outros três, aí sim o arquivo não é o que você pensa.

<a id="inativei-alguem-que-esta-com-um-equipamento-isso-e-um-problema"></a>

!!! question "Inativei alguém que está com um equipamento. Isso é um problema?"

    Não. É o caso comum, e o sistema foi feito para ele.

    Inativa-se justamente quem saiu — trancou a matrícula, se formou, mudou de
    curso —, e essa pessoa quase sempre está com um aparelho na mochila. Por isso
    a inativação é **assimétrica**:

    | O que a inativação faz | O que ela **não** faz |
    | --- | --- |
    | Bloqueia a retirada no tablet, na hora | Não bloqueia a devolução |
    | Tira a pessoa da lista de quem pode levar | Não encerra os empréstimos que estão abertos |
    | Marca a linha como **Inativo** | Não apaga o cadastro nem o histórico |

    Travar os dois lados seria o pior desenho possível: a inativação viraria a
    garantia de que aquele aparelho **nunca** volta. Quem devolve não está
    pedindo nada ao sistema — está entregando algo que a secretaria quer de
    volta.

    Na prática, a matrícula inativa entra no tablet normalmente. No lugar da
    grade de categorias aparece a explicação, e o botão de devolver continua ao
    lado de cada item — ver
    [Devolução de equipamento](../portal/devolucao.md) e
    [Retirada de equipamento](../portal/retirada.md).

    O empréstimo aberto continua onde estava: na aba **Empréstimos Ativos**, que
    é onde a cobrança acontece.

<a id="por-que-o-equipamento-trava-e-a-pessoa-nao"></a>

!!! question "Por que o equipamento trava quando tem empréstimo aberto e a pessoa não?"

    Porque as duas coisas respondem a perguntas diferentes, e esta é a confusão
    mais provável do painel inteiro — a mesma palavra, **Inativar**, com
    resultados opostos em duas telas.

    | | Pessoa (esta página) | Equipamento ([Gestão de inventário](inventario.md)) |
    | --- | --- | --- |
    | Com um empréstimo aberto | Inativar é **permitido**, com um aviso | A situação **trava**: não dá para inativar |
    | Por quê | Quem sai da instituição costuma estar com um aparelho na mochila | O aparelho está fora do armário; o registro tem que dizer a verdade |
    | Efeito da inativação | **Assimétrico**: bloqueia retirar, libera devolver | Some do tablet nas duas pontas |
    | Como volta | Botão **Ativar**, um clique | Botão **Reativar**, um clique |

    A regra por trás das duas é a mesma: **o registro tem que dizer a verdade
    sobre onde o aparelho está.** No equipamento, isso significa travar — mudar a
    situação à mão de um item que está com alguém faria o tablet oferecê-lo a
    outra pessoa. Na pessoa, significa liberar a devolução — é o único caminho
    para o aparelho voltar.

    O detalhe do outro lado está em
    [por que não consigo mexer em um item que está emprestado](inventario.md#por-que-nao-consigo-mexer-em-um-item-que-esta-emprestado).

<a id="por-que-nao-existe-um-botao-de-excluir-cadastro"></a>

!!! question "Por que não existe um botão de excluir cadastro?"

    Porque o histórico de empréstimos aponta para a pessoa, e apagá-la levaria o
    histórico junto: quem levou aquele notebook no semestre passado deixaria de
    existir, sem aviso e sem volta.

    O banco de dados recusa a exclusão de qualquer forma — é uma trava de
    estrutura, não uma escolha da tela. Por isso a ação que tira alguém de
    circulação chama **Inativar**, e o ícone dela é um círculo cortado, não uma
    lixeira: lixeira promete que o registro some, e ele não some.

    A frase está no rodapé da própria tela:

    > O cadastro nunca é apagado: o histórico de empréstimos aponta para ele.

    É a mesma regra do equipamento, e pelo mesmo motivo — ver
    [por que não existe um botão de excluir equipamento](inventario.md#por-que-nao-existe-um-botao-de-excluir-equipamento).

<a id="confirmei-uma-importacao-errada-como-desfaco"></a>

!!! question "Confirmei uma importação errada. Como desfaço?"

    **Não há como desfazer**, e é por isso que a prévia existe. O que dá para
    fazer é corrigir por cima, e o caminho depende do estrago:

    1. **Se o arquivo errado tinha as matrículas certas** (o do semestre
       passado, por exemplo) → importe o arquivo certo. Cada campo que ele trouxer
       sobrescreve o que a importação errada gravou.
    2. **Se ele criou cadastros que não deviam existir** → não dá para apagá-los.
       Use **Inativar** em cada um: eles saem do tablet e ficam na lista em cinza.
    3. **Se ele mexeu em campos que o arquivo certo não menciona** → esses campos
       ficam como estão. Importar de novo não os devolve, porque a importação só
       escreve nas colunas que o arquivo traz. Corrija esses casos à mão, pelo
       **Editar** da linha.

    O terceiro é o mais traiçoeiro, e é o argumento para ler a prévia inteira: a
    lista **O que vai mudar** é a única vez em que o valor antigo aparece na tela.

<a id="a-matricula-perdeu-os-zeros-da-frente-o-que-aconteceu"></a>

!!! question "A matrícula perdeu os zeros da frente. O que aconteceu?"

    O Excel os apagou antes de o arquivo chegar aqui.

    Numa coluna em formato Geral, `0012345` é lido como o **número** 12345, e é o
    número que fica gravado dentro do `.xlsx`. Quando a importação abre o
    arquivo, os zeros já não estão lá — não há como recuperá-los deste lado.

    O efeito é silencioso e caro: a matrícula `0012345` chega como `12345`, o
    cadastro certo não é encontrado, e a linha vira ou um cadastro novo errado ou
    uma linha reprovada. Foi para pegar esse caso que a prévia mostra a matrícula
    de cada linha.

    A prevenção é o passo 4 do procedimento 1: **formate a coluna como Texto
    antes de digitar**. Se a planilha já veio assim da coordenação, o conserto é
    lá, no arquivo — não aqui.

    No sistema, a matrícula é texto, e os zeros à esquerda contam. `0012345` e
    `12345` são duas pessoas diferentes.

<a id="por-que-a-matricula-so-aceita-numeros"></a>

!!! question "Por que a matrícula só aceita números, até 15 dígitos?"

    Porque quem digita a matrícula não é você: é o estudante, de pé, no teclado
    do tablet — e aquele teclado tem dez teclas.

    Uma matrícula com letra ou hífen criaria um cadastro que existe no painel,
    aparece nas listas, e que **ninguém consegue digitar no portal**: uma pessoa
    que nunca mais retira nem devolve nada. O erro só apareceria com ela parada
    na frente do tablet.

    Por isso a regra é a do lado mais restrito, nos dois caminhos: o campo do
    diálogo para em 15 dígitos, e a importação reprova a linha que traz outra
    coisa. Se um dia a coordenação passar a usar prefixo de letra, quem muda
    primeiro é o teclado do tablet.

<a id="trocar-a-matricula-quebra-o-historico"></a>

!!! question "Trocar a matrícula não quebra o histórico?"

    Não. O banco de dados propaga a troca para todos os empréstimos da pessoa —
    abertos e concluídos — na mesma operação em que grava a matrícula nova.

    Isso foi medido: um empréstimo aberto que apontava para `0056789` passou a
    apontar para `0056790` junto com a edição, e não sobrou nenhum registro
    apontando para o número antigo.

    É por isso que o aviso diz as duas coisas — "A matrícula 0056789 agora é
    0056790. O histórico de empréstimos foi junto." A segunda frase existe porque
    trocar um número que o sistema inteiro usa como chave **parece** perigoso
    para quem está clicando.

    O que a troca não faz é criar uma pessoa nova. É o mesmo cadastro, com outro
    número.

## 8. Erros comuns e o que fazer

Na importação, o erro aparece **dentro do cartão Importar planilha**, no lugar
onde a prévia apareceria. Nas ações de linha, ele aparece **dentro da própria
linha**, logo abaixo dos botões — e isso é o sinal de que nada mudou.

### Ao enviar o arquivo

| Mensagem na tela                                       | Causa                                                                                      | O que fazer                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| "Nenhum arquivo foi enviado."                          | O formulário foi enviado sem arquivo escolhido.                                            | Clique na área pontilhada e escolha a planilha.                                                                        |
| "lista.csv não é uma planilha .xlsx."                  | O arquivo está em `.xls`, `.csv` ou outro formato.                                         | Abra no Excel e use **Salvar como → Pasta de Trabalho do Excel (.xlsx)**.                                               |
| "lista.xlsx não é uma planilha do Excel por dentro."   | A extensão é `.xlsx` mas o conteúdo é outra coisa — tipicamente um CSV renomeado à mão.    | Mesmo caminho: abra no Excel e salve de verdade como `.xlsx`. Trocar o nome do arquivo não converte o conteúdo.        |
| "Não foi possível ler lista.xlsx."                     | O arquivo está corrompido ou protegido por senha.                                          | Abra no Excel, remova a senha e salve de novo.                                                                          |
| "O arquivo é grande demais."                           | Passou de 3 MB.                                                                            | Divida a planilha em partes. Uma lista de pessoas raramente chega perto disso — desconfie de imagem colada na planilha. |
| "A planilha não tem a coluna matricula."               | Nenhuma linha do arquivo tem um cabeçalho de matrícula reconhecível.                       | Confira a grafia do cabeçalho. Valem `matricula`, `matrícula`, `ra` e `registro`. O detalhe da mensagem lista o que foi lido. |
| "lista.xlsx não tem nenhuma linha preenchida."         | A aba está vazia.                                                                          | Confira se salvou o arquivo certo, e se os dados estão na **primeira** aba.                                             |
| "A planilha tem 6000 linhas."                          | Passou do teto de 5000 linhas por importação.                                              | Divida o arquivo em partes.                                                                                             |

### Nas linhas reprovadas da prévia

Estas não impedem a importação: o resto do arquivo entra normalmente.

| Mensagem na tela                                                                                          | Causa                                                                             | O que fazer                                                                                          |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "Matrícula "SIS-0012" não é válida — use somente números, até 15 dígitos (é o que o teclado do tablet aceita)." | A célula tem letra, hífen ou mais de 15 dígitos.                                   | Corrija na planilha. Ver a [regra sobre o formato](#por-que-a-matricula-so-aceita-numeros).           |
| "Perfil "Servidor" não é válido — use Estudante ou Professor."                                            | O perfil não é nenhuma das duas coisas que o sistema conhece.                      | Só existem dois perfis. Se a pessoa precisa retirar equipamento, escolha um dos dois.                |
| "Status "desligado" não é válido — use ATIVO ou INATIVO."                                                 | A coluna `status` traz outra palavra.                                              | Use `ATIVO` ou `INATIVO`. Maiúscula e minúscula não importam.                                          |
| "Cadastro novo exige nome, perfil, cursos — a matrícula 45678 ainda não existe no sistema."               | A linha é de alguém que não está cadastrado, e não traz os três campos obrigatórios. | Preencha nome, perfil e cursos. **Se você esperava que essa matrícula existisse**, o mais provável é que ela tenha perdido os zeros à esquerda — ver a [regra](#a-matricula-perdeu-os-zeros-da-frente-o-que-aconteceu). |
| "Linha sem matrícula — a importação não tem como saber de quem é."                                        | A linha tem dados, mas a célula de matrícula está vazia.                           | Preencha a matrícula, ou apague a linha inteira.                                                      |
| "Matrícula repetida na planilha (já aparece na linha 12)."                                                | A mesma matrícula aparece duas vezes no arquivo.                                   | Deixe uma linha só. Duas linhas para a mesma pessoa não têm ordem definida.                            |
| "Nome "12345" não tem nenhuma letra aproveitável."                                                        | A célula de nome tem só números ou símbolos.                                       | Escreva o nome. A célula trouxe algo, e esse algo não é um nome.                                        |
| "Cursos ";;;" não tem nenhum curso aproveitável."                                                         | A célula de cursos tem só pontuação.                                               | Escreva o curso, ou deixe a célula vazia — vazia, o sistema preserva o que já está cadastrado.        |

### Nas ações da lista

| Mensagem na tela                              | Causa                                                                                     | O que fazer                                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| "Sessão encerrada."                           | A sessão caiu com a tela aberta — o servidor reiniciou, ou a senha desta conta foi trocada. | Atualize a página e entre de novo. **Nada foi alterado.**                                                       |
| "Matrícula inválida."                         | O campo tem letra, ponto ou espaço.                                                       | Use somente números. Os zeros à esquerda são significativos e devem ser digitados.                              |
| "A matrícula 0012345 já é de outro cadastro." | O número novo já pertence a outra pessoa.                                                 | Cada matrícula é única. Confira o número antes de salvar — pode ser que o cadastro certo já exista.             |
| "A matrícula 0099999 não existe."             | O cadastro foi alterado em outro computador entre a abertura da tela e o clique.           | Atualize a página. A lista pode estar desatualizada.                                                            |
| "O cadastro de Ana Souza já está inativo."    | A situação mudou em outra aba.                                                            | Nenhuma ação. A lista já foi atualizada.                                                                        |
| "Informe o nome completo."                    | O campo foi enviado vazio, ou com mais de 120 caracteres.                                 | É o nome que a secretaria vê na fila de devoluções — escreva o completo.                                        |
| "Perfil inválido."                            | Chegou um perfil que não é Estudante nem Professor.                                       | Use o seletor. Só existem os dois.                                                                              |
| "Informe pelo menos um curso."                | O campo foi enviado vazio, ou com mais de 200 caracteres.                                 | Separe vários por vírgula. Ex.: Sistemas de Informação, Direito.                                                 |
| "Não foi possível concluir a operação."       | O painel não conseguiu falar com o banco de dados.                                        | Tente de novo. Se continuar, avise quem cuida do servidor.                                                       |
