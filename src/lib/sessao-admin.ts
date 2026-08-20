import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

/**
 * Sessão do Painel Administrativo — contas individuais (Tarefa 10).
 *
 * Até a Tarefa 9 havia **uma** senha, no `.env`, e o cookie provava que alguém
 * a digitou. O que faltava era responsabilização: "quem deu baixa neste
 * equipamento?" não tinha resposta possível, porque para o sistema todo mundo
 * era a mesma pessoa. Agora cada administrador tem login e senha próprios, e a
 * senha vive no banco como **hash bcrypt** — nunca em texto.
 *
 * A ARQUITETURA DO COOKIE, E POR QUE A CHAVE É O PRÓPRIO HASH
 *
 * O cookie continua sendo o que era: uma carga assinada com HMAC-SHA256, e
 * nunca a credencial. A carga agora carrega `id` e `nome` de quem entrou, como
 * a tarefa pede. O que mudou foi a **chave** da assinatura — antes era a
 * `ADMIN_PASSWORD`, que a tarefa manda remover.
 *
 * A chave passou a ser o hash bcrypt daquele administrador, lido do banco na
 * hora de conferir. Três consequências que se ganham de graça, e que eram
 * justamente as propriedades da Tarefa 4:
 *
 * - **Nenhum segredo novo no `.env`.** Não existe mais o estado "painel não
 *   configurado por falta de variável" — o que faz as vezes dele é "não há
 *   nenhum administrador cadastrado", que se resolve com `npm run db:seed`.
 * - **Reiniciar o servidor não desloga ninguém**, porque a chave é o banco e
 *   não um segredo sorteado a cada boot.
 * - **Trocar a senha de alguém — ou apagar a conta — derruba a sessão daquela
 *   pessoa, e só dela.** O hash muda, a assinatura para de bater. Com uma chave
 *   global isso custaria deslogar a secretaria inteira.
 *
 * O preço é uma leitura de banco por verificação. Em SQLite local, num painel
 * cujas telas já consultam o banco a cada render, é ruído.
 *
 * A verificação é chamada de novo em **cada página e cada Server Action** do
 * /admin. Layout não serve de porta: ele não re-renderiza a cada navegação e
 * não impede um POST direto no endpoint da action.
 */

/** Nome do cookie. Não é `session` genérico para não colidir com nada futuro. */
const NOME_DO_COOKIE = "sessao_admin";

/** Um turno da secretaria. Passou disso, digita de novo. */
const DURACAO_DA_SESSAO_MS = 8 * 60 * 60 * 1000;

/** Rótulo dentro da assinatura: impede reaproveitar o HMAC para outro fim. */
const DOMINIO_DA_ASSINATURA = "admin";

/** Quem está logado agora. É o que a barra do painel exibe. */
export type SessaoAdmin = {
  id: number;
  nome: string;
};

/**
 * Hash de mentira, no formato certo, para o caso "usuário não existe".
 *
 * Sem ele, o login responderia na hora para um usuário inexistente e ~159ms
 * depois para um que existe — e essa diferença é um oráculo: dá para descobrir
 * quais contas existem sem acertar nenhuma senha. Comparar contra este hash
 * gasta o mesmo tempo do caminho real. (O valor é um bcrypt válido de uma
 * senha aleatória que ninguém conhece; `compare` contra ele sempre nega.)
 */
const HASH_DE_ISCA =
  "$2b$10$C6UzMDM.H6dfI/f/IKcEe.4Yl6.MZ0m0.9dJ5Jyz7Nnp3wpKZ1nqi";

/* ------------------------------------------------------------------------- *
 * Primitivas de assinatura
 * ------------------------------------------------------------------------- */

/**
 * Comparação de tempo constante entre duas strings.
 *
 * `timingSafeEqual` exige buffers do mesmo tamanho — comparar os valores crus
 * vazaria o comprimento pelo tamanho do buffer. Comparar os digests SHA-256
 * resolve as duas coisas: sempre 32 bytes, e a comparação não termina mais cedo
 * no primeiro caractere diferente.
 */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a, "utf8").digest(),
    createHash("sha256").update(b, "utf8").digest(),
  );
}

/**
 * A carga do cookie: id, nome e prazo, tudo dentro da assinatura.
 *
 * O nome vai em base64url porque nome de gente tem acento, espaço e — em tese —
 * qualquer coisa; o separador precisa continuar sendo um caractere que o nome
 * não pode conter. Estar **dentro** da assinatura é o que impede alguém de
 * trocar "Secretaria" por outra coisa no próprio navegador e aparecer no painel
 * com o crachá de outra pessoa.
 */
function montarCarga(id: number, nome: string, expiraEm: number): string {
  const nomeCodificado = Buffer.from(nome, "utf8").toString("base64url");
  return `${id}.${nomeCodificado}.${expiraEm}`;
}

