# Tarefa 19: Tela cheia no tablet (web app do iPad, manifest e requisitos)

Fazer o portal ocupar **a tela inteira do tablet** — sem barra de endereço,
sem botões do navegador — e deixar escrito, no guia de instalação, **qual
tablet consegue rodar o sistema**. É o item "PWA do tablet" dos próximos
passos do AGENTS.md, recortado ao que dá resultado numa rede local sem HTTPS.

**Pré-requisito: a Tarefa 18 executada** (está). Nenhum fluxo muda; nenhuma
tabela muda. A tarefa mexe no `layout` raiz, cria ícones em `public/` e um
`manifest`, e amplia uma página da wiki.

## 0. Decisões já tomadas (sessão de 2026-09-18, com a foto do iPad na mão)

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
| Tela cheia no Android | **Fully Kiosk Browser** (já no guia). O `manifest` é entregue mesmo assim | Instalar como PWA no Chrome exige HTTPS e service worker; em HTTP, "Adicionar à tela inicial" abre com a barra do Chrome. O manifest custa um arquivo e passa a valer no dia em que houver HTTPS |
| Manifest | **`src/app/manifest.ts`** (convenção do Next: gera `/manifest.webmanifest`), com `display: standalone`, `name`, `short_name` "Empréstimos", `start_url: "/"`, `theme_color` `#023770`, `background_color` `#ffffff` e os ícones | Arquivo de código, e não JSON solto em `public/`: o Next valida os campos pelo tipo `MetadataRoute.Manifest` e a rota sai estática no `build` |
| Ícones | `public/apple-touch-icon.png` (180×180), `public/icon-192.png`, `public/icon-512.png`, gerados **por script** a partir do símbolo de `src/assets/brand/logo-unoesc-colorido.png` (o símbolo, não a palavra; fundo branco; margem de 10%). Mais `src/app/icon.png` (favicon, convenção do Next) | `public/` é o lugar de URL fixa (regra do README). Gerar por script (o `sharp` já está na árvore, é dependência do Next) evita PNG feito à mão que ninguém sabe refazer. **Se o recorte automático do símbolo sair ruim, o dono fornece o PNG** — a decisão de imagem é dele |
| Barra de status do iOS | `statusBarStyle: "default"` (branca, texto preto) e `viewport-fit: cover` | Em modo web app a barra do relógio continua; com `default` ela fica branca sobre o cabeçalho branco do portal, sem sobreposição. `black-translucent` poria o relógio por cima do conteúdo |
| Sem service worker | **Não entra** | Sem o PC não há o que fazer offline (o banco mora nele), e um SW com cache velho é a fonte clássica de "atualizei e o tablet continua mostrando o antigo" |
| Tela ligada | Ajuste do iPad, no guia: **Ajustes → Tela e Brilho → Bloqueio Automático → Nunca**, com o tablet no carregador | O app volta sozinho à matrícula em 2 min; o que falta é a tela não apagar |
| Onde documentar | A página [Instalar no Windows 11](../../../docs/instalacao/windows-11.md) ganha **"Requisitos do tablet"** antes do Passo 5, e o Passo 5 vira passo a passo do iPad (adicionar à tela de início, Acesso Guiado, bloqueio automático) e do Android (Fully). Mais uma linha em "Se der errado": *"A página abre como texto puro, sem cores"* → o navegador do tablet é antigo demais | É a página que a coordenação lê. A pergunta "que tablet comprar" precisa de resposta escrita, não de conversa |

**Dependência nova: nenhuma.** O `sharp` que gera os ícones é dependência do
Next e só roda no script, uma vez.

## 1. `layout.tsx` e o manifest

