"use client";

import { useState } from "react";

import { Alerta } from "@/components/ui/Alerta";
import { Botao } from "@/components/ui/Botao";
import { IconeBaixar } from "@/components/ui/icones";
import type { AbaDeExportacao } from "@/lib/tipos";

/**
 * "Baixar planilha (.xlsx)" — o botão de exportação dos relatórios com
 * período (Tarefa 16, §5). Um por aba: Consumo e Ocupação. Satisfação mantém
 * o CSV da Tarefa 14, por decisão da §0.
 *
 * O arquivo é montado **no navegador**, a partir das abas que já desceram no
 * render — o mesmo desenho do CSV e da planilha modelo, com o mesmo
 * `import()` no clique (o SheetJS tem ~1 MB e não pode entrar no pacote
 * inicial do painel) e a mesma âncora descartável. Nada vai ao servidor no
 * clique; quem conferiu a sessão foi a página que renderizou as linhas.
 * Sem Route Handler, de propósito: seria um padrão novo no projeto para uma
 * escala que não pede.
 *
 * O estado é próprio (`baixando`, `erro`), fora do resto da aba: um erro
 * aqui (o pedaço não desceu) não pode mexer nos números ao lado.
 */
export function BotaoBaixarXlsx({
  abas,
  prefixo,
  de,
  ate,
}: {
  abas: AbaDeExportacao[];
  /** "consumo" ou "ocupacao": vira `consumo-2026-09-01-a-2026-09-30.xlsx`. */
  prefixo: string;
  de: string;
  ate: string;
}) {
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function baixar() {
    if (baixando) return;

    setBaixando(true);
    setErro(null);

    try {
      // O nome do arquivo vem do mesmo módulo, no mesmo `import()`: quem o
      // montasse no servidor puxaria o SheetJS inteiro para o render.
      const { gerarXlsx, nomeDoArquivoDeRelatorio, TIPO_XLSX } = await import("@/lib/exportar-xlsx");

      const endereco = URL.createObjectURL(new Blob([gerarXlsx(abas)], { type: TIPO_XLSX }));

      const ancora = document.createElement("a");
      ancora.href = endereco;
      ancora.download = nomeDoArquivoDeRelatorio(prefixo, de, ate);
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
        Baixar planilha (.xlsx)
      </Botao>

      {erro ? <Alerta tom="erro" mensagem={erro} /> : null}
    </div>
  );
}
