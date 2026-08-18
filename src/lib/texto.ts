/**
 * Ajustes de texto para a interface em português.
 *
 * O banco guarda o `tipo` no singular ("Notebook", "Extensão") porque é o que
 * descreve uma linha da tabela. A tela fala de conjuntos ("Notebooks"), então a
 * conversão mora aqui — em um lugar só, para as telas não divergirem entre si.
 */

/** "Notebook" -> "Notebooks", "Extensão" -> "Extensões". */
export function plural(tipo: string): string {
  if (tipo.endsWith("s")) return tipo;
  if (tipo.endsWith("ão")) return `${tipo.slice(0, -2)}ões`;
  return `${tipo}s`;
}

/**
 * Primeiro nome, para a saudação.
 * "Prof. Daniel Rocha" -> "Prof. Daniel": o tratamento sozinho não serve.
 */
export function primeiroNome(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);

  if (partes.length > 1 && partes[0].endsWith(".")) {
    return `${partes[0]} ${partes[1]}`;
  }

  return partes[0] ?? nomeCompleto;
}
