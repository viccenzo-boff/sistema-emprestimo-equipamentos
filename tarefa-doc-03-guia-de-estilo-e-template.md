# Tarefa D03: Guia de estilo, template de processo e glossário base

Esta tarefa escreve as regras que as dez páginas seguintes vão obedecer. Ela
existe porque decidir tom, formato de passo e nome de termo enquanto se escreve a
quinta página produz cinco páginas que discordam entre si.

Nenhuma página de processo é escrita aqui.

## 1. Guia de estilo — `docs/contribuir/guia-de-estilo.md`

Transcreva e desenvolva as regras da §7 da [spec-wiki.md](spec-wiki.md), com
exemplo de certo e errado para cada uma:

* Texto de interface citado **literalmente**, entre aspas, com a grafia exata da
  tela — inclusive quando a tela estiver errada.
* Um passo, uma ação. Passo com "e então" vira dois passos.
* Ramificação sempre explícita: "Se SIM → ... / Se NÃO → ...", nunca embutida na
  prosa.
* Toda captura é clicável e abre em tamanho cheio.
* Nenhum dado pessoal real em captura. Sem exceção, nem borrado.
* Voz: segunda pessoa, presente, imperativo direto ("Digite a matrícula"), sem
  "você deverá" nem "o sistema irá".

Acrescente a regra de nomenclatura de imagem: **nome descritivo, nunca UUID**.
Formato `NN-acao-descrita.png`, numerado na ordem do passo a passo. O motivo
merece uma linha: com UUID é impossível saber o que uma imagem mostra sem abrir,
e imagem órfã nunca é encontrada.

## 2. Template — `docs/contribuir/template-processo.md`

Arquivo Markdown copiável, com as oito seções da §5 da
[spec-wiki.md](spec-wiki.md), cada uma com um comentário HTML explicando o que
entra e o que não entra.

Regra que precisa estar escrita dentro do template: **seção que não se aplica é
removida, nunca preenchida com "não se aplica"**.

Para a seção 7 (regras que não são óbvias), inclua no template o exemplo pronto
que a spec traz — o do equipamento que não volta a `DISPONIVEL` — como calibração
de tom. É a seção que mais facilmente degenera em descrição de tela.

## 3. Glossário base — `docs/referencia/glossario.md`

Comece o glossário com os termos que atravessam mais de um processo. No mínimo:
matrícula, etiqueta, categoria, módulo de portal, painel, empréstimo, retirada,
devolução, baixa física, tempo de prateleira, manutenção, aposentadoria (item
inativo), perfil, administrador.

Cada verbete: definição em linguagem de usuário final, e — quando o termo tiver
correspondente técnico — o nome do campo ou status entre parênteses.

**Não invente definição.** As regras estão na seção "Regra de negócio que não é
óbvia pelo código" do [AGENTS.md](AGENTS.md) e na [spec.md](spec.md). Traduzir
para linguagem de usuário é o trabalho.

O glossário cresce nas tarefas seguintes; aqui ele só precisa nascer consistente.

## 4. Vocabulário controlado do Vale

Crie `.vale.ini` e o vocabulário do projeto.

Nesta tarefa configure **apenas o vocabulário em português** — grafia aceita e
grafia proibida dos termos do glossário. A regra mais importante: **"usuário"
não é sinônimo de aluno nem de professor**. No vocabulário do sistema, "usuário"
significa login de administrador (`Administrador.usuario`), e o
[AGENTS.md](AGENTS.md) já trata o uso trocado como resíduo a corrigir. A wiki não
pode reintroduzir a ambiguidade que o código eliminou.

O estilo Microsoft para as páginas em inglês é configurado na D13, junto com o
resto do CI. Aqui só nasce o arquivo e o vocabulário.

## 5. Verificação

* `mkdocs build --strict` continua em 0 aviso.
* As três páginas novas aparecem no `nav` e abrem.
* O template, copiado para um arquivo novo, produz uma página que constrói sem
  erro.
* `vale docs/referencia/glossario.md` roda e não acusa erro no próprio glossário.
* Um termo do glossário escrito de forma proibida (ex.: "usuário" falando de
  aluno) é acusado pelo Vale. Teste isso de propósito num arquivo descartável e
  apague depois.

*Atenção: o último item da verificação é o que prova que o vocabulário funciona.
Vale configurado que nunca acusou nada costuma estar configurado errado.*
