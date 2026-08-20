import { SeloPerfil, SeloStatusPessoa } from "@/components/admin/SeloStatus";
import { PERFIL, STATUS_PESSOA, type ResumoDePessoas } from "@/lib/tipos";

/**
 * As contagens de cadastros, no topo da tela de pessoas.
 *
 * Espelha o [ResumoInventario](src/components/admin/ResumoInventario.tsx) de
 * propósito — mesma faixa, mesmo tamanho de número, mesmo selo repetido da
 * tabela abaixo. Duas telas do mesmo painel que contam coisas diferentes do
 * mesmo jeito custam zero a mais para aprender.
 *
 * **Os números são sempre do cadastro inteiro, e não do que os filtros
 * mostram.** É a mesma regra do inventário e existe pelo mesmo motivo: a
 * pergunta "quantos alunos temos ativos?" não pode mudar de resposta porque
 * alguém deixou uma busca digitada na barra abaixo.
 *
 * O cartão de inativos só aparece quando existe algum — um zero permanente
 * ocupa um quarto da faixa para não informar nada. Os de perfil aparecem
 * sempre: a proporção aluno/professor é a leitura que a coordenação faz, e
 * "0 professores" é uma informação de verdade.
 */
export function ResumoPessoas({
  ativos,
  inativos,
  alunos,
  professores,
  total,
}: ResumoDePessoas) {
  const temInativos = inativos > 0;

  return (
    <section aria-label="Resumo dos cadastros" className="flex flex-col gap-3">
      <dl
        className={[
          "grid gap-4",
          temInativos ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
        ].join(" ")}
      >
        <Cartao valor={ativos}>
          <SeloStatusPessoa status={STATUS_PESSOA.ativo} />
        </Cartao>

        {temInativos ? (
          <Cartao valor={inativos}>
            <SeloStatusPessoa status={STATUS_PESSOA.inativo} />
          </Cartao>
        ) : null}

        <Cartao valor={alunos}>
          <SeloPerfil perfil={PERFIL.aluno} />
        </Cartao>

        <Cartao valor={professores}>
          <SeloPerfil perfil={PERFIL.professor} />
        </Cartao>
      </dl>

      <p className="px-1 text-base text-tinta-tenue">
        {total === 1 ? "1 cadastro" : `${total} cadastros`} no sistema
        {temInativos ? ", contando os inativos" : ""}.
      </p>
    </section>
  );
}

function Cartao({ valor, children }: { valor: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5">
      <dd className="numeros-tabulares text-4xl font-semibold tracking-tight text-marca-azul">
        {valor}
      </dd>
      <dt>{children}</dt>
    </div>
  );
}
