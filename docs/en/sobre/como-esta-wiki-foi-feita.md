# How this wiki was made

This page is not a diary. It records the **decisions** that produced the wiki
you are reading, and each one comes with the alternative that was discarded and
the reason — because a decision without a discarded alternative is marketing,
and marketing helps nobody repeat the work.

Where something was measured, the number is right there. Several of them
contradict what seemed obvious before the measurement.

## Before, where the knowledge lived

When the documentation started, the repository had four documents and none of
them spoke to the people who operate the system:

| Document | Written for | What it answered |
| --- | --- | --- |
| `README.md` | Whoever installs and runs the code | How to start the project, which scripts exist |
| `AGENTS.md` | Whoever changes the code | Why each technical decision was made |
| `especificacoes/spec.md` | Whoever specified the product | What the system must do |
| 24 task statements | Whoever built each piece | What that task asked for |

`CONTRIBUTING.md` existed with **zero bytes**. The `docs/` folder did not exist.

In other words, someone standing at the counter with a tablet in front of them,
or at the front desk with the return queue open, had nowhere to look. The
operational knowledge sat entirely in the head of the person who built it, and
the only way to consult it was to ask.

## The decisions

### 1. Model in BPMN before writing the first page

**The decision.** The five processes were drawn in BPMN before any step-by-step
page existed. The diagrams came first, the text came afterwards, out of them.

**The discarded alternative.** Writing the steps first and drawing the diagram
later, from the finished text, which is the natural order because writing is
faster than modeling.

**The reason.** Modeling forces the branches into the open while changing your
mind is still cheap. Text written first turns into **screen narration**: it
describes the happy path, which is what the writer has in mind, and the
decisions end up buried in prose. A diagram does not allow that. A diamond
without both exits named is visibly a hole.

That paid off three times. On the [pickup](../portal/retirada.md),
[return](../portal/devolucao.md) and
[physical check-in](../painel/baixa-fisica.md) pages, the diagram carried a
branch the task statement **did not list** — the race between two tablets over
the same device, the choice between returning one item and returning the whole
list, and the choice between one check-in and the entire queue. All three made
it into the steps because the figure was right there, on the same page,
contradicting the text.

### 2. Describe the product decision, not the screen

**The decision.** Every process page has a section called "Rules that are not
obvious", and it explains **why** the system behaves that way, not what to
click.

**The discarded alternative.** The ordinary manual: eight screens, in order,
with a screenshot on each. It is faster to write and it ages along with the
interface.

**The reason.** People who reach for the manual are rarely lost about *how* to
click. They are lost about *why* the system did what it did, and that answer is
not on the screen.

The most telling example is the two-phase return. When someone returns a device
on the tablet, it does **not** become available again:

> Returning on the tablet is a **declaration**, not a check. While the loan
> waits for check-in, the device is physically on the counter but nobody at the
> front desk has collected it yet. If it went back to available at that moment,
> the tablet would offer another person a device that is still sitting on the
> counter.

A screen manual would describe that as "the equipment shows up in the return
queue" and stop there. Anyone opening the inventory looking for the laptop that
was just returned would go on believing the system got it wrong. The full rule
is in [physical check-in](../painel/baixa-fisica.md) and in
[states and transitions](../referencia/estados-e-transicoes.md).

### 3. Documentation in the same repository as the code

**The decision.** The wiki lives in `docs/`, inside the system repository, and
it is published by an action that runs on every push to the main branch.

**The discarded alternative.** A separate repository just for documentation. It
gives a cleaner artifact to link to, with its own history and without the task
statements in the middle.

**The reason.** Documentation and code in one history is what lets **a rule
change and the manual correction fit in the same commit**. In separate
repositories both steps still exist, the second one depends on somebody
remembering, and the second one is always the one left for later. A wiki that
describes the previous version of a product is worse than no wiki, because it
carries the authority of an official document and the content of a rumor.

The reverse happened during this series, and it is the proof that the
arrangement works. While writing the [people management](../painel/pessoas.md)
page, reading the code revealed that the panel's enrollment number field
accepted 16 digits while the server refused anything above 15. The product fix
and the page that describes it shipped in the same session.

### 4. Document a frozen version

**The decision.** The wiki describes `v1.0`, a fixed tag in the history. The
version selector at the top of the page exists so that future versions live
alongside it instead of replacing it.

