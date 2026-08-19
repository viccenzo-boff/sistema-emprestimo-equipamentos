import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

/**
 * Sessão do Painel Administrativo — a "senha mestre simples" da spec (seção 4,
 * Fluxo 3). Sem biblioteca de autenticação: não há cadastro de usuários, não há
 * papéis, não há recuperação de senha. Há uma senha só, no `.env`, e um cookie
 * que prova que alguém a digitou.
 *
 * O cookie **não** guarda a senha. Guarda um prazo de validade e uma assinatura
 * HMAC-SHA256 desse prazo, com a própria senha mestre como chave. Consequências
 * pretendidas:
 *
 * - Ninguém forja uma sessão sem conhecer a senha (é o que o HMAC garante).
 * - Ninguém lê a senha a partir do cookie (HMAC não volta atrás).
 * - Trocar `ADMIN_PASSWORD` no `.env` invalida todas as sessões abertas, que é
 *   exatamente o que se espera ao trocar a senha da secretaria.
 * - O servidor pode reiniciar sem derrubar quem está logado — a chave é o
 *   arquivo `.env`, não um segredo sorteado a cada boot.
 *
 * A verificação mora aqui e é chamada de novo em **cada página e cada Server
 * Action** do /admin. Layout não serve de porta: ele não re-renderiza a cada
 * navegação e não impede um POST direto no endpoint da action.
 */

/** Nome do cookie. Não é `session` genérico para não colidir com nada futuro. */
const NOME_DO_COOKIE = "sessao_admin";

/** Um turno da secretaria. Passou disso, digita de novo. */
const DURACAO_DA_SESSAO_MS = 8 * 60 * 60 * 1000;

/** Rótulo dentro da assinatura: impede reaproveitar o HMAC para outro fim. */
const DOMINIO_DA_ASSINATURA = "admin";

/**
 * Senha mestre do `.env`, ou `null` quando não configurada.
 *
 * Variável ausente e variável vazia caem no mesmo caso de propósito: um `.env`
 * com `ADMIN_PASSWORD=` não pode significar "entra qualquer um" nem "entra com
 * senha vazia". Sem senha configurada, o painel não abre para ninguém.
 */
function senhaMestre(): string | null {
  const senha = process.env.ADMIN_PASSWORD?.trim();
  return senha ? senha : null;
}

export function senhaMestreConfigurada(): boolean {
  return senhaMestre() !== null;
}

/**
 * Comparação de tempo constante entre duas strings.
 *
 * `timingSafeEqual` exige buffers do mesmo tamanho — comparar as senhas cruas
 * vazaria o comprimento da senha certa pelo tamanho do buffer. Comparar os
 * digests SHA-256 resolve as duas coisas: sempre 32 bytes, e a comparação em si
 * não termina mais cedo no primeiro caractere diferente.
 */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a, "utf8").digest(),
    createHash("sha256").update(b, "utf8").digest(),
  );
}

function assinar(expiraEm: number, senha: string): string {
  return createHmac("sha256", senha)
    .update(`${DOMINIO_DA_ASSINATURA}.${expiraEm}`)
    .digest("base64url");
}

/* ------------------------------------------------------------------------- *
 * Freio de força bruta
 * ------------------------------------------------------------------------- */

/**
 * A rede é local e a senha é uma só — é pouco, mas é tudo o que separa o
 * inventário de quem estiver no mesmo wi-fi. Um contador na memória do processo
 * transforma "tentar o dicionário inteiro" em "tentar cinco por minuto".
 *
 * Mora no `globalThis` pelo mesmo motivo do Prisma: o hot-reload do `next dev`
 * recria os módulos, e um contador recriado não conta nada.
 */
type Porteiro = {
  falhas: number;
  primeiraFalhaEm: number;
  bloqueadoAte: number;
};

const LIMITE_DE_TENTATIVAS = 5;
const JANELA_DE_TENTATIVAS_MS = 5 * 60 * 1000;
const CASTIGO_MS = 60 * 1000;

