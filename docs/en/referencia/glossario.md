# Glossary

The terms that cross more than one process in this wiki. Where a term has a
technical counterpart — a database field or status — it comes in parentheses,
for anybody who needs to connect the word on screen to the data stored.

A term that appears on a single page lives in that page's own glossary.

The screen labels themselves are in Portuguese and are listed separately, in the
[interface glossary](glossario-ui.md).

## Active loans

The [admin panel](#admin-panel) tab that lists everything somebody is holding
right now — the loans in `ATIVO` (active), with the name of whoever has the
device and since when. On screen it is **Empréstimos Ativos**.

It is **read only**: there is no button on it at all. The person who returns is
the borrower, on the [portal](#portal); what closes a loan is the
[physical check-in](#physical-check-in), in the
[return queue](#return-queue). This tab answers "where is `NOTE-04`?", and
nothing else.

## Admin panel

The front desk screen, on the computer, at `/admin`. It requires an
[administrator](#administrator) login. On screen it is the **Painel**.

It brings together the [return queue](#return-queue), the active loans, the
inventory, the categories and the people records.

## Administrator

Whoever operates the front desk [admin panel](#admin-panel). Everybody has their
own account, with their own login and password — there is no shared password.

The login field is called **Usuário** (Username) on the sign-in screen
(`Administrador.usuario`). That is the only sense in which the word **Usuário**
appears in this system: it never refers to whoever picks equipment up.

There is no screen for registering an administrator. Accounts are born from the
database seeding command, and recovering a forgotten password goes the same way.

## Asset tag

The code stuck on the device, such as `NOTE-01` or `EXT-05`
(`Equipamento.id`). It is what identifies the physical item — two laptops of the
same model have different asset tags. On screen it is the **Etiqueta**.

The asset tag always appears in full and in a monospaced font, because it has to
match the sticker on the device character by character.

## Batch

A gesture that handles several items at once. There are two, and they behave
differently on purpose:

* **"Devolver tudo"** (Return all), on the [portal](#portal): all or nothing.
  The devices go to the [counter](#counter) together, and returning half of them
  would let somebody walk away thinking they had handed everything back.
* **"Confirmar Todas as Devoluções"** (Confirm all returns), in the
  [admin panel](#admin-panel): item by item, and one row failing does not bring
  the others down. The physical gesture has already happened — the front desk
  collected the pile — and a row that left the queue in another tab cannot undo
  the checking of the rest. The summary says what closed and what did not.

Both only appear **from two items upwards**. With a single item, each of them
would duplicate the button on the row just below.

## Category

The group the inventory is organized into and that the [portal](#portal) shows
as a grid: "Notebook", "Tablet", "Extensão" (`Categoria.nome`). On screen it is
the **Categoria**.

The name is unique — it is the database that stops two spellings of the same
thing living in the same cabinet. A category can only be deleted when it is
empty.

## Counter

The physical desk where equipment is handed over and collected. It is not a
screen or a field of the system — it is the only place in the process the system
**cannot** verify. On screen it is the **bancada**.

It is what the [return](#return) refers to: whoever returns something leaves the
device on the counter and says so on the tablet. Between that gesture and the
[physical check-in](#physical-check-in), the device is on the counter and
nowhere in the inventory — that is the [shelf time](#shelf-time).

## Enrollment number

The number that identifies a person in the system, and the key to everything
they do: it is what gets typed on the first screen of the [portal](#portal)
(`Pessoa.matricula`). On screen it is the **Matrícula**.

It accepts digits only, fifteen at most, because that is what the tablet keypad
can type. It is stored as text — leading zeros count, and `0012345` is not the
same as `12345`.

The enrollment number can be corrected in the [admin panel](#admin-panel), and
the correction takes the loan history with it.

## Inactive record (person)

A record taken out of circulation — somebody who suspended their enrollment,
graduated or left the institution (`Pessoa.status = INATIVO`).

The rule is **asymmetric on purpose**: an inactive record **cannot pick up** and
**can return**. People who are deactivated usually have a device in their bag;
blocking both directions would make deactivation guarantee that the device never
came back.

In practice: the enrollment number gets into the [portal](#portal) as usual, and
the [category](#category) grid gives way to an explanation.

A record is never deleted either, for the same reason as
[retirement](#retirement-inactive-item): the history points at it.

## Inventory

All registered equipment, one row per device, grouped by
[category](#category) — and the [admin panel](#admin-panel) tab that shows it.
On screen it is the **Inventário**.

The inventory lists **everything**, including what is under
[maintenance](#maintenance), what is [on loan](#on-loan) and what has been
[retired](#retirement-inactive-item). That is what makes it different from the
[portal](#portal), which only shows what can be taken right now.

## Loan

The record of a device in somebody's hands, with the times of
[pickup](#pickup), [return](#return) and
[physical check-in](#physical-check-in) (`Emprestimo`). On screen it is the
**empréstimo**.

**Each item creates a separate loan.** Somebody who takes a laptop and a power
strip on the same trip to the desk has two loans, which can be returned at
different times.

A loan goes through three states: `ATIVO` (with the person),
`AGUARDANDO_BAIXA` (declared returned, awaiting the front desk) and `CONCLUIDO`
(closed).

## Maintenance

The **temporary** withdrawal of a device for repair
(`Equipamento.status = MANUTENCAO`). The item disappears from the
[portal](#portal) and comes back with one click when the repair is done. On
screen it is **Manutenção**.

Different from [retirement](#retirement-inactive-item), which is permanent.

A device with an open [loan](#loan) cannot go under maintenance: its status is
locked until the cycle closes.

## On loan

The [status](#status) of a device that is off the shelf because somebody picked
it up (`Equipamento.status = EMPRESTADO`). On screen it is **Emprestado**.

What is not obvious: **it stays `EMPRESTADO` after the [return](#return)**.
Declaring a return on the tablet changes the [loan](#loan), not the device —
what puts the device back on the shelf is the
[physical check-in](#physical-check-in).

`EMPRESTADO` is not a button in the [admin panel](#admin-panel): it goes in and
out on its own, through the two gestures that involve somebody carrying the
equipment. The row of an item on loan shows the name of whoever has it instead
of the button.

## Physical check-in

The front desk's check: the equipment has been collected from the counter and
the [loan](#loan) is really closed (`Emprestimo.status` goes from
`AGUARDANDO_BAIXA` to `CONCLUIDO`, and the time is stored in
`Emprestimo.data_baixa`). On screen it is the **baixa física**.

It is here — and only here — that the device becomes available for somebody else
to pick up. The [return](#return) on the tablet does not do that.

## Pickup

The moment the person takes the equipment (`Emprestimo.data_retirada`, with the
device moving to `EMPRESTADO`). On screen it is the **retirada**.

The path is enrollment number → [category](#category) → item → confirmation.
Only available items appear, and only for an active record.

## Portal

The screen on the tablet at the counter, at `/`. It is where students and
teachers do the [pickup](#pickup) and the [return](#return).

It has no login: identification is the [enrollment number](#enrollment-number),
typed at every use. The tablet is shared, so the session ends at the end of each
visit.

## Profile

What the person is at the institution: **Estudante** (Student) or **Professor**
(Teacher) (`Pessoa.perfil`). On screen it is the **Perfil**.

It is the only database field stored exactly in the form it appears on screen.
It is used to filter and count records in the [admin panel](#admin-panel); it
does not change what the person can pick up.

## Retirement (inactive item)

The permanent removal of a device from circulation, **without deleting it**
(`Equipamento.status = INATIVO`). On screen it is **Inativo**, and the action is
**Inativar** (Deactivate).

The item stops appearing on the [portal](#portal) — it does not even enter the
availability counts — and stays in the inventory list, in gray, with a button to
reactivate it.

Equipment is not deleted because the [loan](#loan) history points at it:
deleting the device would take the record of whoever used it last semester along
with it. That is why the icon for the action is a crossed circle and not a trash
can — a trash can promises the record disappears, and it does not.

[Maintenance](#maintenance) is the opposite: temporary, and for repair.

## Return

The **declaration** by whoever is returning: the person says on the tablet that
they have handed the equipment over and left it on the counter
(`Emprestimo.status` goes from `ATIVO` to `AGUARDANDO_BAIXA`, and the time is
stored in `Emprestimo.data_devolucao`). On screen it is the **devolução**.

Returning does **not** free the device for somebody else. What does that is the
[physical check-in](#physical-check-in), at the front desk. The distance between
the two moments is the [shelf time](#shelf-time).

## Return queue

The list of loans in `AGUARDANDO_BAIXA`, waiting for the
[physical check-in](#physical-check-in). It is the first screen of the
[admin panel](#admin-panel), and each row is a physical task: pick the device up
from the counter and check the [asset tag](#asset-tag). On screen it is the
**Fila de Devoluções**.

## Session

The period during which the screen knows who it is talking to. The two halves of
the system handle this in opposite ways:

* **On the [portal](#portal)** there is no login: the session starts when the
  [enrollment number](#enrollment-number) is typed and ends at the **Sair**
  (Exit) button or on its own, after two minutes with no touch. The tablet is
  shared, and a forgotten open screen would let the next person pick equipment
  up in somebody else's name.
* **In the [admin panel](#admin-panel)** the session comes from the
  [administrator](#administrator) login and lasts eight hours — one shift. It
  survives restarting the computer, and is ended by the **Sair do painel** (Sign
  out of the panel) button.

## Shelf time

The interval between the [return](#return) declared on the tablet and the
[physical check-in](#physical-check-in) done at the front desk — the time the
device sat on the counter, invisible to the portal and to the inventory.

It is the measure of the operational bottleneck of the system: while it lasts,
there is equipment physically free that nobody can take.

## Status

The column that says where something is in its life. **The word has two
owners**, and what it means depends on the screen. On screen it is the
**Situação**:

| Where | Possible values |
| --- | --- |
| **Inventário** (Inventory) tab — of a device | **Disponível** (Available), **Emprestado** (On loan), **Manutenção** (Maintenance) or **Inativo** (Inactive) |
| **Pessoas** (People) tab — of a record | **Ativo** (Active) or **Inativo** (Inactive) |

The two **Inativo** share a name and have different rules: on a device it is
[retirement](#retirement-inactive-item) and it locks while there is an open loan;
on a person it is an [inactive record](#inactive-record-person), it is allowed
with an open loan, and it blocks the [pickup](#pickup) only.

The full tour of the statuses is in
[States and transitions](estados-e-transicoes.md).
