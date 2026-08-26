# Sistema de Empréstimo de Equipamentos

Este sistema registra o empréstimo de notebooks, tablets e extensões da Unoesc:
quem retirou cada aparelho, quando declarou a devolução e quando a secretaria
conferiu o recebimento.

## Por onde começar

<div class="grid cards" markdown>

-   **Sou estudante ou professor**

    Você usa o tablet da bancada para retirar e devolver equipamento.

    [**O tablet em 5 minutos →**](inicio-rapido/estudante-e-professor.md)

-   **Sou da secretaria**

    Você usa o painel no computador para conferir as devoluções e cuidar do
    inventário e dos cadastros.

    [**O painel em 10 minutos →**](inicio-rapido/secretaria.md)

</div>

As duas trilhas são independentes. Quem opera o tablet não precisa abrir nenhuma
página do painel, e o contrário também vale.

## Atalhos

<div class="grid" markdown>

<div markdown>

**No tablet**

- [Retirar um equipamento](portal/retirada.md)
- [Devolver um equipamento](portal/devolucao.md)
- [Devolvi e o aparelho ainda consta comigo](inicio-rapido/estudante-e-professor.md#devolvi-e-o-aparelho-ainda-consta-comigo)
- [A matrícula não foi encontrada](inicio-rapido/estudante-e-professor.md#a-matricula-nao-foi-encontrada)

</div>

<div markdown>

**No painel**

- [Confirmar o recebimento dos aparelhos devolvidos](painel/baixa-fisica.md)
- [Cadastrar equipamento e cuidar do inventário](painel/inventario.md)
- [Importar a planilha de pessoas](painel/pessoas.md)
- [Entrar, sair e trocar a senha](referencia/conta-do-administrador.md)

</div>

</div>

## O que mais existe aqui

- **[Referência](referencia/glossario.md)** — o [glossário](referencia/glossario.md),
  as duas [máquinas de estado](referencia/estados-e-transicoes.md) e as
  [regras de negócio](referencia/regras-de-negocio.md) por trás do
  comportamento das telas.
- **[Sobre](sobre/arquitetura-do-sistema.md)** — a
  [arquitetura do sistema](sobre/arquitetura-do-sistema.md) e
  [como esta wiki foi feita](sobre/como-esta-wiki-foi-feita.md).
- **[Contribuir](contribuir/guia-de-estilo.md)** — o
  [guia de estilo](contribuir/guia-de-estilo.md) e o
  [template de processo](contribuir/template-processo.md), para quem escreve
  uma página nova.

## A versão que esta wiki descreve

!!! info "Esta wiki descreve a versão v1.0 do sistema"

    Se a tela na sua frente tiver um botão que nenhuma página daqui menciona,
    confira o seletor de versão no alto: a `v1.0` é o estado congelado que esta
    wiki documenta, e versões mais novas são publicadas ao lado dela.

## Onde pedir ajuda

**No tablet**, quem resolve é a secretaria — matrícula que não entra, cadastro
inativo e aparelho que sumiu da lista dependem de alguém com o painel aberto. A
tabela de erros de cada processo diz o que fazer antes de sair da bancada:
[retirada](portal/retirada.md#8-erros-comuns-e-o-que-fazer) e
[devolução](portal/devolucao.md#8-erros-comuns-e-o-que-fazer).

**No painel**, comece pelas páginas de
[Referência](referencia/regras-de-negocio.md): a maior parte do que parece
defeito é regra de negócio deliberada, e está explicada lá. Senha esquecida tem
[procedimento próprio](referencia/conta-do-administrador.md#senha-esquecida) e
não se resolve pela tela.

**Se o sistema estiver mesmo errado** — a tela contradiz esta wiki, ou a wiki
está desatualizada —, o lugar de registrar é o
[repositório do projeto](https://github.com/viccenzo-boff/sistema-emprestimo-equipamentos/issues).
