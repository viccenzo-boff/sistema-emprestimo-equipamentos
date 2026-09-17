/**
 * Tipos compartilhados entre as Server Actions e os componentes de interface.
 *
 * Este arquivo existe separado de `src/app/actions.ts` de propósito: um módulo
 * marcado com "use server" só pode exportar funções assíncronas. Tipos são
 * apagados na compilação, mas manter tudo em um arquivo neutro evita esbarrar
 * nessa regra quando aparecer uma constante compartilhada.
 */

/** Status possíveis de um equipamento (spec, seção 3; `INATIVO` veio na Tarefa 6). */
export const STATUS_EQUIPAMENTO = {
  disponivel: "DISPONIVEL",
  emprestado: "EMPRESTADO",
  manutencao: "MANUTENCAO",
  /**
   * Aposentado: sai de circulação sem sair do banco.
   *
   * Existe porque apagar um equipamento levaria junto o histórico de
   * empréstimos que aponta para ele — o `Emprestimo` do semestre passado
   * deixaria de saber qual aparelho foi. `INATIVO` é o "deletar" que o
   * secretário quer, com o histórico intacto.
   */
  inativo: "INATIVO",
} as const;

/** Status possíveis de um empréstimo (spec, seção 3). */
export const STATUS_EMPRESTIMO = {
  ativo: "ATIVO",
  aguardandoBaixa: "AGUARDANDO_BAIXA",
  concluido: "CONCLUIDO",
} as const;

/**
 * Os rótulos exibidos de cada status, num lugar só (Tarefa 16).
 *
 * Até a Tarefa 15 o rótulo do equipamento vivia dentro do
 * [SeloStatus](../components/admin/SeloStatus.tsx), que era o único leitor.
 * A planilha exportada passou a escrever a mesma palavra numa célula, e uma
 * segunda cópia divergiria na primeira correção — é a mesma regra que tirou
 * `semAcento` das actions na Tarefa 7. O selo continua sendo quem escolhe a
 * cor; a palavra vem daqui.
 */
export const ROTULO_DO_STATUS_DE_EQUIPAMENTO: Readonly<Record<string, string>> = {
  [STATUS_EQUIPAMENTO.disponivel]: "Disponível",
  [STATUS_EQUIPAMENTO.emprestado]: "Emprestado",
  [STATUS_EQUIPAMENTO.manutencao]: "Manutenção",
  [STATUS_EQUIPAMENTO.inativo]: "Inativo",
};

/** O empréstimo nunca teve selo na tela; o rótulo nasce para a planilha exportada. */
export const ROTULO_DO_STATUS_DE_EMPRESTIMO: Readonly<Record<string, string>> = {
  [STATUS_EMPRESTIMO.ativo]: "Ativo",
  [STATUS_EMPRESTIMO.aguardandoBaixa]: "Aguardando baixa",
  [STATUS_EMPRESTIMO.concluido]: "Concluído",
};

/**
 * Status possíveis de um cadastro de pessoa (Tarefa 8).
 *
 * `INATIVO` **bloqueia a retirada e permite a devolução**. A assimetria é a
 * regra inteira: quem sai da faculdade costuma estar com um aparelho na
 * mochila, e travar também a devolução transformaria o cadastro inativado na
 * garantia de que o equipamento nunca volta. Quem devolve não está pedindo
 * nada ao sistema — está entregando.
 */
export const STATUS_PESSOA = {
  ativo: "ATIVO",
  inativo: "INATIVO",
} as const;

/**
 * Os dois perfis da spec (seção 3).
 *
 * Vira lista fechada aqui porque a importação de planilha precisa **recusar**
 * um valor que não seja um dos dois: "servidor", "terceirizado" e "convidado"
 * chegam de planilha de coordenação, e aceitar cada variante criaria perfis que
 * nenhuma tela sabe exibir. As variantes que *são* uma das duas coisas
 * ("alunos", "prof", "docente") são reconhecidas e convertidas — ver
 * `normalizarPerfil` em [sanitizacao.ts](src/lib/sanitizacao.ts).
 *
 * **Os valores mudaram na Tarefa 8.1**, e mudaram em duas dimensões de uma vez:
 * "ALUNO" virou `"Estudante"`. O termo é o que a tarefa pede (o vocabulário da
 * instituição mudou), e a caixa passou a ser a **exibida** porque o enunciado
 * manda gravar exatamente "Estudante" ou "Professor". A consequência boa é que
 * a tela não precisa mais de um `de-para`: o valor gravado já é o rótulo, e as
 * três telas que faziam `perfil === "PROFESSOR" ? "Professor" : "Aluno"` viraram
 * uma chamada a `rotuloDePerfil`.
 *
 * A consequência a conhecer é que `STATUS_PESSOA` e `STATUS_EQUIPAMENTO`
 * continuam em caixa alta, então **a tabela `Pessoa` tem duas convenções de
 * caixa lado a lado**. É intencional: nenhum outro campo é exibido cru, e
 * uniformizar significaria ou gritar "ESTUDANTE" na tabela ou reescrever os
 * quatro status por simetria.
 */
