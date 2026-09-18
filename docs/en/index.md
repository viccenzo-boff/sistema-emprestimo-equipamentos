# Equipment Loan System

This system records the loan of Unoesc's laptops, tablets and power strips: who
took each device, when they declared it returned, and when the front desk
confirmed receiving it.

!!! note "About this translation"

    The system's interface is **only available in Portuguese**, and so are all
    the screenshots in this wiki. Whenever these pages name a button or a
    field, the real Portuguese label comes in bold and the English meaning
    follows in parentheses — for example, click **Devolver** (Return). Look for
    the Portuguese word on screen.

    Every label is listed in one place, in the
    [interface glossary](referencia/glossario-ui.md).

## Where to start

<div class="grid cards" markdown>

-   **I am a student or a teacher**

    You use the tablet at the front desk to pick up and return equipment.

    [**The tablet in 5 minutes →**](inicio-rapido/estudante-e-professor.md)

-   **I work at the front desk**

    You use the admin panel to check returns in and to look after the inventory
    and the people records.

    [**The admin panel in 10 minutes →**](inicio-rapido/secretario.md)

</div>

The two tracks are independent. People working at the tablet never need to open
an admin panel page, and the other way round as well.

## Shortcuts

<div class="grid" markdown>

<div markdown>

**At the tablet**

- [Pick up equipment](portal/retirada.md)
- [Return equipment](portal/devolucao.md)
- [I returned it and the device still shows as mine](inicio-rapido/estudante-e-professor.md#i-returned-it-and-the-device-still-shows-as-mine)
- [The enrollment number was not found](inicio-rapido/estudante-e-professor.md#the-enrollment-number-was-not-found)

</div>

<div markdown>

**In the admin panel**

- [Check returned devices in](painel/baixa-fisica.md)
- [Register equipment and manage the inventory](painel/inventario.md)
- [Import the people spreadsheet](painel/pessoas.md)
- [See what is running out and take it to the coordination](painel/relatorios.md)
- [Sign in, sign out, change your password](referencia/conta-do-administrador.md)

</div>

</div>

## What else is here

- **[Reference](referencia/glossario.md)** — the
  [glossary](referencia/glossario.md), the
  [interface glossary](referencia/glossario-ui.md), the two
  [state machines](referencia/estados-e-transicoes.md) and the
  [business rules](referencia/regras-de-negocio.md) behind the way the screens
  behave.
- **[About](sobre/arquitetura-do-sistema.md)** — the
  [system architecture](sobre/arquitetura-do-sistema.md) and
  [how this wiki was made](sobre/como-esta-wiki-foi-feita.md).
- **[Contributing](contribuir/guia-de-estilo.md)** — the
  [style guide](contribuir/guia-de-estilo.md) and the
  [process template](contribuir/template-processo.md), for whoever writes a new
  page. These two are in Portuguese.
- **[Installation](instalacao/windows-11.md)** — how to install the system as
  a Windows service on the front desk computer, with the tablet on the Wi-Fi,
  a daily backup and a read-only copy for queries. In Portuguese: it quotes
  Windows labels as the person at the front desk sees them.

## The version this wiki describes

!!! info "This wiki describes version v1.0 of the system"

    `v1.0` is the first version delivered to the academic coordination, and
    the only one: the tablet with pickup, return and the anonymous rating at
    the end of a pickup (the four faces and the suggestion-form QR code), and
    the panel with the return queue, the inventory, the people and the four
    reports — **Ocupação e picos de uso** (Occupancy and usage peaks),
    **Satisfação** (Satisfaction), **Ranking de Consumo** (Usage ranking) and
    **Índice de Manutenção** (Maintenance rate), with the period selector, the
    `.xlsx` export and the history of who changed each device's status. When
    a new version comes, it enters the version selector at the top of the
    page next to this one — which stays correct about `v1.0`.

## Where to ask for help

**At the tablet**, the front desk is who solves it — an enrollment number that
will not go through, an inactive record, a device missing from the list, all
need somebody with the admin panel open. The error table of each process says
what to do before you leave the counter:
[pickup](portal/retirada.md#8-common-errors-and-what-to-do) and
[return](portal/devolucao.md#8-common-errors-and-what-to-do).

**In the admin panel**, start with the
[Reference](referencia/regras-de-negocio.md) pages: most of what looks like a
defect is a deliberate business rule, and it is explained there. A forgotten
password has a [procedure of its own](referencia/conta-do-administrador.md#forgotten-password)
and is not solved from the screen.

**If the system really is wrong** — the screen contradicts this wiki, or this
wiki is out of date — the place to report it is the
[project repository](https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos/issues).
