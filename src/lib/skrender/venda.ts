import "server-only";

/**
 * Venda do SK Render no exterior (21/11/2026, tabela do Gutto): dólar com os mesmos números do real e euro pela
 * metade, sem taxa por compra. A MESMA tabela está em ~/DDEV/sk-render/server/intl.mjs (PRECOS): mudou lá, muda aqui.
 */
export type ItemSkr = "pack25" | "pack50" | "pack100" | "mensal25" | "mensal50" | "mensal100";
export type MoedaSkr = "usd" | "eur";

export const ITENS: Record<ItemSkr, { renders: number; assinatura: boolean }> = {
  pack25: { renders: 25, assinatura: false }, pack50: { renders: 50, assinatura: false }, pack100: { renders: 100, assinatura: false },
  mensal25: { renders: 25, assinatura: true }, mensal50: { renders: 50, assinatura: true }, mensal100: { renders: 100, assinatura: true },
};
// Em centavos.
export const PRECOS: Record<MoedaSkr, Record<ItemSkr, number>> = {
  usd: { mensal25: 1990, mensal50: 3490, mensal100: 6490, pack25: 3490, pack50: 6490, pack100: 12990 },
  eur: { mensal25: 995, mensal50: 1745, mensal100: 3245, pack25: 1745, pack50: 3245, pack100: 6495 },
};
export const ehItem = (v: unknown): v is ItemSkr => typeof v === "string" && v in ITENS;
export const moedaDoLocale = (lang: string): MoedaSkr | null => (lang === "es" ? "eur" : lang === "en-US" || lang === "en-GB" ? "usd" : null);
export const idiomaDaMoeda = (m: MoedaSkr): "en" | "es" => (m === "eur" ? "es" : "en");

const SKR = () => (process.env.SKR_INTERNAL_URL?.trim() || "https://skrender.agathas.com.br/api/interno").replace(/\/$/, "");
export const contaSkrUrl = (lang: "en" | "es") => `https://skrender.agathas.com.br/conta?lang=${lang}`;

/** API interna do SK Render (chave INTERNAL_KEY de lá = SKR_INTERNAL_KEY aqui). Lança erro em falha. */
export async function skrInterno<T = Record<string, unknown>>(acao: "conta" | "creditar" | "assinar" | "renovar" | "encerrar", corpo: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${SKR()}/${acao}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-skr-key": process.env.SKR_INTERNAL_KEY?.trim() || "", "user-agent": "agathas-site/1.0" },
    body: JSON.stringify(corpo),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const json = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw Object.assign(new Error(json.error || `SK Render ${r.status}`), { status: r.status });
  return json;
}