export const PERFIL = {
  estudante: "Estudante",
  professor: "Professor",
} as const;

/** Teto de itens por retirada. Segura tanto o dedo escorregando quanto POST malicioso. */
export const MAXIMO_ITENS_POR_RETIRADA = 10;

/**
 * De quantos em quantos dias a mesma pessoa vê os rostos da avaliação no fim
 * da retirada (Tarefa 14).
 *
 * É constante no código, e não configuração do painel, de propósito: a regra
 * precisa se sustentar sozinha por anos — `now()` contra uma coluna, sem
 * calendário, sem serviço externo, sem tela para alguém esquecer. Trinta é o
 * piso da faixa que o mercado usa para repesquisar a mesma pessoa (30–90
 * dias): quem retira todo dia é perguntado uma vez por mês, e quem retira uma
 * vez por semestre é perguntado sempre.
 */
export const INTERVALO_ENTRE_AVALIACOES_DIAS = 30;

/**
 * A escala da avaliação: quatro rostos, sem neutro, do pior ao melhor.
 *
 * Quatro e não cinco porque o neutro vira depósito de indiferença (20–30% das
 * respostas em escalas ímpares); quatro força um lado. O pior rosto é
 * **triste**, nunca bravo: a escala tem um eixo só (valência), raiva é outra
 * dimensão, e ninguém aperta "bravo" num tablet compartilhado com o secretário
 * a dois metros — a ponta baixa esvaziaria.
 *
 * É um `Map`, e não um objeto literal, porque a `nota` chega de um POST
 * público: `OBJETO[chave]` responde a `"constructor"` com o protótipo, e a
 * guarda deixaria passar. É a mesma regra da tabela de transições do
 * inventário (Tarefa 6).
 */
export const NOTAS_DE_AVALIACAO: ReadonlyMap<number, string> = new Map([
  [1, "Muito ruim"],
  [2, "Ruim"],
  [3, "Bom"],
  [4, "Muito bom"],
]);

/** A única chave da tabela `Configuracao` hoje: a URL do formulário externo. */
export const CHAVE_URL_FORMULARIO = "url_formulario_feedback";

/**
 * Dados da pessoa expostos ao tablet. Só o que a tela realmente mostra.
 *
 * `status` entrou na Tarefa 8 porque a tela precisa dele: um cadastro `INATIVO`
 * continua entrando (para poder devolver) e a grade de categorias dá lugar a
 * uma explicação. Sem o campo aqui, o tablet mostraria o inventário inteiro
 * para alguém que não pode retirar nada, e a recusa só apareceria no fim.
 */
export type PessoaIdentificada = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
  status: string;
};

/**
 * Uma categoria do inventário e quantas unidades dela estão livres agora.
 *
 * `tipo` é o `nome` da `Categoria` no banco. O nome do campo ficou como estava
 * de propósito: é o vocabulário que o tablet inteiro usa ("tipo de
 * equipamento"), e trocá-lo aqui renomearia meia dúzia de componentes sem mudar
 * uma linha do que aparece na tela.
 *
 * `total` **não conta os inativos**: para quem está no tablet, um equipamento
 * aposentado não existe — dizer "2 de 12 disponíveis" com 4 itens fora de
 * circulação faria a pessoa procurar aparelho que não está na prateleira.
 */
export type Categoria = {
  tipo: string;
  disponiveis: number;
  total: number;
};

/** Um equipamento livre para retirada. */
export type EquipamentoDisponivel = {
  id: string;
  tipo: string;
};

/**
 * Um item que está com a pessoa agora (empréstimo `ATIVO`).
 *
 * `id` é o do empréstimo, não o da etiqueta: como cada item vira um registro
 * separado em `Emprestimo`, é o número do registro que a devolução precisa
 * endereçar. A etiqueta vem junto porque é o que a pessoa lê no aparelho.
 */
export type EmprestimoAtivo = {
  id: number;
  equip_id: string;
  tipo: string;
  data_retirada: Date;
};

/**
 * Retorno padrão das actions.
 *
 * Erros esperados (matrícula inexistente, equipamento tomado no meio do
 * caminho) voltam como `ok: false` com mensagem pronta para a tela — não como
 * exceção. Exceção aqui viraria tela de erro do Next em cima do aluno.
 */
export type Resultado<T> =
  | { ok: true; dados: T }
  | {
      ok: false;
      motivo: MotivoDeFalha;
      mensagem: string;
      detalhe?: string;
      /** Etiquetas que causaram a falha, para a tela poder se corrigir sozinha. */
      indisponiveis?: string[];
    };

