import Link from "next/link";
import { getSetting, SETTINGS_KEYS, getBooleanSetting } from "@/lib/db/settings";
import { checkDeepSeek } from "@/lib/ai/translate";
import { checkUnsplash } from "@/lib/unsplash";
import { getIndexNowKey, getIndexNowKeySource } from "@/lib/indexer";
import { isRecaptchaConfigured, getRecaptchaSiteKey, getRecaptchaSecretKey, getRecaptchaKeySource } from "@/lib/recaptcha";
import { getWebSubFeedUrls } from "@/lib/google-websub";
import DeepSeekForm from "./DeepSeekForm";
import UnsplashForm from "./UnsplashForm";
import IndexNowForm from "./IndexNowForm";
import GoogleWebSubForm from "./GoogleWebSubForm";
import RecaptchaForm from "./RecaptchaForm";
import UiTogglesForm from "./UiTogglesForm";

export const metadata = {
  title: "Configurações | Painel Admin",
  robots: { index: false, follow: false },
};

function maskKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 8) return "•••";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export default async function SettingsPage() {
  const status = await checkDeepSeek();
  const dbKey = getSetting(SETTINGS_KEYS.deepseekApiKey);
  const envKey = process.env.DEEPSEEK_API_KEY ?? null;
  const displayedKey = dbKey?.trim() ? dbKey : envKey;
  const maskedKey = maskKey(displayedKey);

  const unsplashStatus = await checkUnsplash();
  const unsplashDbKey = getSetting(SETTINGS_KEYS.unsplashAccessKey);
  const unsplashEnvKey = process.env.UNSPLASH_ACCESS_KEY ?? null;
  const unsplashDisplayedKey = unsplashDbKey?.trim() ? unsplashDbKey : unsplashEnvKey;
  const unsplashMaskedKey = maskKey(unsplashDisplayedKey);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/admin"
        className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
      >
        ← Voltar ao Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
      <p className="text-gray-400 mb-8">
        Provedores externos usados pelo painel. Chaves salvas aqui ficam no
        banco SQLite local; chaves do <code>.env</code> são usadas como
        fallback se nada estiver configurado aqui.
      </p>

      <DeepSeekForm initial={status} maskedKey={maskedKey} />

      <UnsplashForm initial={unsplashStatus} maskedKey={unsplashMaskedKey} />

      <IndexNowForm
        initial={{
          key: getIndexNowKey(),
          source: getIndexNowKeySource(),
          keyLocation: getIndexNowKey() ? `/api/indexnow/${getIndexNowKey()}` : null,
        }}
      />

      <GoogleWebSubForm feedUrls={getWebSubFeedUrls()} />

      <RecaptchaForm
        initial={{
          configured: isRecaptchaConfigured(),
          source: getRecaptchaKeySource(),
          siteKey: getRecaptchaSiteKey(),
          hasSecret: !!getRecaptchaSecretKey(),
        }}
      />

      <UiTogglesForm
        initialFloatingWhatsapp={getBooleanSetting(SETTINGS_KEYS.floatingWhatsappEnabled, true)}
      />

      <p className="text-xs text-gray-500 mt-8">
        Dica: você pode definir <code>DEEPSEEK_API_KEY</code> em
        produção via variável de ambiente (e.g. <code>.env.production</code>)
        para nunca precisar tocar no painel. A chave do banco tem prioridade
        se ambas existirem.
      </p>
    </div>
  );
}