function assinar(carga: string, chave: string): string {
  return createHmac("sha256", chave)
    .update(`${DOMINIO_DA_ASSINATURA}.${carga}`)
    .digest("base64url");
}

/* ------------------------------------------------------------------------- *
 * Freio de força bruta
 * ------------------------------------------------------------------------- */

/**
 * A rede é local — é pouco, mas é tudo o que separa o inventário de quem
 * estiver no mesmo wi-fi. Um contador na memória do processo transforma "tentar
 * o dicionário inteiro" em "tentar cinco por minuto".
 *
 * **O contador é por usuário digitado, e não global.** Com senha única (até a
 * Tarefa 9) não havia escolha; com quatro contas, um contador global faria uma
 * pessoa desastrada no teclado trancar o painel para as outras três — e o
 * bloqueio chegaria justamente quando alguém precisasse dar baixa em uma pilha
 * de equipamentos. O custo aceito é que um atacante que revezar entre quatro
 * logins consegue quatro vezes mais tentativas por minuto; numa rede fechada,
 * vinte por minuto continua sendo intratável para qualquer dicionário.
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

/**
 * Teto de logins distintos rastreados ao mesmo tempo.
 *
 * Sem ele, um POST com um usuário diferente a cada requisição faria o mapa
 * crescer sem fim — o contador que existe para conter abuso viraria o próprio
 * vetor. Ao encher, o mapa é esvaziado: perde-se o histórico de tentativas, o
 * que é o comportamento certo para um freio (na dúvida, liberar) e é
 * irrelevante para o atacante, que teria de encher 500 chaves entre cada
 * tentativa para se beneficiar.
 */
const MAXIMO_DE_LOGINS_VIGIADOS = 500;

const globalParaPorteiro = globalThis as unknown as {
  porteirosAdmin?: Map<string, Porteiro>;
};

const porteiros: Map<string, Porteiro> = (globalParaPorteiro.porteirosAdmin ??=
  new Map());

function porteiroDe(usuario: string): Porteiro {
  const existente = porteiros.get(usuario);
  if (existente) return existente;

  if (porteiros.size >= MAXIMO_DE_LOGINS_VIGIADOS) porteiros.clear();

  const novo: Porteiro = { falhas: 0, primeiraFalhaEm: 0, bloqueadoAte: 0 };
  porteiros.set(usuario, novo);
  return novo;
}

/** Segundos que faltam para este login poder tentar de novo. Zero se liberado. */
export function segundosDeBloqueio(usuario: string): number {
  const porteiro = porteiros.get(usuario);
  if (!porteiro) return 0;

  const restante = porteiro.bloqueadoAte - Date.now();
  return restante > 0 ? Math.ceil(restante / 1000) : 0;
}

