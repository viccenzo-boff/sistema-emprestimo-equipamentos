# Quick Start — Front Desk

The admin panel opens on the front desk computer and has five tabs. One of them
has a deadline — **Fila de Devoluções** (Return queue), which holds the devices
already left on the counter and not yet checked. The other four are for looking
things up and for maintenance.

This page is the short version. Each section points to the full process page,
with the screens and the list of error messages.

## Signing in to the admin panel

1. Open the admin panel on the front desk computer.
2. Type your login in the **Usuário** (Username) field.
3. Type your password in the **Senha** (Password) field.
4. Click **Entrar** (Sign in).

Everybody has their own account, and the name of whoever signed in stays at the
bottom of the sidebar. If the accounts still have their initial password, change
it before using the panel at the desk: the **Alterar senha** (Change password)
button sits next to the name.

[Administrator account](../referencia/conta-do-administrador.md) — signing in,
signing out, changing the password, and what to do when nobody remembers it.

## The daily routine: Check the queue and check devices in

This is the only task in the admin panel with a deadline. While a device is in
the queue it is physically on the counter and is **not** offered to anybody else
on the tablet — whoever returned it has already left, and the next person who
needs a laptop cannot see that one.

1. Open the **Fila de Devoluções** (Return queue) tab.
2. Read the row for the device you are holding.
3. Pick the device up from the counter.
4. Check the asset tag on the sticker against the one in the row, character by
   character.
5. Click **Confirmar Recebimento Físico** (Confirm physical receipt) on the row
   for that device.
6. Put the device away on the shelf.

With the whole counter in your hands, the **Confirmar Todas as Devoluções**
(Confirm all returns) button, at the top of the list, does every row at once. It
appears from two devices upwards.

!!! warning "Confirming means the device is in your hand"

    Confirming closes the loan and puts the device back in stock straight away —
    the tablet starts offering it. **There is no screen that reopens a closed
    loan.** If you confirm a row whose device is not on the counter, the system
    starts saying it is on the shelf, and nobody has any reason to look for it
    anymore.

    That is why step 4 exists: checking the asset tag is cheaper than any of the
    ways back.

[Process 3 — Physical check-in](../painel/baixa-fisica.md), with the screens for
each step, the batch button and what to do about each error message.

## Registering equipment

1. Put the sticker on the device, if it does not have one yet.
2. Open the **Inventário** (Inventory) tab.
3. Type in the **Etiqueta** (Asset tag) field exactly what the sticker says.
4. Choose the category in the **Categoria** (Category) field.
5. Click **Cadastrar** (Register).

The category list comes from the **Categorias** (Categories) tab, and that is
the only place that creates a new category — the **Gerenciar** (Manage) link,
next to the label, takes you straight there. It works that way on purpose: two
places creating categories is how "notebook" and "Notebook" end up in the same
cabinet.

[Process 4 — Inventory management](../painel/inventario.md), with the five
procedures of the tab: registering, sending for repair, retiring, changing the
asset tag and looking after the categories.

## Importing the people spreadsheet

1. Open the **Pessoas** (People) tab.
2. Click the dotted area and choose the file.
3. Click **Analisar planilha** (Analyze spreadsheet).
4. Read the four counters and the **O que vai mudar** (What will change) list.
5. Click **Confirmar importação** (Confirm import).

Step 3 **writes nothing** — it reads the file, compares it with what is already
in the database and shows what is going to happen. The preview exists because
the import has no undo: a wrong file, once confirmed, overwrites hundreds of
records, and a report after the fact would only count the damage.

If you do not have a file in the right format yet, the **Baixar planilha
modelo** (Download the template spreadsheet) button, on the same card, generates
a spreadsheet with the columns the panel expects.

[Process 5 — People management](../painel/pessoas.md), with the template
spreadsheet, the field-by-field preview, editing a record and changing an
enrollment number.

## The two kinds of deactivation are not the same rule

This is the most likely confusion of your first few days, because the button has
the same name in both tabs and the behavior is the opposite:

| | **Deactivating a person** | **Deactivating a device** |
| --- | --- | --- |
| With an open loan | **Allowed**, with a warning that names the devices | **Blocked**: instead of the buttons, the row reads "Situação travada até a devolução" (Status locked until the return) |
| What deactivating prevents | Picking up. Returning stays allowed | Being offered on the tablet; the item disappears even from the counts |
| How to undo it | The **Ativar** (Activate) button, one click | The **Reativar** (Reactivate) button, and it comes back as **Disponível** (Available) |
| Is the record deleted? | Never | Never |

The reason for the difference fits in one sentence: **people leave with a device
on them; a device does not leave on its own.**

The person you deactivate is precisely the one who left the institution — and
they nearly always have something in their bag. Blocking the deactivation until
they return it would leave the record active, able to pick up more, until
somebody remembered to come back to it. So deactivating goes through, and their
returns stay allowed on the tablet.

Equipment is the other way round: retiring a device that is in somebody's hands
would create an open loan pointing at an item the system considers out of
circulation. The loan closes first; retirement comes afterwards.

In neither case is the record deleted, and that is deliberate too: the loan
history points at the person and at the device, and a `DELETE` would take last
semester with it. Deactivating is retirement, not deletion.

[Business rules](../referencia/regras-de-negocio.md#deactivating-a-person-and-deactivating-a-device-are-not-the-same-rule)
— this one and the other nine, with the reason behind each.

## If something goes wrong

Each process has its own error table, with the exact message from the screen:
[physical check-in](../painel/baixa-fisica.md#8-common-errors-and-what-to-do),
[inventory](../painel/inventario.md#8-common-errors-and-what-to-do) and
[people](../painel/pessoas.md#8-common-errors-and-what-to-do).

A good part of what looks like a defect is a deliberate rule — the count that
does not go up after a return, the category that refuses to be deleted, the
record that will not disappear from the list. The
[business rules](../referencia/regras-de-negocio.md) and the
[states and transitions](../referencia/estados-e-transicoes.md) pages explain
each one.
