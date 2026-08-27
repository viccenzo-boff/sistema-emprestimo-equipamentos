# Tarefa 10: Autenticação Real e Refatoração de Domínio (DDD)

Esta tarefa implementa o princípio de Accountability (Responsabilização) ao substituir a senha global por contas individuais de administradores, além de adequar a nomenclatura do sistema utilizando Domain-Driven Design (DDD).

## 1. Refatoração de Domínio (De "Usuário" para "Pessoa")
Para evitar conflito de conceitos entre quem administra o sistema e quem retira equipamentos, a entidade atual `Usuario` deve ser renomeada para `Pessoa`.
* **Banco de Dados:** No `schema.prisma`, renomeie o model `Usuario` para `Pessoa`. Lembre-se de atualizar as relações no model `Emprestimo` (ex: `usuario_id` vira `pessoa_id` ou algo semanticamente correto).
* **Rotas e UI:** Renomeie a rota `/admin/usuarios` para `/admin/pessoas`. Altere todos os textos na interface, botões e no menu lateral de "Usuários" para "Pessoas".

## 2. Nova Entidade: Administrador
* **Banco de Dados:** Crie um novo model `Administrador` no `schema.prisma`.
  * `id` (Int, PK, autoincrement)
  * `nome` (String)
  * `usuario` (String, unique) - Ex: 'cidi', 'secretaria'
  * `senha` (String) - Armazenará o hash da senha.
* **Ação:** Após alterar o schema (Pessoas e Administradores), gere e aplique a migração no Prisma.

## 3. Seed Seguro de Administradores
Não criaremos uma tela de CRUD de administradores neste MVP. Eles nascerão direto pelo banco.
* Instale as bibliotecas `bcryptjs` e `@types/bcryptjs`.
* Atualize o arquivo `prisma/seed.ts` para criar os seguintes administradores padrão (lembre-se de fazer o hash da senha usando `bcryptjs` antes de salvar no banco):
  * Administrador 1: nome: "Secretaria", usuario: "secretaria", senha: "Mudar@123"
  * Administrador 2: nome: "Cidi", usuario: "cidi", senha: "Mudar@123"
  * Administrador 3: nome: "Jeanzão", usuario: "jeanzao", senha: "Mudar@123"
  * Administrador 4: nome: "Viccenzo", usuario: "viccenzo", senha: "Mudar@123"

## 4. Refatoração do Login (`/admin`)
* **Remoção de Legado:** Remova a lógica antiga que usava a variável `ADMIN_PASSWORD` do `.env`.
* **Nova Interface de Login:** A tela de login do painel administrativo agora deve ter dois campos: "Usuário" e "Senha".
* **Lógica de Autenticação (Server Actions):** 
  * Ao submeter o login, busque o `Administrador` no banco pelo campo `usuario`.
  * Use `bcryptjs.compare` para validar a senha informada com o hash do banco.
  * Se a senha estiver correta, crie a sessão/cookie (como já estava sendo feito) guardando o `id` e o `nome` do administrador logado.

*Atenção Claude: Faça a refatoração passo a passo. Primeiro o banco de dados e a geração do Seed, depois a refatoração das rotas/componentes para evitar erros de build no Next.js.*