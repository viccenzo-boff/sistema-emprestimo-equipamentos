# Interface glossary

**The system's interface is only available in Portuguese**, and it will not be
translated — the decision and its reason are on the
[home page](../index.md). This page is the bridge: every screen label these
English pages quote, with what it means.

Use it the way you would use a phrasebook. The word in the left column is what
is printed on the screen in front of you; the one in the right column is what it
does.

!!! info "How labels are written on these pages"

    The real Portuguese label comes in bold and the English meaning follows in
    parentheses: *tap **Devolver** (Return)*. The bold half is always the half
    you look for on screen.

Terms that describe the system rather than label a control — loan, shelf time,
physical check-in — are in the [Glossary](glossario.md) instead.

## The portal (the tablet at the counter)

| On screen | In English |
| --- | --- |
| **Continuar** | Continue |
| **Limpar** | Clear (the enrollment number keypad) |
| **Sair** | Exit — ends the visit and returns to the enrollment number screen |
| **Concluir** | Finish — closes the pickup confirmed screen |
| **Meus equipamentos** | My equipment — the list of what is in your name right now |
| **Retirar equipamento** | Pick equipment up — the heading over the category grid, shown only when **Meus equipamentos** is on screen too |
| **Confirmar retirada** | Confirm pickup |
| **Devolver** | Return — the button on one row |
| **Devolver tudo** | Return all — the shortcut above the list, from two items upwards |
| **Devolver equipamento** | Return equipment — the dialog title for one item |
| **Devolver todos os equipamentos** | Return all equipment — the dialog title for a batch |
| **Confirmar devolução** | Confirm return |
| **Confirmar devolução de N itens** | Confirm return of N items — the batch button |
| **Cancelar** | Cancel |
| "4 de 9 disponíveis" | 4 of 9 available — the count on a category card |
| "Nenhum disponível agora" | None available right now — a category with no free unit |
| "O que você vai levar?" | What are you taking? — the heading when you hold no device |
| "O que você quer fazer?" | What do you want to do? — the heading when you already hold one |

## Everywhere in the admin panel

| On screen | In English |
| --- | --- |
| **Painel** | Admin panel |
| **Usuário** | Username — the administrator login field |
| **Senha** | Password |
| **Entrar** | Sign in |
| **Sair do painel** | Sign out of the panel |
| **Alterar senha** | Change password |
| **Senha atual** | Current password |
| **Nova senha** | New password |
| **Confirmar nova senha** | Confirm new password |
| **Editar** | Edit |
| **Salvar** | Save |
| **Excluir** | Delete |
| **Situação** | Status — of a device or of a record, depending on the tab |

## Return queue

| On screen | In English |
| --- | --- |
| **Fila de Devoluções** | Return queue — the first tab of the panel |
| **Confirmar Recebimento Físico** | Confirm physical receipt — the button on one row |
| **Confirmar Todas as Devoluções** | Confirm all returns — the batch button, from two items upwards |
| **Devolução informada em** | Return declared at |
| "Nenhuma devolução esperando" | No returns waiting — the empty queue |
| **Empréstimos Ativos** | Active loans — the read-only tab of what is out right now |

## Inventory and categories

| On screen | In English |
| --- | --- |
| **Inventário** | Inventory |
| **Etiqueta** | Asset tag |
| **Nova etiqueta** | New asset tag |
| **Categoria** | Category |
| **Categorias** | Categories — the tab where categories are created and deleted |
| **Cadastrar** | Register |
| **Gerenciar** | Manage — the link from the category field to the Categories tab |
| **Nome** | Name — of a category |
| **Manutenção** | Maintenance |
| **Inativar** | Deactivate |
| **Reativar** | Reactivate — brings a retired device back as **Disponível** |
| **Equipamentos vinculados** | Linked equipment — the count shown instead of the delete button |
| "Situação travada até a devolução" | Status locked until the return |
| "Devolução informada por … — aguarda conferência" | Return declared by … — awaiting checking |
| "Não aparece no tablet enquanto estiver vazia" | Does not appear on the tablet while empty |
| "No tablet: Projetores" | On the tablet: Projetores — the plural the portal will show |

## People

| On screen | In English |
| --- | --- |
| **Pessoas** | People |
| **Importar planilha** | Import spreadsheet |
| **Baixar planilha modelo** | Download the template spreadsheet |
| **Analisar planilha** | Analyze spreadsheet — builds the preview; writes nothing |
| **Trocar arquivo** | Change file |
| **Confirmar importação** | Confirm import |
| **Cadastrar** | Register — the preview counter of records about to be created |
| **Atualizar** | Update — the preview counter of records that will change |
| **Sem mudança** | No change — records already exactly as the spreadsheet describes them |
| **Com erro** | Error — rows that will be skipped |
| **Colunas lidas** | Columns read |
| **O que vai mudar** | What will change — the field-by-field list |
| **Matrícula** | Enrollment number |
| **Ativar** | Activate |
| **Limpar filtros** | Clear filters |
| "Mostrando 9 de 15 cadastros" | Showing 9 of 15 records |