* Em `src/app/layout.tsx`, `metadata` ganha:

  ```ts
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Empréstimos", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  ```

  e `viewport` ganha `viewportFit: "cover"` (o tipo existe em
  `extra-types.d.ts`).

  **Atenção Claude — a tag que o Next escreve não é a que o iPad de 2023
  lê.** Lido em `node_modules/next/dist/docs/.../generate-metadata.md`: para
  `appleWebApp` o Next 16 emite `<meta name="mobile-web-app-capable">` (o
  nome padronizado, que o Safari só honra a partir do 17.4) e **não** emite
  `apple-mobile-web-app-capable`, que é o que o iPadOS 16.4 a 17.3 entende.
  Acrescente a segunda por `other: { "apple-mobile-web-app-capable": "yes" }`
  no mesmo `metadata`, e confira no HTML gerado que saíram **as duas**, mais
  `apple-mobile-web-app-title`, `<link rel="apple-touch-icon">` e
  `<link rel="manifest">`. Sem a tag da Apple, "Adicionar à Tela de Início"
  num iPad de 2023 abre **com** a barra do Safari e a tarefa parece feita.
* `src/app/manifest.ts` exportando `MetadataRoute.Manifest` com os campos da
  §0. O relatório do `build` tem que classificar `/manifest.webmanifest`
  como estático e a `/` continuar estática.

## 2. Ícones

* Script **descartável ou em `scripts/`** (decisão de quem executa; se ficar,
  `scripts/gerar-icones.mjs` com `sharp`) que lê
  `src/assets/brand/logo-unoesc-colorido.png`, recorta o símbolo (a parte
  verde/azul à esquerda da palavra), centraliza sobre branco com 10% de
  margem e grava os quatro PNG. Anote no commit o recorte usado (em pixels)
  para o próximo poder refazer.
* Se o símbolo não se separar bem da palavra por recorte de pixels, **parar e
  pedir o PNG ao dono** em vez de publicar um ícone torto.

## 3. Documentação (a wiki tem spec própria: `especificacoes/spec-wiki.md`)

* [`docs/instalacao/windows-11.md`](../../../docs/instalacao/windows-11.md):
  * Nova seção **"Requisitos do tablet"** antes do Passo 5: a versão mínima,
    como conferir (**Ajustes → Geral → Sobre → Versão**), a lista de modelos
    da §0, e o sintoma de tablet velho (texto puro, sem cores, teclado que
    não responde).
  * Passo 5 reescrito em dois blocos: **iPad** — abrir o endereço no Safari,
    **Compartilhar → Adicionar à Tela de Início**, abrir pelo ícone (sem
    barra), **Bloqueio Automático → Nunca**, **Acesso Guiado** (ativar,
    código, clique triplo no botão para prender); **Android** — Fully Kiosk
    como está.
  * "Se der errado": a linha do texto puro.
* AGENTS.md: bloco da Tarefa 19, a fila, e o item "PWA do tablet" sai dos
  próximos passos.
* Sem tradução: o guia é só em português (decisão da T18).

## 4. Verificação exigida

* `tsc`, `lint`, `build` em 0, com a `/` estática e `/manifest.webmanifest`
  estático no relatório; `mkdocs build --strict`, `vale docs/`,
  `npm run docs:links` em 0.
* HTTP real contra o `next start`: o HTML da `/` traz as três tags;
  `/manifest.webmanifest` responde 200 com JSON válido e os ícones
  respondem 200 com `image/png` nas dimensões da §0.
* **Num iPad com iPadOS 16.4+ — fornecido pelo dono** — na rede da
  instalação: a página abre com estilo; "Adicionar à Tela de Início" cria o
  ícone com o nome "Empréstimos"; aberto pelo ícone, **não há barra de
  endereço**; a retirada inteira funciona (teclado, categorias, confirmação,
  QR aparece); depois de 2 min sem toque volta à matrícula; o Acesso Guiado
  prende a tela. Se o dono não tiver o aparelho no dia, a tarefa fica
  **"concluída, menos o degrau do iPad"**, dito no AGENTS.md, como a T18
  fez com o `instalar.cmd`.
* O `dev.db` do dono conferido por md5 no fim.

## 5. Fora de escopo

* Suporte a Safari anterior ao 16.4 (o iPad da foto). Não há versão do
  Tailwind 4 que rode nele.
* Service worker, modo offline, notificações.
* HTTPS na rede local (certificado próprio nos tablets) — é o que tornaria o
  Android instalável como PWA; sessão própria, se um dia valer a pena.
* Qualquer mudança nas telas do portal ou do painel.
