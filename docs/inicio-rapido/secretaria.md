# Guia de Início Rápido — Secretaria

O painel abre no computador da secretaria e tem cinco abas. Uma delas tem prazo
— a **Fila de Devoluções**, que é onde ficam os aparelhos já entregues na
bancada e ainda não conferidos. As outras quatro são consulta e manutenção.

Esta página é o essencial. Cada trecho manda para a página completa do processo,
com as telas e a lista de mensagens de erro.

## Entrar no painel

1. Abra o painel no computador da secretaria.
2. Digite o seu login no campo **Usuário**.
3. Digite a sua senha no campo **Senha**.
4. Clique em **Entrar**.

Cada pessoa tem a sua conta, e o nome de quem entrou fica no pé da barra
lateral. Se as contas ainda estiverem com a senha inicial, troque antes de usar
no balcão: o botão **Alterar senha** fica ao lado do nome.

[Conta do administrador](../referencia/conta-do-administrador.md) — entrar,
sair, trocar a senha, e o que fazer quando ninguém lembra dela.

## A rotina diária: conferir a fila e dar baixa

Esta é a única tarefa do painel que tem prazo. Enquanto um aparelho está na
fila, ele está fisicamente na bancada e **não** é oferecido a mais ninguém no
tablet — quem devolveu já foi embora, e a próxima pessoa que precisa de um
notebook não enxerga aquele.

1. Abra a aba **Fila de Devoluções**.
2. Leia a linha do aparelho que você tem em mãos.
3. Pegue o aparelho na bancada.
4. Confira a etiqueta do adesivo contra a da linha, caractere por caractere.
5. Clique em **Confirmar Recebimento Físico**, na linha daquele aparelho.
6. Guarde o aparelho na prateleira.

Com a bancada inteira em mãos, o botão **Confirmar Todas as Devoluções**, no
alto da lista, faz as linhas de uma vez. Ele aparece a partir de dois aparelhos.

!!! warning "Confirmar é dizer que o aparelho está na sua mão"

    A confirmação encerra o empréstimo e devolve o aparelho ao estoque na mesma
    hora — o tablet passa a oferecê-lo. **Não existe tela que reabra um
    empréstimo encerrado.** Se você confirmar uma linha cujo aparelho não está
    na bancada, o sistema passa a dizer que ele está na prateleira, e ninguém
    mais tem motivo para procurá-lo.

    É por isso que o passo 4 existe: conferir a etiqueta é mais barato que
    qualquer um dos caminhos de volta.

[Processo 3 — Baixa física](../painel/baixa-fisica.md), com as telas de cada
passo, o lote e o que fazer em cada mensagem de erro.

## Cadastrar um equipamento

1. Cole o adesivo no aparelho, se ele ainda não tiver um.
2. Abra a aba **Inventário**.
3. Digite no campo **Etiqueta** exatamente o que está escrito no adesivo.
4. Escolha a categoria no campo **Categoria**.
5. Clique em **Cadastrar**.

A lista de categorias vem da aba **Categorias**, e é o único lugar que cria uma
categoria nova — o link **Gerenciar**, ao lado do rótulo, leva direto até lá. É
assim de propósito: dois lugares criando categoria é como nascem "notebook" e
"Notebook" no mesmo armário.

[Processo 4 — Gestão de inventário](../painel/inventario.md), com os cinco
procedimentos da aba: cadastrar, mandar para manutenção, aposentar, trocar a
etiqueta e cuidar das categorias.

## Importar a planilha de pessoas

1. Abra a aba **Pessoas**.
2. Clique na área pontilhada e escolha o arquivo.
3. Clique em **Analisar planilha**.
4. Leia os quatro contadores e a lista **O que vai mudar**.
5. Clique em **Confirmar importação**.

O passo 3 **não grava nada** — ele lê o arquivo, compara com o que já está no
banco e mostra o que vai acontecer. A prévia existe porque a importação não tem
desfazer: um arquivo errado confirmado sobrescreve centenas de cadastros, e um
relatório depois do fato só contaria o estrago.

Se você ainda não tem o arquivo no formato certo, o botão **Baixar planilha
modelo**, no mesmo cartão, gera a planilha com as colunas que o painel espera.

[Processo 5 — Gestão de pessoas](../painel/pessoas.md), com a planilha modelo, a
prévia campo a campo, a edição de cadastro e a troca de matrícula.

## As duas inativações não são a mesma regra

É a confusão mais provável dos primeiros dias, porque o botão tem o mesmo nome
nas duas abas e o comportamento é oposto:

| | **Inativar uma pessoa** | **Inativar um equipamento** |
| --- | --- | --- |
| Com empréstimo aberto | **Permitido**, com um aviso que nomeia os aparelhos | **Bloqueado**: no lugar dos botões, a linha diz "Situação travada até a devolução" |
| O que a inativação impede | Retirar. Devolver continua liberado | Ser oferecido no tablet; o item some até das contagens |
| Como desfazer | Botão **Ativar**, um clique | Botão **Reativar**, e ele volta como **Disponível** |
| O registro é apagado? | Nunca | Nunca |

A razão da diferença cabe em uma frase: **quem sai leva o aparelho junto; o
aparelho não sai sozinho.**

Inativa-se justamente a pessoa que saiu da instituição — e ela quase sempre está
com algo na mochila. Travar a inativação até ela devolver deixaria o cadastro
ativo, apto a retirar mais, até alguém lembrar de voltar nele. Por isso a
inativação passa, e a devolução dela continua liberada no tablet.

O equipamento é o contrário: aposentar um aparelho que está na mão de alguém
criaria um empréstimo aberto apontando para um item que o sistema considera fora
de circulação. O ciclo fecha primeiro; a aposentadoria vem depois.

Nos dois casos o registro **não** é apagado, e isso também é de propósito: o
histórico de empréstimos aponta para a pessoa e para o aparelho, e um `DELETE`
levaria junto o semestre passado. Inativar é aposentadoria, não exclusão.

[Regras de negócio](../referencia/regras-de-negocio.md#inativar-pessoa-e-inativar-equipamento-nao-sao-a-mesma-regra)
— esta e as outras nove, com o porquê de cada uma.

## Se algo der errado

Cada processo tem a sua tabela de erros, com a mensagem exata da tela:
[baixa física](../painel/baixa-fisica.md#8-erros-comuns-e-o-que-fazer),
[inventário](../painel/inventario.md#8-erros-comuns-e-o-que-fazer) e
[pessoas](../painel/pessoas.md#8-erros-comuns-e-o-que-fazer).

Boa parte do que parece defeito é regra deliberada — a contagem que não sobe
depois de uma devolução, a categoria que não deixa ser excluída, o cadastro que
não some da lista. As
[regras de negócio](../referencia/regras-de-negocio.md) e os
[estados e transições](../referencia/estados-e-transicoes.md) explicam cada uma.
