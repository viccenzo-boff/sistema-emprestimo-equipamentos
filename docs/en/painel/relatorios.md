# 6. Reports

!!! info "Screen labels stay in Portuguese"

    The system itself is not translated. Every label is quoted the way it
    appears on screen, in bold, with the English meaning in parentheses:
    **Relatórios** (Reports). The full list is in the
    [interface glossary](../referencia/glossario-ui.md).

## 1. Purpose of the process

This process turns what the system already recorded into an argument: how many
pickups went through the counter in the chosen period, how many devices are off
the shelf right now, how close each category came to running out — and, since
`v1.2`, how people rate the pickup and **what goes out, who takes it and for how
long**, in the usage ranking.

When it ends, the front desk has a number to take to the academic coordination
— or a spreadsheet, because the tabs with a period export what is on screen as
`.xlsx` — and the coordination has something to decide a purchase with, or to
tell whether the service needs attention. It is the only panel screen that
changes almost nothing: it reads, and the only thing it stores is the suggestion
form link.

## 2. Preconditions

- You are signed in to the panel. If you are not, sign in with your username and
  password — see [Administrator account](../referencia/conta-do-administrador.md).
- At least one category exists. With none, the screen says so and points to the
  **Categorias** (Categories) tab.
- The numbers belong to **the moment the page opened**. To see the effect of a
  check-in you just confirmed, reload the page.
- With no period chosen, the screen shows the **current month**. The period
  lives in the page address, so a saved link always opens the same period —
  not "whatever month it is now".

## 3. Process glossary

