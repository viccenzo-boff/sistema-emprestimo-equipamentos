# 6. Reports

!!! info "Screen labels stay in Portuguese"

    The system itself is not translated. Every label is quoted the way it
    appears on screen, in bold, with the English meaning in parentheses:
    **Relatórios** (Reports). The full list is in the
    [interface glossary](../referencia/glossario-ui.md).

## 1. Purpose of the process

This process turns what the system already recorded into an argument: how many
pickups went through the counter this month, how many devices are off the shelf
right now, and how close each category came to running out.

When it ends, the front desk has a number to take to the academic coordination —
and the coordination has something to decide a purchase with. It is the only
panel screen that changes nothing: it only reads.

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

## 4. Roles and responsibilities

| Role                  | Does                                                                                     | Does not                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Front desk            | Opens the tab, reads the numbers, and takes what is out of stock or low to the coordination. | Fixes nothing here. Whatever looks wrong on this screen is corrected in **Inventário** (Inventory) and **Fila de Devoluções** (Return queue). |
| Academic coordination | Decides the purchase, based on what the front desk shows.                                    | Does not open the panel. It has no account — the panel belongs to the front desk.                                          |
| Panel (the computer)  | Adds up what is stored, at the instant the page opens.                                       | Keeps no report history, sends no alert, and compares nothing with last month. Every opening is a fresh snapshot.           |
| Student or teacher    | Nothing. Takes no part in this process.                                                      | Does not see this screen. What they notice is the consequence: the category shown as out of stock here is the empty one there. |

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

8. The **Ranking de Consumo** (Usage ranking) and **Índice de Manutenção**
   (Maintenance rate) tabs have no report yet. Opening either one shows a notice,
   not an error.

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

!!! question "Why can I not see last month, or export this?"

    Because the report is a snapshot of now, and this is its first version. The
    system stores every loan with its dates — the data to compare months
    **exists** — but the screen that would read it has not been built.

    The same goes for the **Ranking de Consumo** and **Índice de Manutenção**
    tabs: the names are in the menu to say what is coming, and the notice inside
    them says it is not here yet.

## 7. Common errors and what to do

<!-- vale Microsoft.Ellipses = NO -->

| Message on screen                         | Cause                                                                                            | What to do                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "Relatório em desenvolvimento..."         | You opened **Ranking de Consumo** or **Índice de Manutenção**. Neither exists yet.                   | Go back to **Ocupação e picos de uso**, the only tab with data. It is not an error: the screen is telling you so.     |
| "Nenhuma categoria cadastrada ainda."     | No category exists in the system, so there is no shelf to measure.                                   | Create the first one in the **Categorias** tab. Without a category, the tablet shows nothing either.                 |
| "Sem unidades em circulação"              | The category exists but has no device in circulation, either none registered or all of them retired. | Register a device in it through the **Inventário** tab, or delete the category if it is no longer useful.            |
| The sign-in screen replaces the report     | The session expired while the page was open.                                                        | Sign in again. Nothing is lost: this screen stores nothing — see [Administrator account](../referencia/conta-do-administrador.md). |

<!-- vale Microsoft.Ellipses = YES -->