**The discarded alternative.** Documenting the main branch, which is the most
recent state and the one the front desk actually uses.

**The reason.** A screenshot of a moving target **is born out of date**. The
main branch keeps moving: one button changes place and the 49 screenshots in
this wiki start showing a screen that no longer exists, without anyone noticing,
because images have no checker. Freezing turns that into an explicit decision.
When the next version of the product ships, somebody publishes its wiki
alongside, and `v1.0` stays correct about `v1.0`.

The price is known and declared on the [home page](../index.md). If the screen
in front of you has a button that no page here mentions, you are on a newer
version.

### 5. Demonstration data instead of blurring the image

**The decision.** No screenshot shows a real person. The scene being
photographed is built by a script — 15 fictional people, 10 loans, 20 devices —
which recreates the same state every time.

**The discarded alternative.** Photographing the real database and blurring
names and enrollment numbers in the images.

**The reason.** There are three problems, and blurring solves none of them.
Image blurring **fails** more often than people expect, and an enrollment number
has few digits, so what remains is a small puzzle. Blurring looks **bad**, and a
screen full of gray rectangles is unreadable exactly where the screenshot was
supposed to teach. Above all, blurring does not solve the problem at its source:
the personal data was still on screen and still in the image file, and one
forgotten screenshot is enough to leak it.

The script has a second effect that only showed up in use. It is
**idempotent**: after exercising a screen by clicking real buttons, running it
again restores the framing. That makes it possible to photograph the same scene
in different sessions, weeks apart, and get the same image.

The fictional cast was chosen too, not drawn at random: one person with **two**
devices, because the batch buttons only appear from two upwards; one inactive
person **who is in the return queue**, because that is the asymmetric rule in
picture form; one name with a lowercase particle, because that is the case the
name normalization handles.

### 6. A controlled vocabulary instead of a Portuguese style linter

<!-- vale Vale.Avoid = NO -->

**The decision.** The text linter checks a list of forbidden spellings on the
Portuguese pages — "usuário" when the subject is a student, "aluno", "o sistema
irá" — and the full Microsoft style only on the English pages.

<!-- vale Vale.Avoid = YES -->

**The discarded alternative.** Turning on a ready-made style for Portuguese as
well, the way it works for English.

**The reason.** **No ready-made style of any quality exists for Portuguese**,
and the attempt to use one was measured. On a test page with four sentences,
**15 of the 19 alerts** were the English spell checker asking whether the writer
really meant "tabela". A gate that is wrong three times out of four is a gate
the next person turns off entirely, and then not even the part that worked
survives.

What remained is small and solves the problem that matters: **two pages
disagreeing about the name of the same thing**. And it settled a word for the
project. Whoever picks equipment up is a *student*, never a "pupil", because
"Estudante" is what the panel has shown since the term was changed in the
system. A wiki saying otherwise would send readers hunting for a filter that has
a different name.

### 7. Gates that fail, and three things they measured

**The decision.** Three checks run on every push, in separate jobs, and
publication **depends** on all three passing: the strict site build, the text
linter, and the link checker over the built site.

**The discarded alternative.** Demoting the inconvenient rules to warnings
instead of turning them off with the reason written beside them. A warning
breaks nothing and leaves everyone in peace.

**The reason.** A warning nobody reads is noise, and noise buries the real
error. With the English style fully on, the linter reported **570 errors**, of
which **569 came from three voice rules** that contradict decisions this wiki
had already published. Demoting those three to warnings would mean 569 lines per
run about settled matters, with the one true error somewhere in the middle. The
three were **turned off with the reason written down**, the other 44 stayed at
full strength, and the real error was fixed in the text.

The three measurements that changed how the gates were built:

- **The strict build passes with a broken anchor.** It classifies "this document
  has no anchor `#x`" as information, and strict mode only promotes *warnings*
  to errors, so the site ships with the broken link printed in the output. That
  was measured four times, across four different tasks, before it became a rule.
  It is the reason a third gate exists.
- **The link checker runs over the built site, not over the source files.** Over
  the source it produced **60 false alerts**: 57 of them because it computes
  each heading's anchor while preserving the accents, whereas the site generator
  normalizes them to ASCII. Obeying the gate would have broken the links on the
  real site.
