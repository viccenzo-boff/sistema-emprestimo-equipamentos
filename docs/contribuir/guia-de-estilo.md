# Guia de estilo

Estas são as regras que todas as páginas desta wiki obedecem. Elas existem
porque decidir tom, formato de passo e nome de termo **enquanto** se escreve a
quinta página produz cinco páginas que discordam entre si.

O guia vale para quem escreve página nova e para quem corrige página existente.
Parte dele é conferida por máquina — ver [O vocabulário controlado](#o-vocabulario-controlado).

## 1. Texto de interface é citado literalmente

Escreva o rótulo com a grafia exata da tela, entre **negrito** — inclusive
quando a tela estiver errada. Corrigir a grafia no texto e não na tela faz o
leitor procurar um botão que não existe.

```text
CERTO   Toque em **Devolver tudo**.
ERRADO  Toque em "devolver todos".
ERRADO  Toque no botão de devolver tudo.
```

Se a grafia da tela incomodar, o conserto é uma tarefa de produto, não uma
licença de reescrita aqui.

**Nas páginas em inglês**, o rótulo real vem em negrito e o significado em
inglês entre parênteses: *click **Devolver** (Return)*. As capturas continuam
em português, e isso é declarado uma vez na home em inglês.

## 2. Um passo, uma ação

Passo que contém "e então", "e depois" ou "e confirme" vira dois passos. O
leitor está de pé na frente de um tablet, comparando a tela com a linha; duas
ações em uma linha custam uma ida e volta de olho.

```text
CERTO
1. Digite a matrícula.
2. Toque em **Continuar**.

ERRADO
1. Digite a matrícula e toque em **Continuar**.
```

## 3. Ramificação é sempre explícita

Decisão nunca fica embutida na prosa. O formato é literal:

```text
CERTO
3. O cadastro está ativo?
   - Se SIM → a grade de categorias aparece. Siga para o passo 4.
   - Se NÃO → a tela mostra "Este cadastro está inativo e não pode retirar
     equipamento." Procure a secretaria.

ERRADO
3. Caso o cadastro esteja ativo, as categorias aparecerão normalmente;
   caso contrário, será exibida uma mensagem de bloqueio.
```

Prosa condicional é onde o leitor se perde: ele precisa segurar as duas
hipóteses na cabeça até o fim do parágrafo para descobrir qual é a dele.

## 4. Voz: segunda pessoa, presente, imperativo direto

Escreva a instrução como quem está ao lado da pessoa dizendo o que fazer.

```text
CERTO   Digite a matrícula.
CERTO   A tela mostra os equipamentos no seu nome.

ERRADO  Você deverá digitar a matrícula.
ERRADO  O sistema irá exibir os equipamentos.
ERRADO  Deve-se proceder à digitação da matrícula.
```

<!-- vale Vale.Avoid = NO -->

"Você deverá" e "o sistema irá" empurram a ação para um futuro que nunca chega,
e alongam a linha sem acrescentar informação. Os dois são acusados pelo
vocabulário controlado — inclusive nesta página, e é por isso que o parágrafo
está entre as marcas de escape descritas na
[porta de saída](#a-porta-de-saida).

<!-- vale Vale.Avoid = YES -->

## 5. Toda captura de tela é clicável e abre em tamanho cheio

Captura de passo a passo é lida em detalhe — o leitor quer conferir se a tela
dele é a mesma. Imagem que não amplia obriga a abrir em outra aba à mão.

O mecanismo é envolver a imagem em um link para ela mesma:

```markdown
[![A grade de categorias, com Notebook, Tablet e Extensão](../assets/images/retirada/03-grade-de-categorias.png)](../assets/images/retirada/03-grade-de-categorias.png)
```

O texto alternativo descreve **o que a imagem mostra**, não o número do passo:
quem usa leitor de tela já sabe em que passo está.

## 6. Nenhum dado pessoal real em captura de tela

Sem exceção, e **nem borrado** — borrão em imagem é reversível com mais
frequência do que se imagina, e uma matrícula tem poucos dígitos.

O estado que as capturas mostram é montado por script, com gente fictícia. A
receita está na seção "Reproduzir o estado de demonstração" do
[CONTRIBUTING.md](https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos/blob/main/CONTRIBUTING.md).

Entre no painel sempre com a conta `secretaria`, que é a conta neutra: as outras
três têm nome de pessoa real e aparecem no rodapé da barra lateral em toda
captura do painel.

## 7. Nome de imagem: descritivo, nunca UUID

O formato é `NN-acao-descrita.png`, numerado na ordem do passo a passo, dentro
de `docs/assets/images/<processo>/`.

```text
CERTO   docs/assets/images/retirada/03-grade-de-categorias.png
ERRADO  docs/assets/images/retirada/a3f9c1e2-7b04-4d11-9e88-2c5f0a6b1d33.png
ERRADO  docs/assets/images/retirada/print3.png
```

O motivo é duplo: com UUID é impossível saber o que uma imagem mostra sem
abrir, e imagem órfã — a que sobrou de um passo que foi reescrito — nunca é
encontrada, porque ninguém sabe procurar por ela.

## 8. O vocabulário controlado {#o-vocabulario-controlado}

Parte destas regras é conferida pelo [Vale](https://vale.sh). Não existe estilo
pronto de qualidade para português, então a wiki **não** usa lint de estilo em
português: usa um vocabulário próprio, que resolve o problema que importa —
duas páginas discordarem do nome da mesma coisa.

```bash
vale docs/
```

A instalação está na seção "Documentação" do `CONTRIBUTING.md`.

### O que ele acusa

| Grafia proibida            | Escreva                                    |
| -------------------------- | ------------------------------------------ |
| `usuário`, `usuários`      | estudante, professor, pessoa, cadastro     |
| `aluno`, `alunos`          | estudante                                  |
| `você deverá`, `você deve` | o imperativo direto: "Digite a matrícula." |
| `o sistema irá`, `o sistema vai` | o presente: "A tela mostra…"         |
| `deletar`, `logar`         | excluir; entrar                            |

<!-- vale Vale.Avoid = NO -->

**"Usuário" é a regra mais importante, e não é preciosismo.** No vocabulário
deste sistema, essa palavra quer dizer **login de administrador** — é o campo
`Administrador.usuario`, e nada mais. Quem retira equipamento é uma `Pessoa`. O
código levou a Tarefa 10 inteira para desfazer essa ambiguidade; a wiki não pode
reintroduzi-la.

Por isso o rótulo do campo de login **passa**: na tela ele aparece capitalizado,
como **Usuário**, e a regra distingue caixa. Citar o campo é permitido; chamar um
estudante de usuário, não.

**"Aluno" também é proibido**, e por um motivo de tela: o painel mostra o perfil
como **Estudante** desde a Tarefa 8.1. Uma wiki que diz "aluno" manda o leitor
procurar um filtro que tem outro nome.

<!-- vale Vale.Avoid = YES -->

### Onde ele não olha

Trecho de código — cercado por crases ou em bloco — é ignorado pelo Vale. Então
`Administrador.usuario` e um bloco de SQL com a coluna `usuario` passam sem
alerta, que é o comportamento certo: ali o termo é o nome do campo.

### A porta de saída

Uma página pode precisar escrever a palavra proibida de propósito — este guia
mesmo precisa. O escape é um comentário HTML, e ele **tem que ser fechado**:

```markdown
<!-- vale Vale.Avoid = NO -->
Aqui a palavra proibida pode aparecer.
<!-- vale Vale.Avoid = YES -->
```

Use o escape para um trecho, nunca para uma página inteira. Página inteira com o
lint desligado é página que sai do vocabulário sem ninguém perceber.

## 9. Pré-voo, antes de abrir o pedido

Antes de dar uma página por pronta:

- [ ] Todo rótulo citado foi conferido **na tela**, não de memória
- [ ] Nenhum passo tem duas ações
- [ ] Toda decisão está em "Se SIM → … / Se NÃO → …"
- [ ] Toda captura é clicável e tem texto alternativo descritivo
- [ ] Nenhuma captura tem nome de pessoa real, matrícula real ou a conta de um
      administrador com nome próprio
- [ ] Os arquivos de imagem seguem `NN-acao-descrita.png`
- [ ] `vale docs/` passa
- [ ] `mkdocs build --strict` passa
