# 6. Reports

!!! info "Screen labels stay in Portuguese"

    The system itself is not translated. Every label is quoted the way it
    appears on screen, in bold, with the English meaning in parentheses:
    **Relatórios** (Reports). The full list is in the
    [interface glossary](../referencia/glossario-ui.md).

## 1. Purpose of the process

This process turns what the system already recorded into an argument: how many
pickups went through the counter this month, how many devices are off the shelf
right now, how close each category came to running out — and, since `v1.2`,
how people rate the pickup.

When it ends, the front desk has a number to take to the academic coordination —
and the coordination has something to decide a purchase with, or to tell
whether the service needs attention. It is the only panel screen that changes
almost nothing: it reads, and the only thing it stores is the suggestion form
link.

## 2. Preconditions

- You are signed in to the panel. If you are not, sign in with your username and
  password — see [Administrator account](../referencia/conta-do-administrador.md).
- At least one category exists. With none, the screen says so and points to the
  **Categorias** (Categories) tab.
- The numbers belong to **the moment the page opened**. To see the effect of a
  check-in you just confirmed, reload the page.

## 3. Process glossary

Terms that cross several processes live in the
[general glossary](../referencia/glossario.md):
[category](../referencia/glossario.md#category),
[maintenance](../referencia/glossario.md#maintenance),
[retirement](../referencia/glossario.md#retirement-inactive-item),
[counter](../referencia/glossario.md#counter) and
[loan](../referencia/glossario.md#loan).

These belong to this page only:

| Term                              | What it is                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Ocupação** (Occupancy)          | The share of the circulating stock that is **not** on the shelf right now, either on loan or under maintenance. Runs from 0% to 100%.      |
| Circulating stock                 | Every device in the category **except the retired ones**. It is what the shelf can offer, even if part of it is out at the moment.         |
| **Estoque Esgotado** (Out of stock) | The red badge. No unit of that category is available, so whoever reaches the tablet now takes nothing.                                   |
| **Estoque Crítico** (Low stock)   | The amber badge. One or two units are still available.                                                                                     |
| **Empréstimos no Mês** (Loans this month) | How many **pickups** were recorded since the first day of the month. It counts what went out, not what is out.                     |
| **Equipamentos na Rua** (Devices out) | How many devices are off the shelf at this instant, adding the ones people hold to the ones waiting for check-in at the counter.        |
| **Avaliação** (Rating)            | The tap on one of the four faces at the end of a pickup, on the tablet: 1 (**Muito ruim**, very bad), 2 (**Ruim**, bad), 3 (**Bom**, good) or 4 (**Muito bom**, very good). Anonymous — see the [rule below](#why-does-it-not-show-who-voted). |
| Asked                             | One time the faces showed up, whether somebody tapped or not. Each person is asked at most once every 30 days.                       |
| **Taxa de resposta** (Response rate) | Answered ÷ asked, in %. It is the number that reveals survey fatigue before any complaint: when it drops, the average stops meaning much. |
| **Formulário de sugestões** (Suggestion form) | The external form (a Google form, on an institutional account of the sector) that the QR code on the pickup screen opens. The link is set up here. |

## 4. Roles and responsibilities

| Role                  | Does                                                                                     | Does not                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Front desk            | Opens the tab, reads the numbers, and takes what is out of stock or low to the coordination — and the satisfaction average. Sets the suggestion form link up. | Fixes nothing here. Whatever looks wrong on this screen is corrected in **Inventário** (Inventory) and **Fila de Devoluções** (Return queue). Does not see who voted, because nobody does. |
| Academic coordination | Decides the purchase, based on what the front desk shows.                                    | Does not open the panel. It has no account — the panel belongs to the front desk.                                          |
| Panel (the computer)  | Adds up what is stored, at the instant the page opens.                                       | Keeps no report history, sends no alert, and compares nothing with last month. Every opening is a fresh snapshot.           |
| Student or teacher    | Taps a face at the end of a pickup, on the tablet, when the faces show up — or does not. That is their only part. | Does not see this screen. What they notice is the consequence: the category shown as out of stock here is the empty one there. |

## 5. Step by step

A single sequence, from sign-in to the number that comes out of this screen.

1. Sign in to the panel with your username and password.
2. Select **Relatórios** (Reports), the last item in the left menu.

    [![The Reports screen with the occupancy tab open: two cards at the top and the three categories with their bars](../assets/images/relatorios/01-relatorios-ocupacao.png)](../assets/images/relatorios/01-relatorios-ocupacao.png)

3. The **Ocupação e picos de uso** (Occupancy and usage peaks) tab opens by
   default. Read the two cards at the top: **Empréstimos no Mês** is the workload
   that went through the counter, and **Equipamentos na Rua** is what is off the
   shelf now.

    [![The two cards at the top: 10 loans this month and 7 devices out, split into 3 with people and 4 at the counter](../assets/images/relatorios/02-indicadores-do-mes.png)](../assets/images/relatorios/02-indicadores-do-mes.png)

4. Look at the second line of the **Equipamentos na Rua** card: it separates the
   devices people hold from the ones waiting for check-in at the counter. Only
   the second share depends on you — it drops when the
   [physical check-in](baixa-fisica.md) is confirmed.
5. Scroll down to **Esgotamento por categoria** (Stock depletion by category).
   Each row is a shelf, with the bar showing the occupancy and, below it, the
   breakdown in numbers.

    [![The three categories with their bars: notebooks at 56%, tablets at 50% with the low stock badge, and power strips at 40%](../assets/images/relatorios/03-esgotamento-por-categoria.png)](../assets/images/relatorios/03-esgotamento-por-categoria.png)

6. Read the category row from right to left. **56% de ocupação (5 de 9)** means
   that, of the 9 notebooks in circulation, 5 are not on the shelf. Those 5 open
   up below: **4 emprestados · 1 em manutenção** (4 on loan, 1 under
   maintenance).
7. Does any category carry a colored badge next to the numbers?

    - If **Estoque Esgotado** shows up (red) → no unit of that category is left.
      Whoever reaches the tablet now takes nothing. Check the
      [return queue](baixa-fisica.md): if a device is waiting for check-in,
      confirming receipt puts a unit back on the shelf right away. If the queue
      is empty, the number is the purchase argument.

        [![The tablet row at 100% occupancy, 0 free, with the red out of stock badge](../assets/images/relatorios/04-estoque-esgotado.png)](../assets/images/relatorios/04-estoque-esgotado.png)

    - If **Estoque Crítico** shows up (amber) → one or two units are left. Tell
      the coordination before it runs out, and check whether some device under
      maintenance can already return through the **Inventário** tab.
    - If no badge shows up → that category has three or more free units. Nothing
      to do.

8. Select the **Satisfação** (Satisfaction) tab. The two cards are two fixed
   windows — **Últimos 30 dias** (Last 30 days) and **Desde o início** (Since
   the beginning) — and each one brings the average on the 1 to 4 scale, how
   many answers there were and the response rate, and the distribution in four
   bars, one per face.

    [![The satisfaction tab: two cards side by side, each with the average, the answers, the response rate and four bars with a colored face on each, and the download button below](../assets/images/relatorios/06-satisfacao.png)](../assets/images/relatorios/06-satisfacao.png)

9. Read the card from top to bottom: **3,3 de 4** (3.3 out of 4) is the
   average of the ratings; **33 respostas · 87% de taxa de resposta (33 de 38
   pedidas)** says the faces showed up 38 times and 33 people tapped; and the
   bars say how many tapped each face. The bar is the share among the answers,
   and the number next to it is the count.
10. Is there any row? If the tab says "Nenhuma avaliação ainda. Os rostos
    aparecem no tablet ao fim da retirada, uma vez a cada 30 dias por pessoa."
    (No rating yet. The faces show up on the tablet at the end of a pickup,
    once every 30 days per person.), nobody has been asked yet — the cards and
    the download button only show up with the first row.

    [![The satisfaction tab with no rating at all: only the title, the explanation and the sentence saying no rating exists yet](../assets/images/relatorios/08-satisfacao-vazia.png)](../assets/images/relatorios/08-satisfacao-vazia.png)

11. Want to cross the data some other way? Select **Baixar planilha**
    (Download spreadsheet). The `avaliacoes-YYYY-MM-DD.csv` file lands in the
    downloads folder with one row per time the faces showed up, in the `dia`
    (day) and `nota` (rating) columns — the rating blank when nobody answered.
    There is no time, enrollment number or name in the file, and there cannot
    be: the system does not store them. The screen does not reload.
12. Scroll down to **Formulário de sugestões** (Suggestion form). It is the
    link the QR code on the pickup screen opens — paste the full form address,
    starting with `https://`, and select **Salvar** (Save). The preview next to
    it shows the QR code exactly as it appears on the tablet. To take the QR
    code off the tablet, save with the field blank.

    [![The suggestion form card, with the address field filled in, the Save button and the QR code preview on the right](../assets/images/relatorios/07-formulario-de-sugestoes.png)](../assets/images/relatorios/07-formulario-de-sugestoes.png)

    !!! tip "How to create the form"

        In Google Forms, with the **institutional account of the sector** —
        never the personal account of whoever is at the front desk today,
        because it leaves with the person and the sticker keeps pointing at a
        form nobody opens. In Settings → Responses, keep e-mail collection and
        sign-in requirement **off**: the form is anonymous like the faces are.
        Copy the link from Send, paste it here and print the same QR code on a
        sticker next to the tablet — the return shows no QR code, and the
        sticker covers whoever only came to return.

13. The **Ranking de Consumo** (Usage ranking) and **Índice de Manutenção**
    (Maintenance rate) tabs have no report yet. Opening either one shows a
    notice, not an error.

    [![The usage ranking tab selected, showing the dashed box with the report under development notice](../assets/images/relatorios/05-aba-sem-relatorio.png)](../assets/images/relatorios/05-aba-sem-relatorio.png)

## 6. Rules that are not obvious

<a id="why-does-occupancy-count-devices-under-maintenance"></a>

!!! question "Why does occupancy count a device under maintenance together with one on loan?"

    Because the question this screen answers is **"is there a device left for
    whoever arrives now?"**, and for that person the two are the same: the
    notebook in the repair shop and the notebook in somebody's backpack are
    equally off the shelf.

    The consequence is what matters: **100% occupancy means exactly "no unit
    available"**, which is why the full bar and the red badge always appear
    together. If occupancy counted only the loans, a category with three devices
    in repair and the rest on loan would show a half-full bar next to an alert
    saying the stock ran out — and both would be right at the same time.

    The breakdown under the bar keeps the two shares apart, so the decision does
    not get lost. Maintenance is a device that **can** come back; a loan is a
    device that **will** come back.

<a id="why-is-a-retired-device-left-out-of-the-count"></a>

!!! question "Why is a retired device left out of the count?"

    Because it does not come back.
    [Retirement](../referencia/glossario.md#retirement-inactive-item) is the
    permanent exit from circulation — the device stays in the database only so
    the loan history does not lose the reference to it.

    Counting it in the total would make occupancy look lower than it is. A
    category with ten devices, four of them retired and the remaining six on
    loan, would show 60% occupancy with an empty shelf.

    It is the same arithmetic the tablet already does: the grid there says
    "Notebooks — 4 de 9 disponíveis" with ten notebooks registered, because one
    is retired. Retired devices show up on this screen in parentheses, **outside
    the count**, so the numbers still add up against the **Inventário** tab,
    which shows the whole asset base instead.

<a id="why-do-the-loans-this-month-not-drop-when-somebody-returns"></a>

!!! question "Why does Empréstimos no Mês not drop when somebody returns a device?"

    Because it counts **pickups**, and a pickup that happened does not unhappen.
    The number answers "how much work went through the counter this month" and
    climbs until the first day of the next month, when it goes back to zero.

    The card next to it, **Equipamentos na Rua**, is the one that answers "how
    much is out right now". The two measure different things on purpose: one is
    the movement, the other is the stock.

<a id="the-number-does-not-match-the-cabinet"></a>

!!! question "I counted the devices in the cabinet and the number does not match. What is wrong?"

    Almost always nothing. Three differences are possible, and all three are
    deliberate:

    - **Retired devices are outside the count.** They are in the cabinet and not
      in circulation. The total in parentheses next to the row says how many.
    - **Devices at the counter count as off the shelf.** A device somebody just
      returned at the tablet has not gone back into stock yet: it waits for the
      [physical check-in](baixa-fisica.md). While it waits, it sits physically
      on the counter and counts as out.
    - **The numbers belong to the instant the page opened.** A pickup made at
      the tablet while you were reading the screen does not show up until the
      next opening.

    If the difference is none of the three, the place to check item by item is
    the [Inventory](inventario.md) tab.

<a id="why-does-a-category-show-no-units-in-circulation"></a>

!!! question "Why does a category show Sem unidades em circulação instead of out of stock?"

    Because there is no stock to run out. This happens in two cases: the category
    was just created and has not received any device yet, or every device in it
    was retired.

    Marking it red would ask for a purchase nobody asked for — and, worse, it
    would be a permanent red, which teaches the eye to ignore the others. The row
    shows up with no bar, in gray text, and it disappears from the tablet grid
    for the same reason.

<a id="why-does-the-tab-go-back-to-the-first-one"></a>

!!! question "Why does the tab go back to the first one when I reload the page?"

    Because the chosen tab does not go into the address. It is a design choice:
    the whole report already arrives ready when the page opens, and switching
    tabs queries nothing — the switch is instant because nothing goes to the
    server.

    The price is this: reloading goes back to **Ocupação e picos de uso**, and no
    link opens a specific tab directly. For a screen consulted standing up, in
    one session, nobody shares a link to a report tab.

<a id="why-can-i-not-compare-with-last-month"></a>

!!! question "Why can I not see last month, or export the occupancy?"

    Because the occupancy report is a snapshot of now, and this is its first
    version. The system stores every loan with its dates — the data to compare
    months **exists** — but the screen that would read it has not been built.
    The **Satisfação** tab is the only one that exports, and what it exports is
    the raw list, for the crossing to be done elsewhere.

    The same goes for the **Ranking de Consumo** and **Índice de Manutenção**
    tabs: the names are in the menu to say what is coming, and the notice inside
    them says it is not here yet.

<a id="why-does-it-not-show-who-voted"></a>

!!! question "Why does it not show who gave each rating?"

    Because the system **does not store it**. A rating row has only the rating
    and the day — no enrollment number, no profile, no time. A timestamp would
    cross with the pickup time and reveal who gave the 1; the profile would
    point at the teacher of the day. It is not a filter the screen hides: it is
    data that exists nowhere, not in the downloaded spreadsheet, not for
    whoever opens the database.

    The honest limit is the size of the population: on a day when **a single
    person** was asked, whoever reads the database knows whose rating that is.
    The screen never shows it, and the downloaded file only brings day and
    rating — but the rule is worth stating, because it is the only way the
    anonymity promise can be true.

<a id="is-the-average-over-answers-or-over-asked"></a>

!!! question "Is the average over the answers or over the asked?"

    Over the **answers**. Whoever tapped no face did not give a zero — they
    gave no rating. That is why the card shows the two numbers apart: the
    average (of the answers) and the response rate (answers over asked).

    Read the two together. An average of 3.8 with a 30% response rate says less
    than an average of 3.3 with 85%: in the first case almost nobody is
    answering, and the ones who do are the ones with something to say.

<a id="why-30-days"></a>

!!! question "Why is the same person asked only once every 30 days?"

    So the survey does not annoy whoever picks equipment up every day — and so
    the result is not the opinion of whoever picks it up every day. The
    interval is a system rule, not a setting: it counts from the day the faces
    **showed up**, whether the person tapped or not.

    The consequence that matters here: "asked" counts whoever ignored it. If
    the response rate drops, it is not because people started seeing fewer
    faces — it is because they started ignoring them more.

<a id="why-does-the-csv-open-in-a-single-column"></a>

!!! question "I opened the spreadsheet in Excel and everything came in a single column"

    Because the file separates columns with commas (the standard CSV format),
    and Excel in Portuguese expects semicolons when you double-click the file.
    It is not wrong — it is reading with the system separator.

    The way is to import instead of opening: **Data → From Text/CSV**, pick the
    file, and Excel recognizes the comma on its own. Google Sheets and
    LibreOffice open it directly.

## 7. Common errors and what to do

<!-- vale Microsoft.Ellipses = NO -->

| Message on screen                         | Cause                                                                                            | What to do                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "Relatório em desenvolvimento..."         | You opened **Ranking de Consumo** or **Índice de Manutenção**. Neither exists yet.                   | Go back to **Ocupação e picos de uso**, the only tab with data. It is not an error: the screen is telling you so.     |
| "Nenhuma categoria cadastrada ainda."     | No category exists in the system, so there is no shelf to measure.                                   | Create the first one in the **Categorias** tab. Without a category, the tablet shows nothing either.                 |
| "Sem unidades em circulação"              | The category exists but has no device in circulation, either none registered or all of them retired. | Register a device in it through the **Inventário** tab, or delete the category if it is no longer useful.            |
| "Nenhuma avaliação ainda. Os rostos aparecem no tablet ao fim da retirada, uma vez a cada 30 dias por pessoa." | The faces have not shown up for anybody yet — the system was just installed, or nobody picked equipment up since. | Nothing to do. The first card shows up with the first pickup. It is not an error: the screen is telling you so. |
| "Endereço inválido."                      | The link pasted into **Formulário de sugestões** is not a full address, or does not start with `https://`. The detail below says which. | Open the form in the browser, copy the whole address from the address bar and paste it. It has to start with `https://`. |
| "Formulário removido. O QR code não aparece mais no tablet." | You saved the field blank.                                                                 | Not an error: that is what "blank" does. For the QR code to come back, paste the address and save again.           |
| "Sessão encerrada."                       | The session dropped between opening the page and selecting **Salvar**.                              | Reload the page, sign in again and save once more. The address was not stored.                                     |
| The sign-in screen replaces the report     | The session expired while the page was open.                                                        | Sign in again. Nothing is lost: this screen only stores the form link — see [Administrator account](../referencia/conta-do-administrador.md). |

<!-- vale Microsoft.Ellipses = YES -->
