import Link from "next/link";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";
import ReportFormAds from "./ReportFormAds";

export const metadata = {
  title: "Relatórios PDF | Ads | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function RelatoriosPdfPage() {
  const adsAccounts = listManagedAdsAccounts();

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/admin/ads" className="text-xs text-gray-400 hover:text-white">
            ← Voltar ao Ads
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Relatórios em PDF</h1>
          <p className="text-xs text-gray-400 mt-1">
            Relatório completo de tráfego pago a qualquer momento — padrão Meta
            Business Suite/AdEspresso com paleta visual Agathas.
          </p>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/ads" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/ads/contas" className="text-gray-400 hover:text-white">Contas de anúncio</Link>
          <Link href="/admin/ads/contas-instagram" className="text-gray-400 hover:text-white">Contas Instagram</Link>
          <Link href="/admin/ads/campanhas" className="text-gray-400 hover:text-white">Campanhas</Link>
          <Link href="/admin/ads/dashboard" className="text-gray-400 hover:text-white">Analytics</Link>
          <span className="text-voyia-blue font-semibold">Relatórios PDF</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
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
              Ative pelo menos 1 ad account em{" "}
              <Link href="/admin/ads/contas" className="underline">/admin/ads/contas</Link>.
            </div>
          ) : (
            <ReportFormAds
              accounts={adsAccounts.map((a) => ({ ad_account_id: a.ad_account_id, name: a.name }))}
            />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-12">
        <div className="bg-blue-900/20 border border-blue-500/40 rounded-lg p-4 text-sm text-blue-100">
          <strong>Padrão da indústria utilizado:</strong>
          <p className="mt-2 text-xs">
            Modelo Meta Business Suite + AdEspresso/Madgicx: ROAS real cruzando gasto
            Meta com receita ASAAS, gasto diário, tabela de campanhas com spend cap,
            funil completo (impressões → cliques → leads → checkout → venda), top
            campanhas por ROAS e recomendações por benchmark.
          </p>
        </div>
      </div>
    </main>
  );
}