export type MotivoDeFalha =
  // Portal do tablet (Fluxos 1 e 2)
  | "MATRICULA_VAZIA"
  | "MATRICULA_NAO_ENCONTRADA"
  | "SELECAO_VAZIA"
  | "SELECAO_EXCEDIDA"
  | "EQUIPAMENTO_INDISPONIVEL"
  | "EMPRESTIMO_NAO_ENCONTRADO"
  // Painel administrativo (Fluxo 3)
  | "SEM_SESSAO"
  | "EQUIPAMENTO_NAO_ENCONTRADO"
  | "EQUIPAMENTO_EM_USO"
  | "ETIQUETA_DUPLICADA"
  | "ETIQUETA_INVALIDA"
  | "TIPO_INVALIDO"
  | "STATUS_INVALIDO"
  | "CATEGORIA_NAO_ENCONTRADA"
  | "CATEGORIA_DUPLICADA"
  | "CATEGORIA_EM_USO"
  // Gestão de pessoas (Tarefa 8)
  | "PESSOA_NAO_ENCONTRADA"
  | "PESSOA_INATIVA"
  | "MATRICULA_INVALIDA"
  | "MATRICULA_DUPLICADA"
  | "NOME_INVALIDO"
  | "PERFIL_INVALIDO"
  | "CURSOS_INVALIDOS"
  | "ARQUIVO_INVALIDO"
  | "PLANILHA_VAZIA"
  | "PLANILHA_SEM_MATRICULA"
  | "PLANILHA_EXCEDIDA"
  // Troca da própria senha (Tarefa 11)
  | "SENHA_VAZIA"
  | "SENHA_NAO_CONFERE"
  | "SENHA_FRACA"
  | "SENHA_IGUAL_A_ATUAL"
  | "SENHA_ATUAL_INCORRETA"
  | "MUITAS_TENTATIVAS"
  // Avaliação anônima e QR code (Tarefa 14)
  | "AVALIACAO_INVALIDA"
  | "AVALIACAO_NAO_ENCONTRADA"
  | "URL_INVALIDA"
  | "FALHA_INTERNA";

/**
 * O que a tela de sucesso recebe quando os rostos devem aparecer (Tarefa 14).
 *
 * Só o `id` da linha de `Avaliacao` que o servidor acabou de criar — é o token
 * de uso único que `registrarAvaliacao` preenche. Nulo quer dizer "não
 * pergunte": a decisão é do servidor, dentro de `confirmarRetirada`, e a tela
 * não sabe nem precisa saber por quê.
 */
export type AvaliacaoPedida = {
  id: number;
};

/**
 * O QR code do formulário de sugestões, pronto para a tela.
 *
 * `svg` é a imagem inteira, gerada no servidor pela biblioteca `qrcode` (sem
 * rede), e `url` é o que ele codifica — vai junto para a tela poder mostrar o
 * destino a quem prefere ler a apontar a câmera.
 */
export type QrDoFormulario = {
  svg: string;
  url: string;
};

export type RetiradaConfirmada = {
  pessoa: PessoaIdentificada;
  itens: EquipamentoDisponivel[];
  registrados: number;
  /** Os rostos aparecem? Decidido no servidor pela regra dos 30 dias. */
  avaliacao: AvaliacaoPedida | null;
  /** Nulo quando a URL do formulário não está configurada — a tela não mostra nada. */
  qr: QrDoFormulario | null;
};

/** Resultado da devolução de um item: o que sumiu da lista e o que sobrou nela. */
export type DevolucaoConfirmada = {
  /** O empréstimo que acabou de ir para `AGUARDANDO_BAIXA`. */
  devolvido: EmprestimoAtivo;
  /** Lista relida do banco — a tela adota esta, em vez de remover item na mão. */
  restantes: EmprestimoAtivo[];
};

/**
 * Resultado do "Devolver tudo": os itens que foram para `AGUARDANDO_BAIXA` de
 * uma vez só.
 *
 * `restantes` continua existindo — e normalmente vem vazio — porque a lista da
 * tela é sempre a relida do banco, nunca a filtrada na mão. Se alguém retirou
 * um equipamento em outro tablet no meio do caminho, ele aparece aqui em vez de
 * sumir da tela sem explicação.
 */
export type DevolucaoEmLoteConfirmada = {
  devolvidos: EmprestimoAtivo[];
  restantes: EmprestimoAtivo[];
};

/* ------------------------------------------------------------------------- *
 * Fluxo 3 — Painel Administrativo (spec, seção 4)
 * ------------------------------------------------------------------------- */

/**
 * As três telas do painel são renderizadas no servidor, então as datas já
 * chegam formatadas nestes tipos, em vez de virem como `Date` para a tela
 * calcular.
 *
 * Motivo: as linhas com botão são ilhas de cliente, e uma data formatada no
 * servidor e re-formatada na hidratação diverge sempre que servidor e navegador
 * discordarem de fuso ou de minuto — o clássico erro de hidratação por texto de
 * tempo. Formatar uma vez, no servidor, elimina a classe inteira do problema.
 */

