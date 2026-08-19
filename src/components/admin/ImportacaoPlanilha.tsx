"use client";

import { useRef, useState, useTransition } from "react";

import { analisarPlanilha, importarPlanilha } from "@/app/admin/usuarios/actions";
import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import {
  IconeAlerta,
  IconeBaixar,
  IconeCheck,
  IconeLapis,
  IconeMais,
  IconePlanilha,
} from "@/components/ui/icones";
import type {
  EstadoDaImportacao,
  LinhaDaImportacao,
  PreviaDaImportacao,
} from "@/lib/tipos";

/**
 * Importação da planilha de usuários (.xlsx) — Tarefa 8, itens 2 e 3.
 *
 * A tela tem **duas etapas obrigatórias**: analisar e confirmar. A importação
 * não tem desfazer — um arquivo errado sobrescreveria centenas de cadastros — e
 * um relatório depois do fato só contaria o estrago. Isso foi levantado como
 * conflito de reversibilidade antes de existir código; a prévia é a resposta.
 *
 * O arquivo é **mantido em estado do React e enviado duas vezes**: uma para
 * analisar, outra para confirmar. Não é desperdício, é a garantia de que o
 * servidor nunca escreve o que a tela calculou — ele relê a planilha e refaz o
 * plano no momento da gravação. Uma lista de operações vinda do cliente seria
 * escrita direta no banco, e esta é uma action pública.
 *
 * Por isso também **não é um `<form action>`**: o React 19 limpa o formulário
 * quando a action termina, e um `<input type="file">` limpo entre a análise e a
 * confirmação perderia justamente o arquivo que a segunda etapa precisa. A
 * armadilha é a mesma já registrada na Tarefa 5, do outro lado: lá o problema
 * era um `<select>` controlado dentro de um form; aqui é o form limpando o que
 * precisa sobreviver a ele.
 */

/**
 * Quantas linhas da prévia são desenhadas.
 *
 * Planilha de curso inteiro tem centenas de linhas, e desenhar todas trava a
 * página do computador da secretaria sem informar mais: a decisão de confirmar
 * se toma pelos totais e por uma amostra do que muda. Os **erros escapam deste
 * teto** — eles são a lista que alguém vai usar para corrigir o arquivo.
 */
const LINHAS_DESENHADAS = 60;

