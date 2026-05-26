import Link from "next/link";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";

export const metadata = {
  title: "Relatórios PDF | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function RelatoriosPdfPage() {
  const socialAccounts = listSocialAccounts();
  const adsAccounts = listManagedAdsAccounts();

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/admin/social" className="text-xs text-gray-400 hover:text-white">
            ← Voltar ao Social
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Relatórios em PDF</h1>
          <p className="text-xs text-gray-400 mt-1">
            Gere relatórios completos e profissionais em PDF a qualquer momento.
            Padrão Hootsuite/Sprout Social/AdEspresso com paleta visual Agathas.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ===== Social ===== */}
        <div className="bg-voyia-gray rounded-xl border border-gray-700 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-4xl">📱</div>
            <div>
              <h2 className="text-lg font-bold text-white">Relatório de Redes Sociais</h2>
              <p className="text-xs text-gray-400 mt-1">
                10 seções: KPIs, crescimento, alcance, engajamento por tipo, top posts,
                melhor horário, demografia, frequência, recomendações.
              </p>
            </div>
          </div>

          {socialAccounts.length === 0 ? (
            <div className="bg-yellow-900/20 border border-yellow-500/40 rounded p-3 text-xs text-yellow-200">
              Cadastre pelo menos 1 conta em <Link href="/admin/social/contas" className="underline">/admin/social/contas</Link>.
            </div>
          ) : (
            <form action="/api/admin/reports/social" method="get" target="_blank" className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Conta Instagram</label>
                <select name="account_id" required defaultValue={socialAccounts[0]?.id ?? ""}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm">
                  {socialAccounts.map((a) => (
                    <option key={a.id} value={a.id}>@{a.username} — {a.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Período</label>
                <select name="days" defaultValue="30"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm">
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </div>
              <button type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold">
                📄 Gerar PDF
              </button>
              <p className="text-[10px] text-gray-500 text-center">
                O PDF abre em nova aba — pode demorar 3-10s pra renderizar.
              </p>
            </form>
          )}
        </div>

        {/* ===== Ads ===== */}
        <div className="bg-voyia-gray rounded-xl border border-gray-700 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-4xl">🎯</div>
            <div>
              <h2 className="text-lg font-bold text-white">Relatório de Tráfego Pago</h2>
              <p className="text-xs text-gray-400 mt-1">
                10 seções com <strong>ROAS REAL</strong> (Meta + ASAAS): KPIs, gasto diário,
                campanhas, funil completo, top ads, recomendações.
              </p>
            </div>
          </div>

          {adsAccounts.length === 0 ? (
            <div className="bg-yellow-900/20 border border-yellow-500/40 rounded p-3 text-xs text-yellow-200">
              Ative pelo menos 1 ad account em <Link href="/admin/social/ads/contas" className="underline">/admin/social/ads/contas</Link>.
            </div>
          ) : (
            <form action="/api/admin/reports/ads" method="get" target="_blank" className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ad Account</label>
                <select name="ad_account_id" defaultValue=""
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm">
                  <option value="">Todas as contas gerenciadas ({adsAccounts.length})</option>
                  {adsAccounts.map((a) => (
                    <option key={a.id} value={a.ad_account_id}>{a.name} ({a.ad_account_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Período</label>
                <select name="days" defaultValue="30"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm">
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </div>
              <button type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold">
                📄 Gerar PDF
              </button>
              <p className="text-[10px] text-gray-500 text-center">
                Render demora 5-15s (chamadas ao Meta Marketing API por campanha).
              </p>
            </form>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-12">
        <div className="bg-blue-900/20 border border-blue-500/40 rounded-lg p-4 text-sm text-blue-100">
          <strong>Padrões da indústria utilizados:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
            <li>
              <strong>Social</strong> — modelo Hootsuite/Sprout Social/Buffer: KPIs com delta vs período anterior,
              crescimento de seguidores, alcance/impressões, engajamento por tipo de conteúdo,
              top posts, melhor horário (heatmap), demografia (idade/gênero/geo), frequência,
              insights automáticos.
            </li>
            <li>
              <strong>Ads</strong> — modelo Meta Business Suite + AdEspresso/Madgicx: ROAS real
              cruzando gasto Meta com receita ASAAS, gasto diário, tabela de campanhas com
              spend cap, funil completo (impressões → cliques → leads → checkout → venda),
              top campanhas por ROAS, recomendações por benchmark.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