/** Uma linha da Fila de Devoluções: empréstimo em `AGUARDANDO_BAIXA`. */
export type ItemDaFila = {
  /** Id do empréstimo — é ele que a confirmação endereça. */
  id: number;
  equip_id: string;
  tipo: string;
  nome: string;
  matricula: string;
  perfil: string;
  /** "18/08/2026, 14:32" — quando o item saiu. */
  retiradoEm: string;
  /** Quando a pessoa declarou a devolução no tablet. */
  declaradoEm: string;
  /** "há 2 horas" — o que diz se o item já devia estar na bancada. */
  esperandoHa: string;
};

/** Uma linha da visão de Empréstimos Ativos (somente leitura). */
export type EmprestimoEmCurso = {
  id: number;
  equip_id: string;
  tipo: string;
  nome: string;
  matricula: string;
  perfil: string;
  retiradoEm: string;
  /** "há 3 dias" — o dado que faz o secretário cobrar ou não. */
  ha: string;
};

/** Uma linha da Gestão de Inventário. `tipo` é o `nome` da `Categoria`. */
export type ItemDeInventario = {
  id: string;
  tipo: string;
  status: string;
  /**
   * Quem está com o item agora, quando existe empréstimo aberto (`ATIVO` ou
   * `AGUARDANDO_BAIXA`). É o que explica na tela por que a troca de status está
   * travada, em vez de só desabilitar o botão sem dizer nada.
   */
  responsavel: { nome: string; matricula: string; status: string } | null;
};

/**
 * Estado do formulário de senha do /admin, para o `useActionState`.
 *
 * Não existe estado de "entrou": o sucesso é um `redirect` do servidor, e a
 * tela seguinte já é o painel. O que sobra para o formulário é o erro.
 */
export type EstadoDoLogin = {
  mensagem: string;
  detalhe?: string;
} | null;

/**
 * O que a troca de senha devolve quando dá certo (Tarefa 11).
 *
 * `nome` volta para o aviso poder dizer de quem é a senha que mudou — no
 * balcão há quatro contas e um computador só, e "Senha alterada" sem o nome
 * é justamente a frase que não resolve a dúvida que a tarefa existe para
 * resolver.
 */
export type SenhaAlterada = {
  nome: string;
};

/** Estado do formulário de cadastro de equipamento. */
export type EstadoDoCadastro =
  | { fase: "inicial" }
  | { fase: "erro"; mensagem: string; detalhe?: string }
  | { fase: "sucesso"; mensagem: string };

/** O que a Fila devolve depois de confirmar o recebimento físico. */
export type RecebimentoConfirmado = {
  equip_id: string;
  tipo: string;
  nome: string;
  /**
   * `false` quando o equipamento não voltou para `DISPONIVEL` porque estava em
   * `MANUTENCAO` — o empréstimo fecha do mesmo jeito, mas a tela precisa dizer
   * que o item continua fora do inventário.
   */
  liberado: boolean;
};

/**
 * O que a Fila devolve depois de "Confirmar Todas as Devoluções".
 *
 * O lote é conferido item a item, e não tudo-ou-nada: o secretário está com uma
 * pilha de aparelhos na bancada, e uma linha que saiu da fila por outra aba não
 * pode desfazer a baixa das outras quatro que ela acabou de recolher. Por isso
 * o resultado é um resumo, e não um `ok` seco.
 */
export type RecebimentoEmLote = {
  /** Etiquetas que fecharam o ciclo agora. */
  confirmados: string[];
  /** Destas, as que continuam fora do inventário por estarem em `MANUTENCAO`. */
  presas: string[];
  /** Linhas que já não estavam na fila quando o lote rodou (outra aba chegou antes). */
  foraDaFila: number;
  /** Linhas que falharam por erro inesperado — o lote segue, mas a tela avisa. */
  comFalha: number;
};

/**
 * Uma linha da tela de Categorias.
 *
 * `equipamentos` vem junto porque é ele que decide se o botão de excluir pode
 * aparecer — e, quando não pode, é a explicação: "3 equipamentos vinculados".
 * A trava de verdade continua sendo do banco (`onDelete: Restrict`); esta
 * contagem é o que evita oferecer um botão que só existe para dar erro.
 */
export type CategoriaDoPainel = {
  id: number;
  nome: string;
  equipamentos: number;
};

/** Uma opção do `<select>` de categoria no cadastro de equipamento. */
export type OpcaoDeCategoria = {
  id: number;
  nome: string;
};

/** As contagens do topo da Gestão de Inventário. */
export type ResumoDoInventario = {
  disponiveis: number;
  emprestados: number;
  manutencao: number;
  inativos: number;
  /**
   * Todos os equipamentos cadastrados, inativos inclusive. Aqui — ao contrário
   * do tablet — o inativo conta: o secretário está olhando o patrimônio, e o
   * aparelho aposentado continua sendo um aparelho que existe no armário.
   */
  total: number;
};

