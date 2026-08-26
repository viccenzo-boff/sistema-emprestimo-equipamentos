# Conta do administrador

Cada pessoa que opera o [painel](glossario.md#painel) tem a sua conta, com login
e senha próprios. Não existe credencial compartilhada entre o balcão inteiro.

A razão é responsabilização: com uma credencial só, "quem deu baixa neste
equipamento?" não tinha resposta possível — para o sistema, todo mundo era a
mesma pessoa. O nome de quem está logado aparece no pé da barra lateral, ao lado
dos dois botões da conta.

## Entrar

1. Abra `/admin` no computador da secretaria.
2. Preencha **Usuário** e **Senha**.
3. Toque em **Entrar**.

O campo **Usuário** ignora maiúsculas e espaços em volta: `Secretaria` e
`secretaria` entram na mesma conta, e um espaço sobrando antes ou depois não
atrapalha. A senha, não — nela cada caractere conta, inclusive a caixa.

!!! info "A sessão dura oito horas, e sobrevive a reiniciar o servidor"

    Oito horas é um turno. Passou disso, o painel volta para a tela de entrada e
    a senha precisa ser digitada de novo.

    Reiniciar o computador da secretaria **não** derruba ninguém — quem foi
    desligado no fim do dia continua logado na manhã seguinte, se ainda estiver
    dentro das oito horas. Se o painel precisa ficar fechado, use **Sair do
    painel**; não basta fechar a janela.

## Sair

O botão **Sair do painel** fica no pé da barra lateral, embaixo do nome de quem
está logado. Ele encerra a sessão daquele navegador na hora e devolve a tela de
entrada.

É o gesto que fecha o turno. Um painel deixado aberto num computador de balcão dá
a quem sentar ali o inventário inteiro, a fila de devoluções e os cadastros.

## Trocar a própria senha

1. Toque em **Alterar senha**, no pé da barra lateral.
2. Preencha **Senha atual**, **Nova senha** e **Confirmar nova senha**.
3. Toque em **Alterar senha** no diálogo.

O aviso de sucesso nomeia a conta — "Senha da conta Secretaria alterada." — e o
diálogo fecha. São quatro contas e um computador só: sem o nome, a frase não
resolveria a dúvida de qual senha acabou de mudar.

**A senha nova precisa de pelo menos oito caracteres.** Não há exigência de
número nem de símbolo: cada regra a mais é uma forma a mais de a troca ser
recusada para quem está de pé no balcão, e não existe recuperação automática
quando alguém desiste no meio.

<a id="trocar-a-senha-derruba-as-outras-sessoes"></a>

!!! warning "Trocar a senha derruba a conta nos outros computadores"

    Quem estava logado com essa conta em outra máquina cai na tela de entrada na
    requisição seguinte. Na aba onde a troca foi feita, nada acontece — a pessoa
    continua exatamente onde estava.

    Isso não é efeito colateral: é a ferramenta. Trocar a senha é o gesto que
    expulsa quem ficou logado na máquina do turno anterior.

## O bloqueio por tentativas

**Cinco senhas erradas seguidas travam novas tentativas por um minuto.** Vale nos
dois lugares onde uma senha é conferida: a tela de entrada e o campo **Senha
atual** da troca.

Enquanto o bloqueio está de pé, **nem a senha certa passa** — a mensagem é
"Muitas tentativas seguidas." com os segundos que faltam. A saída é esperar; não
há como destravar pela tela.

Dois detalhes que evitam susto:

* **O bloqueio é por login digitado**, e não do painel inteiro. Alguém errando a
  senha no teclado não tranca as outras contas.
* **Errar a confirmação ou escolher uma senha curta não conta** como tentativa.
  Só a senha atual errada conta — o resto é engano de digitação, e contá-lo
  trancaria a pessoa fora da própria conta por desastre no teclado.

## O que este sistema não faz

Dito sem rodeio, porque são as três perguntas que aparecem primeiro:

* **Não há tela para cadastrar administrador.** As contas nascem pelo comando de
  semeadura do banco, no servidor. Nenhum botão do painel cria, edita ou apaga
  conta.
* **Não há papéis nem permissões.** Toda conta que entra vê e faz exatamente as
  mesmas coisas. Não existe conta "só de leitura".
* **Não há recuperação de senha por e-mail.** O sistema não envia mensagem
  nenhuma, e não guarda endereço de e-mail de administrador.

## Senha esquecida

O caminho de volta é **apagar a linha da conta no banco e semear de novo** — o
comando de semeadura recria a conta com a senha padrão, e a pessoa troca no
primeiro acesso.

Isso exige **acesso ao servidor da secretaria**, com as ferramentas de
desenvolvimento instaladas. Quem está no balcão não consegue fazer sozinho.

!!! note "Se ainda houver outra conta funcionando, o caminho é mais curto"

    Não há como uma conta trocar a senha de outra — mas quem ainda entra
    consegue seguir operando o painel enquanto o acesso ao servidor é
    providenciado. O trabalho do dia não para por causa de uma senha perdida.

O passo a passo do comando está na
[seção "Documentação" do CONTRIBUTING.md](https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos/blob/main/CONTRIBUTING.md)
do repositório, que é onde mora a nota de trabalho.

## Erros comuns e o que fazer

<!--
  A coluna da esquerda é citação literal de mensagem de tela, e a regra 1 do
  guia de estilo manda transcrevê-la com a grafia exata — é por essa frase que
  o leitor chega aqui. Uma delas diz "Informe o usuário e a senha.", com a
  palavra proibida em minúscula, e o Vale acusou (conferido: ele acusa mesmo).

  O escape vale para a tabela inteira, e não para a linha: comentário no meio
  de uma tabela a encerra no Python-Markdown, e o resto viraria parágrafo solto.
  A tabela inteira é do mesmo tipo de conteúdo — mensagem transcrita —, que é
  justamente o que a regra de vocabulário não tem como julgar.
-->
<!-- vale Vale.Avoid = NO -->

| Mensagem na tela | Causa | O que fazer |
| --- | --- | --- |
| "Usuário ou senha inválidos." | Um dos dois está errado. A frase é a mesma para os dois casos de propósito: dizer qual metade errou entrega a metade cara de descobrir. | Confira o teclado — maiúsculas e acento — e tente de novo. O campo **Usuário** ignora caixa; a senha não. |
| "Informe o usuário e a senha." | Um dos campos ficou em branco. | Preencha os dois. |
| "Muitas tentativas seguidas." | Cinco senhas erradas na mesma conta. | Aguarde os segundos que a mensagem indica. Nem a senha certa passa nesse intervalo. |
| "Nenhum administrador cadastrado." | O banco não tem nenhuma conta — instalação incompleta ou banco recriado. | Rode o comando de semeadura no servidor. A própria tela mostra qual é. |
| "Senha atual incorreta." | A senha digitada no primeiro campo do diálogo não é a atual. | Confira e tente de novo. Cinco erros aqui também bloqueiam por um minuto. |
| "A confirmação não bate com a nova senha." | Os dois campos de baixo estão diferentes. | Digite a nova senha igual nos dois. Isso **não** conta no bloqueio. |
| "A nova senha é igual à atual." | A senha escolhida é a que já está em uso. | Escolha outra. |
| "A nova senha precisa ter pelo menos 8 caracteres." | Senha curta demais. | Use oito ou mais. |
| "Sessão encerrada." em uma ação do painel | As oito horas acabaram, ou alguém trocou a senha desta conta em outro computador. | Entre de novo. Nada do que estava na tela foi gravado. |

<!-- vale Vale.Avoid = YES -->

## Onde continuar

* O que a secretaria faz depois de entrar está em
  [Baixa física](../painel/baixa-fisica.md),
  [Gestão de inventário](../painel/inventario.md) e
  [Gestão de pessoas](../painel/pessoas.md).
* O portal do tablet **não** tem login, e o motivo está em
  [Regras de negócio](regras-de-negocio.md#o-portal-nao-tem-login-e-se-fecha-sozinho).
