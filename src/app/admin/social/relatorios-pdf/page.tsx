import Link from "next/link";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";
import ReportFormSocial from "./ReportFormSocial";
import ReportFormAds from "./ReportFormAds";

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
            <ReportFormSocial
              accounts={socialAccounts.map((a) => ({
                id: a.id,
                username: a.username,
                display_name: a.display_name,
              }))}
            />
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
            <ReportFormAds
              accounts={adsAccounts.map((a) => ({ ad_account_id: a.ad_account_id, name: a.name }))}
            />
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