/** Estado do formulário de cadastro de categoria. Mesma forma do de equipamento. */
export type EstadoDaCategoria = EstadoDoCadastro;

/* ------------------------------------------------------------------------- *
 * Gestão de Pessoas (Tarefa 8)
 * ------------------------------------------------------------------------- */

/**
 * Uma linha da tabela de `/admin/pessoas`.
 *
 * `emprestimosAbertos` vem junto porque é o que a inativação precisa dizer: o
 * secretário pode inativar quem ainda está com equipamento — é justamente o
 * caso comum, alguém que saiu da faculdade —, mas não às cegas. O modal mostra
 * o que a pessoa tem antes de confirmar, e o empréstimo continua na aba
 * Empréstimos Ativos para cobrança.
 */
export type PessoaDoPainel = {
  matricula: string;
  nome: string;
  perfil: string;
  cursos: string;
  status: string;
  /** Empréstimos em `ATIVO` ou `AGUARDANDO_BAIXA` — o que a pessoa deve agora. */
  emprestimosAbertos: number;
  /** Etiquetas desses empréstimos, para o modal poder nomeá-las. */
  equipamentosEmMaos: string[];
};

/** As contagens do topo da tela de pessoas. */
export type ResumoDePessoas = {
  ativos: number;
  inativos: number;
  estudantes: number;
  professores: number;
  total: number;
};

/**
 * O que uma linha da planilha vai provocar no banco.
 *
 * Os três cenários da tarefa viram três verbos, e o quarto (`inalterada`)
 * existe porque planilha de coordenação é reenviada inteira toda semana: sem
 * ele, a prévia diria "180 atualizações" quando 178 delas não mudam um
 * caractere, e ninguém leria a lista.
 */
export type AcaoDaLinha = "criar" | "atualizar" | "inalterada" | "erro";

/** Um campo que a importação vai trocar, com o valor de antes e o de depois. */
export type MudancaDeCampo = {
  campo: "nome" | "perfil" | "cursos" | "status";
  de: string;
  para: string;
};

/**
 * Uma linha da planilha depois de lida, normalizada e confrontada com o banco.
 *
 * `linha` é o número da linha **no arquivo** (contando o cabeçalho), e não o
 * índice do array: quem for corrigir a planilha vai abri-la no Excel, e ali as
 * linhas começam em 1.
 */
export type LinhaDaImportacao = {
  linha: number;
  matricula: string;
  acao: AcaoDaLinha;
  /** Nome atual (ou o que virá), só para a prévia ter o que exibir. */
  nome: string;
  /** O que muda. Vazio em `criar` (é tudo novo) e em `inalterada`. */
  mudancas: MudancaDeCampo[];
  /** Preenchido só quando `acao === "erro"`. */
  erro?: string;
};

/**
 * O resultado da leitura da planilha, antes de qualquer escrita.
 *
 * A prévia existe porque a importação não tem desfazer: um arquivo errado
 * sobrescreveria centenas de cadastros, e o relatório depois do fato só contaria
 * o estrago. Aqui o secretário vê o que vai acontecer e decide.
 */
export type PreviaDaImportacao = {
  /** Nome do arquivo lido, para a tela poder repeti-lo na confirmação. */
  arquivo: string;
  /** Cabeçalhos reconhecidos, na grafia normalizada. Diz o que a planilha trazia. */
  colunas: string[];
  linhas: LinhaDaImportacao[];
  totais: { criar: number; atualizar: number; inalteradas: number; erros: number };
};

/**
 * O que a importação de fato gravou.
 *
 * Repete a forma da prévia de propósito: o servidor **relê a planilha e refaz
 * as contas** na confirmação, em vez de confiar no que a tela calculou. Se o
 * banco mudou entre a prévia e o clique, é este número que vale — e a tela
 * mostra os dois lado a lado quando eles diferem.
 */
export type ImportacaoConcluida = {
  criados: number;
  atualizados: number;
  inalterados: number;
  erros: number;
};

/** Estado do formulário de importação, para o `useActionState`. */
export type EstadoDaImportacao =
  | { fase: "inicial" }
  | { fase: "previa"; previa: PreviaDaImportacao }
  | { fase: "concluida"; resultado: ImportacaoConcluida }
  | { fase: "erro"; mensagem: string; detalhe?: string };

/* ------------------------------------------------------------------------- *
 * Relatórios (Tarefa 13)
 * ------------------------------------------------------------------------- */