function registrarFalha(usuario: string): void {
  const porteiro = porteiroDe(usuario);
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

function registrarAcerto(usuario: string): void {
  porteiros.delete(usuario);
}

/* ------------------------------------------------------------------------- *
 * Autenticação
 * ------------------------------------------------------------------------- */

export type Autenticacao =
  | { resultado: "ok"; admin: SessaoAdmin }
  | { resultado: "vazio" }
  | { resultado: "credenciais" }
  | { resultado: "bloqueado"; segundos: number }
  | { resultado: "sem-contas" };

/**
 * Existe alguma conta de administrador cadastrada?
 *
 * É o que sobrou do antigo "a senha está configurada?": sem nenhuma conta, o
 * painel não abre para ninguém e a tela precisa dizer o que fazer
 * (`npm run db:seed`) em vez de repetir "usuário ou senha inválidos" para
 * sempre.
 */
export async function existeAdministrador(): Promise<boolean> {
  return (await prisma.administrador.count()) > 0;
}

/**
 * Acha o administrador pelo login, **sem diferenciar maiúscula de minúscula**.
 *
 * O caminho rápido é o `findUnique` no índice, com o valor já em minúsculas —
 * é o que o `prisma/seed.ts` grava e o que acontece em todo login normal.
 *
 * O caminho lento existe por um defeito medido, não por precaução: o `=` do
 * SQLite é sensível à caixa, e o único jeito de acrescentar um administrador
 * neste MVP é digitando no `npm run db:studio` — onde ninguém prometeu digitar
 * em minúsculas. Uma conta gravada como "Coordenacao" ficava **inalcançável**:
 * existia na tabela, aparecia no Studio, e não havia nada que se pudesse
 * digitar na tela para entrar com ela, porque o campo normaliza para minúsculo
 * antes de procurar. Cadastro gravável e inutilizável — o defeito não estava
 * na escrita nem na leitura isoladamente, e sim no acordo entre as duas.
 *
 * A varredura é aceitável porque esta tabela tem unidades de linhas (não há
 * tela de cadastro), e ela só roda quando o caminho rápido erra.
 */
async function procurarAdministrador(usuario: string) {
  const exato = await prisma.administrador.findUnique({
    where: { usuario },
    select: { id: true, nome: true, senha: true },
  });
  if (exato) return exato;

  const todos = await prisma.administrador.findMany({
    select: { id: true, nome: true, senha: true, usuario: true },
  });

  return todos.find((a) => a.usuario.trim().toLowerCase() === usuario) ?? null;
}

/**
 * Confere login e senha contra o banco.
 *
 * A mensagem de recusa é a mesma para "usuário não existe" e "senha errada" —
 * dizer qual dos dois errou entrega metade da credencial. O tempo de resposta
 * também é o mesmo, e é por isso que o caso "não existe" ainda paga um
 * `bcrypt.compare` contra o `HASH_DE_ISCA`.
 */
export async function autenticar(
  usuarioBruto: unknown,
  senhaBruta: unknown,
): Promise<Autenticacao> {
  const usuario =
    typeof usuarioBruto === "string" ? usuarioBruto.trim().toLowerCase() : "";
  const senha = typeof senhaBruta === "string" ? senhaBruta : "";

  if (usuario.length === 0 || senha.length === 0) return { resultado: "vazio" };

  if (!(await existeAdministrador())) return { resultado: "sem-contas" };

  const segundos = segundosDeBloqueio(usuario);
  if (segundos > 0) return { resultado: "bloqueado", segundos };

  const admin = await procurarAdministrador(usuario);

  // Conferido nesta sessão: `compare` contra um hash corrompido devolve `false`
  // em vez de lançar, então uma linha estragada no banco recusa o login em vez
  // de derrubar a tela.
  const confere = await bcrypt.compare(senha, admin?.senha ?? HASH_DE_ISCA);

  if (!admin || !confere) {
    registrarFalha(usuario);
    return { resultado: "credenciais" };
  }

  registrarAcerto(usuario);
  return { resultado: "ok", admin: { id: admin.id, nome: admin.nome } };
}

/* ------------------------------------------------------------------------- *
 * Entrada e saída
 * ------------------------------------------------------------------------- */

/**
 * Grava o cookie de sessão do administrador que acabou de entrar.
 *
 * `secure` fica **falso** de propósito: o sistema roda em HTTP na rede local da
 * secretaria (spec, seção 1). Com `secure: true` o navegador simplesmente
 * descartaria o cookie e ninguém conseguiria entrar. Se um dia isso for
 * publicado com HTTPS, este é o primeiro lugar a mexer.
 */
export async function criarSessao(admin: SessaoAdmin): Promise<void> {
  const registro = await prisma.administrador.findUnique({
    where: { id: admin.id },
    select: { senha: true },
  });
  if (!registro) return;

  const expiraEm = Date.now() + DURACAO_DA_SESSAO_MS;
  const carga = montarCarga(admin.id, admin.nome, expiraEm);
  const cookieStore = await cookies();

  cookieStore.set(NOME_DO_COOKIE, `${carga}.${assinar(carga, registro.senha)}`, {
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
 * coisa: quem está logado agora?
 *
 * Devolve `null` para cookie ausente, malformado, vencido, assinado com outra
 * chave, ou de um administrador que já não existe. Nenhum desses casos se
 * distingue do outro para quem chamou — e não precisa: a resposta é sempre a
 * mesma porta fechada.
 *
 * Chamar `cookies()` também é o que torna a rota dinâmica — nenhuma tela do
 * painel pode ser congelada no build, porque todas leem o banco.
 */
export async function sessaoAdmin(): Promise<SessaoAdmin | null> {
  const cookieStore = await cookies();
  const bruto = cookieStore.get(NOME_DO_COOKIE)?.value;
  if (!bruto) return null;

  const partes = bruto.split(".");
  if (partes.length !== 4) return null;

  const [idBruto, nomeCodificado, expiraBruto, assinatura] = partes;

  const id = Number(idBruto);
  const expiraEm = Number(expiraBruto);

  if (!Number.isInteger(id) || id <= 0) return null;
  if (!Number.isFinite(expiraEm) || expiraEm <= Date.now()) return null;
  if (assinatura.length === 0) return null;

  const registro = await prisma.administrador.findUnique({
    where: { id },
    select: { nome: true, senha: true },
  });
  if (!registro) return null;

  const carga = `${idBruto}.${nomeCodificado}.${expiraBruto}`;
  if (!iguaisEmTempoConstante(assinatura, assinar(carga, registro.senha))) {
    return null;
  }

  // O nome vem do banco, e não da carga do cookie: os dois estão dentro da
  // assinatura e são igualmente confiáveis, mas o do banco é o mais recente.
  // Quem for renomeado no `db:seed` aparece com o nome novo sem precisar sair
  // e entrar de novo.
  return { id, nome: registro.nome };
}

/** Atalho para quem só precisa saber se a porta está aberta. */
export async function temSessaoAdmin(): Promise<boolean> {
  return (await sessaoAdmin()) !== null;
}
