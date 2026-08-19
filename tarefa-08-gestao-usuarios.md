# Tarefa 08: Gestão de Usuários e Importação Inteligente de Excel

Esta tarefa visa criar a tela `/admin/usuarios` para o gerenciamento de estudantes e professores. O grande foco é a importação robusta de planilhas nativas do Excel (`.xlsx`) com regras de atualização parcial (Partial Updates).

## 1. Atualização do Banco de Dados (Prisma)
* **Tabela `Usuario`:**
  * Adicione o campo `status` (String) com valor padrão "ATIVO". Aceita "ATIVO" ou "INATIVO".
* **Regra de Integridade (Cascade):**
  * Na relação entre `Emprestimo` e `Usuario`, garanta que a foreign key `usuario_id` possui `onUpdate: Cascade`. Isso garante que correções ortográficas na matrícula não quebrem o histórico.
* Rode a migration localmente antes de codificar a UI.

## 2. Leitura Nativa de Excel (.xlsx)
* Instale e utilize a biblioteca `xlsx` (SheetJS) para processar o upload do arquivo no padrão `.xlsx`. 
* Não exija a conversão para CSV. O usuário fará upload do arquivo Excel direto.

## 3. Lógica de Importação Inteligente (Upsert e Partial Update)
A planilha pode conter as seguintes colunas (não sensíveis a maiúsculas/minúsculas nos cabeçalhos): `matricula`, `nome`, `perfil`, `cursos`, `status`.

A importação deve processar linha a linha utilizando a `matricula` como chave principal, seguindo as seguintes regras estritas:

* **Cenário A - Atualização Parcial (Ex: Apenas Inativar):**
  * Se a planilha tiver apenas a coluna `matricula` preenchida e a coluna `status` como "INATIVO" (ou "inativo").
  * O sistema deve procurar o usuário. Se ele existir, atualize SOMENTE o status para "INATIVO". Preserve o nome, perfil e cursos existentes no banco.

* **Cenário B - Atualização de Dados (Ignorando Status):**
  * Se a planilha possuir as colunas de dados preenchidas, mas a coluna `status` não existir no arquivo ou estiver vazia na linha.
  * O sistema atualiza o nome, perfil e cursos, MAS preserva o status que o usuário já possui no banco de dados.

* **Cenário C - Criação de Novo Usuário:**
  * Se a `matricula` não existir no banco de dados.
  * O sistema exige que as colunas obrigatórias (`nome`, `perfil` e `cursos`) estejam preenchidas na linha para realizar a criação.
  * Se o `status` não for informado na linha da planilha durante a criação, o sistema assume o padrão "ATIVO". Se vier escrito "INATIVO" na linha, cadastre o usuário já como "INATIVO".

## 4. Interface de Gerenciamento (`/admin/usuarios`)
* Crie a página com duas áreas principais:
  1. **Área de Upload:** Um *dropzone* ou botão de upload simples exclusivo para arquivos `.xlsx`.
  2. **Tabela de Usuários:** Lista todos os cadastros.
* **Filtros na Tabela:** Barra de pesquisa (nome/matrícula) e selects para filtrar por Perfil e Status.
* **Ações Rápidas na Tabela:**
  * **Editar:** Abre um Modal para edição manual completa dos dados.
  * **Toggle Status:** Um botão diretamente na linha da tabela para Ativar/Inativar o usuário rapidamente com 1 clique (para evitar abertura de modais na manutenção do dia a dia).