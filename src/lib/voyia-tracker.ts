/**
 * Passa ao script do Voyia o telefone que o visitante digitou no formulário do WhatsApp: o Voyia
 * liga a visita (página, UTM, Google, Meta) à conversa pelo telefone, com casamento exato.
 * Silencioso se o script não carregou (bloqueador, rede): o lead segue o fluxo normal.
 */
export function registrarTelefoneNoVoyia(telefone: string, nome?: string, email?: string): void {
  try {
    const v = (window as unknown as { Voyia?: { register?: (p: string, n?: string, e?: string) => unknown } }).Voyia;
    if (telefone && v?.register) void v.register(telefone, nome || undefined, email || undefined);
  } catch {
    /* sem rastreio: segue normal */
  }
}
