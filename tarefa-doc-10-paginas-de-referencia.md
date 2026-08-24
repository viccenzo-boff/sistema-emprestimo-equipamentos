# Tarefa D10: Páginas de referência

As cinco páginas de processo ensinam a fazer. Estas ensinam a entender. Elas são
o destino natural do conteúdo que aparecia repetido nas páginas de processo — e o
lugar onde o conhecimento hoje trancado no [AGENTS.md](AGENTS.md) fica disponível
para quem não lê código.

## 1. `docs/referencia/glossario.md` — completar

O glossário nasceu na D03 com os termos que atravessam processos. Agora ele
recebe os termos que apareceram nas páginas D05 a D09 e ainda não estão lá.

Regra: **todo termo em negrito ou entre aspas nas páginas de processo tem verbete
aqui.** Faça a varredura de verdade, página por página.

## 2. `docs/referencia/estados.md` — as duas máquinas de estado

A página mais técnica da wiki, e a que amarra tudo.

* **Empréstimo:** `ATIVO` → `AGUARDANDO_BAIXA` → `CONCLUIDO`. Cada transição com
  quem dispara, em que tela, e qual marcador de tempo é gravado.
* **Equipamento:** `DISPONIVEL` ↔ `EMPRESTADO`, `DISPONIVEL` ↔ `MANUTENCAO`,
  e `INATIVO` como aposentadoria.
* Um diagrama para cada. Aqui **Mermaid serve melhor que BPMN**: máquina de
  estado não tem raia nem ator, e o `stateDiagram-v2` fica legível e versionável
  em texto. Não force BPMN onde ele não é a notação certa.
* Uma tabela cruzando os dois: para cada estado do empréstimo, o que acontece com
  o equipamento. É a tabela que responde a pergunta mais frequente do sistema.

## 3. `docs/referencia/regras-de-negocio.md`

Consolidação em linguagem de usuário final do que hoje está na seção "Regra de
negócio que não é óbvia pelo código" do [AGENTS.md](AGENTS.md).

Cada regra com: o que o sistema faz, por que faz assim, e o que quebraria se
fizesse diferente. O terceiro item é o que dá valor à página — regra sem
consequência declarada é regra que alguém "simplifica" depois.

Inclua a nota de regressão do tempo de prateleira, se ela não tiver ficado na
página da D07.

Esta página **não substitui** o `AGENTS.md`: aquele é escrito para quem mexe no
código, esta para quem opera. As duas descrevem as mesmas regras em vocabulários
diferentes, e isso é proposital. Diga isso numa nota, para ninguém tentar
"unificar" as duas depois.

## 4. `docs/referencia/conta-administrador.md`

Login, logout e troca da própria senha. Curta e direta.

Precisa dizer, sem rodeio, o que o sistema **não** faz: não há cadastro de
administrador pela interface, não há papéis, não há recuperação de senha por
e-mail. Senha esquecida se resolve apagando a linha no banco e ressemeando — o
que exige quem tenha acesso ao servidor da secretaria.

Documente também o bloqueio por tentativas (cinco erros travam novas tentativas
por um minuto), porque é comportamento que assusta quem não sabe que existe.

## 5. Verificação

* `mkdocs build --strict` em 0 aviso.
* Varredura feita: nenhum termo destacado nas páginas D05–D09 ficou sem verbete.
* Os dois diagramas de estado renderizam no site publicado, não só no editor.
* A tabela cruzada cobre **todas** as combinações, sem lacuna.
* Cada regra da página de regras tem os três itens (o quê, por quê, o que
  quebraria).
* Os links das páginas de processo para os verbetes do glossário funcionam.

*Atenção: resista a transformar a página de regras num despejo do `AGENTS.md`.
Copiar o texto técnico para cá é o caminho fácil e destrói o propósito da página
— o trabalho é traduzir, não transportar.*
