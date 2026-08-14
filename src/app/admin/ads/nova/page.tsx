import Link from "next/link";
import { listManagedAdsAccounts } from "@/lib/db/ads-accounts";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import { getNumberSetting, SETTINGS_KEYS } from "@/lib/db/settings";
import WizardForm from "./WizardForm";

export const metadata = {
  title: "Nova campanha | Ads | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function NovaCampanhaPage() {
  const adAccounts = listManagedAdsAccounts();
  const socialAccountsRaw = listSocialAccounts();
  const socialAccounts = socialAccountsRaw
    .filter((a) => a.provider === "instagram" && a.ig_user_id && a.fb_page_id)
    .map((a) => ({
      id: a.id,
      username: a.username,
      ig_user_id: a.ig_user_id,
      fb_page_id: a.fb_page_id,
    }));

  const maxDailyBudget = getNumberSetting(SETTINGS_KEYS.adsMaxDailyBudgetBrl, 500);
  const minSpendCap = getNumberSetting(SETTINGS_KEYS.adsMinSpendCapBrl, 50);

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/admin/ads" className="text-xs text-gray-400 hover:text-white">
            ← Voltar à visão geral
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Nova campanha</h1>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/ads" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/ads/contas" className="text-gray-400 hover:text-white">Contas de anúncio</Link>
          <Link href="/admin/ads/contas-instagram" className="text-gray-400 hover:text-white">Contas Instagram</Link>
          <span className="text-voyia-blue font-semibold">Nova campanha</span>
          <Link href="/admin/ads/campanhas" className="text-gray-400 hover:text-white">Campanhas</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="bg-voyia-gray rounded-xl border border-gray-700 p-6">
          <WizardForm
            adAccounts={adAccounts.map((a) => ({ ad_account_id: a.ad_account_id, name: a.name }))}
            socialAccounts={socialAccounts}
            maxDailyBudget={maxDailyBudget}
            minSpendCap={minSpendCap}
          />
        </div>
      </div>
    </main>
  );
}
