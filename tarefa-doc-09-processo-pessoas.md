# Tarefa D09: Processo 5 — Gestão de pessoas

Última página de processo. É a mais densa em regra de negócio: importação com
prévia, normalização automática de dados, e uma inativação que se comporta ao
contrário da do equipamento.

Arquivo: `docs/painel/pessoas.md`

## 1. Antes de escrever

* Estado de demonstração da D01, com pessoas ativas e inativas.
* Execute no navegador: baixar a planilha modelo, importar uma planilha com
  sujeira proposital (perfil em caixa alta, curso abreviado, nome todo em
  maiúscula), conferir a prévia, gravar, editar cadastro, editar matrícula,
  inativar e reativar.
* Leia [GestaoPessoas.tsx](src/components/admin/GestaoPessoas.tsx),
  [ImportacaoPlanilha.tsx](src/components/admin/ImportacaoPlanilha.tsx),
  [planilha-pessoas.ts](src/lib/planilha-pessoas.ts),
  [planilha-modelo.ts](src/lib/planilha-modelo.ts) e
  [sanitizacao.ts](src/lib/sanitizacao.ts).

## 2. O passo a passo

Quatro procedimentos:

1. Baixar a planilha modelo e preenchê-la.
2. Importar a planilha — com a etapa de **prévia** antes de gravar.
3. Editar um cadastro, incluindo a matrícula.
4. Inativar e reativar.

**Nenhuma captura desta página pode conter dado da planilha real da
coordenação.** Use exclusivamente o estado do `db:demo`. Esta é a página de maior
risco da wiki inteira.

## 3. Regras que não são óbvias (seção 7)

* **A importação mostra prévia antes de gravar**, e a prévia existe porque a
  operação não tem desfazer. Explique que a secretária deve conferir a lista
  antes de confirmar.
* **O sistema corrige a grafia sozinho, na gravação.** Nome vira Title Case com
  partícula minúscula, perfil vira "Estudante" ou "Professor", e os cursos são
  reordenados na ordem hierárquica (Sistemas de Informação, Ciência da
  Computação, Engenharia da Computação, e o resto em ordem alfabética). Mostre um
  antes/depois em tabela — é a forma mais rápida de a secretária entender que
  não precisa formatar a planilha à mão.
* **A inativação de pessoa é assimétrica: bloqueia retirar, libera devolver.**
  Quem foi inativado costuma estar com um aparelho na mochila; travar os dois
  lados garantiria que ele nunca voltasse. Por isso a matrícula inativa entra no
  tablet normalmente e recebe uma explicação no lugar das categorias.
* **Inativar alguém com empréstimo aberto é permitido**, com aviso. É o oposto do
  equipamento (D08), cuja situação trava até o ciclo fechar. Diga isso lado a
  lado, porque é a confusão mais provável do painel inteiro.
* **Pessoa também nunca é apagada** — o histórico aponta para ela e o banco
  recusa a exclusão.
* **A matrícula é editável e a correção leva o histórico junto.** Aceita só
  dígitos, até 15, porque é o que o teclado do tablet consegue digitar. Zeros à
  esquerda são preservados: a matrícula é texto, não número.

## 4. Capturas

Em `docs/assets/images/pessoas/`. No mínimo: lista de pessoas com busca e filtro,
botão da planilha modelo, tela de importação, **a prévia antes de gravar**, o
aviso ao inativar quem tem empréstimo aberto, e um cadastro inativo na lista.

## 5. Verificação

* `mkdocs build --strict` em 0 aviso.
* A tabela de antes/depois da normalização existe e usa exemplos reais do
  comportamento (execute a importação suja e copie o resultado).
* A comparação com a inativação de equipamento (D08) está presente e linkada nos
  dois sentidos.
* **Nenhuma captura contém dado da planilha real.** Confira imagem por imagem,
  abrindo cada uma — este item não pode ser marcado por inspeção superficial.
* O diagrama `05-pessoas.svg` está embutido e mostra a prévia como etapa.
