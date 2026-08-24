# Tarefa D13: CI de qualidade da documentação

O deploy automático nasceu na D02. Esta tarefa acrescenta as travas que impedem
a publicação de documentação quebrada. Ela vem perto do fim de propósito: ligar
linter antes de existir texto produz um CI vermelho que ninguém consegue
consertar e todo mundo aprende a ignorar.

## 1. Vale

Complete a configuração iniciada na D03.

* **Páginas em inglês:** estilo Microsoft completo.
* **Páginas em português:** apenas o vocabulário controlado da D03. Os estilos
  prontos do Vale são escritos para inglês e **não existe equivalente de
  qualidade para PT-BR** — a limitação está registrada na §6.1 da
  [spec-wiki.md](spec-wiki.md). Não tente aplicar o estilo Microsoft ao
  português; ele vai acusar centenas de falsos positivos e a equipe vai desligar
  o linter inteiro por causa disso.
* Ajuste o nível de severidade para que aviso não quebre o build, mas erro sim.

## 2. Verificador de links

* `lychee` sobre `docs/`, incluindo âncoras internas.
* Ignore explicitamente o que for esperado falhar (se houver), com comentário
  dizendo o porquê. Lista de exceção sem justificativa vira depósito.

## 3. Build estrito

O `mkdocs build --strict` entra como passo do CI. Ele já vinha sendo usado desde
a D02 na verificação manual; aqui vira obrigação automatizada.

## 4. Um workflow, ou dois?

Junte a qualidade ao workflow de publicação da D02, em jobs separados, com o
deploy dependendo da qualidade passar. Dois workflows independentes permitiriam
publicar documentação que não passou no linter — que é exatamente o que esta
tarefa existe para impedir.

## 5. Verificação

Cada item abaixo precisa ser provado com uma falha **de propósito**, e depois
desfeito:

* Link quebrado introduzido → o CI falha e aponta o arquivo e a linha.
* Termo proibido do vocabulário introduzido numa página em português (ex.:
  "usuário" falando de aluno) → o Vale acusa.
* Erro de estilo introduzido numa página em inglês → o Vale acusa.
* Referência a página inexistente no `nav` → o `--strict` falha.
* Com tudo desfeito, o CI passa inteiro em verde e o deploy acontece.

*Atenção: CI que nunca foi visto falhando não é CI verificado — é CI que talvez
não esteja rodando. Os cinco itens acima exigem provocar a falha e ver a
mensagem, não deduzir que funcionaria.*
