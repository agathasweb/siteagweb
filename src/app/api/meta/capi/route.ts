import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sendCapiEvent, type MetaStandardEvent, type MetaCustomData } from "@/lib/meta/capi";
import { extractGeoFromHeaders, type RawUserData } from "@/lib/meta/user-data";

export const dynamic = "force-dynamic";

/**
 * Proxy server-side pra Conversions API.
 *
 * Por que existir: o `META_CAPI_ACCESS_TOKEN` é secret e não pode aparecer no
 * client. Esta route recebe eventos disparados pelo browser (ex.: Contact no
 * clique, Lead no submit) com os identificadores client (`_fbp`, `_fbc`) e
 * encaminha pra Meta com o token aplicado no servidor.
 *
 * O `event_id` recebido aqui DEVE ser o mesmo já enviado pelo Pixel client —
 * é o que permite Meta deduplicar pixel+CAPI. Sem isso, vira double-count.
 *
 * Eventos server-only (Subscribe, Purchase, CompleteRegistration) NÃO passam
 * por aqui — chamam `sendCapiEvent()` direto da route que dispara o gatilho.
 */

interface CapiProxyBody {
  eventName: MetaStandardEvent;
  eventId: string;
  eventSourceUrl?: string;
  userData?: {
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
    externalId?: string | null;
    fbp?: string | null;
    fbc?: string | null;
  };
  customData?: MetaCustomData;
}

const ALLOWED: ReadonlySet<MetaStandardEvent> = new Set<MetaStandardEvent>([
  "PageView",
  "ViewContent",
  "Contact",
  "Lead",
  "InitiateCheckout",
  "AddPaymentInfo",
]);

export async function POST(req: Request) {
  let body: CapiProxyBody;
  try {
    body = (await req.json()) as CapiProxyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.eventName || !body.eventId) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 422 });
  }
  if (!ALLOWED.has(body.eventName)) {
    // Defesa: client não pode forjar eventos de receita (Purchase/Subscribe).
    // Esses só chegam via webhook ASAAS server-to-server.
    return NextResponse.json({ ok: false, error: "event_not_allowed" }, { status: 403 });
  }

  const h = await headers();
  const clientIp =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    null;
  const clientUserAgent = h.get("user-agent") || null;
  const geo = extractGeoFromHeaders(h);

  const userData: RawUserData = {
    email: body.userData?.email ?? null,
    phone: body.userData?.phone ?? null,
    fullName: body.userData?.fullName ?? null,
    externalId: body.userData?.externalId ?? null,
    city: geo.city,
    state: geo.state,
    zip: geo.zip,
    country: (geo.country ?? "br").toLowerCase(),
    fbp: body.userData?.fbp ?? null,
    fbc: body.userData?.fbc ?? null,
    clientIp,
    clientUserAgent,
  };

  const result = await sendCapiEvent({
    eventName: body.eventName,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl ?? h.get("referer") ?? null,
    actionSource: "website",
    userData,
    customData: body.customData,
  });

  // Resposta sempre 200 (não derrubar UX por falha no Meta) — incluímos `ok`
  // pra eventual telemetria do client.
  return NextResponse.json({ ok: result.ok, fbtrace_id: result.fbtrace_id });
}
