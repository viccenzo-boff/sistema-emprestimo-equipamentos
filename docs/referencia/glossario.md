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

## Tempo de prateleira

O intervalo entre a [devolução](#devolucao) declarada no tablet e a
[baixa física](#baixa-fisica) feita na secretaria — o tempo em que o aparelho
ficou parado na bancada, invisível para o portal e para o inventário.

É a medida do gargalo operacional do sistema: enquanto ele existe, há
equipamento fisicamente livre que ninguém consegue pegar.