/**
 * As abas do `/admin/relatorios`, **na ordem em que aparecem na barra**.
 *
 * Duas delas ainda não têm relatório: a Tarefa 13 entregou a estrutura de
 * navegação e o primeiro painel, e consumo e manutenção ficaram declaradas com
 * o texto de "em desenvolvimento". Estão aqui como valores, e não só como texto
 * na tela, porque é a lista que o componente de abas percorre — acrescentar
 * uma aba é editar um lugar.
 *
 * A Tarefa 14 acrescentou **Satisfação**, e ela entrou em segundo, e não em
 * quarto como o enunciado escrevia: com as duas vazias no meio, a barra
 * ficaria *relatório · vazio · vazio · relatório*, e quem procura o segundo
 * relatório clicaria em dois avisos antes de achá-lo. Os dois que existem
 * ficam juntos; os que ainda não existem vão para o fim. Decisão do dono do
 * repositório (2026-09-16).
 */
export const ABA_DE_RELATORIO = {
  ocupacao: "ocupacao",
  satisfacao: "satisfacao",
  consumo: "consumo",
  manutencao: "manutencao",
} as const;

export type AbaDeRelatorio =
  (typeof ABA_DE_RELATORIO)[keyof typeof ABA_DE_RELATORIO];

/**
 * A aba que a URL pede (`?aba=consumo`, Tarefa 16), ou a primeira quando o
 * valor não é nenhuma das quatro. Mora aqui, e não no componente de abas,
 * porque quem a chama é a página no **servidor** — e um export de módulo
 * `"use client"` chamado do servidor não é uma função, é uma referência.
 */
export function abaDaUrl(valor: string | string[] | undefined): AbaDeRelatorio {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const conhecida = Object.values(ABA_DE_RELATORIO).find((aba) => aba === texto);
  return conhecida ?? ABA_DE_RELATORIO.ocupacao;
}

/**
 * O quanto falta na prateleira de uma categoria, em uma palavra.
 *
 * Os três primeiros são os do enunciado da Tarefa 13; `vazio` é o quarto, e
 * existe porque desde a Tarefa 6 dá para criar categoria sem nenhum
 * equipamento — e uma categoria sem unidade em circulação tem zero disponíveis
 * sem estar esgotada. Sem este nível ela apareceria em vermelho permanente,
 * dizendo "Estoque Esgotado" de uma prateleira que nunca teve aparelho.
 */
export type NivelDeEstoque = "esgotado" | "critico" | "normal" | "vazio";

/**
 * A ocupação de uma categoria: quanto do estoque em circulação não está na
 * prateleira agora.
 *
 * **`emCirculacao` não conta os `INATIVO`**, e é o mesmo denominador que o
 * tablet já mostra em "Notebooks — 4 de 9 disponíveis" (ver `listarCategorias`
 * em [actions.ts](src/app/actions.ts)). Contar o aposentado aqui faria a
 * coordenação receber dois números diferentes para "quantos notebooks temos",
 * dependendo da tela em que perguntasse.
 *
 * `ocupados` é tudo que **não** está disponível — emprestado ou em manutenção.
 * É o que faz `ocupacao === 100` querer dizer exatamente "nenhum item com
 * status `DISPONIVEL`", que é como o enunciado define o alerta vermelho. Com o
 * numerador só nos emprestados, a barra diria 70% enquanto o alerta ao lado
 * diria "Estoque Esgotado" — e as duas coisas estariam certas.
 */
export type OcupacaoDeCategoria = {
  id: number;
  /** O nome como está no banco, no singular. Quem pluraliza é a tela. */
  nome: string;
  /** Tudo menos os aposentados: é o estoque de que a prateleira dispõe. */
  emCirculacao: number;
  disponiveis: number;
  emprestados: number;
  manutencao: number;
  /** `INATIVO`: fora da conta, mostrado como nota para os números fecharem. */
  aposentados: number;
  /** `emCirculacao - disponiveis`. */
  ocupados: number;
  /** 0 a 100, inteiro. É o número que a barra desenha e que o texto repete. */
  ocupacao: number;
  nivel: NivelDeEstoque;
};

/**
 * O relatório de Ocupação e picos de uso (Tarefa 13, item 2).
 *
 * As datas e o nome do mês já chegam formatados, pela mesma regra do resto do
 * painel: formatar de novo na hidratação é a receita clássica de divergência
 * de fuso em texto de tempo.
 */
export type RelatorioDeOcupacao = {
  /**
   * Retiradas com `data_retirada` dentro do período (Tarefa 16). Era "no mês
   * corrente" até a Tarefa 15; hoje o período vem da URL, e o padrão continua
   * sendo o mês corrente.
   */
  retiradasNoPeriodo: number;
  /** "setembro de 2026", "3 a 9 de agosto de 2026" — o período por extenso, para o cartão dizer de que janela fala. */
  periodo: string;
  /** "Retiradas por dia" (ou por semana, ou por mês): a série temporal do período, com os baldes vazios incluídos. */
  serie: SerieDeRetiradas;
  /**
   * "17/09/2026, 14:32" — o instante da leitura. A ocupação por categoria é
   * a fotografia do agora, e a planilha exportada diz isso na primeira linha.
   */
  lidoEm: string;
  /**
   * Os equipamentos que não estão na prateleira agora, contados pelos
   * **empréstimos abertos**.
   *
   * O enunciado pede "status `EMPRESTADO` ou `AGUARDANDO_BAIXA`", e o segundo
   * não é status de `Equipamento`: enquanto o empréstimo espera conferência, o
   * aparelho continua `EMPRESTADO`. Contar pela tabela de empréstimos é o que
   * torna a frase verdadeira — e o que permite separar os dois, que é a
   * distinção que a Tarefa 12 existe para tornar visível.
   */
  naRua: {
    total: number;
    /** Empréstimos `ATIVO`: o aparelho está com a pessoa. */
    comPessoas: number;
    /** Empréstimos `AGUARDANDO_BAIXA`: o aparelho está na bancada. */
    naBancada: number;
  };
  /** Uma linha por categoria, na ordem do `Categoria.id` — a do tablet. */
  categorias: OcupacaoDeCategoria[];
};

