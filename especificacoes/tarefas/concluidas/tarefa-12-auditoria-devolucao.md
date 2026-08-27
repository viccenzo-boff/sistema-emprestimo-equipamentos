# Tarefa 12: Auditoria de Baixa Física (Tempo de Prateleira)

Esta tarefa adiciona um novo marcador temporal no banco de dados para medir o gargalo operacional entre o momento em que o aluno devolve o equipamento no tablet e o momento em que a secretaria recolhe fisicamente e dá a baixa no sistema.

## 1. Atualização do Banco de Dados (Prisma)
* **Model `Emprestimo`:** 
  * Adicione um novo campo opcional chamado `data_baixa` (DateTime?).
  * O schema atual já possui `data_retirada` (quando o aluno pega) e `data_devolucao` (quando o aluno clica em devolver no tablet). Este novo campo será o terceiro marcador temporal.
* **Ação:** Gere e aplique a migração no SQLite de desenvolvimento.

## 2. Atualização da Lógica de Negócio (Server Actions)
* Vá até a Server Action responsável por processar o "Confirmar Recebimento Físico" na aba de "Fila de Devoluções" do Painel Administrativo.
* Ao mudar o status do `Emprestimo` para `CONCLUIDO`, o sistema deve preencher o campo `data_baixa` com o timestamp atual (`new Date()`).
* Certifique-se de que a lógica anterior (que preenchia `data_devolucao` quando o status ia para `AGUARDANDO_BAIXA` no portal do tablet) permaneça inalterada.