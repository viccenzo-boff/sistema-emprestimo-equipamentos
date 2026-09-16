"use client";

import { useState } from "react";

import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeBaixar } from "@/components/ui/icones";
import { diaLocal } from "@/lib/texto";
import type { LinhaDeAvaliacao } from "@/lib/tipos";

/**
 * "Baixar planilha" da aba Satisfação (Tarefa 14, item 5).
 *
 * O CSV é montado **no navegador**, a partir das linhas que já desceram no
 * render — o mesmo desenho da planilha modelo da Tarefa 9, com o mesmo
 * `import()` no clique e a mesma âncora descartável. Nada vai ao servidor no
 * clique, e por isso o botão não precisa de sessão nem de action: quem
 * conferiu a sessão foi a página que renderizou as linhas.
 *
 * O estado é próprio (`baixando`, `erro`), fora do resto da aba, porque o
 * download não participa de nada — e um erro aqui (o pedaço não desceu) não
 * pode mexer nos números ao lado.
 */
export function BotaoBaixarAvaliacoes({ linhas }: { linhas: LinhaDeAvaliacao[] }) {
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function baixar() {
    if (baixando) return;

    setBaixando(true);
    setErro(null);

    try {
      const { gerarCsvDeAvaliacoes, nomeDoCsvDeAvaliacoes, TIPO_CSV } =
        await import("@/lib/avaliacoes-csv");

      const endereco = URL.createObjectURL(
        new Blob([gerarCsvDeAvaliacoes(linhas)], { type: TIPO_CSV }),
      );

      const ancora = document.createElement("a");
      ancora.href = endereco;
      ancora.download = nomeDoCsvDeAvaliacoes(diaLocal(new Date()));
      document.body.append(ancora);
      ancora.click();
      ancora.remove();
      URL.revokeObjectURL(endereco);
    } catch {
      setErro("Não foi possível gerar a planilha. Recarregue a página e tente de novo.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Botao
        variante="secundario"
        tamanho="pequeno"
        onClick={baixar}
        carregando={baixando}
        className="self-start"
      >
        <IconeBaixar className="size-5" />
        Baixar planilha
      </Botao>

      {erro ? <Alerta tom="erro" mensagem={erro} /> : null}
    </div>
  );
}
