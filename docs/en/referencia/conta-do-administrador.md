# Administrator account

Everybody who operates the [admin panel](glossario.md#admin-panel) has their own
account, with their own login and password. There is no credential shared by the
whole desk.

The reason is accountability: with a single credential, "who checked this device
in?" had no possible answer — to the system, everybody was the same person. The
name of whoever is signed in appears at the bottom of the sidebar, beside the
two account buttons.

## Signing in

1. Open `/admin` on the front desk computer.
2. Fill in **Usuário** (Username) and **Senha** (Password).
3. Click **Entrar** (Sign in).

The **Usuário** (Username) field ignores capitals and surrounding spaces:
`Secretaria` and `secretaria` get into the same account, and a stray space
before or after does no harm. The password does not: there, every character
counts, case included.

!!! info "The session lasts eight hours, and survives a server restart"

    Eight hours is one shift. Past that, the panel goes back to the sign-in
    screen and the password has to be typed again.

    Restarting the front desk computer does **not** sign anybody out — whoever
    was shut down at the end of the day is still signed in the next morning, if
    they are still within the eight hours. If the panel needs to stay closed,
    use **Sair do painel** (Sign out of the panel); closing the window is not
    enough.

## Signing out

The **Sair do painel** (Sign out of the panel) button is at the bottom of the
sidebar, below the name of whoever is signed in. It ends that browser's session
straight away and brings back the sign-in screen.

It is the gesture that closes the shift. A panel left open on a desk computer
gives whoever sits there the whole inventory, the return queue and the people
records.

## Changing your own password

1. Click **Alterar senha** (Change password), at the bottom of the sidebar.
2. Fill in **Senha atual** (Current password), **Nova senha** (New password) and
   **Confirmar nova senha** (Confirm new password).
3. Click **Alterar senha** (Change password) in the dialog.

The success notice names the account — "Senha da conta Secretaria alterada."
(Password for the Secretaria account changed.) — and the dialog closes. There
are four accounts and a single computer: without the name, the sentence would
not settle the question of which password had just changed.

**The new password needs at least eight characters.** There is no requirement
for a digit or a symbol: every extra rule is one more way for the change to be
refused for somebody standing at the desk, and there is no automatic recovery
when somebody gives up halfway.

<a id="changing-the-password-signs-the-account-out-elsewhere"></a>

!!! warning "Changing the password signs the account out on other computers"

    Anybody signed in with that account on another machine lands on the sign-in
    screen at their next request. In the tab where the change was made, nothing
    happens — that person stays exactly where they were.

    This is not a side effect: it is the tool. Changing the password is the
    gesture that ejects whoever was left signed in on the previous shift's
    machine.

## The attempt lockout

**Five wrong passwords in a row lock out new attempts for one minute.** It
applies in both places where a password is checked: the sign-in screen and the
**Senha atual** (Current password) field of the change dialog.

While the lockout stands, **not even the right password gets through** — the
message is "Muitas tentativas seguidas." (Too many attempts in a row.) with the
seconds remaining. The way out is to wait; there is no way to unlock it from the
screen.

Two details that avoid a scare:

* **The lockout is per login typed**, not for the whole panel. Somebody getting
  their password wrong at the keyboard does not lock the other accounts out.
* **Getting the confirmation wrong or choosing a short password does not count**
  as an attempt. Only a wrong current password counts — the rest is a typing
  slip, and counting it would lock people out of their own account through a
  keyboard mishap.

## What this system does not do

Said plainly, because these are the three questions that come up first:

* **There is no screen for registering an administrator.** Accounts are born
  from the database seeding command, on the server. No button in the panel
  creates, edits or deletes an account.
* **There are no roles or permissions.** Every account that gets in sees and
  does exactly the same things. There is no "read only" account.
* **There is no password recovery by email.** The system sends no messages at
  all, and stores no administrator email address.

## Forgotten password

The way back is to **delete the account row in the database and seed again** —
the seeding command recreates the account with the default password, and the
person changes it on first use.

That requires **access to the front desk server**, with the development tools
installed. Somebody at the desk cannot do it on their own.

!!! note "If another account still works, the path is shorter"

    No account can change another one's password — but whoever can still get in
    can carry on operating the panel while access to the server is arranged. The
    day's work does not stop because of a lost password.

The step by step for the command is in the
["Documentação" section of CONTRIBUTING.md](https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos/blob/main/CONTRIBUTING.md)
in the repository, which is where the working notes live.

## Common errors and what to do

<!--
  The left column is a literal quotation of a screen message, and rule 1 of the
  style guide says to transcribe it with the exact spelling — it is by that
  sentence that the reader gets here. One of them says "Informe o usuário e a
  senha.", with the forbidden word in lowercase, and Vale flagged it (checked:
  it really does).

  The escape covers the whole table, not the row: a comment in the middle of a
  table ends it in Python-Markdown, and the rest would become a stray paragraph.
  The whole table is the same kind of content — transcribed messages — which is
  exactly what the vocabulary rule has no way of judging.
-->
<!-- vale Vale.Avoid = NO -->

| Message on screen | Cause | What to do |
| --- | --- | --- |
| "Usuário ou senha inválidos." (Invalid username or password.) | One of the two is wrong. The sentence is the same for both cases on purpose: saying which half was wrong hands over the expensive half to find out. | Check the keyboard — capitals and accents — and try again. The **Usuário** field ignores case; the password does not. |
| "Informe o usuário e a senha." (Enter the username and the password.) | One of the fields was left blank. | Fill in both. |
| "Muitas tentativas seguidas." (Too many attempts in a row.) | Five wrong passwords on the same account. | Wait the seconds the message gives. Not even the right password gets through in that interval. |
| "Nenhum administrador cadastrado." (No administrator registered.) | The database has no account at all — incomplete installation or a recreated database. | Run the seeding command on the server. The screen itself shows which one it is. |
| "Senha atual incorreta." (Current password is incorrect.) | The password typed in the first field of the dialog is not the current one. | Check it and try again. Five wrong tries here also lock you out for a minute. |
| "A confirmação não bate com a nova senha." (The confirmation does not match the new password.) | The two lower fields are different. | Type the new password identically in both. This does **not** count towards the lockout. |
| "A nova senha é igual à atual." (The new password is the same as the current one.) | The chosen password is the one already in use. | Choose another. |
| "A nova senha precisa ter pelo menos 8 caracteres." (The new password needs at least 8 characters.) | The password is too short. | Use eight or more. |
| "Sessão encerrada." (Session ended.) in a panel action | The eight hours ran out, or somebody changed this account's password on another computer. | Sign in again. Nothing that was on screen was saved. |

<!-- vale Vale.Avoid = YES -->

## Where to go next

* What the front desk does after signing in is in
  [Physical check-in](../painel/baixa-fisica.md),
  [Inventory management](../painel/inventario.md) and
  [People management](../painel/pessoas.md).
* The tablet portal has **no** login, and the reason is in
  [Business rules](regras-de-negocio.md#the-portal-has-no-login-and-closes-itself).
