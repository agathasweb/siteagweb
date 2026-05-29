import "server-only";
import { metaGraph, getSocialAccessToken } from "@/lib/meta-graph/client";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";

/**
 * Breakdowns — segmentação demográfica/geográfica vinda do endpoint /insights
 * da Graph API com o parâmetro `breakdowns`.
 *
 * A Meta NÃO retorna demografia junto com as métricas agregadas normais — cada
 * dimensão exige uma chamada separada (não dá pra combinar, ex., region com
 * publisher_platform). Por isso este módulo é separado do insights.ts e é
 * chamado on-demand (dashboard e PDF), nunca no cron de sync.
 *
 * Dimensões suportadas pela Meta que usamos:
 *  - age                    → faixa etária (18-24, 25-34, ...)
 *  - gender                 → male / female / unknown
 *  - region                 → estado/província (localização)
 *  - country                → país
 *  - publisher_platform     → facebook / instagram / audience_network / messenger
 *  - impression_device      → dispositivo (iphone, android_smartphone, desktop, ...)
 *
 * Valores monetários vêm em STRING no currency da conta (BRL).
 */

export type BreakdownDim =
  | "age"
  | "gender"
  | "region"
  | "country"
  | "publisher_platform"
  | "impression_device";

export type BreakdownDatePreset =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "last_90d"
  | "maximum";

/** Uma linha agregada de um breakdown — `key` é o valor da dimensão. */
export interface BreakdownRow {
  key: string;
  impressions: number;
  clicks: number;
  reach: number;
  spend_brl: number;
  conversions: number;
}

/** Conjunto completo de breakdowns que alimenta dashboard + PDF. */
export interface AdsBreakdowns {
  age: BreakdownRow[];
  gender: BreakdownRow[];
  region: BreakdownRow[];
  country: BreakdownRow[];
  platform: BreakdownRow[];
  device: BreakdownRow[];
}

interface RawBreakdownInsight {
  age?: string;
  gender?: string;
  region?: string;
  country?: string;
  publisher_platform?: string;
  impression_device?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  spend?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

// Mesmos tipos de conversão usados em insights.ts (mantidos em sincronia).
const CONVERSION_ACTIONS = new Set([
  "offsite_conversion.fb_pixel_purchase",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.fb_pixel_subscribe",
  "offsite_conversion.fb_pixel_complete_registration",
  "lead",
  "purchase",
  "subscribe",
  "complete_registration",
]);

function conversionsFromActions(actions?: Array<{ action_type: string; value: string }>): number {
  let n = 0;
  for (const a of actions ?? []) {
    if (CONVERSION_ACTIONS.has(a.action_type)) n += parseInt(a.value, 10);
  }
  return n;
}

const FIELDS = "impressions,clicks,reach,spend,actions";

/**
 * Busca insights de UM target (ad account `act_xxx` OU campaign_id) segmentado
 * por uma única dimensão. Retorna linhas cruas com a chave da dimensão.
 */
async function fetchBreakdown(
  target_id: string,
  dim: BreakdownDim,
  date_preset: BreakdownDatePreset,
): Promise<Array<{ key: string; row: BreakdownRow }>> {
  const token = getSocialAccessToken();
  if (!token) return [];
  const r = await metaGraph.get<{ data?: RawBreakdownInsight[] }>(
    token,
    `${target_id}/insights`,
    {
      fields: FIELDS,
      breakdowns: dim,
      date_preset,
      level: "account",
      limit: 500,
    },
  );
  if (!r.ok || !r.json.data) return [];
  return r.json.data.map((raw) => {
    const key =
      dim === "age" ? raw.age :
      dim === "gender" ? raw.gender :
      dim === "region" ? raw.region :
      dim === "country" ? raw.country :
      dim === "publisher_platform" ? raw.publisher_platform :
      raw.impression_device;
    return {
      key: key && key.length > 0 ? key : "desconhecido",
      row: {
        key: key && key.length > 0 ? key : "desconhecido",
        impressions: parseInt(raw.impressions ?? "0", 10),
        clicks: parseInt(raw.clicks ?? "0", 10),
        reach: parseInt(raw.reach ?? "0", 10),
        spend_brl: parseFloat(raw.spend ?? "0"),
        conversions: conversionsFromActions(raw.actions),
      },
    };
  });
}

/** Soma linhas com a mesma chave (usado para agregar várias contas). */
function mergeRows(rows: BreakdownRow[]): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  for (const r of rows) {
    const cur = map.get(r.key);
    if (cur) {
      cur.impressions += r.impressions;
      cur.clicks += r.clicks;
      cur.reach += r.reach;
      cur.spend_brl += r.spend_brl;
      cur.conversions += r.conversions;
    } else {
      map.set(r.key, { ...r });
    }
  }
  return Array.from(map.values());
}

