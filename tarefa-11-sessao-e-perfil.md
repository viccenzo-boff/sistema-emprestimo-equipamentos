# Tarefa 11: Controle de Sessão e Gestão de Perfil do Admin

Esta tarefa foca em resolver a usabilidade operacional de múltiplos administradores dividindo o mesmo computador, além de permitir que alterem suas senhas padrão de forma segura.

## 1. Funcionalidade de Logout (Sair)
* **UI:** No painel administrativo (`/admin`), no menu lateral esquerdo (geralmente na parte inferior), garanta que exista um botão claro de "Sair" ou "Logout" acompanhado do nome do administrador logado.
* **Lógica (Server Action):** Ao clicar neste botão, o sistema deve destruir/limpar o cookie de sessão atual e redirecionar o usuário imediatamente para a tela de login (`/admin`).

## 2. Funcionalidade: Alterar Senha (Meu Perfil)
* **UI:** Próximo ao botão de "Sair" no menu lateral, adicione um botão "Alterar Senha" ou "Meu Perfil".
* **Comportamento:** Ao clicar, deve abrir um Modal sobreposto à tela atual.
* **Campos do Modal:**
  * "Senha Atual" (input type password)
  * "Nova Senha" (input type password)
  * "Confirmar Nova Senha" (input type password)
* **Lógica de Validação (Server Action):**
  * Verifique se "Nova Senha" e "Confirmar Nova Senha" são idênticas.
  * Busque o Administrador logado no banco de dados.
  * Utilize `bcryptjs.compare` para verificar se a "Senha Atual" informada bate com o hash salvo no banco.
  * Se tudo estiver correto, gere o hash da "Nova Senha" usando `bcryptjs.hash` e atualize o registro do administrador no banco de dados.
  * Exiba uma notificação de sucesso (Toast/Alerta) e feche o modal. Se houver erro (senha atual incorreta), exiba a mensagem de erro apropriada no modal.