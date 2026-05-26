import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildSocialReportData } from "@/lib/reports/data-social";
import { SocialReportDocument } from "@/lib/reports/templates/social-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/social?account_id=1&days=30
 *
 * Gera PDF do relatório de Redes Sociais e devolve como download.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const accountId = Number(url.searchParams.get("account_id"));
  const days = Number(url.searchParams.get("days") ?? "30");
  if (!Number.isFinite(accountId) || !Number.isFinite(days)) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  try {
    const data = buildSocialReportData(accountId, days);
    const buffer = await renderToBuffer(<SocialReportDocument data={data} />);
    const filename = `relatorio-social-${data.account.username}-${days}d-${new Date().toISOString().slice(0, 10)}.pdf`;
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
    console.error("[reports/social] erro:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
