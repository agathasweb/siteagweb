/**
 * Attribution helpers — leitura/gravação dos cookies `_fbp` (browser ID) e
 * `_fbc` (click ID) que a Meta usa pra atribuir conversões.
 *
 * - `_fbp` é setado automaticamente pelo Pixel base code; aqui só lemos.
 * - `_fbc` é setado pelo Pixel SE houver `?fbclid=` na URL. Nós também
 *   replicamos manualmente em <AttributionCapture/> pra garantir que persista
 *   mesmo se o Pixel demorar a carregar (race condition real em mobile lento).
 *
 * Formato `_fbc`: `fb.{subdomainIndex}.{timestampMs}.{fbclid}`
 *   subdomainIndex: 1 = .com (1 ponto), 2 = subdomain.com (2 pontos)
 */

const FBP_NAME = "_fbp";
const FBC_NAME = "_fbc";
const COOKIE_MAX_AGE_DAYS = 90; // padrão Meta

/** Lê um cookie do document — só funciona no browser. */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return trimmed.slice(target.length) || null;
  }
  return null;
}

export function readFbp(): string | null {
  return readCookie(FBP_NAME);
}

export function readFbc(): string | null {
  return readCookie(FBC_NAME);
}

/**
 * Calcula o subdomainIndex correto pro domínio atual.
 * Meta exige: 1 = TLD direto (ex.: example.com), 2 = subdomain (ex.: www.example.com).
 *
 * Como a Agathas roda em `agathas.com.br` (TLD composto), tratamos `*.com.br`,
 * `*.co.uk`, etc. como TLD efetivo de 2 partes.
 */
function subdomainIndex(hostname: string): number {
  const parts = hostname.split(".");
  // 2-part TLD (com.br, co.uk, com.es) → considera 3 segmentos como "raiz"
  const lastTwo = parts.slice(-2).join(".");
  const tldEffectiveParts =
    /^(com|co|gov|net|org|edu)\.(br|uk|es|au|nz|jp|mx|ar|in)$/.test(lastTwo) ? 3 : 2;
  return Math.max(1, parts.length - tldEffectiveParts + 1);
}

/**
 * Seta o cookie `_fbc` com o fbclid recebido na URL. Idempotente: se já existe
 * um `_fbc` com o mesmo fbclid, mantém o timestamp original (preserva o
 * "primeiro toque").
 *
 * Também grava `_fbclid_raw` em paralelo — backup do clique cru, útil pra
 * debug + reconstrução do `_fbc` caso o cookie original seja apagado.
 */
export function persistFbcFromFbclid(fbclid: string): void {
  if (typeof document === "undefined" || !fbclid) return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

  // Cookie cru — backup pra debug/recovery. Sem TTL longo perde valor pra
  // reconstrução, então usa o mesmo 90d do `_fbc`.
  document.cookie = `_fbclid_raw=${encodeURIComponent(fbclid)}; max-age=${maxAge}; path=/; SameSite=Lax; Secure`;

  const existing = readFbc();
  if (existing && existing.endsWith(`.${fbclid}`)) return;
  const idx = subdomainIndex(window.location.hostname);
  const value = `fb.${idx}.${Date.now()}.${fbclid}`;
  document.cookie = `${FBC_NAME}=${value}; max-age=${maxAge}; path=/; SameSite=Lax; Secure`;
}

/** Helper: pega fbclid da URL atual (ou null). */
export function getFbclidFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  return sp.get("fbclid");
}

// ---------- UTMs ----------

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
type UtmKey = (typeof UTM_KEYS)[number];
export type UtmSnapshot = Record<UtmKey, string | null>;

const UTM_COOKIE = "agathas_utm";
const UTM_COOKIE_MAX_AGE = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;

/**
 * Persiste UTMs em cookie (90d) com first-touch attribution: se já existe um
 * `agathas_utm`, mantém o original — só sobrescreve se houver UTM novo na URL
 * E o cookie atual estiver vazio. Esse modelo dá crédito ao primeiro toque,
 * que é o padrão de mercado pra atribuição de jornadas longas (B2B/SaaS).
 */
export function persistUtmsFromLocation(): UtmSnapshot {
  const empty: UtmSnapshot = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  };
  if (typeof window === "undefined") return empty;

  const sp = new URLSearchParams(window.location.search);
  const fromUrl: UtmSnapshot = { ...empty };
  let hasAny = false;
  for (const k of UTM_KEYS) {
    const v = sp.get(k);
    if (v) {
      fromUrl[k] = v.slice(0, 255); // truncate paranoia
      hasAny = true;
    }
  }
  if (!hasAny) return readUtmsFromCookie() ?? empty;

  const existing = readUtmsFromCookie();
  if (existing && Object.values(existing).some(Boolean)) {
    // First-touch já registrado — mantém.
    return existing;
  }

  // Grava como cookie próprio JSON serializado.
  try {
    document.cookie = `${UTM_COOKIE}=${encodeURIComponent(JSON.stringify(fromUrl))}; max-age=${UTM_COOKIE_MAX_AGE}; path=/; SameSite=Lax; Secure`;
  } catch {
    // ignora — cookie é melhoria, não bloqueia
  }
  return fromUrl;
}

export function readUtmsFromCookie(): UtmSnapshot | null {
  const raw = readCookie(UTM_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<UtmSnapshot>;
    return {
      utm_source: parsed.utm_source ?? null,
      utm_medium: parsed.utm_medium ?? null,
      utm_campaign: parsed.utm_campaign ?? null,
      utm_term: parsed.utm_term ?? null,
      utm_content: parsed.utm_content ?? null,
    };
  } catch {
    return null;
  }
}

/** Snapshot de attribution pra enviar junto com payloads do server. */
export interface AttributionSnapshot {
  fbp: string | null;
  fbc: string | null;
  fbclid: string | null;
  gclid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  eventSourceUrl: string | null;
}

export function snapshotAttribution(): AttributionSnapshot {
  const empty: AttributionSnapshot = {
    fbp: null, fbc: null, fbclid: null, gclid: null,
    utm_source: null, utm_medium: null, utm_campaign: null,
    utm_term: null, utm_content: null, eventSourceUrl: null,
  };
  if (typeof window === "undefined") return empty;
  const sp = new URLSearchParams(window.location.search);
  const utms = readUtmsFromCookie() ?? {
    utm_source: null, utm_medium: null, utm_campaign: null,
    utm_term: null, utm_content: null,
  };
  return {
    fbp: readFbp(),
    fbc: readFbc(),
    fbclid: sp.get("fbclid"),
    gclid: sp.get("gclid"),
    ...utms,
    eventSourceUrl: window.location.href,
  };
}
