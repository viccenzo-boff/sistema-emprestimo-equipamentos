# Business rules

The product decisions that explain why the system behaves the way it does. Each
rule comes in three parts: **what the system does**, **why it does it that way**
and **what would break** if it did otherwise.

The third part is what gives this page its value. A rule with no stated
consequence is a rule somebody "simplifies" in the first refactor, in good
faith, with no way of knowing what it was holding up.

!!! note "This page does not replace `AGENTS.md`, and that is deliberate"

    [AGENTS.md](https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos/blob/main/AGENTS.md)
    describes the same rules for whoever is going to work on the code: it talks
    about fields, transactions and foreign keys. This page talks about counters,
    devices and the front desk.

    They are two vocabularies for the same set of rules, and both versions need
    to exist — somebody working at the desk should not have to read a coding
    instruction file to understand why a button refused. **Do not try to merge
    them.** When a rule changes, both change.

---

## Returning is declaring, not handing over

**What the system does.** When somebody taps **Confirmar devolução** (Confirm
return) on the [portal](glossario.md#portal), the loan leaves `ATIVO` and goes to
`AGUARDANDO_BAIXA`. The device does **not** become available again: it stays
`EMPRESTADO` until the front desk confirms receiving it in the
[admin panel](glossario.md#admin-panel).

**Why it does it that way.** Because the tablet cannot check anything. It
records a statement — "I left the device on the [counter](glossario.md#counter)"
— and whoever verifies that the device really is there is a person, with the
device in their hands. The [physical check-in](glossario.md#physical-check-in)
is that verification.

**What would break.** The portal would offer somebody else a device that is
still on the counter — or that never got there. The second person would do the
pickup, go to the shelf and find nothing; and the system would show two people
with the same device, with no error anywhere.

The interval between the two moments has a name: it is the
[shelf time](glossario.md#shelf-time).

---

## Each item picked up is a separate loan

**What the system does.** Somebody who takes a laptop and a power strip on the
same trip to the desk creates **two** records, not one with two items.

**Why it does it that way.** Because the two devices come back at different
times. Returning the power strip today and keeping the laptop until Friday is
the common case, not the exception.

**What would break.** A partial return could not be recorded. The person would
return one item and the system would have to choose between closing the whole
loan (losing sight of the laptop) or closing nothing (keeping the power strip
out of circulation). In the front desk queue, each row would stop being a
physical task with one device and one [asset tag](glossario.md#asset-tag).

---

## The three times are three fields, and each has a single owner

**What the system does.** A loan holds three time stamps: the pickup, the return
declared on the tablet and the check-in confirmed in the panel. One never
overwrites another.

**Why it does it that way.** Because the difference between the second and the
third is the only measure of the operational bottleneck of the system — how long
the device sat on the counter, physically free and invisible to whoever wanted
to take it.

**What would break.** If the check-in rewrote the time of the return, the two
stamps would be identical and the shelf time would be **zero forever**. And it
would be zero in silence: the records would still be right, the report would
still add up, and the number would merely say there is no bottleneck at all.

!!! info "The technical note about that regression lives on the check-in page"

    It is in
    [Physical check-in, §7](../painel/baixa-fisica.md#7-rules-that-are-not-obvious),
    in a collapsed block, and it is not repeated here — saying the same thing in
    two places is how the two versions start disagreeing.

---

## Retiring a device is not deleting it

**What the system does.** A device leaving circulation for good goes to
`INATIVO`. It disappears from the portal — availability counts included — and
stays in the inventory list, in gray, with a button to reactivate it. No screen
deletes equipment.

**Why it does it that way.** Because the loan history points at the device.
Deleting `NOTE-03` would take with it the record of whoever used it last
semester, and with that the answer to "who had this laptop when the screen
broke".

**What would break.** The system would lose exactly the information the front
desk looks for when a device comes back faulty. That is why the icon for the
action is a crossed circle and not a trash can: a trash can promises the record
disappears, and it does not.

[Maintenance](glossario.md#maintenance) is the opposite — temporary, for repair,
with a one-click way back.

---

## Categories can be deleted; equipment and people, never

**What the system does.** A [category](glossario.md#category) can really be
deleted, but only when it is empty. What refuses the deletion of a category in
use is the database, not the screen.

**Why it does it that way.** No loan points at a category — it is only the name
of the shelf. Equipment and people, on the other hand, are pointed at by the
history, and that is why deactivation is the only way out for both.

**What would break.** If the refusal lived only in the screen, a path that did
not go through it would leave equipment pointing at a category that no longer
exists — and it would vanish from the whole portal, because the grid is
organized by category.

!!! warning "The refusal message gives advice that does not work"

    It tells you to deactivate the equipment in the category before deleting it,
    and **that does not allow the deletion**: an inactive item is still linked
    and the database refuses just the same. Since there is no screen that moves
    equipment between categories, and equipment is never deleted, **a category
    with equipment cannot be deleted from the admin panel**.

    The real behavior and the way out are in
    [Inventory management, §7](../painel/inventario.md#the-message-says-to-deactivate-the-devices-does-that-allow-deletion).
    The sentence on screen is a known defect and still open.

---

## Deactivating a person and deactivating a device are not the same rule

**What the system does.** The two fields share a name and have opposite rules
about open loans:

| | Person | Equipment |
| --- | --- | --- |
| Deactivating with an open loan | **Allowed**, with a warning | **Refused** until the cycle closes |
| Effect on the portal | Gets in, but cannot pick up | Disappears, counts included |

**Why it does it that way.** People who are deactivated — enrollment suspended,
graduated, left the institution — nearly always have a device in their bag. That
is exactly the moment the front desk needs to deactivate them, and blocking it
until the return would leave the record able to pick more things up until
somebody remembered to go back to it.

Equipment is the opposite: changing its status in the middle of an open loan
would create the inconsistency the
[cross table](estados-e-transicoes.md#both-at-once) marks as impossible.

**What would break.** Blocking the deactivation of people would produce active
records nobody wants active. Allowing it for equipment would produce a device
"under maintenance" that is in somebody's hands.

---

## An inactive record can return, and cannot pick up

**What the system does.** The enrollment number of an
[inactive record](glossario.md#inactive-record-person) gets into the portal as
usual. The **Meus equipamentos** (My equipment) list appears and works; the
category grid gives way to an explanation.

**Why it does it that way.** The asymmetry is the whole rule. Somebody returning
something is not asking the system for anything — they are handing something
over. Blocking both directions would turn deactivation into a guarantee that the
device never comes back.

**What would break.** The device would be stuck: out of circulation in the
system, inside a bag out in the street, and with no gesture available to
whoever wanted to return it. The front desk would have to reactivate the record
just to let the person return it, and then remember to deactivate it again.

---

## The enrollment number is text, and correcting it takes the history along

**What the system does.** The enrollment number accepts **digits only, fifteen
at most**, and is stored as text. It can be corrected in the panel, and that
person's loans follow the correction in the same operation.

**Why it does it that way.** Stored as a number, `0012345` would become `12345`
— two different records for the same person, and the number on the ID card would
stop working on the tablet. The fifteen-digit limit and the refusal of letters
come from the portal keypad, which is numeric: the rule is the one from the most
restrictive consumer, not from the screen that registers.

**What would break.** A looser validation in the panel would allow an enrollment
number **nobody can type on the tablet** — a record that exists, appears in the
lists and is useless. And a correction that did not take the history along would
leave old loans pointing at an enrollment number that no longer exists.

---

## The import shows before it writes, and preserves what the spreadsheet does not carry

**What the system does.** The spreadsheet import has a mandatory preview, which
writes nothing, splitting the rows into four groups: register, update, no change
and error. On writing, **a column the file did not carry is a field the database
preserves**.

**Why it does it that way.** The operation has no undo, and a wrong file would
overwrite hundreds of records at once. The preview is the only chance to see the
damage before it happens.

The preservation exists because the course office's spreadsheet does not know
everything: it does not carry the status column, for example. If absence counted
as "delete", importing Monday's list would reactivate every record the front desk
deactivated last week.

**What would break.** Without the preview, a report after the fact would only
count the damage. Without the preservation, every import would silently undo the
manual work done in the panel since the previous one.

---

## The portal has no login, and closes itself

**What the system does.** The portal asks for no password: identification is the
[enrollment number](glossario.md#enrollment-number), typed at every visit. After
two minutes with no touch, the screen goes back to the start.

**Why it does it that way.** The tablet sits on the counter and is shared. A
password on a shared device is a password somebody writes on a note stuck to the
back.

**What would break.** Without the automatic ending, the next person arriving at
the counter would find somebody else's screen — and would be able to pick
equipment up in their name, or declare a return that never happened.

!!! info "This applies to the portal only"

    The front desk panel requires individual logins and passwords, and its
    behavior is in
    [Administrator account](conta-do-administrador.md).

---

## Where to go next

* The complete design of the transitions is in
  [States and transitions](estados-e-transicoes.md).
* The vocabulary is in the [Glossary](glossario.md).
* Each rule appears again, in the context of the gesture that triggers it, in
  section 7 of the five process pages.
