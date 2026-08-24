# Tarefa D11: Home e guias de início rápido

A home é escrita **depois** das páginas de processo, de propósito: só quem já
escreveu o conteúdo sabe para onde mandar o leitor. Home escrita primeiro vira
índice do que se pretendia fazer.

## 1. `docs/index.md` — a home

Estrutura, na ordem:

1. Uma frase dizendo o que o sistema é. Sem adjetivo.
2. **Escolha de perfil, logo no alto:** "Sou aluno ou professor" e "Sou da
   secretaria", cada um levando ao seu guia de início rápido. Essa bifurcação é
   a decisão de arquitetura de informação mais importante da wiki — quem opera o
   tablet nunca precisa abrir a trilha do painel.
3. Atalhos para as tarefas mais frequentes de cada trilha.
4. Aviso de versão: esta wiki documenta a `v1.0`. Declare isso na home, não só no
   seletor do `mike` — leitor não olha o seletor.
5. Onde pedir ajuda.

## 2. `docs/inicio-rapido/aluno-professor.md`

O tablet em cinco minutos. Público: alguém em pé na bancada, com pressa.

* Retirar um equipamento — o essencial, com link para a página completa da D05.
* Devolver — com o aviso de deixar o aparelho na bancada.
* As três dúvidas mais prováveis: matrícula não encontrada, cadastro inativo, e
  "devolvi e o sistema ainda mostra o item comigo".

A terceira é a mais importante da página. Ela é a manifestação, para o usuário
final, da regra das duas fases — e é a pergunta que a secretaria mais vai
receber.

## 3. `docs/inicio-rapido/secretaria.md`

O painel em dez minutos. Público: alguém que assumiu a função esta semana.

* Entrar no painel.
* A rotina diária: conferir a fila e dar baixa.
* Cadastrar equipamento; importar pessoas.
* As duas confusões prováveis, ditas lado a lado: inativar **pessoa** é
  permitido com empréstimo aberto; inativar **equipamento** trava até o ciclo
  fechar.

Cada item com link para a página completa. O guia rápido não repete o passo a
passo — ele orienta e encaminha.

## 4. Verificação

* `mkdocs build --strict` em 0 aviso.
* A escolha de perfil aparece **acima da dobra** em janela de 1366x768.
* Todo link da home e dos dois guias resolve.
* Os guias rápidos não duplicam passo a passo das páginas completas — se
  duplicaram, encurte e linke.
* A declaração de versão está visível na home.
* **Teste de caminho:** partindo da home, chega-se a qualquer uma das cinco
  páginas de processo em no máximo dois cliques. Se alguma exigir três, a home
  ou o `nav` precisa mudar.