- **A gate can be green without having looked at anything.** While setting the
  text linter up, the first path pattern matched the top folder and **none below
  it**. The tool reported "0 files" and **exited successfully**. That green is
  indistinguishable from the green of a clean project. Ever since, the first
  assertion about any new checker is **how many files it examined**, not its
  exit code.

### 8. Document a defect instead of fixing it

**The decision.** One admin panel message gives advice that does not work. When
deleting a category that still has equipment, the screen suggests deactivating
the equipment first — and deactivating does **not** unlock the deletion. The
[inventory management](../painel/inventario.md) page quotes the message with its
exact wording and, right below, contradicts the advice.

**The discarded alternative.** Fixing the sentence in the product, which is one
line of code.

**The reason.** The wiki describes version `v1.0`, and the writing rule of this
wiki is to quote the screen **even when the screen is wrong**, because the
sentence is how a reader finds the page, and correcting it in the text would
send that reader looking for a message that does not exist. Fixing the product
is a product task, with its own verification cycle. It remains open and is
recorded as such.

The decision holds as a principle: **the wiki does not fix the system in
writing.** When it finds a defect, the record is honest and the fix becomes
declared work.

## The test worth more than the three gates

No gate catches a page that is entirely correct and still useless. So the wiki's
final criterion is not a tool: it is handing the wiki to someone who has never
seen the system and asking for a pickup using **only** that.

The pass done here followed the pickup page to the letter, doing only what it
says and using only the labels it quotes. The 17 checkpoints matched: every
button quoted exists with the exact wording, and the sequence leads from the
enrollment number keypad to the device in hand.

It found one thing, and it is the kind of thing only a reading finds:

> The page promised that "the category grid appears". It does appear — but for
> someone **already holding a device** the screen is different: the heading
> changes, the list of what is already in their name comes in on the left, and
> the grid shares the space with it. On a portrait tablet, the grid starts at
> 752px of a 1280px screen, below a list the page never mentioned.

Nobody gets stuck. The grid is visible without scrolling in both orientations,
and the number above is what proves it. Still, it is half a second of "is this
the right screen?" for the most common case at the counter, which is precisely
someone who already holds something and came for one more. The page gained an
explicit branch for the two cases.

!!! note "The full test is still pending"

    The pass above was done by the person who built the system, following their
    own page. That finds a wrong label and a missing step. It does **not** find
    the assumption the writer does not know they hold. Only an outsider finds
    that, and that part of the criterion has not been carried out.

## What was left out

Honesty about scope is worth more than a list of achievements.

- **There is no sixth process page.** The reporting and occupancy feature is
  specified and was **not** built. The wiki describes what exists, and it does
  not exist. When it lands, it becomes a new version, published beside this one.
- **The system interface is still Portuguese only.** The wiki is bilingual, the
  product is not. Translating the interface is a week of work that did not fit,
  and the answer was an
  [interface glossary](../referencia/glossario-ui.md) on the English trail: every
  screen label, with what it means. Anyone reading in English has a Portuguese
  screen in front of them, which is why the real label comes in bold and the
  translation in parentheses, never the other way around.
- **The two "Contributing" pages were not translated**, and that is deliberate.
  They teach how to write **in Portuguese**, with the spellings the linter
  forbids. An English copy would be a second owner of the same writing rule.
- **There is no video, animated GIF or interactive tour.** They were out of
  scope from the start: they age worse than a screenshot and have no diff in the
  history.
- **Shelf time is measured and nobody reads it.** The system records when a
  return was declared and when the front desk checked it in, but no screen shows
  the difference. The data is there, waiting for the report.
- **Who performed the check-in is not recorded.** The system knows **when** each
  check happened and now has individual accounts, but the loan does not store
  which account confirmed the receipt.
- **The wrong inventory message is still wrong**, for the reason in decision 8.

## After, what exists today

| What | How much |
| --- | --- |
| Pages | 16 in Portuguese, 15 in English |
| Words | About 26,600 in Portuguese, 30,100 in English |
| Documented processes | 5, with eight sections each |
| BPMN diagrams | 5 `.bpmn` sources under version control, with the SVG derived from them by command |
| Screenshots | 49, none holding real personal data |
| Gates in CI | 3, and publication depends on all three |

The number that matters is not in the table: **anyone arriving with an
operational question now has somewhere to look**, and the answer explains the
decision instead of describing the button.
