# Tarefa 19: Tela cheia no tablet (web app, manifest e requisitos)

Fazer o portal ocupar **a tela inteira do tablet** — sem barra de endereço,
sem botões do navegador — e deixar escrito, no guia de instalação, **qual
tablet consegue rodar o sistema**. É o item "PWA do tablet" dos próximos
passos do AGENTS.md, recortado ao que dá resultado **hoje**, numa rede local
sem HTTPS.

**Pré-requisito: a Tarefa 18 executada** (está). Nenhum fluxo muda; nenhuma
tabela muda; **nenhuma tela do portal ou do painel muda**. A tarefa mexe no
`layout` raiz, cria ícones em `public/` e um `manifest`, e amplia uma página
da wiki.

> **Leia a §1 antes da §0.** Ela diz o que esta tarefa **não** entrega, e é a
> parte que decide se o resultado vai parecer pronto ou pela metade.

## 0. Decisões já tomadas (2026-09-18, com a foto do iPad; revistas em 2026-09-22)

O dono ligou o sistema no iPad da coordenação e a página abriu como **texto
puro** — fonte com serifa, logo gigante, teclado como botões cinza, barra do
Safari em cima. Foi medido antes de decidir: o CSS compilado usa `@layer`
(5 ocorrências), `@property` (54) e `color-mix()` (29); o JS do cliente usa
`??` (107) e `?.`. Nada disso existe no Safari daquele iPad (a barra do
Safari na foto é a do iOS 12 ou anterior). O navegador **ignora o CSS
inteiro** e **não executa o JS** — o que se vê é o HTML que o servidor
renderizou, sem estilo e sem o teclado funcionar. **Não reabra sem motivo
novo**; o porquê está ao lado.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| O iPad da foto | **Fica de fora.** O sistema exige **Safari 16.4+** (iPadOS 16.4, março de 2023) ou **Chrome 111+** no Android | É o piso declarado do Tailwind 4 (`@property`, `color-mix`) e o alvo padrão do Next 16. Um build "legado" exigiria descer para o Tailwind 3 e transpilar o JS para Safari 12 — duas decisões de stack do AGENTS.md desfeitas e uma bateria de testes num aparelho de 2013, contra o preço de um iPad usado de 2017 |
| Quais iPads servem | Qualquer um que aceite **iPadOS 16.4 ou mais novo**: iPad (5ª geração, 2017) em diante, iPad mini 5 em diante, iPad Air 3 em diante, qualquer iPad Pro. Como conferir: **Ajustes → Geral → Sobre → Versão** | Lista para o dono comprar ou pedir emprestado sem adivinhar. Android: qualquer um com Chrome atualizado (o Chrome atualiza sozinho pela Play Store) |
| Tela cheia no iPad | **Web app da tela de início**: `apple-mobile-web-app-capable` + `apple-touch-icon` no `layout`, e a pessoa faz **Compartilhar → Adicionar à Tela de Início** uma vez. Abre sem barra nenhuma | É o mecanismo nativo do iOS desde sempre, **funciona em HTTP** e não precisa de service worker. Depois, o **Acesso Guiado** prende o tablet na tela — é ajuste do iPad, sem código |
| Tela cheia no Android | **Fully Kiosk Browser**, como o guia já manda. O `manifest` é entregue mesmo assim | Ver a §1: o install de verdade exige `https://`, que é a **Tarefa 20**. O manifest custa um arquivo e passa a valer no dia em que ela rodar |
| Botão "tela cheia" no portal | **Não entra** (decisão do dono, 2026-09-22) | Foi oferecido como rede de segurança para um Android sem Fully (`requestFullscreen()` num toque, ~20 linhas). Recusado: manteria a promessa de que nenhuma tela do portal muda, e vira código morto no dia em que a Tarefa 20 rodar |
| Manifest | **`src/app/manifest.ts`** (convenção do Next: gera `/manifest.webmanifest`), com `display: standalone`, `name`, `short_name` "Empréstimos", `start_url: "/"`, `theme_color` `#023770`, `background_color` `#ffffff` e os ícones | Arquivo de código, e não JSON solto em `public/`: o Next valida os campos pelo tipo `MetadataRoute.Manifest` e a rota sai estática no `build` |
| Ícones | `public/apple-touch-icon.png` (180×180), `public/icon-192.png`, `public/icon-512.png`, gerados **por script** a partir de `src/assets/brand/logo-unoesc-colorido.png`. Mais `src/app/icon.png` (favicon, convenção do Next) | `public/` é o lugar de URL fixa (regra do README). Gerar por script (o `sharp` 0.35.3 já está na árvore, é dependência do Next) evita PNG feito à mão que ninguém sabe refazer. Os números do recorte estão na §3 — **foram medidos, não estimados** |
| Nitidez do ícone de 512 | **Ampliação de 2,2× aceita** (decisão do dono, 2026-09-22) | O símbolo tem no máximo 232px de altura na fonte. Os dois que aparecem na tela — 180 (o que o iPad mostra) e 192 — saem por **redução**, nítidos. O 512 serve à tela de abertura e a listagens, e quase nunca é exibido no tamanho cheio |
| `purpose` dos ícones | **Só `"any"`. Nada de `maskable`** | A zona segura de um ícone mascarável no Android é o círculo de 80% da largura; com ela, o símbolo sobraria minúsculo dentro de muito branco. Sem `maskable` declarado, o Chrome põe o ícone num quadrado arredondado branco sem cortar nada |
| Barra de status do iOS | `statusBarStyle: "default"` (branca, texto preto) e `viewport-fit: cover` | Em modo web app a barra do relógio continua; com `default` ela fica branca sobre o cabeçalho branco do portal, sem sobreposição. `black-translucent` poria o relógio por cima do conteúdo |
| Sem service worker | **Não entra** — e isso continua valendo na Tarefa 20 | Sem o PC não há o que fazer offline (o banco mora nele), e um SW com cache velho é a fonte clássica de "atualizei e o tablet continua mostrando o antigo". Conferido em 2026-09-22 no [blog do Chrome](https://developer.chrome.com/blog/update-install-criteria): a exigência de service worker para **instalar pelo menu** caiu na v108 do Chrome no celular. Só o convite automático de instalação ainda quer um `fetch` handler — e o guia manda instalar pelo menu |
| Tela ligada | Ajuste do iPad, no guia: **Ajustes → Tela e Brilho → Bloqueio Automático → Nunca**, com o tablet no carregador | O app volta sozinho à matrícula em 2 min; o que falta é a tela não apagar |
| Reserva de DHCP | Deixa de ser conselho e vira **passo obrigatório** do guia, antes de instalar o ícone em qualquer tablet | O `start_url` é gravado com o endereço do dia da instalação. Se o roteador trocar o IP, o ícone da tela de início quebra — e ninguém liga uma coisa à outra, porque o sintoma aparece semanas depois e o tablet não diz o motivo |
| Onde documentar | A página [Instalar no Windows 11](../../../docs/instalacao/windows-11.md) ganha **"Requisitos do tablet"** antes do Passo 5, e o Passo 5 vira passo a passo do iPad e do Android. Mais uma linha em "Se der errado": *"A página abre como texto puro, sem cores"* → o navegador do tablet é antigo demais | É a página que a coordenação lê. A pergunta "que tablet comprar" precisa de resposta escrita, não de conversa |

**Dependência nova: nenhuma.** O `sharp` que gera os ícones é dependência do
Next e só roda no script, uma vez.

## 1. O que esta tarefa NÃO entrega no Android

**O iPad fica pronto; o Android, não.** Isto é escopo, não ressalva — leia
antes de escrever a primeira linha, e escreva no guia com estas palavras.

Um install de PWA de verdade no Chrome exige que a página seja servida pelo
protocolo **`https://`**. É critério de instalabilidade, não recomendação —
[a MDN o enuncia como o protocolo](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable),
e não como "contexto seguro", o que também descarta o flag
`unsafely-treat-insecure-origin-as-secure` do Chrome como caminho de
produção. Hoje o sistema serve `http://192.168.x.x:3000`. Então, **depois
desta tarefa**:

* **iPad:** "Adicionar à Tela de Início" abre **sem barra**. Pronto, em HTTP.
* **Android:** o Chrome continua **não** oferecendo "Instalar aplicativo". O
  manifest é entregue e fica correto; quem dá a tela cheia continua sendo o
  **Fully Kiosk Browser**, como o guia já descreve.

Quem destrava o Android é a **[Tarefa 20 — HTTPS na rede local](../pendentes/tarefa-20-https-na-rede-local.md)**,
enunciada junto com esta e marcada para **depois da entrega à coordenação**.
Escrever o manifest agora é o que faz a Tarefa 20 ser só infraestrutura.

**Um efeito colateral a dizer no guia:** quando a Tarefa 20 rodar, o endereço
muda de `http://192.168…:3000/` para `https://192.168…/`. Ícone instalado num
iPad antes dela aponta para o endereço velho e para de abrir — quem já
instalou **remove e adiciona de novo**.

## 2. `layout.tsx` e o manifest

* Em `src/app/layout.tsx`, `metadata` ganha:

  ```ts
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Empréstimos", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  ```

  e `viewport` ganha `viewportFit: "cover"` (o campo existe no tipo
  `ViewportLayout`, em `node_modules/next/dist/lib/metadata/types/extra-types.d.ts`).

  **Atenção Claude — a tag que o Next escreve não é a que o iPad de 2023
  lê.** Conferido em 2026-09-22 no `generate-metadata.md` instalado
  (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/`,
  linhas 801-812): para `appleWebApp` o Next 16 emite
  `<meta name="mobile-web-app-capable">` — o nome padronizado — e **não**
  emite `apple-mobile-web-app-capable`, que é o que o iPadOS 16.4 a 17.3
  entende. Acrescente a segunda por
  `other: { "apple-mobile-web-app-capable": "yes" }` no mesmo `metadata`, e
  confira no HTML gerado que saíram **as duas**, mais
  `apple-mobile-web-app-title`, `<link rel="apple-touch-icon">` e
  `<link rel="manifest">`. Sem a tag da Apple, "Adicionar à Tela de Início"
  num iPad de 2023 abre **com** a barra do Safari e a tarefa parece feita.
* `src/app/manifest.ts` exportando `MetadataRoute.Manifest` com os campos da
  §0. O relatório do `build` tem que classificar `/manifest.webmanifest`
  como estático e a `/` continuar estática.

## 3. Ícones — o recorte já foi medido

A logo foi analisada com o `sharp` em 2026-09-22. **Use estes números; não
os redescubra a olho:**

* O arquivo tem **444×351** e o conteúdo visível vai de `y=1` a `y=350`.
* A logo é **empilhada**, não lado a lado: há uma faixa horizontal
  **inteiramente vazia em `y=233..263`** (31px). Acima dela, o símbolo;
  abaixo, a palavra "unoesc".
* **O recorte é por linha (`y`), nunca por coluna (`x`).** O maior vão
  vertical vazio no arquivo inteiro tem 5px — não existe corte limpo entre
  símbolo e palavra no eixo horizontal, e tentar um produz ícone torto.
* O símbolo ocupa no máximo ~181 colunas; a palavra chega a 295. Centralize
  o recorte pela caixa envolvente do próprio símbolo, não pela largura da
  imagem.

Script **descartável ou em `scripts/`** (decisão de quem executa; se ficar,
`scripts/gerar-icones.mjs`) que recorta `y=0..232`, acha a caixa envolvente
do símbolo, centraliza sobre **branco opaco** com 10% de margem e grava os
quatro PNG. Branco opaco e não transparência: o iOS compõe `apple-touch-icon`
sobre preto. Anote no commit a caixa usada, em pixels, para o próximo poder
refazer.

## 4. Documentação (a wiki tem spec própria: `especificacoes/spec-wiki.md`)

* [`docs/instalacao/windows-11.md`](../../../docs/instalacao/windows-11.md):
  * Nova seção **"Requisitos do tablet"** antes do Passo 5: a versão mínima,
    como conferir (**Ajustes → Geral → Sobre → Versão**), a lista de modelos
    da §0, e o sintoma de tablet velho (texto puro, sem cores, teclado que
    não responde).
  * A **reserva de DHCP** sobe para antes do Passo 5, como passo obrigatório,
    com o motivo da §0.
  * Passo 5 reescrito em dois blocos. **iPad** — abrir o endereço no Safari,
    **Compartilhar → Adicionar à Tela de Início**, abrir pelo ícone (sem
    barra), **Bloqueio Automático → Nunca**, **Acesso Guiado**. **Android** —
    Fully Kiosk como está, mais uma frase dizendo que o "Instalar aplicativo"
    do Chrome **ainda não aparece**, e por quê, em uma linha.
  * "Se der errado": a linha do texto puro.
* AGENTS.md: bloco da Tarefa 19, a fila (que passa a apontar a Tarefa 20), e
  o item "PWA do tablet" sai dos próximos passos.
* Sem tradução: o guia é só em português (decisão da T18).

## 5. Verificação exigida

* `tsc`, `lint`, `build` em 0, com a `/` estática e `/manifest.webmanifest`
  estático no relatório; `mkdocs build --strict`, `vale docs/`,
  `npm run docs:links` em 0.
* HTTP real contra o `next start`: o HTML da `/` traz **as duas** tags de
  web app mais o título e o `apple-touch-icon`;
  `/manifest.webmanifest` responde 200 com JSON válido e os ícones
  respondem 200 com `image/png` nas dimensões da §0 (leia os bytes do PNG,
  não confie no nome do arquivo).
* Leitura visual dos quatro PNG antes de commitar: ícone torto passa por
  todos os portões.
* **Num iPad com iPadOS 16.4+ — fornecido pelo dono** — na rede da
  instalação: a página abre com estilo; "Adicionar à Tela de Início" cria o
  ícone com o nome "Empréstimos"; aberto pelo ícone, **não há barra de
  endereço**; a retirada inteira funciona (teclado, categorias, confirmação,
  QR aparece); depois de 2 min sem toque volta à matrícula; o Acesso Guiado
  prende a tela. **O dono ainda não testou o iPad** (2026-09-22): se ele não
  tiver o aparelho no dia, a tarefa fica **"concluída, menos o degrau do
  iPad"**, dito no AGENTS.md, como a T18 fez com o `instalar.cmd`.
* **Anote a versão do iPadOS do aparelho testado.** Há relato de que o
  iPadOS 26 abre como web app **qualquer** site adicionado à tela de início,
  por padrão — não medido aqui. Se o teste for num iPadOS 26, ele **não
  prova** que as tags funcionam; o degrau só fecha num aparelho entre 16.4 e
  25, ou lendo o HTML e confiando nas tags. Diga qual dos dois aconteceu.
* O `dev.db` do dono conferido por md5 no fim.

## 6. Fora de escopo

* Suporte a Safari anterior ao 16.4 (o iPad da foto). Não há versão do
  Tailwind 4 que rode nele.
* Service worker, modo offline, notificações.
* **HTTPS na rede local — é a [Tarefa 20](../pendentes/tarefa-20-https-na-rede-local.md)**,
  e é ela que torna o Android instalável.
* Qualquer mudança nas telas do portal ou do painel, inclusive o botão de
  tela cheia que foi oferecido e recusado.
