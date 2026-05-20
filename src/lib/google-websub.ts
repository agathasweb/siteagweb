import "server-only";
import { locales, localeToDomain, type Locale } from "@/lib/i18n";

/**
 * WebSub (PubSubHubbub) — protocolo de notificação push para feeds RSS/Atom.
 *
 * Em vez de depender da Google Indexing API (que exige projeto GCP + service
 * account), publicamos no hub `pubsubhubbub.appspot.com` (operado pelo Google).
 * O hub puxa nosso feed XML imediatamente — Google encontra novos posts em
 * minutos em vez de horas.
 *
 * Sem auth, sem dependência GCP. Funciona pra qualquer Atom/RSS feed público.
 *
 * Spec: https://www.w3.org/TR/websub/#publisher
 */

const HUBS = [
  // Hub principal do Google — herdado do PubSubHubbub original
  "https://pubsubhubbub.appspot.com/publish",
  // Hub do Superfeedr (commercial, mas a primeira chamada/mês é grátis)
  // Mantemos como fallback porque o GAE hub é flaky desde 2023
  "https://pubsubhubbub.superfeedr.com/",
];

export interface WebSubResult {
  ok: boolean;
  results: { hub: string; feed: string; ok: boolean; status?: number; error?: string }[];
  error?: string;
}

function getFeedUrls(): string[] {
  return locales.map((loc) => {
    const domain = localeToDomain[loc as Locale];
    return `https://${domain}/blog/feed.xml`;
  });
}

async function publishOne(hub: string, feed: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const body = new URLSearchParams({
      "hub.mode": "publish",
      "hub.url": feed,
    });
    const res = await fetch(hub, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (res.status === 204 || res.status === 200 || res.status === 202) {
      return { ok: true, status: res.status };
    }
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: text.slice(0, 200) || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Notifica os hubs WebSub sobre atualização dos 4 feeds RSS de blog
 * (um por domínio). Cada hub recebe 4 POSTs paralelos. Idempotente —
 * pode ser chamado quantas vezes quiser, hub apenas pula se o feed
 * ainda não mudou.
 */
export async function pingWebSub(): Promise<WebSubResult> {
  const feeds = getFeedUrls();
  const tasks: Promise<{ hub: string; feed: string; ok: boolean; status?: number; error?: string }>[] = [];
  for (const hub of HUBS) {
    for (const feed of feeds) {
      tasks.push(
        publishOne(hub, feed).then((r) => ({ hub, feed, ...r })),
      );
    }
  }
  const results = await Promise.all(tasks);
  // "ok" se pelo menos um hub aceitou cada feed (redundância)
  const feedOk = new Map<string, boolean>();
  for (const r of results) {
    feedOk.set(r.feed, (feedOk.get(r.feed) ?? false) || r.ok);
  }
  const allFeedsOk = feeds.every((f) => feedOk.get(f));
  return { ok: allFeedsOk, results };
}

export function getWebSubFeedUrls(): string[] {
  return getFeedUrls();
}
