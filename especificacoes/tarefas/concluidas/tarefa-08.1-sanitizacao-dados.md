# Tarefa 08.1: Sanitização e Normalização de Dados (Importação)

Esta tarefa adiciona uma camada de inteligência na importação da planilha Excel (`.xlsx`) para garantir a consistência e integridade dos dados no banco, aplicando regras estritas de formatação e mapeamento de sinônimos, evitando duplicação de filtros.

## 1. Arquitetura da Solução
* Crie um arquivo utilitário dedicado para isso, por exemplo: `src/lib/sanitizacao.ts`.
* Todas as funções de limpeza devem ser chamadas na Server Action de importação, **antes** de enviar os dados para o Prisma (Upsert/Create/Update).

## 2. Regra 1: Normalização de Nomes
* **Ação:** O nome da pessoa deve ser sempre formatado em "Title Case" (Primeira Letra Maiúscula).
* **Tratamento:** 
  * Converter "NOME DO ALUNO", "nome do aluno", "nome-do-aluno" ou qualquer variação para "Nome Do Aluno".
  * Remover caracteres especiais indesejados (ex: @, #, $, números no meio do nome), mantendo apenas letras, espaços e acentos válidos do português.
  * Remover espaços duplos ou espaços sobrando no início/fim (trim).

## 3. Regra 2: Normalização de Perfil (Estudante/Professor)
* O banco de dados deve armazenar estritamente: "Estudante" ou "Professor".
* **Mapeamento Inteligente:**
  * Se a planilha vier com: "Aluno", "Alunos", "Estudantes", "estudante" ou qualquer variação -> Converter para **"Estudante"**.
  * Se a planilha vier com: "Docente", "Docentes", "Prof", "Professores" ou qualquer variação -> Converter para **"Professor"**.
  * Se vier algo irreconhecível, defina um fallback (padrão) seguro ou rejeite a linha.

## 4. Regra 3: Normalização e Ordenação de Cursos
* O sistema deve reconhecer siglas e variações e convertê-las para a nomenclatura oficial.
* **Mapeamento:**
  * "SI", "Sistema de Informação", "sistemas de informacao", "sistema-informação" ou qualquer variação -> **"Sistemas de Informação"**
  * "CC", "Ciencia da Computacao", "ciências da computação" ou qualquer variação -> **"Ciências da Computação"**
  * "EC", "Engenharia da Computacao", "engenharia-computação" ou qualquer variação -> **"Engenharia da Computação"**
* **Ordenação Obrigatória:** Se um usuário pertencer a múltiplos cursos, a string final salva no banco deve SEMPRE seguir esta ordem hierárquica, separada por vírgula e espaço:
  `"Sistemas de Informação, Ciências da Computação, Engenharia da Computação"`.
  * *Exemplo:* Se a planilha enviar "EC, SI", o código deve identificar, mapear e salvar como `"Sistemas de Informação, Engenharia da Computação"`.

## 5. Atualização da Lógica Existente
* Certifique-se de que a tela de gerenciamento de usuários (edição manual no painel) e os filtros da tabela também reflitam o uso do termo "Estudante" no lugar de "Aluno" para manter a coesão visual.