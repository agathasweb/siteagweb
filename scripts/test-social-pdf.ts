#!/usr/bin/env tsx
/**
 * Script de teste pra renderizar o relatório social em PDF localmente.
 * Usa o banco prod copiado pra /tmp + thumbs locais.
 *
 * Uso (dentro do container): ddev exec npx tsx scripts/test-social-pdf.ts [account_id] [days]
 */
import { writeFileSync } from "node:fs";
import React from "react";

process.env.DATABASE_PATH = "/tmp/agathas-prod.db";

async function main() {
  const accountId = Number(process.argv[2] ?? 9);
  const days = Number(process.argv[3] ?? 90);

  const { buildSocialReportData } = await import("../src/lib/reports/data-social.ts");
  const { SocialReportDocument } = await import("../src/lib/reports/templates/social-report.tsx");
  const { renderToBuffer } = await import("@react-pdf/renderer");

  console.log(`Renderizando: account_id=${accountId} days=${days}`);
  const data = buildSocialReportData({ accountId, sinceDays: days });
  console.log(`Conta: @${data.account.username}`);
  console.log(
    `Top Feed: ${data.topFeed.length} | Top Reels: ${data.topReels.length} | Top Stories: ${data.topStories.length}`,
  );

  const buffer = await renderToBuffer(
    React.createElement(SocialReportDocument, { data }),
  );
  const outPath = `/tmp/test-social-${data.account.username}-${days}d.pdf`;
  writeFileSync(outPath, buffer);
  console.log(`✓ Salvo: ${outPath} (${Math.round(buffer.length / 1024)}KB)`);
}

main().catch((err) => {
  console.error("ERRO:", err);
  process.exit(1);
});
