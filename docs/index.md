# Sistema de Empréstimo de Equipamentos

Este sistema registra o empréstimo de notebooks, tablets e extensões da Unoesc:
quem retirou cada aparelho, quando declarou a devolução e quando o secretário
conferiu o recebimento.

## Por onde começar

<div class="grid cards" markdown>

-   **Sou estudante ou professor**

    Você usa o tablet da bancada para retirar e devolver equipamento.

    [**O tablet em 5 minutos →**](inicio-rapido/estudante-e-professor.md)

-   **Sou o secretário**

    Você usa o painel no computador para conferir as devoluções e cuidar do
    inventário e dos cadastros.

    [**O painel em 10 minutos →**](inicio-rapido/secretario.md)

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
- [Ver o que está esgotando e levar à coordenação](painel/relatorios.md)
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
- **[Instalação](instalacao/windows-11.md)** — como pôr o sistema para rodar
  sozinho no computador da coordenação, com o tablet no Wi-Fi, backup diário e
  uma cópia do banco para consultar sem risco. Passo a passo para quem nunca
  instalou nada.

## A versão que esta wiki descreve

!!! info "Esta wiki descreve a versão v1.0 do sistema"

    A `v1.0` é a primeira versão entregue à coordenação, e é a única: o
    tablet com retirada, devolução e a avaliação anônima no fim da retirada
    (os quatro rostos e o QR code do formulário de sugestões), e o painel com
    a fila de devoluções, o inventário, as pessoas e os quatro relatórios —
    **Ocupação e picos de uso**, **Satisfação**, **Ranking de Consumo** e
    **Índice de Manutenção**, com o seletor de período, a exportação em
    `.xlsx` e o histórico de quem mudou a situação de cada aparelho. Quando
    houver uma versão nova, ela entra no seletor de versão, no alto da página,
    ao lado desta — que continua correta sobre a `v1.0`.

## Onde pedir ajuda

**No tablet**, quem resolve é o secretário — matrícula que não entra, cadastro
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