/* ------------------------------------------------------------------------- *
 * Satisfação (Tarefa 14)
 * ------------------------------------------------------------------------- */

/**
 * Um recorte do relatório de satisfação: os últimos 30 dias, ou tudo desde o
 * início. Os dois são fixos — não há filtro, por decisão da Tarefa 14: o dado
 * é um inteiro de 1 a 4 por dia, e filtro é código para manter num sistema que
 * vai ficar anos parado. Quem quer outro recorte baixa o CSV.
 */
export type RecorteDeSatisfacao = {
  /** "Últimos 30 dias" ou "Desde o início". */
  rotulo: string;
  /** Quantas vezes os rostos apareceram. */
  pedidas: number;
  /** Quantas dessas vezes alguém tocou num rosto. */
  respondidas: number;
  /** `respondidas / pedidas`, em inteiro de 0 a 100. Zero quando nada foi pedido. */
  taxaDeResposta: number;
  /** "3,4" — média na escala 1–4 com uma casa, já formatada. Nula sem resposta. */
  media: string | null;
  /** Uma entrada por nota, de 1 a 4, sempre as quatro — inclusive as com zero. */
  distribuicao: { nota: number; rotulo: string; quantas: number; fatia: number }[];
};

/**
 * O relatório de Satisfação (Tarefa 14, item 5).
 *
 * `linhas` é o que o botão "Baixar planilha" serializa **no navegador**: as
 * linhas descem no render porque o painel lê o banco no render, e não por
 * ação. O peso é o dado, não o código — ~30 bytes por linha e no máximo umas
 * cinco linhas por dia útil —, e a página abre uma vez por mês. Vêm ordenadas
 * por `dia` e `nota`, nunca por id: a ordem de gravação é a única coisa que
 * poderia parear pessoa e nota, e ela não sai daqui.
 */
export type RelatorioDeSatisfacao = {
  ultimos30Dias: RecorteDeSatisfacao;
  desdeOInicio: RecorteDeSatisfacao;
  linhas: LinhaDeAvaliacao[];
  /** A URL configurada e o QR que ela gera, ou nulo — é o que o cartão do formulário mostra. */
  formulario: { url: string; qr: QrDoFormulario } | null;
};

/** Uma linha do CSV: o dia e a nota (nula quando ninguém respondeu). */
export type LinhaDeAvaliacao = {
  dia: string;
  nota: number | null;
};

/** Estado do formulário da URL do formulário de sugestões, para o `useActionState`. */
export type EstadoDaUrlDoFormulario =
  | { fase: "inicial" }
  | { fase: "erro"; mensagem: string; detalhe?: string }
  | { fase: "sucesso"; mensagem: string };

/* ------------------------------------------------------------------------- *
 * Período, gráficos e exportação (Tarefa 16)
 * ------------------------------------------------------------------------- */

/** Um ponto da série temporal: o rótulo do eixo, o texto do tooltip e o valor. */
export type PontoDaSerie = {
  /** "03/09", "01/09" (segunda da semana) ou "set/26" — o que o eixo escreve. */
  rotulo: string;
  /** "3 de setembro de 2026", "semana de 1 a 7 de setembro de 2026" — o que o tooltip diz. */
  detalhe: string;
  valor: number;
};

/**
 * A série "Retiradas por dia" (Tarefa 16, §3). O grão é automático pelo
 * tamanho do período — dia até 31 dias, semana até 182, mês acima — e o título
 * diz qual é ("Retiradas por semana"). Os baldes sem retirada vêm com zero:
 * o buraco **é** a informação.
 */
export type SerieDeRetiradas = {
  grao: "dia" | "semana" | "mes";
  titulo: string;
  pontos: PontoDaSerie[];
};

/**
 * Uma fatia do gráfico de composição ("Retiradas por categoria"). A cor vem
 * de [cores-de-grafico.ts](cores-de-grafico.ts) pela posição da categoria
 * na ordem de `id`, e desce pronta: o componente de gráfico não decide cor.
 */