export function ImportacaoPlanilha() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<EstadoDaImportacao>({ fase: "inicial" });
  const [arrastando, setArrastando] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();
  const entradaRef = useRef<HTMLInputElement>(null);

  // O download do modelo tem estado próprio, e não uma fase de `estado`: ele não
  // participa do ciclo analisar → confirmar, e enfiá-lo ali faria baixar o
  // modelo apagar a prévia que a pessoa está lendo para decidir.
  const [baixando, setBaixando] = useState(false);
  const [erroDoModelo, setErroDoModelo] = useState<string | null>(null);

  function escolher(novo: File | null) {
    setArquivo(novo);
    // Trocar de arquivo invalida a prévia do anterior: manter a lista antiga na
    // tela com um nome novo em cima é o caminho mais curto para confirmar a
    // importação errada.
    setEstado({ fase: "inicial" });
  }

  function limpar() {
    setArquivo(null);
    setEstado({ fase: "inicial" });
    // O input de arquivo guarda o valor no DOM; sem isso, escolher o **mesmo**
    // arquivo de novo não dispara `change` e a tela parece travada.
    if (entradaRef.current) entradaRef.current.value = "";
  }

  function analisar() {
    if (!arquivo || pendente) return;

    iniciarTransicao(async () => {
      const dados = new FormData();
      dados.append("planilha", arquivo);

      const resultado = await analisarPlanilha(dados);

      setEstado(
        resultado.ok
          ? { fase: "previa", previa: resultado.dados }
          : {
              fase: "erro",
              mensagem: resultado.mensagem,
              detalhe: resultado.detalhe,
            },
      );
    });
  }

  function confirmar() {
    if (!arquivo || pendente) return;

    iniciarTransicao(async () => {
      const dados = new FormData();
      dados.append("planilha", arquivo);

      const resultado = await importarPlanilha(dados);

      if (!resultado.ok) {
        setEstado({
          fase: "erro",
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
        });
        return;
      }

      setEstado({ fase: "concluida", resultado: resultado.dados });
      limparEntrada();
    });
  }

  function limparEntrada() {
    setArquivo(null);
    if (entradaRef.current) entradaRef.current.value = "";
  }

  /**
   * Gera a planilha modelo no próprio navegador e entrega ao download (Tarefa 9).
   *
   * O `import()` é dinâmico de propósito: o SheetJS tem ~1 MB, e um import
   * estático o traria no pacote inicial desta tela — que abre todo dia — por
   * causa de um botão clicado uma vez por semestre. Assim o pacote só desce no
   * primeiro clique, e a tela não recarrega, como o enunciado pede.
   *
   * A âncora criada na hora, e não `XLSX.writeFile`: aqui o tipo MIME é escrito
   * explicitamente e o endereço temporário é revogado na mesma função, sem
   * depender do que a biblioteca faz com o DOM por dentro.
   */
  async function baixarModelo() {
    if (baixando) return;

    setBaixando(true);
    setErroDoModelo(null);

    try {
      const { gerarPlanilhaModelo, NOME_DA_PLANILHA_MODELO, TIPO_XLSX } =
        await import("@/lib/planilha-modelo");

      const endereco = URL.createObjectURL(
        new Blob([gerarPlanilhaModelo()], { type: TIPO_XLSX }),
      );

      const ancora = document.createElement("a");
      ancora.href = endereco;
      ancora.download = NOME_DA_PLANILHA_MODELO;
      document.body.append(ancora);
      ancora.click();
      ancora.remove();
      URL.revokeObjectURL(endereco);
    } catch {
      // Falha real e possível: o pacote do SheetJS não desceu (rede caiu, ou o
      // servidor foi reiniciado com outra versão dos arquivos). Sem esta
      // mensagem, o botão gira uma vez e não acontece nada.
      setErroDoModelo(
        "Não foi possível gerar a planilha modelo. Recarregue a página e tente de novo.",
      );
    } finally {
      setBaixando(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-borda bg-superficie p-6 lg:p-7">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-tinta">
          Importar planilha
        </h2>
        <p className="mt-1 text-base text-tinta-suave">
          Arquivo <span className="font-mono">.xlsx</span> do Excel, com a coluna{" "}
          <span className="font-mono">matricula</span> e, opcionalmente,{" "}
          <span className="font-mono">nome</span>,{" "}
          <span className="font-mono">perfil</span>,{" "}
          <span className="font-mono">cursos</span> e{" "}
          <span className="font-mono">status</span>. Nada é gravado antes de você
          conferir a prévia.
        </p>
      </div>

      {/*
        O botão fica entre a explicação e a área de soltar, que é a ordem da
        tarefa real: primeiro se descobre quais colunas existem, depois se pega
        o arquivo com elas, e só então se envia o preenchido.

        `self-start` no botão, e não `items-start` no bloco: com o alinhamento no
        pai, o parágrafo abaixo também encolheria para o próprio conteúdo e sairia
        em uma linha larguíssima. É a mesma armadilha de `stretch` que distorceu a
        logo do login na Tarefa 5, do outro lado.
      */}
      <div className="flex flex-col gap-2">
        <Botao
          variante="secundario"
          tamanho="pequeno"
          onClick={baixarModelo}
          carregando={baixando}
          className="self-start"
        >
          <IconeBaixar className="size-5" />
          Baixar planilha modelo
        </Botao>

        <p className="max-w-prose text-sm text-tinta-tenue">
          Vem vazia, só com os cabeçalhos. Se a matrícula tiver zero à esquerda,
          formate a coluna como <span className="font-semibold">Texto</span> antes
          de digitar — em formato Geral o Excel guarda{" "}
          <span className="font-mono">0012345</span> como{" "}
          <span className="font-mono">12345</span>.
        </p>

        {erroDoModelo ? <Alerta tom="erro" mensagem={erroDoModelo} /> : null}
      </div>

      <Area
        arquivo={arquivo}
        arrastando={arrastando}
        desabilitado={pendente}
        entradaRef={entradaRef}
        onArrastando={setArrastando}
        onEscolher={escolher}
      />

      {arquivo ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Botao
            variante="secundario"
            onClick={limpar}
            disabled={pendente}
            className="sm:min-w-40"
          >
            Trocar arquivo
          </Botao>

          {estado.fase === "previa" ? (
            <Botao
              variante="sucesso"
              onClick={confirmar}
              carregando={pendente}
              className="sm:min-w-56"
            >
              <IconeCheck className="size-5" />
              Confirmar importação
            </Botao>
          ) : (
            <Botao onClick={analisar} carregando={pendente} className="sm:min-w-56">
              <IconePlanilha className="size-5" />
              Analisar planilha
            </Botao>
          )}
        </div>
      ) : null}

      {estado.fase === "erro" ? (
        <Alerta tom="erro" mensagem={estado.mensagem} detalhe={estado.detalhe} />
      ) : null}

      {estado.fase === "previa" ? <Previa previa={estado.previa} /> : null}

      {estado.fase === "concluida" ? (
        <Alerta
          tom="sucesso"
          mensagem={resumoDaImportacao(estado.resultado)}
          detalhe={
            estado.resultado.erros > 0
              ? `${estado.resultado.erros} ${estado.resultado.erros === 1 ? "linha foi ignorada" : "linhas foram ignoradas"} por erro. Corrija a planilha e importe de novo — reimportar o que já entrou não duplica nada.`
              : "A lista abaixo já está atualizada."
          }
        />
      ) : null}
    </section>
  );
}

