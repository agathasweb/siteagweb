import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildAdsReportData } from "@/lib/reports/data-ads";
import { AdsReportDocument } from "@/lib/reports/templates/ads-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// PDF render pode demorar (gráficos + agregações + Graph API), aumenta o limite
export const maxDuration = 60;

/**
 * GET /api/admin/reports/ads?ad_account_id=act_xxx&days=30
 *  (ou sem ad_account_id pra agregar todas as contas gerenciadas)
 *
 * Gera PDF do relatório de Tráfego Pago.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const ad_account_id = url.searchParams.get("ad_account_id") ?? undefined;
  const days = Number(url.searchParams.get("days") ?? "30");
  if (!Number.isFinite(days)) {
    return NextResponse.json({ error: "invalid_days" }, { status: 400 });
  }

  try {
    const data = await buildAdsReportData({ ad_account_id, sinceDays: days });
    const buffer = await renderToBuffer(<AdsReportDocument data={data} />);
    const scope = ad_account_id ? ad_account_id.replace("act_", "") : "todas";
    const filename = `relatorio-ads-${scope}-${days}d-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "render_failed";
    console.error("[reports/ads] erro:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
