# Tarefa D12: Tradução para inglês

Espelha a wiki inteira em `docs/en/`. Esta é a tarefa **de corte**: se o prazo
apertar, ela sai por inteiro e não deixa buraco — a wiki fica completa em
português e o inglês entra depois. Está registrado assim na §9 da
[spec-wiki.md](../../spec-wiki.md). Se você precisar cortar, corte esta, e nenhuma
outra.

## 1. A regra da interface não traduzida

O sistema é todo em português e **não será internacionalizado** (§2 da
[spec-wiki.md](../../spec-wiki.md)). As capturas continuam em português.

A convenção, aplicada sem exceção: **o rótulo real vem em negrito, e o
significado em inglês entre parênteses.**

```markdown
4. Click **Devolver** (Return) on the item you want to give back.
```

> Este enunciado prescrevia a forma invertida — *click **Return** (Devolver)* —,
> e ela perdeu para o repositório na execução da tarefa: a regra 1 do
> [guia de estilo](../../../docs/contribuir/guia-de-estilo.md) (D03) e a nota da home em
> inglês (D11) já tinham publicado esta forma, concordando entre si, e o
> argumento delas é de ergonomia — quem lê está com a tela em português na
> frente, e o negrito tem que ser a palavra que ele procura no botão. A §7 da
> [spec-wiki.md](../../spec-wiki.md) foi corrigida junto, para não ficarem dois donos
> da mesma regra.

Declare essa convenção **uma vez**, com destaque, na home em inglês. Sem essa
declaração, o leitor de fora acha que a wiki está desatualizada em relação ao
sistema.

## 2. Glossário de interface — `docs/en/referencia/glossario-ui.md`

O `mkdocs-static-i18n` em modo pasta **espelha a estrutura**: o caminho em
`docs/en/` repete o do português, inclusive os nomes de pasta. Não traduza nome
de diretório — quebra o pareamento e o seletor de idioma perde a página.


Tabela PT → EN de todo rótulo de tela citado na wiki: botão, título de tela,
mensagem de erro, nome de status.

Essa página é o que torna a wiki em inglês utilizável de verdade por quem está
com o sistema em português na frente. É também a peça que demonstra que a decisão
de não traduzir a interface foi consciente, e não descuido.

## 3. O que traduzir, e como

Todas as páginas: home, dois guias rápidos, cinco processos, quatro de
referência, e as de "Sobre" da D14.

* **Traduza o sentido, não a sintaxe.** Documentação em inglês tem frase mais
  curta e voz mais direta que a portuguesa; tradução literal fica pesada e
  denuncia a origem.
* **Nome de status do banco não se traduz** (`AGUARDANDO_BAIXA` continua
  `AGUARDANDO_BAIXA`), porque é o que aparece no sistema. Explique o significado
  em inglês na primeira ocorrência.
* **Reaproveite as mesmas imagens** — não duplique arquivo de captura. Aponte
  para `docs/assets/images/`, e traduza apenas o texto alternativo.
* Os diagramas BPMN têm rótulo em português. Ou exporte um segundo SVG com
  rótulo em inglês, ou mantenha o mesmo e explique os rótulos na legenda. **A
  segunda opção é a recomendada:** dois SVG por processo dobram a superfície de
  manutenção, e o diagrama é o artefato que menos muda.

## 4. Verificação

* `mkdocs build --strict` em 0 aviso.
* O seletor de idioma funciona **em todas** as páginas e mantém a página ao
  trocar — não volta para a home.
* Nenhuma página em inglês ficou órfã ou vazia. Confira contra o `nav` em
  português, item por item.
* A convenção dos parênteses está aplicada em toda citação de rótulo. Faça uma
  varredura por termos de interface para conferir.
* O glossário de UI cobre todo rótulo citado nas páginas em inglês.
* Nenhuma imagem foi duplicada — confira que `docs/en/` não contém `.png`.

*Atenção: se o prazo apertar no meio desta tarefa, não entregue metade. Uma wiki
com sete páginas em inglês e sete faltando é pior que uma só em português — a
primeira parece abandonada, a segunda parece uma escolha.*