/** Ordena faixas etárias na ordem natural (18-24 antes de 25-34). */
function sortAge(rows: BreakdownRow[]): BreakdownRow[] {
  return [...rows].sort((a, b) => {
    const na = parseInt(a.key, 10);
    const nb = parseInt(b.key, 10);
    if (Number.isNaN(na)) return 1;
    if (Number.isNaN(nb)) return -1;
    return na - nb;
  });
}

const GENDER_LABEL: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  unknown: "Não informado",
  desconhecido: "Não informado",
};

const DEVICE_LABEL: Record<string, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  android_smartphone: "Android (celular)",
  android_tablet: "Android (tablet)",
  desktop: "Desktop",
  ipod: "iPod",
  other: "Outro",
};

const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  audience_network: "Audience Network",
  messenger: "Messenger",
  unknown: "Outro",
};

function relabel(rows: BreakdownRow[], labels: Record<string, string>): BreakdownRow[] {
  return rows.map((r) => ({ ...r, key: labels[r.key] ?? r.key }));
}

/**
 * Busca TODOS os breakdowns relevantes de um escopo (uma conta ou todas as
 * gerenciadas). Faz uma chamada por dimensão por conta — para "todas" agrega.
 *
 * Como há poucas contas gerenciadas (2-3) e 6 dimensões, são ~6-18 chamadas;
 * aceitável para uma tela force-dynamic ou geração de PDF on-demand.
 */
export async function getAdsBreakdowns(options: {
  ad_account_id?: string;
  date_preset?: BreakdownDatePreset;
}): Promise<AdsBreakdowns> {
  const date_preset = options.date_preset ?? "last_30d";
  const targets = options.ad_account_id
    ? [options.ad_account_id]
    : listManagedAdsAccounts().map((a) => a.ad_account_id);

  const dims: BreakdownDim[] = [
    "age",
    "gender",
    "region",
    "country",
    "publisher_platform",
    "impression_device",
  ];

  // Uma chamada por (conta × dimensão), todas em paralelo.
  const jobs = targets.flatMap((t) =>
    dims.map(async (dim) => ({ dim, rows: (await fetchBreakdown(t, dim, date_preset)).map((x) => x.row) })),
  );
  const settled = await Promise.all(jobs);

  const byDim = new Map<BreakdownDim, BreakdownRow[]>();
  for (const { dim, rows } of settled) {
    byDim.set(dim, [...(byDim.get(dim) ?? []), ...rows]);
  }

  const topBy = (rows: BreakdownRow[], n: number) =>
    [...rows].sort((a, b) => b.impressions - a.impressions).slice(0, n);

  return {
    age: sortAge(mergeRows(byDim.get("age") ?? [])),
    gender: relabel(mergeRows(byDim.get("gender") ?? []), GENDER_LABEL),
    region: topBy(mergeRows(byDim.get("region") ?? []), 12),
    country: topBy(mergeRows(byDim.get("country") ?? []), 8),
    platform: relabel(
      [...mergeRows(byDim.get("publisher_platform") ?? [])].sort((a, b) => b.impressions - a.impressions),
      PLATFORM_LABEL,
    ),
    device: relabel(topBy(mergeRows(byDim.get("impression_device") ?? []), 8), DEVICE_LABEL),
  };
}
