#!/usr/bin/env node
/**
 * Script de teste pra renderizar o relatório social em PDF localmente.
 * Usa o banco prod copiado pra /tmp + thumbs locais.
 *
 * Uso: ddev exec node scripts/test-social-pdf.mjs <account_id> <days>
 */
import { writeFileSync } from "node:fs";

process.env.DATABASE_PATH = "/tmp/agathas-prod.db";

const accountId = Number(process.argv[2] ?? 9);
const days = Number(process.argv[3] ?? 90);

const { buildSocialReportData } = await import("../src/lib/reports/data-social.js");
const { SocialReportDocument } = await import("../src/lib/reports/templates/social-report.js");
const { renderToBuffer } = await import("@react-pdf/renderer");
const React = await import("react");

console.log(`Renderizando relatório: account_id=${accountId} days=${days}`);
const data = buildSocialReportData({ accountId, sinceDays: days });
console.log(`Conta: @${data.account.username}`);
console.log(`Top Feed: ${data.topFeed.length} | Top Reels: ${data.topReels.length} | Top Stories: ${data.topStories.length}`);

const buffer = await renderToBuffer(React.createElement(SocialReportDocument, { data }));
const outPath = `/tmp/test-social-${data.account.username}-${days}d.pdf`;
writeFileSync(outPath, buffer);
console.log(`PDF salvo em: ${outPath} (${Math.round(buffer.length / 1024)}KB)`);