/**
 * A área de soltar o arquivo.
 *
 * É um `<label>` com o `<input type="file">` escondido dentro, e não uma `div`
 * com `onClick`: assim o clique, o Tab e o Enter funcionam sozinhos, o leitor de
 * tela anuncia "botão de upload de arquivo", e não há um `role` inventado à mão
 * para manter. O arrastar-e-soltar é um extra por cima disso — nunca o único
 * caminho, porque em uma tela sensível ao toque não existe arrastar de arquivo.
 */
function Area({
  arquivo,
  arrastando,
  desabilitado,
  entradaRef,
  onArrastando,
  onEscolher,
}: {
  arquivo: File | null;
  arrastando: boolean;
  desabilitado: boolean;
  entradaRef: React.RefObject<HTMLInputElement | null>;
  onArrastando: (valor: boolean) => void;
  onEscolher: (arquivo: File | null) => void;
}) {
  return (
    <label
      onDragOver={(evento) => {
        evento.preventDefault();
        if (!desabilitado) onArrastando(true);
      }}
      onDragLeave={() => onArrastando(false)}
      onDrop={(evento) => {
        evento.preventDefault();
        onArrastando(false);
        if (desabilitado) return;

        const solto = evento.dataTransfer.files?.[0];
        if (solto) onEscolher(solto);
      }}
      className={[
        "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center",
        "transition-colors duration-150",
        "focus-within:border-marca-azul focus-within:bg-marca-azul-tenue",
        desabilitado ? "cursor-not-allowed opacity-60" : "",
        arrastando
          ? "border-marca-verde bg-sucesso-fundo"
          : "border-borda-forte bg-superficie-2 hover:border-marca-azul-claro hover:bg-marca-azul-tenue",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        ref={entradaRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        disabled={desabilitado}
        onChange={(evento) => onEscolher(evento.target.files?.[0] ?? null)}
        className="sr-only"
      />

      <span className="flex size-14 items-center justify-center rounded-2xl bg-marca-azul-tenue text-marca-azul">
        <IconePlanilha className="size-8" />
      </span>

      {arquivo ? (
        <span>
          <span className="block font-mono text-lg font-semibold break-all text-tinta">
            {arquivo.name}
          </span>
          <span className="mt-1 block text-base text-tinta-suave">
            {formatarTamanho(arquivo.size)} — clique para trocar
          </span>
        </span>
      ) : (
        <span>
          <span className="block text-lg font-semibold text-tinta">
            Clique para escolher a planilha
          </span>
          <span className="mt-1 block text-base text-tinta-suave">
            ou arraste o arquivo .xlsx até aqui
          </span>
        </span>
      )}
    </label>
  );
}

/**
 * O que a importação vai fazer, antes de fazer.
 *
 * As linhas **inalteradas não entram na lista**, e é para isso que a categoria
 * existe: planilha de coordenação é reenviada inteira todo semestre, e uma lista
 * de 300 itens em que 290 dizem "nada muda" é uma lista que ninguém lê. Elas
 * continuam contadas no cartão — o número é o que responde "então o arquivo foi
 * lido mesmo?".
 *
 * Os erros vêm **primeiro** e não respeitam o teto de linhas desenhadas: são
 * eles que alguém vai transcrever para corrigir o arquivo, e cortar essa lista
 * pela metade obrigaria a importar de novo só para descobrir o resto.
 */
function Previa({ previa }: { previa: PreviaDaImportacao }) {
  const erros = previa.linhas.filter((linha) => linha.acao === "erro");
  const mudam = previa.linhas.filter(
    (linha) => linha.acao === "criar" || linha.acao === "atualizar",
  );

  const desenhadas = mudam.slice(0, LINHAS_DESENHADAS);
  const escondidas = mudam.length - desenhadas.length;

  const nadaAFazer = mudam.length === 0 && erros.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Contagem rotulo="Cadastrar" valor={previa.totais.criar} tom="bom" />
        <Contagem rotulo="Atualizar" valor={previa.totais.atualizar} tom="bom" />
        <Contagem rotulo="Sem mudança" valor={previa.totais.inalteradas} tom="neutro" />
        <Contagem rotulo="Com erro" valor={previa.totais.erros} tom="ruim" />
      </dl>

      <p className="text-base text-tinta-suave">
        Colunas lidas em{" "}
        <span className="font-mono font-semibold text-tinta">{previa.arquivo}</span>:{" "}
        {previa.colunas.map((coluna) => (
          <span
            key={coluna}
            className="mr-1.5 inline-block rounded-lg border border-borda bg-superficie-2 px-2 py-0.5 font-mono text-sm"
          >
            {coluna}
          </span>
        ))}
        {previa.colunas.length < 5 ? (
          <span className="block pt-1 text-tinta-tenue">
            As colunas que não estão no arquivo são preservadas como estão no
            sistema — a importação não apaga o que a planilha não menciona.
          </span>
        ) : null}
      </p>

      {nadaAFazer ? (
        <Alerta
          tom="info"
          mensagem="Esta planilha não muda nada."
          detalhe="Todos os cadastros dela já estão exatamente assim no sistema. Confirmar não faz mal, só não faz nada."
        />
      ) : null}

      {erros.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-erro">
            <IconeAlerta className="size-5" />
            {erros.length === 1
              ? "1 linha será ignorada"
              : `${erros.length} linhas serão ignoradas`}
          </h3>
          <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto rounded-2xl border border-erro-borda bg-erro-fundo p-4">
            {erros.map((linha) => (
              <li key={`${linha.linha}-${linha.matricula}`} className="text-base text-erro/90">
                <span className="numeros-tabulares font-semibold">
                  Linha {linha.linha}
                </span>
                {linha.matricula ? (
                  <span className="font-mono"> ({linha.matricula})</span>
                ) : null}
                : {linha.erro}
              </li>
            ))}
          </ul>
          <p className="text-base text-tinta-tenue">
            O resto da planilha entra normalmente. Corrija estas linhas e importe
            o arquivo de novo — o que já entrou não é duplicado.
          </p>
        </div>
      ) : null}

      {desenhadas.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-tinta">O que vai mudar</h3>

          <ul className="flex max-h-96 flex-col divide-y divide-borda overflow-y-auto rounded-2xl border border-borda">
            {desenhadas.map((linha) => (
              <LinhaDaPrevia key={`${linha.linha}-${linha.matricula}`} linha={linha} />
            ))}
          </ul>

          {escondidas > 0 ? (
            <p className="text-base text-tinta-tenue">
              e mais {escondidas} {escondidas === 1 ? "linha" : "linhas"} que não
              couberam na amostra. Os totais acima contam todas.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Uma linha da prévia: quem é, o que acontece e o que muda campo a campo. */
function LinhaDaPrevia({ linha }: { linha: LinhaDaImportacao }) {
  const criando = linha.acao === "criar";

  return (
    <li className="flex flex-col gap-2 bg-superficie p-4 sm:flex-row sm:items-start sm:gap-4">
      <span className="flex shrink-0 items-center gap-2">
        <span
          className={[
            "flex size-8 items-center justify-center rounded-lg",
            criando
              ? "bg-sucesso-fundo text-sucesso"
              : "bg-marca-azul-tenue text-marca-azul",
          ].join(" ")}
        >
          {criando ? (
            <IconeMais className="size-5" />
          ) : (
            <IconeLapis className="size-5" />
          )}
        </span>
        <span className="numeros-tabulares font-mono text-base font-semibold text-tinta">
          {linha.matricula}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-tinta">
          {criando ? "Cadastrar" : "Atualizar"} {linha.nome}
        </span>

        <ul className="mt-1 flex flex-col gap-0.5">
          {linha.mudancas
            // Em uma criação, "de → para" com o lado esquerdo vazio é ruído: o
            // cadastro inteiro é novo, e o que importa é o valor que ele nasce.
            .filter((mudanca) => criando || mudanca.de !== mudanca.para)
            .map((mudanca) => (
              <li key={mudanca.campo} className="text-sm text-tinta-suave">
                <span className="font-semibold">{mudanca.campo}</span>:{" "}
                {criando ? (
                  <span className="text-tinta">{mudanca.para}</span>
                ) : (
                  <>
                    <span className="text-tinta-tenue line-through">{mudanca.de}</span>{" "}
                    <span aria-hidden="true">→</span>
                    <span className="sr-only">passa a ser</span>{" "}
                    <span className="font-medium text-tinta">{mudanca.para}</span>
                  </>
                )}
              </li>
            ))}
        </ul>
      </span>
    </li>
  );
}

function Contagem({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom: "bom" | "neutro" | "ruim";
}) {
  // Zero em "Com erro" é boa notícia e não deve gritar em vermelho; zero nos
  // outros também não pede destaque. Só o número que existe ganha cor.
  const cor =
    valor === 0
      ? "text-tinta-tenue"
      : tom === "ruim"
        ? "text-erro"
        : tom === "neutro"
          ? "text-tinta-suave"
          : "text-marca-azul";

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-borda bg-superficie-2 p-4">
      <dd className={`numeros-tabulares text-3xl font-semibold tracking-tight ${cor}`}>
        {valor}
      </dd>
      <dt className="text-sm font-semibold tracking-wide text-tinta-tenue uppercase">
        {rotulo}
      </dt>
    </div>
  );
}

/** "1,2 MB", "340 KB" — o tamanho como o Windows mostra. */
function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** A frase do alerta verde, montada só com o que de fato aconteceu. */
function resumoDaImportacao(resultado: {
  criados: number;
  atualizados: number;
  inalterados: number;
}): string {
  const partes: string[] = [];

  if (resultado.criados > 0) {
    partes.push(
      `${resultado.criados} ${resultado.criados === 1 ? "cadastro criado" : "cadastros criados"}`,
    );
  }

  if (resultado.atualizados > 0) {
    partes.push(
      `${resultado.atualizados} ${resultado.atualizados === 1 ? "atualizado" : "atualizados"}`,
    );
  }

  if (partes.length === 0) {
    return "Importação concluída — nenhum cadastro precisou mudar.";
  }

  return `Importação concluída: ${partes.join(" e ")}.`;
}
