/**
 * Páginas do Salomão: landings em *.salomao.agathas.com.br e /produtos/salomao no site.
 * Nelas os eventos da Meta vão só para o pixel do Salomão (público de escolas), nunca para os
 * pixels do site da Agathas. O snippet de <MetaPixel/> repete esta regra em JS puro.
 */
export function ehPaginaSalomao(hostname: string, pathname: string): boolean {
  return /(^|\.)salomao\.agathas\.com\.br$/.test(hostname) || /\/produtos\/salomao(\/|$)/.test(pathname);
}
