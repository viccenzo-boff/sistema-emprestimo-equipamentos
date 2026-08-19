# Tarefa 09: Download de Planilha Modelo (Template)

Esta tarefa visa melhorar a experiência do usuário (UX) na tela de gerenciamento de usuários (`/admin/usuarios`), adicionando a opção de baixar uma planilha base vazia, contendo apenas os cabeçalhos corretos para a importação.

## 1. UI/UX: Botão de Download
* **Localização:** Dentro do card "Importar planilha", logo abaixo do texto explicativo e imediatamente acima da área pontilhada (dropzone) de upload.
* **Componente:** Crie um botão secundário (ex: estilo outline/borda) contendo um ícone de download e o texto: "Baixar planilha modelo".
* **Comportamento:** O botão deve ser perfeitamente visível, mas ter peso visual ligeiramente inferior ao de uma ação primária, para não confundir o usuário.

## 2. Geração do Arquivo (Lógica)
* Ao clicar no botão, o sistema deve gerar e baixar automaticamente um arquivo chamado `modelo_importacao_usuarios.xlsx`.
* O arquivo NÃO deve conter dados de exemplo (linhas em branco), apenas a primeira linha de cabeçalho.
* **Colunas Exigidas (exatamente nesta ordem e formatação):**
  1. `matricula`
  2. `nome`
  3. `perfil`
  4. `cursos`
  5. `status`
* **Implementação Técnica:** Como a biblioteca `xlsx` (SheetJS) já está instalada no projeto, utilize-a para criar uma *worksheet* em memória contendo apenas este array de cabeçalhos e force o download no navegador do cliente (Client-side) de forma rápida e sem recarregar a página.