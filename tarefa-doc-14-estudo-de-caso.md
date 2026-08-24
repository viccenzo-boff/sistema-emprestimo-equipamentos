# Tarefa D14: Estudo de caso e fechamento

Última tarefa. Ela escreve a página que fala com quem avalia o trabalho, e fecha
as pontas soltas da série.

## 1. `docs/sobre/arquitetura.md`

Visão técnica do sistema para quem lê a wiki e quer entender o que está por trás:
stack, modelo de dados, as duas frentes, e por que SQLite em arquivo único (a
portabilidade para a máquina da secretaria).

Curta. Quem quiser profundidade tem o [README.md](README.md) e o
[AGENTS.md](AGENTS.md), e esta página deve linkar para os dois.

## 2. `docs/sobre/como-esta-wiki-foi-feita.md`

A página do estudo de caso. **Não é um diário.** É um relato de decisões, e cada
uma precisa trazer a alternativa descartada e o motivo. Sem isso vira propaganda.

Cubra:

* **Por que BPMN antes de escrever.** Modelar primeiro obriga a achar as
  ramificações enquanto ainda é barato mudar de ideia; escrever primeiro produz
  narração de tela.
* **Por que a seção "regras que não são óbvias" existe** em toda página de
  processo. Manual comum descreve a tela; esta wiki descreve a decisão de
  produto. Use a regra das duas fases da devolução como exemplo — é a mais
  ilustrativa do sistema inteiro.
* **Por que a doc mora no repositório do código.** Repositório separado dá
  artefato mais limpo de linkar; foi descartado porque doc e código no mesmo
  histórico é o que permite a mudança de regra e a correção do manual caberem no
  mesmo commit.
* **Por que uma versão congelada.** A `main` continua andando; captura de tela de
  alvo em movimento nasce vencida.
* **Por que dado de demonstração em vez de borrar imagem.** Borrão falha, fica
  feio, e não resolve o problema de origem.
* **O que ficou de fora, e por quê.** Honestidade sobre escopo vale mais que
  lista de conquistas. Se a D12 tiver sido cortada, é aqui que isso se declara
  como decisão, não como lacuna.

Se possível, um antes/depois: o que existia de documentação operacional antes
(nada, fora do `AGENTS.md`, que é escrito para quem mexe no código) e o que
existe agora.

## 3. Seção no `README.md`

Um bloco curto no README apontando para a wiki publicada, com uma frase sobre o
que ela cobre. Quem chega pelo GitHub precisa achar a documentação sem procurar.

## 4. Fechamento da série

* Confira a lista de critérios de conclusão da §10 da
  [spec-wiki.md](spec-wiki.md), item por item, e marque o que está cumprido.
* Item não cumprido **não se marca** — registre o que falta e por quê.
* Se a autorização da Unoesc (§8) não tiver vindo, execute o plano B agora:
  trocar marca e logo pela alternativa neutra. Não publique com a marca sem
  autorização.

## 5. Verificação

* `mkdocs build --strict` em 0 aviso e CI da D13 em verde.
* O estudo de caso traz, para **cada** decisão, a alternativa descartada.
* O README linka para a wiki publicada.
* Os critérios da §10 estão conferidos um a um, com os pendentes nomeados.
* **O critério que importa:** entregue a wiki a alguém que nunca viu o sistema e
  peça para fazer uma retirada usando só ela. Se a pessoa travar, o ponto onde
  travou é a correção mais valiosa que a wiki inteira vai receber — faça a
  correção antes de considerar a série encerrada.
