import { IconeCategoria, IconeRelogio } from "@/components/ui/icones";
import type { EmprestimoEmCurso } from "@/lib/tipos";

/**
 * Visão Geral: quem está com qual equipamento agora (spec, seção 4, Fluxo 3).
 *
 * Somente leitura — de propósito. Não existe botão de "devolver" aqui: a baixa
 * é um ato físico, e ela acontece onde o equipamento está, na Fila de
 * Devoluções. Um atalho nesta tela permitiria concluir um empréstimo sem
 * ninguém ter conferido a bancada, que é o buraco que o `AGUARDANDO_BAIXA`
 * existe para tapar.
 *
 * Aqui é tabela de verdade, e não cartão como na fila: nada para fazer em cada
 * linha, muita linha para varrer com o olho. A tabela rola dentro do próprio
 * contêiner em telas estreitas, para a página nunca deslizar de lado.
 */

type Props = {
  emprestimos: EmprestimoEmCurso[];
};

export function TabelaAtivos({ emprestimos }: Props) {
  if (emprestimos.length === 0) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-3xl border border-borda bg-superficie px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-marca-azul-tenue text-marca-azul">
          <IconeRelogio className="size-8" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-tinta">
            Nenhum equipamento fora
          </h2>
          <p className="mt-2 text-lg text-tinta-suave">
            Todo o inventário está na secretaria ou em manutenção.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-3xl border border-borda bg-superficie">
        <table className="w-full min-w-3xl border-collapse text-left">
          <caption className="sr-only">
            Empréstimos ativos, do mais antigo para o mais recente
          </caption>

          <thead>
            <tr className="border-b border-borda">
              <th scope="col" className={CABECALHO}>
                Equipamento
              </th>
              <th scope="col" className={CABECALHO}>
                Com quem está
              </th>
              <th scope="col" className={CABECALHO}>
                Retirado em
              </th>
              <th scope="col" className={`${CABECALHO} text-right`}>
                Fora há
              </th>
            </tr>
          </thead>

          <tbody>
            {emprestimos.map((emprestimo) => (
              <tr
                key={emprestimo.id}
                className="border-b border-borda last:border-b-0 hover:bg-superficie-2"
              >
                <td className={CELULA}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-marca-azul-tenue text-marca-azul">
                      <IconeCategoria tipo={emprestimo.tipo} className="size-6" />
                    </span>
                    <span>
                      <span className="block font-mono text-lg font-bold tracking-tight text-tinta">
                        {emprestimo.equip_id}
                      </span>
                      <span className="block text-sm text-tinta-suave">
                        {emprestimo.tipo}
                      </span>
                    </span>
                  </div>
                </td>

                <td className={CELULA}>
                  <span className="block text-base font-semibold text-tinta">
                    {emprestimo.nome}
                  </span>
                  <span className="numeros-tabulares block text-sm text-tinta-suave">
                    {emprestimo.perfil === "PROFESSOR" ? "Professor" : "Aluno"} ·{" "}
                    {emprestimo.matricula}
                  </span>
                </td>

                <td className={`${CELULA} numeros-tabulares text-base text-tinta-suave`}>
                  {emprestimo.retiradoEm}
                </td>

                <td
                  className={`${CELULA} numeros-tabulares text-right text-base font-semibold text-tinta`}
                >
                  {emprestimo.ha}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-1 text-base text-tinta-tenue">
        {emprestimos.length === 1
          ? "1 equipamento fora da secretaria."
          : `${emprestimos.length} equipamentos fora da secretaria.`}{" "}
        A lista mostra apenas empréstimos ativos — o que já foi devolvido no tablet
        está na Fila de Devoluções.
      </p>
    </section>
  );
}

const CABECALHO =
  "px-5 py-4 text-sm font-semibold tracking-wide text-tinta-tenue uppercase";
const CELULA = "px-5 py-4 align-middle";