Terms that cross several processes live in the
[general glossary](../referencia/glossario.md):
[category](../referencia/glossario.md#category),
[maintenance](../referencia/glossario.md#maintenance),
[retirement](../referencia/glossario.md#retirement-inactive-item),
[counter](../referencia/glossario.md#counter),
[loan](../referencia/glossario.md#loan) and
[shelf time](../referencia/glossario.md#shelf-time).

These belong to this page only:

| Term                              | What it is                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Período** (Period)              | The date window the reports obey: a day, a month, a year or any interval, chosen on the line above the tabs. The default is the current month. |
| **Retiradas no período** (Pickups in the period) | How many **pickups** were recorded inside the period. It counts what went out, not what is out. A loan belongs to the period it was picked up in, and to that one only. |
| **Retiradas por dia** (Pickups per day) | The usage peaks chart: how many pickups there were on each day of the period. Above 31 days the chart groups by week; above 182, by month — and the title says which. |
| **Ocupação** (Occupancy)          | The share of the circulating stock that is **not** on the shelf right now, either on loan or under maintenance. Runs from 0% to 100%.      |
| Circulating stock                 | Every device in the category **except the retired ones**. It is what the shelf can offer, even if part of it is out at the moment.         |
| **Estoque Esgotado** (Out of stock) | The red badge. No unit of that category is available, so whoever reaches the tablet now takes nothing.                                   |
| **Estoque Crítico** (Low stock)   | The amber badge. One or two units are still available.                                                                                     |
| **Equipamentos na Rua** (Devices out) | How many devices are off the shelf at this instant, adding the ones people hold to the ones waiting for check-in at the counter.        |
| **Tempo de uso** (Usage time)     | From the pickup to the return declared at the tablet. It only counts on loans already returned.                                            |
| **Tempo de prateleira** (Shelf time) | From the declared return to the physical check-in — the time the device sat at the counter. It only counts on completed loans that carry both records. |
| **Mediana** (Median)              | The middle value: half of the loans fell below it, half above. The times on this screen are medians, not averages — see the [rule below](#why-medians). |
| Ranking                           | A table ordered by pickups, with a bar on each row proportional to the largest in the table. There are three: by device, by category and by person. |
| **Fatia** (Share)                 | In the ranking by category, that category's part of the period's total pickups, in %.                                                     |
| **Avaliação** (Rating)            | The tap on one of the four faces at the end of a pickup, on the tablet: 1 (**Muito ruim**, very bad), 2 (**Ruim**, bad), 3 (**Bom**, good) or 4 (**Muito bom**, very good). Anonymous — see the [rule below](#why-does-it-not-show-who-voted). |
| Asked                             | One time the faces showed up, whether somebody tapped or not. Each person is asked at most once every 30 days.                       |
| **Taxa de resposta** (Response rate) | Answered ÷ asked, in %. It is the number that reveals survey fatigue before any complaint: when it drops, the average stops meaning much. |
| **Formulário de sugestões** (Suggestion form) | The external form (a Google form, on an institutional account of the sector) that the QR code on the pickup screen opens. The link is set up here. |

## 4. Roles and responsibilities

| Role                  | Does                                                                                     | Does not                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Front desk            | Chooses the period, opens the tab, reads the numbers, and takes to the coordination what is out of stock or low, who picks up the most, and the satisfaction average — on screen or in the exported spreadsheet. Sets the suggestion form link up. | Fixes nothing here. Whatever looks wrong on this screen is corrected in **Inventário** (Inventory) and **Fila de Devoluções** (Return queue). Does not see who voted, because nobody does. |
| Academic coordination | Decides the purchase and the usage policy, based on what the front desk shows — or on the spreadsheet it receives. | Does not open the panel. It has no account — the panel belongs to the front desk.                                          |
| Panel (the computer)  | Adds up what is stored, at the instant the page opens, inside the chosen period.             | Keeps no report history, sends no alert, and compares nothing with the previous period. Every opening is a fresh snapshot.  |
| Student or teacher    | Taps a face at the end of a pickup, on the tablet, when the faces show up — or does not. That is their only part. | Does not see this screen. What they notice is the consequence: the category shown as out of stock here is the empty one there. |

## 5. Step by step

A single sequence, from sign-in to the spreadsheet that comes out of this screen.

1. Sign in to the panel with your username and password.
2. Select **Relatórios** (Reports), the last item in the left menu.

    [![The Reports screen: the period selector line, the tab bar with the occupancy tab open, the two cards and the pickups per day chart](../assets/images/relatorios/01-relatorios-ocupacao.png)](../assets/images/relatorios/01-relatorios-ocupacao.png)

3. Choose the period on the line above the tabs. It applies to the whole
   screen, and it starts on the **current month**: the field shows the month,
   and the sentence **Mostrando setembro de 2026** (Showing September 2026)
   spells out which window the numbers refer to. There are four units: **Dia**
   (Day), **Mês** (Month), **Ano** (Year) and **Período** (Period).

    [![The selector line with Month selected, the field showing September 2026 and the sentence Showing September 2026](../assets/images/relatorios/02-periodo-mes.png)](../assets/images/relatorios/02-periodo-mes.png)

    - **If it is Day, Month or Year** → select the unit and change the field
      next to it. The report reloads on its own as soon as the date is
      complete; while the server answers, the frame dims and the old number
      stays readable.

        [![The selector with Day selected and a date field](../assets/images/relatorios/03-periodo-dia.png)](../assets/images/relatorios/03-periodo-dia.png)

        [![The selector with Year selected and a list of the years that have pickups](../assets/images/relatorios/04-periodo-ano.png)](../assets/images/relatorios/04-periodo-ano.png)

    - **If it is Period** → fill in both fields, **De** (From) and **até**
      (until), and select **Aplicar** (Apply). Here the screen waits for the
      click on purpose: two fields applied one at a time would reload the
      report with the second one still to be filled.

        [![The selector with Period selected: the From and until fields, and the Apply button](../assets/images/relatorios/05-periodo-intervalo.png)](../assets/images/relatorios/05-periodo-intervalo.png)

4. The **Ocupação e picos de uso** (Occupancy and usage peaks) tab opens by
   default. Read the two cards at the top: **Retiradas no período** is the
   workload that went through the counter in the chosen window, and
   **Equipamentos na Rua** is what is off the shelf now — this one does not
   change with the period.

    [![The two cards at the top: 15 pickups in the period and 7 devices out, split into 3 with people and 4 at the counter](../assets/images/relatorios/06-indicadores-do-periodo.png)](../assets/images/relatorios/06-indicadores-do-periodo.png)

5. Look at the second line of the **Equipamentos na Rua** card: it separates the
   devices people hold from the ones waiting for check-in at the counter. Only
   the second share depends on you — it drops when the
   [physical check-in](baixa-fisica.md) is confirmed.
6. Scroll down to **Picos de uso** (Usage peaks). The **Retiradas por dia**
   chart has one bar per day of the period, including the days with no pickup,
   which show up as zero. The number above the tallest bar is the peak; hover
   (or move with the keyboard arrows) to read the other days.

    [![The pickups per day chart in bars, one bar per day of September and the number 3 above the peak](../assets/images/relatorios/07-retiradas-por-dia-barras.png)](../assets/images/relatorios/07-retiradas-por-dia-barras.png)

    - **If you prefer a line** → select **Linha** (Line), in the corner of the
      chart. The choice is kept on this computer for the next visits.

        [![The same chart as a line](../assets/images/relatorios/08-retiradas-por-dia-linha.png)](../assets/images/relatorios/08-retiradas-por-dia-linha.png)

    - **If you need the exact numbers** → select **Ver como tabela** (View as
      table), below the chart. It is the same series, one row per day.

7. Scroll down to **Esgotamento por categoria** (Stock depletion by category).
   Each row is a shelf, with the bar showing the occupancy and, below it, the
   breakdown in numbers. The sentence right above the list — **Situação atual
   do estoque; o período acima não muda esta lista** (Current stock status; the
   period above does not change this list) — is not decoration: this part of
   the tab is the snapshot of now.

    [![The three categories with their bars: notebooks at 56%, tablets at 50% with the low stock badge, and power strips at 40%](../assets/images/relatorios/09-esgotamento-por-categoria.png)](../assets/images/relatorios/09-esgotamento-por-categoria.png)

8. Read the category row from right to left. **56% de ocupação (5 de 9)** means
   that, of the 9 notebooks in circulation, 5 are not on the shelf. Those 5 open
   up below: **4 emprestados · 1 em manutenção** (4 on loan, 1 under
   maintenance).
9. Does any category carry a colored badge next to the numbers?

    - If **Estoque Esgotado** shows up (red) → no unit of that category is left.
      Whoever reaches the tablet now takes nothing. Check the
      [return queue](baixa-fisica.md): if a device is waiting for check-in,
      confirming receipt puts a unit back on the shelf right away. If the queue
      is empty, the number is the purchase argument.

        [![The tablet row at 100% occupancy, 0 free, with the red out of stock badge](../assets/images/relatorios/10-estoque-esgotado.png)](../assets/images/relatorios/10-estoque-esgotado.png)

    - If **Estoque Crítico** shows up (amber) → one or two units are left. Tell
      the coordination before it runs out, and check whether some device under
      maintenance can already return through the **Inventário** tab.
    - If no badge shows up → that category has three or more free units. Nothing
      to do.

10. Select the **Satisfação** (Satisfaction) tab. The two cards are two fixed
    windows — **Últimos 30 dias** (Last 30 days) and **Desde o início** (Since
    the beginning) — and each one brings the average on the 1 to 4 scale, how
    many answers there were and the response rate, and the distribution in four
    bars, one per face. The line **Esta aba não usa o período acima** (This tab
    does not use the period above) is there as a reminder: the two windows do
    not change with the selector.

    [![The satisfaction tab: the note that the tab does not use the period, two cards side by side with the average, the answers, the response rate and four bars with a colored face on each, and the download button below](../assets/images/relatorios/11-satisfacao.png)](../assets/images/relatorios/11-satisfacao.png)

11. Read the card from top to bottom: **3,3 de 4** (3.3 out of 4) is the
    average of the ratings; **33 respostas · 87% de taxa de resposta (33 de 38
    pedidas)** says the faces showed up 38 times and 33 people tapped; and the
    bars say how many tapped each face. The bar is the share among the answers,
    and the number next to it is the count.
12. Is there any row? If the tab says "Nenhuma avaliação ainda. Os rostos
    aparecem no tablet ao fim da retirada, uma vez a cada 30 dias por pessoa."
    (No rating yet. The faces show up on the tablet at the end of a pickup,
    once every 30 days per person.), nobody has been asked yet — the cards and
    the download button only show up with the first row.

    [![The satisfaction tab with no rating at all: only the title, the explanation and the sentence saying no rating exists yet](../assets/images/relatorios/13-satisfacao-vazia.png)](../assets/images/relatorios/13-satisfacao-vazia.png)

13. Want to cross the ratings some other way? Select **Baixar planilha**
    (Download spreadsheet). The `avaliacoes-YYYY-MM-DD.csv` file lands in the
    downloads folder with one row per time the faces showed up, in the `dia`
    (day) and `nota` (rating) columns — the rating blank when nobody answered.
    There is no time, enrollment number or name in the file, and there cannot
    be: the system does not store them. The screen does not reload.
14. Scroll down to **Formulário de sugestões** (Suggestion form). It is the
    link the QR code on the pickup screen opens — paste the full form address,
    starting with `https://`, and select **Salvar** (Save). The preview next to
    it shows the QR code exactly as it appears on the tablet. To take the QR
    code off the tablet, save with the field blank.

    [![The suggestion form card, with the address field filled in, the Save button and the QR code preview on the right](../assets/images/relatorios/12-formulario-de-sugestoes.png)](../assets/images/relatorios/12-formulario-de-sugestoes.png)

    !!! tip "How to create the form"

        In Google Forms, with the **institutional account of the sector** —
        never the personal account of whoever is at the front desk today,
        because it leaves with the person and the sticker keeps pointing at a
        form nobody opens. In Settings → Responses, keep e-mail collection and
        sign-in requirement **off**: the form is anonymous like the faces are.
        Copy the link from Send, paste it here and print the same QR code on a
        sticker next to the tablet — the return shows no QR code, and the
        sticker covers whoever only came to return.

15. Select the **Ranking de Consumo** (Usage ranking) tab. It obeys the same
    period as the top. The four cards say how many pickups there were, how many
    distinct people picked up, and the two medians: **Tempo de uso** (usage
    time, from pickup to the declared return) and **Tempo de prateleira**
    (shelf time, from the return to the physical check-in). A card showing "—"
    is a median with no sample — nobody returned yet, or nobody picked up.

    [![The usage ranking tab: four cards at the top, the pickups by category chart in bars on the left and the table by category on the right](../assets/images/relatorios/14-ranking-de-consumo.png)](../assets/images/relatorios/14-ranking-de-consumo.png)

16. Read **Retiradas por categoria** (Pickups by category): the chart and the
    table next to it say the same thing. The table lists every category,
    including the ones nobody picked up from, with each one's **fatia** (share)
    of the total.

    [![The pickups by category chart in horizontal bars, one per category, each in its own color](../assets/images/relatorios/15-retiradas-por-categoria-barras.png)](../assets/images/relatorios/15-retiradas-por-categoria-barras.png)

    - **If you prefer the pie** → select **Pizza** (Pie). It is the only
      composition on the screen where a pie makes sense; above six categories,
      the smallest ones become "Outras" (Others).

        [![The same chart as a pie, with the percentage written on the slices and the legend below](../assets/images/relatorios/16-retiradas-por-categoria-pizza.png)](../assets/images/relatorios/16-retiradas-por-categoria-pizza.png)

17. Scroll down to **Por equipamento** (By device). Every device in circulation
    is listed, including the ones with zero pickups — the zero rows go to the
    end, in gray. A retired device only shows up if it has a pickup in the
    period, with **Inativo** (Inactive) as its status on the row.

    [![The ranking by device: asset tag, category, current status, pickups, the bar and the median usage, from the most picked up to the least](../assets/images/relatorios/17-ranking-por-equipamento.png)](../assets/images/relatorios/17-ranking-por-equipamento.png)

18. Scroll down to **Por pessoa** (By person). Only whoever picked up at least
    once in the period is listed; the name is today's record.

    [![The ranking by person: name, enrollment number, profile, pickups, the bar and the median usage](../assets/images/relatorios/18-ranking-por-pessoa.png)](../assets/images/relatorios/18-ranking-por-pessoa.png)

19. Want to take the numbers to the coordination? Select **Baixar planilha
    (.xlsx)** (Download spreadsheet), at the top of the tab. The
    `consumo-YYYY-MM-DD-a-YYYY-MM-DD.xlsx` file lands in the downloads folder
    with four sheets: **Equipamentos**, **Categorias** and **Pessoas** are the
    three tables on screen, column by column; **Retiradas** is one row per loan
    in the period, with asset tag, category, pickup, declared return, check-in,
    status and the two times — **without name or enrollment number**. Counts
    and times go as numbers (the times in minutes), so Excel can add them up
    and average them. The **Ocupação e picos de uso** tab has the same button,
    and its file (`ocupacao-…xlsx`) brings **Categorias** (the stock snapshot,
    with the reading date and time on the first row) and the **Retiradas por
    dia** series. The screen does not reload.
20. Pasted a link with a date that does not exist, or with the end before the
    start? The screen warns you and shows the current month, instead of
    failing.

    [![The period selector and, below it, the amber notice Invalid period. Showing the current month.](../assets/images/relatorios/19-periodo-invalido.png)](../assets/images/relatorios/19-periodo-invalido.png)

21. The **Índice de Manutenção** (Maintenance rate) tab has no report yet.
    Opening it shows a notice, not an error.

    [![The maintenance rate tab selected, showing the dashed box with the report under development notice and the three reports that exist](../assets/images/relatorios/20-aba-sem-relatorio.png)](../assets/images/relatorios/20-aba-sem-relatorio.png)

## 6. Rules that are not obvious

<a id="the-tab-and-the-period-live-in-the-address"></a>

!!! question "Why do the tab and the period live in the page address?"

    Because changing the period is a new query to the database, and the way to
    make a new query is to navigate: the address carries `de` and `ate` with
    resolved dates — never "this month". A link saved today shows September in
    November, and reloading the page (F5) keeps the period **and** the tab.

    Switching tabs, in turn, does not go to the server: the four panels
    already arrived ready, and the address is only updated so the link stays
    right. This reverses a choice from the first version of this screen, where
    the tab went back to the first one on every reload — the reason for that
    choice (no link worth sharing) went away when the period moved into the
    address.

<a id="what-enters-the-period-is-the-pickup"></a>

!!! question "A device picked up in August and returned in September counts in which month?"

    In **August**. What enters the period is the **pickup**: a loan belongs to
    the period it was picked up in, and to that one only. A return outside the
    period does not change the attribution, and its usage time — which crosses
    the month boundary — enters August's median.

    The rule is the same for the three rankings, the cards and the chart,
    because two rules would give two totals for the same question.

<a id="why-medians"></a>

!!! question "Why are the times medians, and not averages?"

    Because a notebook forgotten over the weekend skews the average of a whole
    week: ten two-hour loans and one three-day loan give an eight-hour average
    that describes none of them. The median is the middle value — half fell
    below, half above — and one extreme case does not drag it.

    Loans still open count as pickups and stay **out** of the usage median:
    they have no return yet. And shelf time only counts on completed loans
    that carry both records; the ones completed before the system recorded the
    physical check-in stay out on their own, instead of entering as zero.

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

<a id="why-does-occupancy-not-obey-the-period"></a>

!!! question "I chose August and the category list did not change. Is that right?"

    It is. Occupancy by category is the **snapshot of now**, and there is no
    such thing as "occupancy on August 3rd": the system does not store each
    device's status on each day, only today's. What obeys the period on that
    tab is the **Retiradas no período** card and the **Retiradas por dia**
    chart. The sentence above the list says so, so nobody reads the bars as if
    they belonged to the chosen month.

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

    In the **Ranking de Consumo** the rule is different, and deliberately so: a
    retired device **enters** the ranking by device if it has a pickup in the
    period, with **Inativo** as its status on the row. A whole-year report
    covers months when it still circulated, and hiding it would make the rows
    stop adding up against the pickups card. With no pickup in the period, it
    does not show up.

<a id="why-do-the-loans-this-month-not-drop-when-somebody-returns"></a>

!!! question "Why does Retiradas no período not drop when somebody returns a device?"

    Because it counts **pickups**, and a pickup that happened does not unhappen.
    The number answers "how much work went through the counter" in the chosen
    window, and only changes if the window changes.

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

<a id="why-does-satisfaction-not-use-the-period"></a>

!!! question "Why does the Satisfação tab not obey the period?"

    Because its data is different: one whole-number rating per day, with no
    time, no enrollment number and no profile — that is what makes the rating
    anonymous. A one-day filter, on a day when a single person was asked,
    would leave that person's rating one click away. The two windows are fixed
    (**Últimos 30 dias** and **Desde o início**), the tab says so in one line,
    and whoever wants another cut downloads the CSV.

<a id="why-can-i-not-compare-with-last-month"></a>

!!! question "Can I compare with last month?"

    Only by looking at both: choose a month, note the number, choose the other.
    The screen shows no difference and no trend arrow — every opening is a
    snapshot of a single period. To compare several months at once, the way is
    the whole year in the selector (the pickups chart switches to months) or
    the exported spreadsheet, where the coordination builds whatever pivot it
    wants.

    The **Índice de Manutenção** tab is still declared and not built: the name
    is in the menu to say what is coming, and the notice inside it says it is
    not here yet.

<a id="why-does-the-spreadsheet-carry-no-name"></a>

!!! question "The Retiradas sheet in the spreadsheet has no name of who picked up. Why?"

    On purpose. The ranking by person, on screen and in the **Pessoas** sheet
    of the file, already answers "who" — with name, enrollment number and the
    count. The **Retiradas** sheet exists for the pivot (by category, by day,
    by usage time), and the name is not needed for that. Without it, each
    person's named history does not leave the panel inside a file that will
    travel by e-mail.

    The ranking by person is a deliberate exposure, decided by the coordination
    in September 2026 — see
    [Business rules](../referencia/regras-de-negocio.md#the-ranking-by-person-is-deliberate-and-the-rating-stays-anonymous).
    It does not change the anonymity promise of the rating, which is another
    table, with no enrollment number.

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

!!! question "I opened the ratings spreadsheet in Excel and everything came in a single column"

    Because the file separates columns with commas (the standard CSV format),
    and Excel in Portuguese expects semicolons when you double-click the file.
    It is not wrong — it is reading with the system separator.

    The way is to import instead of opening: **Data → From Text/CSV**, pick the
    file, and Excel recognizes the comma on its own. Google Sheets and
    LibreOffice open it directly. The **Consumo** and **Ocupação** spreadsheets
    have no such problem: they are `.xlsx`, and open with two or more columns on
    a double-click.

## 7. Common errors and what to do

<!-- vale Microsoft.Ellipses = NO -->

| Message on screen                         | Cause                                                                                            | What to do                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "Período inválido. Mostrando o mês atual." | The address carried a date that does not exist (February 30th), a wrong format, or a start after the end — almost always a link copied halfway. | Nothing is lost: the screen shows the current month. Choose the period again in the selector. It is not a system error: it is the link. |
| "Nenhuma retirada em …"                   | The chosen period has no pickup recorded. The cards show 0 and "—".                                  | Check the window in the selector. If the period is right, that is the number — nobody picked anything up.             |
| "Relatório em desenvolvimento..."         | You opened **Índice de Manutenção**. That one does not exist yet.                                    | Go back to one of the other three tabs. It is not an error: the screen is telling you so.                            |
| "Nenhuma categoria cadastrada ainda."     | No category exists in the system, so there is no shelf to measure.                                   | Create the first one in the **Categorias** tab. Without a category, the tablet shows nothing either.                 |
| "Sem unidades em circulação"              | The category exists but has no device in circulation, either none registered or all of them retired. | Register a device in it through the **Inventário** tab, or delete the category if it is no longer useful.            |
| "Nenhuma avaliação ainda. Os rostos aparecem no tablet ao fim da retirada, uma vez a cada 30 dias por pessoa." | The faces have not shown up for anybody yet — the system was just installed, or nobody picked equipment up since. | Nothing to do. The first card shows up with the first pickup. It is not an error: the screen is telling you so. |
| "Não foi possível gerar a planilha. Recarregue a página e tente de novo." | The piece of the program that builds the file did not reach the browser — the network dropped halfway, or the page stayed open for too long. | Reload the page and select the button again. Nothing was stored or lost: the spreadsheet is built on the spot, from what is on screen. |
| "Endereço inválido."                      | The link pasted into **Formulário de sugestões** is not a full address, or does not start with `https://`. The detail below says which. | Open the form in the browser, copy the whole address from the address bar and paste it. It has to start with `https://`. |
| "Formulário removido. O QR code não aparece mais no tablet." | You saved the field blank.                                                                 | Not an error: that is what "blank" does. For the QR code to come back, paste the address and save again.           |
| "Sessão encerrada."                       | The session dropped between opening the page and selecting **Salvar**.                              | Reload the page, sign in again and save once more. The address was not stored.                                     |
| The sign-in screen replaces the report     | The session expired while the page was open.                                                        | Sign in again. Nothing is lost: this screen only stores the form link — see [Administrator account](../referencia/conta-do-administrador.md). |

<!-- vale Microsoft.Ellipses = YES -->
