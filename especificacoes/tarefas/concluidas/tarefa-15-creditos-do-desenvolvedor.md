# Tarefa 15: Créditos do desenvolvedor

Dar crédito a quem fez o sistema, nos lugares onde a coordenação autorizou e da
forma que um quiosque institucional comporta: uma linha de texto na tela de
repouso do tablet, uma linha com link no pé da barra lateral do painel, e o
contato completo onde link é o comportamento esperado — README e a página do
estudo de caso da wiki.

**Contexto.** O sistema foi desenvolvido por uma pessoa só, como contrapartida
à coordenação dos cursos. A coordenação autorizou o crédito no tablet e no
painel (confirmado pelo dono do repositório em 2026-09-16). Não há
contrapartida financeira nem de horas; o crédito é a contrapartida.

## 0. Decisões já tomadas (consultoria de 2026-09-16)

Debatidas e aprovadas pelo dono do repositório. **Não reabra sem motivo novo**;
o porquê está ao lado, porque é o que a próxima pessoa reverteria com boa
intenção.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Onde, no tablet | **Só na tela de matrícula**, como rodapé abaixo do `main` | É a tela de repouso do quiosque: a que todo mundo vê primeiro, em toda sessão, e a que fica na bancada o dia inteiro entre um uso e outro. É também a mais leve — sem `BarraSelecao` (fixa no rodapé nas telas de retirada) e sem relógio de inatividade. A tela de sucesso tem 87 px de folga medidos (Tarefa 14) e a de início já foi medida no limite com três empréstimos: nenhuma das duas paga uma linha a mais |
| Forma, no tablet | **Texto plano, sem link** | O tablet é quiosque: uma rota, sem navegação, reinício por estado. Um `<a href>` para o GitHub seria a única porta de saída da aplicação pelo toque, e o relógio de 2 min não traria a tela de volta — ele mora na página que ficou para trás. Nenhum portão acusa: o link funciona, e é isso que o torna perigoso. O mesmo vale para `mailto:` e `tel:` |
| O que, no tablet | `Desenvolvido por Viccenzo Boff · github.com/viccenzo-boff` | Nome e um identificador **estável e profissional**. O handle é o portfólio: o repositório com a wiki está a um clique dele. Telefone e e-mail pessoal envelhecem com a pessoa (o tablet fica), e expostos numa bancada pública são convite a contato indesejado |
| Tipografia | `text-sm`, `text-tinta-suave`, centralizado, sem borda, sem ícone, fonte sans | `text-xs` some à distância de braço numa bancada. Mono é reservada às etiquetas por decisão registrada. O contraste do par é **calculado no navegador**, como manda a regra do projeto — o `tinta-tenue` não passa para texto de 14 px |
| Painel | Uma linha no pé da barra lateral, abaixo do bloco da conta: `Desenvolvido por [Viccenzo Boff](github)` — **com link**, em nova aba | O público é o secretário e a coordenação, em desktop com mouse: link não é porta de saída, e é onde a coordenação vai de fato ver o crédito |
| Versão no painel | **Não** | A proposta inicial era `v1.2 · Desenvolvido por…`. A versão cravada no componente seria o **quinto** lugar a mexer quando a versão fechar (a tabela "Como a wiki é publicada" do CONTRIBUTING lista quatro), e o `package.json` está em `0.1.0` — não é fonte. Duas cópias divergem em silêncio |
| Contato completo | README (`## Autor`) e a página "Como esta wiki foi feita", nos dois idiomas: GitHub e e-mail | É onde quem se interessou chega, e onde link é o comportamento esperado. **Telefone em lugar nenhum** — repositório público é indexado |
| QR do desenvolvedor no tablet | **Não** | A tela de sucesso já tem um QR institucional; um segundo, pessoal, é exatamente o "espaço comercial" que se quer evitar |
| Capturas da wiki | **Não são refeitas** | O crédito não é etapa de processo: uma captura sem ele não mostra nada falso, só omite. Refazer as capturas da tela de matrícula (retirada e devolução, nos dois idiomas) custaria uma sessão de captura para uma linha de rodapé |

## 1. Tablet

* Um `<footer>` em [Portal.tsx](../../../src/components/portal/Portal.tsx),
  **depois** do `<main>`, renderizado só quando `etapa.nome === "matricula"`.
  O contêiner externo já é `flex min-h-full flex-col` com o `main` em
  `flex-1`, então o rodapé cai no pé da janela sem posicionamento fixo — e
  nunca disputa com a `BarraSelecao`, que não existe nessa tela.
* Texto exato: `Desenvolvido por Viccenzo Boff · github.com/viccenzo-boff`.
  Nenhum elemento interativo dentro.
* Medir, nas duas orientações do tablet (1280x800 e 800x1280): o documento
  continua sem rolagem e o rodapé fica visível. Registrar o número.
* Calcular o contraste do texto sobre o fundo **na posição em que ele fica**
  (o fundo da página é um gradiente que se dissolve no `fundo` antes da
  metade): mínimo 4,5:1.

## 2. Painel

* Uma linha no pé do `<aside>` de
  [CascaAdmin.tsx](../../../src/components/admin/CascaAdmin.tsx), abaixo do
  `ContaDoAdmin`, com o link `https://github.com/viccenzo-boff` em
  `target="_blank"` e `rel="noopener noreferrer"`.
* Medir em 1440 (coluna) e em 900 px (faixa horizontal): sem rolagem
  horizontal, e a altura da faixa registrada — a D11 mediu 364 px em 900 px
  antes desta linha.

## 3. README e wiki

* README: seção `## Autor` no fim, com nome, GitHub e e-mail, e a frase que
  explica por que existe crédito na interface de um sistema institucional (a
  autorização), porque é o que alguém removeria com boa intenção.
* [como-esta-wiki-foi-feita.md](../../../docs/sobre/como-esta-wiki-foi-feita.md)
  e a versão em inglês: uma seção final "Quem fez" / "Who made it", com os
  mesmos dados. Os três portões da wiki continuam em 0.

## 4. Verificação

1. `tsc`, `lint` e `build` em 0; as seis rotas do painel dinâmicas e a `/`
   estática, como antes.
2. `mkdocs build --strict`, `vale docs/` e `npm run docs:links` em 0.
3. Navegador real (CDP): as duas orientações do tablet e as duas larguras do
   painel, com os números registrados no AGENTS.md — e o gatilho que os
   invalida.
4. O `dev.db` não é tocado: a tarefa não escreve no banco.
