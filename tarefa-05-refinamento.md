# Tarefa 05: Refinamento de UI/UX e Correção de Bugs

Esta tarefa contém melhorias de usabilidade e correções de bugs identificados após testes no MVP. Você deve ler este arquivo e aplicar as correções abaixo.

## 1. Correção UI: Tela de Login Admin (`/admin`)
* **Problema:** O card/container de login está muito largo ("esticado") e, quando uma mensagem de erro (ex: "Senha incorreta") aparece, ela empurra o botão "Entrar" para baixo, forçando o usuário a rolar a tela.
* **Solução:** 
  * Reduza a largura máxima (max-width) do card de login para deixá-lo mais quadrado e centralizado.
  * Garanta que o layout tenha espaço suficiente para a mensagem de erro sem empurrar o botão para fora da tela visível (sem precisar de scroll).

## 2. Correção Bug: Seletor de Categoria no Inventário
* **Problema:** No painel de Inventário, ao cadastrar um novo equipamento, o campo "Categoria" está se comportando como um input de texto problemático. Se o usuário seleciona "Notebook", ele não consegue abrir a lista novamente para trocar para "Tablet" sem antes apagar a palavra "Notebook" manualmente.
* **Solução:** 
  * Altere este componente. Transforme-o em um `<select>` HTML padrão (estilizado com Tailwind) ou em um componente de dropdown simples onde clicar nele sempre abre as opções, permitindo a troca com 1 clique, sem precisar apagar o texto.

## 3. Nova Funcionalidade UX: Botão "Devolver Tudo" (Secretaria)
* **Local:** Painel Admin (`/admin`) -> Aba "Fila de Devoluções".
* **Problema:** Se houver 5 equipamentos aguardando baixa na bancada, a secretária precisa clicar em 5 botões individuais.
* **Solução:** 
  * Adicione um botão "Confirmar Todas as Devoluções" no topo da lista.
  * Ao clicar neste botão, o sistema deve executar a ação de conclusão (mudar log para `CONCLUIDO` e equipamento para `DISPONIVEL`) para **todos** os itens que estão na tela no status `AGUARDANDO_BAIXA`.

## 4. Nova Funcionalidade UX: Botão "Devolver Tudo" (Estudante/Tablet)
* **Local:** Portal de Retirada (`/`) -> Área "Meus Equipamentos" (após digitar a matrícula).
* **Problema:** Se o aluno pegou múltiplos itens, ele tem que clicar em devolver um por um.
* **Solução:** 
  * Adicione um botão "Devolver Tudo" acima da lista dos equipamentos dele.
  * Ao clicar, exiba o mesmo Modal de alerta ("Atenção: Deixe o equipamento na bancada...").
  * Ao confirmar, mude o status de **todos** os itens daquele aluno (que estão `ATIVO`) para `AGUARDANDO_BAIXA` de uma só vez.

## 5. Correção UI: Consistência da Logo no Login Admin (`/admin`)
* **Problema:** A logo da instituição dentro do card de login do painel administrativo está distorcida (esticada) e quebra o padrão visual estabelecido no sistema.
* **Solução:** 
  * Remova a logo de dentro do card branco de login.
  * Posicione a logo no canto superior esquerdo da tela de fundo, mantendo exatamente o mesmo tamanho, proporção nativa (sem distorcer) e espaçamento (padding/margem) que foram utilizados no cabeçalho do portal de retirada de equipamentos (rota `/`).