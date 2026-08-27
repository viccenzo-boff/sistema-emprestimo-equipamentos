# Tarefa D04: Modelagem BPMN dos cinco processos

Esta tarefa produz os cinco diagramas antes de qualquer página ser escrita. A
ordem é deliberada: modelar primeiro obriga a descobrir as ramificações e os
estados intermediários enquanto ainda é barato mudar de ideia. Página escrita
antes do diagrama tende a virar narração de tela.

## 1. Ferramenta e formato

* Use **bpmn.io** (roda no navegador, sem instalação) ou **Camunda Modeler**
  (desktop). Ambos salvam `.bpmn`, que é XML padrão OMG.
* **Não use o Bizagi.** O `.bpm` dele é um ZIP proprietário: o Git não faz diff,
  o GitHub não renderiza e quem for ler precisa instalar o programa. A decisão
  está registrada na §2 da [spec-wiki.md](../../spec-wiki.md).
* Fontes em `docs/processos-fonte/NN-nome.bpmn`.
* SVG exportado em `docs/assets/diagramas/NN-nome.svg`, commitado junto.

## 2. Os cinco diagramas

Todos com **duas raias** quando houver dois atores. A raia é o que torna visível
que o processo atravessa pessoas diferentes — é metade do valor de modelar.

| Arquivo                | Processo               | Raias                     | O que o diagrama precisa deixar claro                                                    |
| ---------------------- | ---------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `01-retirada.bpmn`     | Retirada               | Aluno/Professor · Sistema | O gateway de matrícula não encontrada e o de matrícula inativa levam a saídas diferentes |
| `02-devolucao.bpmn`    | Devolução pelo usuário | Aluno/Professor · Sistema | Termina em `AGUARDANDO_BAIXA`, **não** em equipamento disponível                         |
| `03-baixa-fisica.bpmn` | Baixa física           | Secretaria · Sistema      | É a continuação do 02; começa onde ele termina                                           |
| `04-inventario.bpmn`   | Gestão de inventário   | Secretaria · Sistema      | Manutenção e aposentadoria são caminhos distintos, com regras distintas                  |
| `05-pessoas.bpmn`      | Gestão de pessoas      | Secretaria · Sistema      | A importação de planilha tem prévia antes de gravar                                      |

## 3. O processo 02 e o 03 são um ciclo partido ao meio

Modele-os de forma que isso fique evidente: o 02 termina num evento intermediário
que o 03 consome. Não desenhe o 02 terminando em "equipamento disponível" — é
justamente o erro que a regra de negócio do sistema existe para impedir.

Se o modelo ficar mais legível com um sexto diagrama de visão geral mostrando o
ciclo inteiro do equipamento, faça — mas ele é de referência, não substitui
nenhum dos cinco.

## 4. Fonte da verdade

**Modele a partir do comportamento real, não da memória nem da spec.** A
[spec.md](../../spec.md) descreve a intenção; o código descreve o que acontece. Onde
divergirem, o código manda para a wiki, e a divergência vira uma linha no
registro de decisões da tarefa.

Para cada processo, leia:

* Retirada e devolução: [src/app/actions.ts](../../../src/app/actions.ts) e os componentes
  em [src/components/portal/](../../../src/components/portal/).
* Baixa e inventário: [src/app/admin/actions.ts](../../../src/app/admin/actions.ts),
  [FilaDeDevolucoes.tsx](../../../src/components/admin/FilaDeDevolucoes.tsx) e
  [GestaoInventario.tsx](../../../src/components/admin/GestaoInventario.tsx).
* Pessoas: [src/app/admin/pessoas/actions.ts](../../../src/app/admin/pessoas/actions.ts),
  [GestaoPessoas.tsx](../../../src/components/admin/GestaoPessoas.tsx) e
  [planilha-pessoas.ts](../../../src/lib/planilha-pessoas.ts).

## 5. Verificação

* Os cinco `.bpmn` abrem no bpmn.io sem erro de validação.
* `git diff` de um `.bpmn` alterado mostra mudança legível em XML — se aparecer
  binário, o arquivo foi salvo no formato errado.
* Os cinco SVG abrem no navegador e são legíveis a 100% de zoom, sem corte.
* Cada gateway do diagrama tem correspondência num `if` ou numa validação real do
  código. Gateway que você não conseguir apontar no código está inventado.

*Atenção: não acrescente ao diagrama etapa que o sistema não executa, por mais
que ela "devesse" existir. Diagrama que descreve o processo desejado em vez do
implementado é a forma mais cara de errar — ele parece certo e induz a wiki
inteira ao erro.*