export type FatiaDeComposicao = {
  nome: string;
  valor: number;
  cor: string;
  corDoRotulo: string;
};

/** Uma célula da planilha exportada. Número vai como número — o Excel soma. */
export type CelulaDeExportacao = string | number | null;

/**
 * Uma aba do .xlsx exportado (Tarefa 16, §5). `notas` são linhas de texto
 * antes do cabeçalho — a data e hora da leitura, na fotografia da ocupação.
 * O título obedece ao limite do formato (31 caracteres, sem `/ \ ? * [ ] :`),
 * conferido em [exportar-xlsx.ts](exportar-xlsx.ts).
 */
export type AbaDeExportacao = {
  titulo: string;
  cabecalho: string[];
  linhas: CelulaDeExportacao[][];
  notas?: string[];
};

/* ------------------------------------------------------------------------- *
 * Ranking de Consumo (Tarefa 16)
 * ------------------------------------------------------------------------- */

/**
 * O que os três rankings têm em comum: quantas retiradas no período, a
 * mediana do tempo de uso (só nos empréstimos que já têm `data_devolucao`),
 * e a largura da barra em linha — proporcional ao **maior da tabela**, de 0 a
 * 100, para a barra CSS da Tarefa 13.
 *
 * A mediana desce duas vezes: formatada ("2 h 15 min") para a tela e em
 * minutos, como número, para a planilha. Nula quando não há amostra — mediana
 * sem amostra não é zero, e a tela mostra "—".
 */
type LinhaDeRanking = {
  retiradas: number;
  usoMediano: string | null;
  usoMedianoMin: number | null;
  barra: number;
};

/**
 * Uma linha do ranking por equipamento. **Todo equipamento em circulação
 * entra, inclusive com zero retiradas** — "nunca sai da prateleira" é
 * argumento de compra tanto quanto "está sempre fora". O aposentado entra só
 * se tiver retirada no período (decisão do dono, Tarefa 16): sem ela, a soma
 * das linhas não fecharia com o cartão nem com a tabela por categoria.
 */
export type EquipamentoNoRanking = LinhaDeRanking & {
  id: string;
  categoria: string;
  /** A situação **atual** do aparelho, não a do período. */
  status: string;
};

/** Uma linha do ranking por categoria: todas as categorias, com zero incluído. */
export type CategoriaNoRanking = LinhaDeRanking & {
  id: number;
  nome: string;
  /** A parte desta categoria no total de retiradas do período, em inteiro de 0 a 100. */
  fatia: number;
  cor: string;
  corDoRotulo: string;
};

/** Uma linha do ranking por pessoa: **só quem retirou ao menos uma vez**. */
export type PessoaNoRanking = LinhaDeRanking & {
  matricula: string;
  nome: string;
  perfil: string;
};

/**
 * Uma retirada do período, como vai para a aba `Retiradas` da planilha:
 * **sem nome nem matrícula**, de propósito. O ranking já responde "quem"; a
 * aba crua dá o pivô sem o histórico nominal de cada pessoa sair do painel.
 * Datas como texto `AAAA-MM-DD HH:MM` no fuso da máquina; durações em minutos.
 */
export type RetiradaExportada = {
  etiqueta: string;
  categoria: string;
  retirada: string;
  devolucao: string | null;
  baixa: string | null;
  situacao: string;
  usoMin: number | null;
  prateleiraMin: number | null;
};

/**
 * O relatório Ranking de Consumo (Tarefa 16, §2).
 *
 * **O que entra no período é a retirada**: um empréstimo pertence ao período
 * em que `data_retirada` cai, e só a esse. Devolução fora do período não muda
 * a atribuição. É a regra única do relatório, e mora no tipo para ninguém
 * reimplementá-la diferente na Tarefa 17.
 *
 * As medianas do topo são sobre todos os empréstimos do período: a de uso só
 * nos que já têm `data_devolucao` (os `ATIVO` contam na retirada e ficam fora
 * dela), a de prateleira só nos `CONCLUIDO` com os dois carimbos — os
 * concluídos antes da Tarefa 12 têm `data_baixa` nula e se excluem sozinhos.
 */
export type RelatorioDeConsumo = {
  /** O período por extenso, formatado no servidor. */
  periodo: string;
  retiradas: number;
  pessoasDistintas: number;
  usoMediano: string | null;
  usoMedianoMin: number | null;
  prateleiraMediana: string | null;
  prateleiraMedianaMin: number | null;
  /** Ordenado por retiradas, e os zeros ao fim; desempate pela ordem do inventário. */
  equipamentos: EquipamentoNoRanking[];
  /** Ordenado por retiradas, desempate pela ordem de `id`. */
  categorias: CategoriaNoRanking[];
  /** Ordenado por retiradas, desempate por nome. */
  pessoas: PessoaNoRanking[];
  /** Uma linha por empréstimo do período, para a aba crua da planilha. */
  linhas: RetiradaExportada[];
};
