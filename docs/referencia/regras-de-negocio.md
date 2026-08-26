# Regras de negócio

As decisões de produto que explicam por que o sistema se comporta como se
comporta. Cada regra vem em três partes: **o que o sistema faz**, **por que faz
assim** e **o que quebraria** se fizesse diferente.

A terceira parte é a que dá valor à página. Regra sem consequência declarada é
regra que alguém "simplifica" na primeira refatoração, de boa-fé, sem ter como
saber o que estava segurando.

!!! note "Esta página não substitui o `AGENTS.md`, e isso é de propósito"

    O [AGENTS.md](https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos/blob/main/AGENTS.md)
    descreve as mesmas regras para quem vai mexer no código: fala em campo,
    transação e chave estrangeira. Esta página fala em bancada, aparelho e
    balcão.

    São dois vocabulários para o mesmo conjunto de regras, e as duas versões
    precisam existir — quem opera o balcão não deve ter que ler um arquivo de
    instrução de código para entender por que um botão recusou. **Não tente
    unificar as duas.** Quando uma regra mudar, mudam as duas.

---

## Devolver é declarar, não é entregar

**O que o sistema faz.** Quando alguém toca em **Confirmar devolução** no
[portal](glossario.md#portal), o empréstimo sai de `ATIVO` e vai para
`AGUARDANDO_BAIXA`. O aparelho **não** volta a ficar disponível: ele continua
`EMPRESTADO` até a secretaria confirmar o recebimento no
[painel](glossario.md#painel).

**Por que faz assim.** Porque o tablet não tem como conferir nada. Ele registra
uma afirmação — "eu deixei o aparelho na [bancada](glossario.md#bancada)" — e
quem verifica se o aparelho está mesmo lá é uma pessoa, com o aparelho na mão.
A [baixa física](glossario.md#baixa-fisica) é essa verificação.

**O que quebraria.** O portal ofereceria a outra pessoa um equipamento que ainda
está em cima da bancada — ou que nunca chegou lá. A segunda pessoa faria a
retirada, iria buscar na prateleira e não acharia nada; e o sistema mostraria
duas pessoas com o mesmo aparelho, sem nenhum erro em lugar nenhum.

O intervalo entre os dois momentos tem nome: é o
[tempo de prateleira](glossario.md#tempo-de-prateleira).

---

## Cada item retirado é um empréstimo separado

**O que o sistema faz.** Quem leva um notebook e uma extensão na mesma ida ao
balcão gera **dois** registros, não um com dois itens.

**Por que faz assim.** Porque os dois aparelhos voltam em momentos diferentes.
Devolver a extensão hoje e ficar com o notebook até sexta é o caso comum, e não
a exceção.

**O que quebraria.** Uma devolução parcial não teria como ser registrada. A
pessoa devolveria um item e o sistema teria que escolher entre encerrar o
empréstimo inteiro (perdendo o notebook de vista) ou não encerrar nada (mantendo
a extensão fora de circulação). Na fila da secretaria, cada linha deixaria de ser
uma tarefa física com um aparelho e uma [etiqueta](glossario.md#etiqueta).

---

## Os três horários são três campos, e cada um tem um dono só

**O que o sistema faz.** Um empréstimo guarda três marcadores de tempo: a
retirada, a devolução declarada no tablet e a baixa conferida no painel. Um
nunca sobrescreve o outro.

**Por que faz assim.** Porque a diferença entre o segundo e o terceiro é a única
medida do gargalo operacional do sistema — quanto tempo o aparelho ficou parado
na bancada, fisicamente livre e invisível para quem queria pegá-lo.

**O que quebraria.** Se a baixa regravasse o horário da devolução, os dois
carimbos ficariam iguais e o tempo de prateleira daria **zero para sempre**. E
daria zero em silêncio: os registros continuariam certos, o relatório continuaria
somando, e o número apenas diria que não existe gargalo nenhum.

!!! info "A nota técnica dessa regressão mora na página da baixa física"

    Ela está em
    [Baixa física, §7](../painel/baixa-fisica.md#7-regras-que-nao-sao-obvias),
    num bloco recolhido, e não é repetida aqui — dizer a mesma coisa em dois
    lugares é como as duas versões passam a discordar.

---

## Aposentar um equipamento não é apagá-lo

**O que o sistema faz.** Um aparelho que sai de circulação para sempre vai para
`INATIVO`. Ele some do portal — inclusive das contagens de disponibilidade — e
continua na lista do inventário, em cinza, com um botão para reativar. Nenhuma
tela apaga equipamento.

**Por que faz assim.** Porque o histórico de empréstimos aponta para o aparelho.
Apagar o `NOTE-03` levaria junto o registro de quem o usou no semestre passado, e
com ele a resposta para "quem estava com este notebook quando a tela quebrou".

**O que quebraria.** O sistema perderia justamente a informação que a secretaria
procura quando um aparelho volta com defeito. Por isso o ícone da ação é um
círculo cortado e não uma lixeira: lixeira promete que o registro some, e ele não
some.

[Manutenção](glossario.md#manutencao) é o contrário — temporária, para conserto,
com volta de um clique.

---

## Categoria se apaga; equipamento e pessoa, nunca

**O que o sistema faz.** [Categoria](glossario.md#categoria) pode ser excluída de
verdade, mas só quando está vazia. Quem recusa a exclusão de uma categoria em uso
é o banco de dados, não a tela.

**Por que faz assim.** Nenhum empréstimo aponta para uma categoria — ela é só o
nome da prateleira. Já o equipamento e a pessoa são apontados pelo histórico, e
por isso a única saída para os dois é a inativação.

**O que quebraria.** Se a recusa morasse só na tela, um caminho que não passasse
por ela deixaria equipamentos apontando para uma categoria que não existe mais —
e eles sumiriam do portal inteiro, porque a grade é organizada por categoria.

!!! warning "A mensagem de recusa dá um conselho que não funciona"

    Ela manda inativar os equipamentos da categoria antes de excluí-la, e
    **isso não libera a exclusão**: o item inativo continua vinculado e o banco
    recusa igual. Como não existe tela que mova um equipamento de categoria, e
    equipamento nunca é apagado, **categoria com equipamento não é excluível
    pelo painel**.

    O comportamento real e a saída estão em
    [Gestão de inventário, §7](../painel/inventario.md#a-mensagem-manda-inativar-os-equipamentos-isso-libera-a-exclusao).
    A frase da tela é um defeito conhecido e ainda em aberto.

---

## Inativar pessoa e inativar equipamento não são a mesma regra

**O que o sistema faz.** Os dois campos têm o mesmo nome e regras opostas quanto
a empréstimo aberto:

| | Pessoa | Equipamento |
| --- | --- | --- |
| Inativar com empréstimo aberto | **Permitido**, com aviso | **Recusado** até o ciclo fechar |
| Efeito no portal | Entra, mas não retira | Some, inclusive das contagens |

**Por que faz assim.** Quem é inativado — trancou a matrícula, se formou, saiu da
instituição — quase sempre está com um aparelho na mochila. É exatamente o
momento em que a secretaria precisa inativar, e travar até a devolução deixaria o
cadastro apto a retirar mais coisas até alguém lembrar de voltar lá.

O equipamento é o oposto: mudar a situação dele no meio de um empréstimo aberto
criaria a inconsistência que a
[tabela cruzada](estados-e-transicoes.md#as-duas-ao-mesmo-tempo) marca como
impossível.

**O que quebraria.** Travar a inativação da pessoa produziria cadastros ativos
que ninguém quer ativos. Liberar a do equipamento produziria um aparelho "em
manutenção" que está na mão de alguém.

---

## O cadastro inativo pode devolver, e não pode retirar

**O que o sistema faz.** A matrícula de um
[cadastro inativo](glossario.md#cadastro-inativo-pessoa) entra normalmente no
portal. A lista "Meus equipamentos" aparece e funciona; a grade de categorias dá
lugar a uma explicação.

**Por que faz assim.** A assimetria é a regra inteira. Quem devolve não está
pedindo nada ao sistema — está entregando. Bloquear os dois lados transformaria a
inativação na garantia de que o equipamento nunca volta.

**O que quebraria.** O aparelho ficaria preso: fora de circulação no sistema,
dentro de uma mochila na rua, e sem nenhum gesto disponível para quem quisesse
devolvê-lo. A secretaria teria que reativar o cadastro só para deixar a pessoa
devolver, e depois lembrar de inativar de novo.

---

## A matrícula é texto, e corrigi-la leva o histórico junto

**O que o sistema faz.** A matrícula aceita **só dígitos, no máximo quinze**, e é
guardada como texto. Ela pode ser corrigida no painel, e os empréstimos daquela
pessoa acompanham a correção na mesma operação.

**Por que faz assim.** Guardada como número, `0012345` viraria `12345` — dois
cadastros diferentes para a mesma pessoa, e a matrícula do crachá deixaria de
funcionar no tablet. O limite de quinze dígitos e a recusa de letras vêm do
teclado do portal, que é numérico: a regra é a do consumidor mais restrito, e não
a da tela que cadastra.

**O que quebraria.** Uma validação mais frouxa no painel deixaria gravar uma
matrícula que **ninguém consegue digitar no tablet** — um cadastro que existe,
aparece nas listas e é inútil. E uma correção que não levasse o histórico junto
deixaria os empréstimos antigos apontando para uma matrícula que não existe mais.

---

## A importação mostra antes de escrever, e preserva o que a planilha não traz

**O que o sistema faz.** A importação de planilha tem uma prévia obrigatória, que
não grava nada, separando as linhas em quatro grupos: cadastrar, atualizar, sem
mudança e com erro. Na gravação, **coluna que o arquivo não trouxe é campo que o
banco preserva**.

**Por que faz assim.** A operação não tem desfazer, e um arquivo errado
sobrescreveria centenas de cadastros de uma vez. A prévia é a única chance de ver
o estrago antes de ele acontecer.

A preservação existe porque a planilha da coordenação não conhece tudo: ela não
traz a coluna de situação, por exemplo. Se a ausência valesse como "apague",
importar a lista de segunda-feira reativaria todos os cadastros que a secretaria
inativou na semana passada.

**O que quebraria.** Sem a prévia, um relatório depois do fato só contaria o
estrago. Sem a preservação, cada importação desfaria em silêncio o trabalho manual
feito no painel desde a anterior.

---

## O portal não tem login, e se fecha sozinho

**O que o sistema faz.** O portal não pede senha: a identificação é a
[matrícula](glossario.md#matricula), digitada a cada atendimento. Depois de dois
minutos sem nenhum toque, a tela volta para o começo.

**Por que faz assim.** O tablet fica na bancada e é compartilhado. Senha em
dispositivo compartilhado é senha que alguém escreve num papel colado atrás.

**O que quebraria.** Sem o encerramento automático, a próxima pessoa a chegar na
bancada encontraria a tela de outra — e conseguiria retirar equipamento no nome
dela, ou declarar uma devolução que não aconteceu.

!!! info "Isso vale só para o portal"

    O painel da secretaria exige login e senha individuais, e o comportamento
    dele está em [Conta do administrador](conta-do-administrador.md).

---

## Onde continuar

* O desenho completo das transições está em
  [Estados e transições](estados-e-transicoes.md).
* O vocabulário está no [Glossário](glossario.md).
* Cada regra aparece de novo, no contexto do gesto que a dispara, na seção 7
  das cinco páginas de processo.
