# Glossário

Os termos que atravessam mais de um processo desta wiki. Quando o termo tem um
correspondente técnico — um campo ou um status do banco de dados —, ele vem
entre parênteses, para quem precisar ligar a palavra da tela ao dado gravado.

Termo que só aparece em uma página mora no glossário daquela página.

## Administrador

Quem opera o [painel](#painel) da secretaria. Cada pessoa tem a sua conta, com
login e senha próprios — não existe senha compartilhada.

O campo de login chama-se **Usuário** na tela de entrada
(`Administrador.usuario`). É o único sentido em que a palavra **Usuário**
aparece neste sistema: ela nunca se refere a quem retira equipamento.

Não há tela para cadastrar administrador. As contas nascem pelo comando de
semeadura do banco, e recuperar senha esquecida se faz pelo mesmo caminho.

## Aposentadoria (item inativo)

A saída definitiva de um equipamento de circulação, **sem apagá-lo**
(`Equipamento.status = INATIVO`).

O item deixa de aparecer no [portal](#portal) — nem nas contagens de
disponibilidade entra — e continua na lista do inventário, em cinza, com um
botão para reativar.

Equipamento não é apagado porque o histórico de [empréstimos](#emprestimo)
aponta para ele: excluir o aparelho levaria junto o registro de quem o usou no
semestre passado. Por isso o ícone da ação é um círculo cortado, e não uma
lixeira — lixeira promete que o registro some, e ele não some.

[Manutenção](#manutencao) é o contrário: temporária, e para conserto.

## Baixa física

A conferência da secretaria: o equipamento foi recolhido da bancada e o
[empréstimo](#emprestimo) está encerrado de verdade (`Emprestimo.status`
passa de `AGUARDANDO_BAIXA` para `CONCLUIDO`, e a hora fica em
`Emprestimo.data_baixa`).

É aqui — e só aqui — que o equipamento volta a ficar disponível para outra
pessoa retirar. A [devolução](#devolucao) no tablet não faz isso.

## Bancada

O balcão físico onde o equipamento é entregue e recolhido. Não é uma tela nem um
campo do sistema — é o único lugar do processo que o sistema **não** consegue
verificar.

É a ela que a [devolução](#devolucao) se refere: quem devolve deixa o aparelho na
bancada e avisa no tablet. Entre esse gesto e a [baixa física](#baixa-fisica), o
aparelho está na bancada e em lugar nenhum do inventário — é o
[tempo de prateleira](#tempo-de-prateleira).

## Cadastro inativo (pessoa)

Um cadastro que saiu de circulação — quem trancou a matrícula, quem se formou,
quem deixou a instituição (`Pessoa.status = INATIVO`).

A regra é **assimétrica de propósito**: o cadastro inativo **não pode retirar**
e **pode devolver**. Quem foi inativado costuma estar com um aparelho na
mochila; travar os dois lados faria a inativação garantir que o equipamento
nunca voltasse.

Na prática: a matrícula entra normalmente no [portal](#portal), e a grade de
[categorias](#categoria) dá lugar a uma explicação.

Cadastro também nunca é apagado, pelo mesmo motivo da
[aposentadoria](#aposentadoria-item-inativo): o histórico aponta para ele.

## Categoria

O grupo em que o inventário é organizado e que o [portal](#portal) mostra em
grade: "Notebook", "Tablet", "Extensão" (`Categoria.nome`).

O nome é único — é o banco que impede duas grafias da mesma coisa convivendo no
mesmo armário. Categoria só pode ser excluída quando está vazia.

## Devolução

A **declaração** de quem devolve: a pessoa avisa no tablet que entregou o
equipamento e o deixou na bancada (`Emprestimo.status` passa de `ATIVO` para
`AGUARDANDO_BAIXA`, e a hora fica em `Emprestimo.data_devolucao`).

Devolver **não** libera o equipamento para outra pessoa. Quem faz isso é a
[baixa física](#baixa-fisica), na secretaria. A diferença entre os dois
momentos é o [tempo de prateleira](#tempo-de-prateleira).

## Emprestado

A [situação](#situacao) de um equipamento que está fora da prateleira porque
alguém o retirou (`Equipamento.status = EMPRESTADO`).

O que não é óbvio: **ele continua `EMPRESTADO` depois da
[devolução](#devolucao)**. Declarar a devolução no tablet muda o
[empréstimo](#emprestimo), não o aparelho — quem devolve o aparelho à prateleira
é a [baixa física](#baixa-fisica).

`EMPRESTADO` não é um botão do [painel](#painel): ele entra e sai sozinho, pelos
dois gestos que envolvem alguém carregando o equipamento. A linha de um item
emprestado mostra o nome de quem está com ele no lugar do botão.

## Empréstimo

O registro de um equipamento na mão de uma pessoa, com as horas de
[retirada](#retirada), de [devolução](#devolucao) e de
[baixa física](#baixa-fisica) (`Emprestimo`).

**Cada item gera um empréstimo separado.** Quem leva um notebook e uma extensão
na mesma ida ao balcão tem dois empréstimos, que podem ser devolvidos em
momentos diferentes.

Um empréstimo passa por três situações: `ATIVO` (está com a pessoa),
`AGUARDANDO_BAIXA` (foi declarado devolvido, aguarda a secretaria) e
`CONCLUIDO` (encerrado).

## Empréstimos ativos

A aba do [painel](#painel) que lista tudo o que está com alguém agora — os
empréstimos em `ATIVO`, com o nome de quem está com o aparelho e desde quando.

É **somente leitura**: não há botão nenhum nela. Quem devolve é a pessoa, no
[portal](#portal); quem encerra é a [baixa física](#baixa-fisica), na
[fila de devoluções](#fila-de-devolucoes). Esta aba responde "onde está o
`NOTE-04`?", e nada mais.

## Etiqueta

O código colado no aparelho, como `NOTE-01` ou `EXT-05` (`Equipamento.id`). É o
que identifica o item físico — dois notebooks do mesmo modelo têm etiquetas
diferentes.

A etiqueta aparece na tela sempre inteira e em fonte monoespaçada, porque ela
precisa bater caractere a caractere com o adesivo do aparelho.

## Fila de devoluções

A lista de empréstimos que estão em `AGUARDANDO_BAIXA`, esperando a
[baixa física](#baixa-fisica). É a primeira tela do [painel](#painel), e cada
linha é uma tarefa física: pegar o aparelho da bancada e conferir a
[etiqueta](#etiqueta).

## Inventário

Todo o equipamento cadastrado, uma linha por aparelho, agrupado por
[categoria](#categoria) — e a aba do [painel](#painel) que o mostra.

O inventário lista **tudo**, inclusive o que está em
[manutenção](#manutencao), o que está [emprestado](#emprestado) e o que foi
[aposentado](#aposentadoria-item-inativo). É a diferença dele para o
[portal](#portal), que só mostra o que dá para levar agora.

## Lote

Um gesto que trata vários itens de uma vez. Existem dois, e eles se comportam de
forma diferente de propósito:

* **"Devolver tudo"**, no [portal](#portal): tudo ou nada. Os aparelhos vão
  juntos para a [bancada](#bancada), e devolver metade faria a pessoa sair
  achando que entregou tudo.
* **"Confirmar Todas as Devoluções"**, no [painel](#painel): item a item, e uma
  linha que falha não derruba as outras. O gesto físico já aconteceu — a
  secretaria recolheu a pilha —, e uma linha que saiu da fila em outra aba não
  pode desfazer a conferência das demais. O resumo diz o que fechou e o que não
  fechou.

Os dois só aparecem **a partir de dois itens**. Com um só, cada um duplicaria o
botão da linha logo abaixo.

## Manutenção

O afastamento **temporário** de um equipamento para conserto
(`Equipamento.status = MANUTENCAO`). O item some do [portal](#portal) e volta
com um clique quando o conserto termina.

Diferente da [aposentadoria](#aposentadoria-item-inativo), que é definitiva.

Equipamento com [empréstimo](#emprestimo) aberto não pode ir para manutenção: a
situação dele fica travada até o ciclo fechar.

## Matrícula

O número que identifica a pessoa no sistema, e a chave de tudo que ela faz: é o
que se digita na primeira tela do [portal](#portal) (`Pessoa.matricula`).

Só aceita dígitos, no máximo quinze, porque é isso que o teclado do tablet
consegue digitar. É guardada como texto — os zeros à esquerda contam, e
`0012345` não é o mesmo que `12345`.

A matrícula pode ser corrigida no [painel](#painel), e a correção leva o
histórico de empréstimos junto.

## Painel

A tela da secretaria, no computador, em `/admin`. Exige login de
[administrador](#administrador).

Reúne a [fila de devoluções](#fila-de-devolucoes), os empréstimos ativos, o
inventário, as categorias e os cadastros de pessoas.

## Perfil

O que a pessoa é na instituição: **Estudante** ou **Professor**
(`Pessoa.perfil`).

É o único campo do banco gravado exatamente na forma em que aparece na tela.
Serve para filtrar e contar cadastros no [painel](#painel); não muda o que a
pessoa pode retirar.

## Portal

A tela do tablet da bancada, em `/`. É por onde estudante e professor fazem a
[retirada](#retirada) e a [devolução](#devolucao).

Não tem login: a identificação é a [matrícula](#matricula), digitada a cada
uso. O tablet é compartilhado, então a sessão é encerrada ao fim de cada
atendimento.

## Retirada

O momento em que a pessoa leva o equipamento (`Emprestimo.data_retirada`, com o
equipamento passando para `EMPRESTADO`).

O caminho é matrícula → [categoria](#categoria) → item → confirmação. Só
aparecem itens disponíveis, e só para cadastro ativo.

## Sessão

O período em que a tela sabe com quem está falando. As duas frentes do sistema
tratam isso de forma oposta:

* **No [portal](#portal)** não há login: a sessão começa quando a
  [matrícula](#matricula) é digitada e termina no botão **Sair** ou sozinha,
  depois de dois minutos sem nenhum toque. O tablet é compartilhado, e uma tela
  esquecida aberta deixaria a próxima pessoa retirar equipamento em nome de
  outra.
* **No [painel](#painel)** a sessão vem do login do
  [administrador](#administrador) e dura oito horas — um turno. Ela sobrevive a
  reiniciar o computador, e é encerrada pelo botão **Sair do painel**.

## Situação

A coluna que diz onde algo está na vida dele. **A palavra tem dois donos**, e o
que ela quer dizer depende da tela:

| Onde | Valores possíveis |
| --- | --- |
| Aba **Inventário** — de um equipamento | **Disponível**, **Emprestado**, **Manutenção** ou **Inativo** |
| Aba **Pessoas** — de um cadastro | **Ativo** ou **Inativo** |

Os dois **Inativo** têm o mesmo nome e regras diferentes: no equipamento é
[aposentadoria](#aposentadoria-item-inativo) e trava enquanto houver empréstimo
aberto; na pessoa é [cadastro inativo](#cadastro-inativo-pessoa), é permitido com
empréstimo aberto, e bloqueia só a [retirada](#retirada).

O passeio completo entre as situações está em
[Estados e transições](estados-e-transicoes.md).

## Tempo de prateleira

O intervalo entre a [devolução](#devolucao) declarada no tablet e a
[baixa física](#baixa-fisica) feita na secretaria — o tempo em que o aparelho
ficou parado na bancada, invisível para o portal e para o inventário.

É a medida do gargalo operacional do sistema: enquanto ele existe, há
equipamento fisicamente livre que ninguém consegue pegar.