### The spreadsheet column headers

These are not screen labels: they are the headers the import reads inside the
`.xlsx` file, and they must be written exactly like this.

| In the file | What it holds |
| --- | --- |
| `matricula` | Enrollment number — digits only, up to 15. The only required column |
| `nome` | Full name |
| `perfil` | Profile — `Estudante` or `Professor` |
| `cursos` | Courses, separated by commas |
| `status` | `ATIVO` or `INATIVO` |

## Status names

The badges on screen are in Portuguese; the values stored in the database are in
capitals, and the pages of this wiki quote both.

| On screen | In the database | In English |
| --- | --- | --- |
| **Disponível** | `DISPONIVEL` | Available — on the shelf, offered on the tablet |
| **Emprestado** | `EMPRESTADO` | On loan — somebody has it, or has declared it returned and it is not checked yet |
| **Manutenção** | `MANUTENCAO` | Maintenance — temporarily out for repair |
| **Inativo** (device) | `INATIVO` | Inactive — retired, kept only for the history |
| **Ativo** (record) | `ATIVO` | Active — the person can pick equipment up |
| **Inativo** (record) | `INATIVO` | Inactive — the person can return but not pick up |
| (not shown) | `ATIVO` (loan) | The loan is open; the person has the device |
| (not shown) | `AGUARDANDO_BAIXA` | Return declared, awaiting the front desk check |
| (not shown) | `CONCLUIDO` | The loan is closed |

**Database status names are never translated**, on these pages or anywhere
else — `AGUARDANDO_BAIXA` stays `AGUARDANDO_BAIXA`, because that is the name
anybody looking at the data will see.

## Profiles

| On screen | In English |
| --- | --- |
| **Estudante** | Student |
| **Professor** | Teacher |

There are only these two, and a spreadsheet row carrying anything else is
rejected by the preview.

## Error messages

<!--
  A coluna da esquerda e citacao literal de mensagem de tela. Uma delas diz
  "Informe o usuario e a senha.", com a palavra proibida em minuscula, e a regra
  1 do guia de estilo manda transcreve-la assim -- e por essa frase que o leitor
  chega ate aqui.

  O escape vale para a tabela inteira, e nao para a linha: comentario no meio de
  uma tabela a encerra no Python-Markdown, e o resto viraria paragrafo solto.
  Mesma solucao da tabela de erros da pagina Conta do administrador.
-->
<!-- vale Vale.Avoid = NO -->

The messages that appear on more than one screen. The ones specific to a single
process are translated in the error table of that process page, which is where
you should look for them: [pickup](../portal/retirada.md#8-common-errors-and-what-to-do),
[return](../portal/devolucao.md#8-common-errors-and-what-to-do),
[physical check-in](../painel/baixa-fisica.md#8-common-errors-and-what-to-do),
[inventory](../painel/inventario.md#8-common-errors-and-what-to-do),
[people](../painel/pessoas.md#8-common-errors-and-what-to-do) and
[administrator account](conta-do-administrador.md#common-errors-and-what-to-do).

| On screen | In English |
| --- | --- |
| "Matrícula 9999999 não encontrada." | Enrollment number 9999999 not found. |
| "Este cadastro está inativo e não pode retirar equipamento." | This record is inactive and cannot pick equipment up. |
| "Sessão encerrada." | Session ended. |
| "Usuário ou senha inválidos." | Invalid username or password. |
| "Informe o usuário e a senha." | Enter the username and the password. |
| "Muitas tentativas seguidas." | Too many attempts in a row. |
| "Nenhum administrador cadastrado." | No administrator registered. |
| "Não foi possível concluir a operação." | Could not complete the operation. |
| "Não foi possível falar com o sistema agora." | Could not reach the system right now. |

<!-- vale Vale.Avoid = YES -->

## Why the interface was not translated

Translating the system would mean internationalizing the application itself —
every screen, every message, every error — and keeping the two versions in step
from then on. The people who use it are all Portuguese speakers at a Brazilian
university, so that work would serve nobody who actually stands at the counter.

This wiki exists in English for a different audience: people reading about how
the system works. Giving them the real labels beside the English meaning costs
one page and keeps the screenshots honest — they show the screen as it is,
which is the only version that exists.
