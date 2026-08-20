/**
 * As regras da senha de administrador, em um lugar só (Tarefa 11).
 *
 * Existe separado de [sessao-admin.ts](src/lib/sessao-admin.ts) por uma razão
 * mecânica: aquele módulo importa `next/headers`, que não existe fora de uma
 * requisição — e o `prisma/seed.ts`, que roda no terminal, precisa do mesmo
 * custo de bcrypt. Sem este arquivo neutro, o custo teria dois donos, e é assim
 * que uma regra vira duas sem ninguém perceber (o mesmo argumento que criou
 * `semAcento` em [texto.ts](src/lib/texto.ts) na Tarefa 7 e o
 * [Campo.tsx](src/components/ui/Campo.tsx) na Tarefa 8).
 *
 * Nada aqui toca o banco nem o React: é aritmética de texto e uma constante.
 * Também não usa `Buffer` — a contagem de bytes é feita com `TextEncoder`, que
 * existe nos dois lados. O módulo é importado pelo servidor, pelo seed **e**
 * pelo modal no navegador, que precisa do mínimo para escrever a dica embaixo
 * do campo.
 */

/**
 * Custo do bcrypt. 10 é o padrão da biblioteca e o que foi medido nesta
 * máquina na Tarefa 10: ~209ms para gerar e ~159ms para conferir. O `bcryptjs`
 * é JavaScript puro (sem compilação nativa), então o custo 12 subiu para
 * ~630ms — caro demais para uma tela que a secretaria abre várias vezes por
 * dia, e sem ganho proporcional numa rede fechada que já tem freio de
 * tentativas.
 */
export const CUSTO_BCRYPT = 10;

/**
 * Mínimo de caracteres da senha nova.
 *
 * A spec da Tarefa 11 não define regra nenhuma; oito é o piso combinado, e ele
 * é deliberadamente só comprimento. Exigir também número e símbolo criaria
 * quatro maneiras de a troca ser recusada para quem está de pé no balcão, numa
 * rede local fechada que já tem freio de tentativas — e o caminho de
 * recuperação de senha esquecida é apagar a linha no `npm run db:studio` e
 * ressemear.
 */
export const MINIMO_DE_CARACTERES = 8;

/**
 * Teto da senha, **em bytes UTF-8 e não em caracteres**.
 *
 * O bcrypt trunca a entrada em 72 bytes e ignora o resto em silêncio —
 * conferido nesta sessão, e antes na Tarefa 10. A unidade importa: `"á"` custa
 * 2 bytes e um emoji custa 4, então 40 letras acentuadas já são 80 bytes.
 * Um limite contado em caracteres (um `maxLength` no `<input>`, por exemplo)
 * aceitaria essa senha, gravaria o hash dos 72 primeiros bytes, e a pessoa
 * passaria a conseguir entrar com uma senha **mais curta** do que a que
 * escolheu — sem nenhuma linha de erro em lugar nenhum. Por isso a conta é de
 * bytes, e por isso ela é feita no servidor.
 */
export const MAXIMO_DE_BYTES = 72;

/**
 * O que há de errado com a senha nova, ou `null` quando não há nada.
 *
 * Devolve a frase pronta para a tela em vez de um booleano: a mensagem é a
 * parte útil, e deixá-la aqui evita que a regra e o texto que a explica se
 * separem.
 */
export function problemaDaNovaSenha(senha: string): string | null {
  if (senha.length < MINIMO_DE_CARACTERES) {
    return `A nova senha precisa ter pelo menos ${MINIMO_DE_CARACTERES} caracteres.`;
  }

  if (new TextEncoder().encode(senha).length > MAXIMO_DE_BYTES) {
    return `A nova senha é longa demais (limite de ${MAXIMO_DE_BYTES} bytes; acentos contam 2 e emojis contam 4).`;
  }

  return null;
}
