# Quick Start — Students and Teachers

The tablet sits on the front desk counter and does two things: it hands
equipment out, and it takes your word that a device has come back. There is no
login and no password — your enrollment number identifies you.

This page is the short version. Each section points to the full process page,
with the screens and the list of error messages.

!!! warning "The screen goes back to the start on its own"

    After two minutes with no touch, the portal ends the session and returns to
    the enrollment number screen. The tablet belongs to everybody, and a
    forgotten open session is the next person picking up equipment in your name.
    If that happens halfway through, start again — nothing that was only
    selected has been recorded.

## Picking equipment up

1. Type your enrollment number on the on-screen keypad, leading zeros included.
2. Tap **Continuar** (Continue).
3. Check the name that appears in the top right corner.
4. Tap the card of the category you want.
5. Tap the asset tag of each device you are taking.
6. Check the bar at the bottom, which lists what is selected.
7. Tap **Confirmar retirada** (Confirm pickup).
8. Take the devices shown on screen from the counter, checking each asset tag.

Each device becomes a **separate** loan, even though you confirmed only once —
which is why you can return the laptop on Tuesday and keep the power strip until
Friday.

[Process 1 — Equipment pickup](../portal/retirada.md), with the screens for each
step and the five error messages you can get.

## Returning equipment

1. Type your enrollment number on the on-screen keypad.
2. Tap **Continuar** (Continue).
3. Look at the **Meus equipamentos** (My equipment) section, on the left.
4. Leave the device you came to return on the counter.
5. Tap **Devolver** (Return) on the row for that device — or **Devolver tudo**
   (Return all), above the list, to hand everything back at once.
6. Check the asset tag at the top of the dialog against the one on the device.
7. Tap **Confirmar devolução** (Confirm return).

!!! danger "Step 4 is the only one the system cannot check"

    The dialog says **"Deixe o equipamento na bancada"** (Leave the device on
    the counter) because that is exactly what you have to do before confirming.
    The tablet records what you declare: if you confirm and walk away with the
    device in your bag, the record says it came back, the front desk looks for
    it on the counter and does not find it. No error appears on screen to warn
    you — the mismatch shows up later, as a missing device, in your name.

[Process 2 — Equipment return](../portal/devolucao.md), with the screens for
each step and what to do about each error message.

## Three questions that come up every week

### The enrollment number was not found

The screen stays on the enrollment number and shows
**"Matrícula 9999999 não encontrada."** (Enrollment number 9999999 not found.),
with the digits you typed.

Nearly always it is a wrong digit or a missing leading zero: `0012345` and
`12345` are different enrollment numbers to the system, and the on-screen keypad
completes neither of them. Check the digits and type them again.

If they are right, the record was never imported — ask the front desk, who fix
that in a minute from the admin panel.

### The record is inactive

You get in normally, your name appears at the top, and where the category grid
should be you get **"Este cadastro está inativo e não pode retirar
equipamento."** (This record is inactive and cannot pick equipment up.)

The block works in one direction only, and that is deliberate: it stops
**pickups** and allows **returns**. People who are deactivated — enrollment
suspended, graduated, left the institution — nearly always have a device in
their bag. If the portal blocked both directions, deactivating somebody would
guarantee that their device never comes back to the cabinet.

So: if you are holding a device, return it as usual. To pick equipment up again,
ask the front desk.

### I returned it and the device still shows as mine

**On your screen it does not.** The moment you confirm, the item leaves
**Meus equipamentos** (My equipment) — if it is still there, the return was not
confirmed, and you need to repeat the steps above.

**To the front desk it is still in your name** until somebody picks the device
up from the counter and confirms that in the admin panel. In their inventory,
the row for the device reads **"Devolução informada por … — aguarda
conferência"** (Return declared by … — awaiting check).

Returning on the tablet is a **declaration**, not a check. Until somebody at the
front desk has the device in their hands, the system has no way of knowing it is
really on the counter — and so it does not offer it to anybody else. You can see
this on the screen itself: the count in the category grid **does not go up**
when you return something.

That has two practical consequences:

- **You cannot pick up again the device you have just returned.** It is offered
  once the front desk confirms receiving it.
- **The time recorded as your return is the time of your tap**, not the time of
  the check. A slow front desk does not count against you.

If the wait gets unreasonable, say so at the desk: what is missing is the
physical step, not a stuck record. That is the
[physical check-in](../painel/baixa-fisica.md), on the other side of the counter.

## If something goes wrong

Each process has an error table that tells you what to do without leaving the
counter: [pickup](../portal/retirada.md#8-common-errors-and-what-to-do) and
[return](../portal/devolucao.md#8-common-errors-and-what-to-do). Whatever those
tables do not solve, the front desk does — they are the ones with the admin
panel.
