# Tarefa D02: Esqueleto do MkDocs, bilíngue e publicação automática

Esta tarefa põe um site vazio no ar. Nenhum conteúdo de processo entra aqui — o
objetivo é que a partir do fim dela toda página escrita já apareça publicada
sozinha, e que ninguém descubra problema de infraestrutura depois de dez páginas
prontas.

**Pré-requisito bloqueante:** a autorização da Unoesc para uso público do nome e
da logo (§8 da [spec-wiki.md](../../spec-wiki.md)). Se ela ainda não veio, execute esta
tarefa com uma marca neutra provisória e deixe a troca para depois — não invente
que a autorização existe.

## 1. Ambiente Python isolado

O projeto é Node. As ferramentas de documentação são Python e **não devem entrar
no `package.json`**.

* Crie `docs-requirements.txt` na raiz, com versões fixadas (não use faixas):
  `mkdocs-material`, `mkdocs-static-i18n`, `mike`.
* Documente como criar o ambiente e instalar na seção "Documentação" do
  [CONTRIBUTING.md](../../../CONTRIBUTING.md), aberta pela D01. Não crie arquivo de nota
  de trabalho dentro de `docs/` — tudo que mora lá vira página publicada.
* Acrescente ao `.gitignore` o diretório do ambiente virtual e o `site/` gerado
  pelo build do MkDocs. **Confira antes se já não estão lá.**

## 2. `mkdocs.yml`

* `site_name`, tema `material`, idioma padrão `pt-BR`.
* Paleta: use os tokens de cor que o sistema já definiu — azul `#023770` e verde
  `#3aaa35`, documentados na seção "Decisões de design já tomadas" do
  [AGENTS.md](../../../AGENTS.md). **Leia a regra dos dois verdes antes de aplicar:** o
  verde da logo dá 3,0:1 sobre branco e não serve para texto nem para fundo de
  botão.
* Modo claro e escuro com alternância. (O sistema é fixado em claro por causa do
  reflexo no tablet; a wiki não tem essa restrição — quem lê está no desktop.)
* Extensões necessárias para o template da D03: `admonition`,
  `pymdownx.details`, `pymdownx.superfences`, `attr_list`, `md_in_html`,
  `pymdownx.tasklist` com `custom_checkbox`.
* `nav` com a árvore da §4 da [spec-wiki.md](../../spec-wiki.md), apontando para
  páginas ainda vazias (um `#` e uma frase). O `nav` completo desde o início
  torna visível o que falta.

## 3. Bilíngue

* Configure o `mkdocs-static-i18n` em estrutura de **pasta**: português na raiz
  de `docs/`, inglês em `docs/en/`.
* Verifique que o seletor de idioma aparece no cabeçalho e que trocar de idioma
  numa página mantém a página, não joga para a home.
* Nesta tarefa, o inglês pode ter só a home. A tradução é a D12.

## 4. Publicação automática

* Crie `.github/workflows/docs.yml`. Não existe `.github/` no repositório ainda.
* Gatilho: `push` na `main` que toque `docs/**`, `mkdocs.yml` ou o próprio
  workflow.
* O job instala o Python, instala o `docs-requirements.txt` e publica no GitHub
  Pages.
* Use `mike` para publicar sob o alias `v1.0` e aponte o padrão para ele.
* Configure o Pages do repositório para servir da branch `gh-pages`.

## 5. Verificação

* `mkdocs build --strict` termina sem aviso. O `--strict` é obrigatório: sem ele
  link quebrado vira aviso silencioso e a D13 herda um passivo.
* `mkdocs serve` sobe e a árvore inteira do `nav` aparece na barra lateral.
* O seletor de idioma troca entre `/` e `/en/`.
* Após o `push` (feito **pelo dono do repositório**, não por você), a Action
  conclui em verde e a URL do Pages responde.
* A URL publicada mostra o seletor de versão do `mike` com `v1.0`.

*Atenção: esta tarefa termina com os commits prontos na `main` e sem `push`. A
verificação do item de deploy só pode ser concluída depois que o dono publicar —
deixe isso registrado e não marque como verificado o que você não viu acontecer.*