const globalParaPorteiro = globalThis as unknown as { porteiroAdmin?: Porteiro };

const porteiro: Porteiro = (globalParaPorteiro.porteiroAdmin ??= {
  falhas: 0,
  primeiraFalhaEm: 0,
  bloqueadoAte: 0,
});

/** Segundos que faltam para poder tentar de novo. Zero quando está liberado. */
export function segundosDeBloqueio(): number {
  const restante = porteiro.bloqueadoAte - Date.now();
  return restante > 0 ? Math.ceil(restante / 1000) : 0;
}

function registrarFalha(): void {
  const agora = Date.now();

  if (agora - porteiro.primeiraFalhaEm > JANELA_DE_TENTATIVAS_MS) {
    porteiro.falhas = 0;
    porteiro.primeiraFalhaEm = agora;
  }

  porteiro.falhas += 1;

  if (porteiro.falhas >= LIMITE_DE_TENTATIVAS) {
    porteiro.bloqueadoAte = agora + CASTIGO_MS;
    porteiro.falhas = 0;
    porteiro.primeiraFalhaEm = agora;
  }
}

function registrarAcerto(): void {
  porteiro.falhas = 0;
  porteiro.primeiraFalhaEm = 0;
  porteiro.bloqueadoAte = 0;
}

/* ------------------------------------------------------------------------- *
 * Entrada e saída
 * ------------------------------------------------------------------------- */

export type ConferenciaDeSenha =
  | "ok"
  | "vazia"
  | "incorreta"
  | "bloqueado"
  | "nao-configurada";

export function conferirSenha(bruta: unknown): ConferenciaDeSenha {
  const senha = senhaMestre();
  if (!senha) return "nao-configurada";

  if (segundosDeBloqueio() > 0) return "bloqueado";

  const digitada = typeof bruta === "string" ? bruta : "";
  if (digitada.length === 0) return "vazia";

  if (!iguaisEmTempoConstante(digitada, senha)) {
    registrarFalha();
    return "incorreta";
  }

  registrarAcerto();
  return "ok";
}

/**
 * Grava o cookie de sessão.
 *
 * `secure` fica **falso** de propósito: o sistema roda em HTTP na rede local da
 * secretaria (spec, seção 1). Com `secure: true` o navegador simplesmente
 * descartaria o cookie e ninguém conseguiria entrar. Se um dia isso for
 * publicado com HTTPS, este é o primeiro lugar a mexer.
 */
export async function criarSessao(): Promise<void> {
  const senha = senhaMestre();
  if (!senha) return;

  const expiraEm = Date.now() + DURACAO_DA_SESSAO_MS;
  const cookieStore = await cookies();

  cookieStore.set(NOME_DO_COOKIE, `${expiraEm}.${assinar(expiraEm, senha)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(expiraEm),
  });
}

export async function encerrarSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_DO_COOKIE);
}

/**
 * A pergunta que toda página e toda action do /admin faz antes de qualquer
 * coisa: existe sessão válida agora?
 *
 * Chamar `cookies()` também é o que torna a rota dinâmica — nenhuma tela do
 * painel pode ser congelada no build, porque todas leem o banco.
 */
export async function temSessaoAdmin(): Promise<boolean> {
  const senha = senhaMestre();
  if (!senha) return false;

  const cookieStore = await cookies();
  const bruto = cookieStore.get(NOME_DO_COOKIE)?.value;
  if (!bruto) return false;

  const separador = bruto.indexOf(".");
  if (separador <= 0) return false;

  const expiraEm = Number(bruto.slice(0, separador));
  const assinatura = bruto.slice(separador + 1);

  if (!Number.isFinite(expiraEm) || expiraEm <= Date.now()) return false;
  if (assinatura.length === 0) return false;

  return iguaisEmTempoConstante(assinatura, assinar(expiraEm, senha));
}
