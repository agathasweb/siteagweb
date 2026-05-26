import "server-only";
import { createHash } from "node:crypto";

/**
 * Constrói o `user_data` do CAPI no formato esperado pela Meta — com hashing
 * SHA-256 (lowercase hex) dos campos de PII e os identificadores client-side
 * `_fbp` / `_fbc` / IP / UA enviados em texto plano.
 *
 * Quanto mais campos hashados forem enviados, maior o Event Match Quality
 * (alvo: ≥ 8.0 em Lead/Subscribe/Purchase).
 *
 * Referência:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */

export interface RawUserData {
  email?: string | null;
  phone?: string | null;
  /** Nome completo — será dividido em fn/ln pelo primeiro espaço. */
  fullName?: string | null;
  /** Identificador único do cliente no seu sistema (CPF/CNPJ normalizado ou subscription_id). */
  externalId?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  dobYYYYMMDD?: string | null;
  // Identificadores client-side (NÃO hashar)
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
}

export interface MetaUserData {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  external_id?: string[];
  ct?: string[];
  st?: string[];
  zp?: string[];
  country?: string[];
  db?: string[];
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Normalização padrão Meta: trim + lowercase. */
function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Telefone: só dígitos (E.164 sem '+'), conforme spec Meta. */
function normPhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Nome: split no primeiro espaço — fn = primeiro nome, ln = resto. */
function splitName(full: string | null | undefined): { fn: string; ln: string } {
  const s = norm(full);
  if (!s) return { fn: "", ln: "" };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { fn: parts[0], ln: "" };
  return { fn: parts[0], ln: parts.slice(1).join(" ") };
}

/**
 * Extrai dados geo (cidade/estado/CEP/país) dos headers Cloudflare quando
 * disponíveis. Esses campos sobem o Event Match Quality sem coletar nada
 * adicional do usuário.
 *
 * Os headers `cf-ip*` vêm preenchidos por padrão em qualquer site atrás do
 * Cloudflare proxy — não precisa de Workers nem features pagas.
 */
export function extractGeoFromHeaders(h: Headers): {
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
} {
  return {
    city: h.get("cf-ipcity") || null,
    // Cloudflare manda código ISO-3166-2 (ex.: "SP"); Meta aceita as 2 letras.
    state: h.get("cf-region-code") || h.get("cf-ipregion") || null,
    zip: h.get("cf-postal-code") || null,
    country: h.get("cf-ipcountry") || null,
  };
}

export function buildMetaUserData(raw: RawUserData): MetaUserData {
  const out: MetaUserData = {};

  const email = norm(raw.email);
  if (email) out.em = [sha256(email)];

  const phone = normPhone(raw.phone);
  if (phone) out.ph = [sha256(phone)];

  const { fn, ln } = splitName(raw.fullName);
  if (fn) out.fn = [sha256(fn)];
  if (ln) out.ln = [sha256(ln)];

  const ext = norm(raw.externalId).replace(/[^a-z0-9]/g, "");
  if (ext) out.external_id = [sha256(ext)];

  const ct = norm(raw.city).replace(/\s+/g, "");
  if (ct) out.ct = [sha256(ct)];

  const st = norm(raw.state).replace(/[^a-z]/g, "");
  if (st) out.st = [sha256(st)];

  const zp = (raw.zip ?? "").replace(/\D/g, "");
  if (zp) out.zp = [sha256(zp)];

  const country = norm(raw.country);
  if (country) out.country = [sha256(country)];

  const db = (raw.dobYYYYMMDD ?? "").replace(/\D/g, "");
  if (/^\d{8}$/.test(db)) out.db = [sha256(db)];

  // Identificadores client-side — NÃO hash
  if (raw.fbp) out.fbp = raw.fbp;
  if (raw.fbc) out.fbc = raw.fbc;
  if (raw.clientIp) out.client_ip_address = raw.clientIp;
  if (raw.clientUserAgent) out.client_user_agent = raw.clientUserAgent;

  return out;
}
