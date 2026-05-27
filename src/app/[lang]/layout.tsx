import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "../globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/whatsapp/FloatingWhatsAppButton";
import RecaptchaProvider from "@/components/RecaptchaProvider";
import MetaPixel from "@/components/meta/MetaPixel";
import AttributionCapture from "@/components/meta/AttributionCapture";
import { getRecaptchaSiteKey } from "@/lib/recaptcha";
import { getBooleanSetting, SETTINGS_KEYS } from "@/lib/db/settings";
import {
  htmlLangAttr,
  isLocale,
  locales,
  openGraphLocale,
  getOriginForLocale,
  buildHreflangAlternates,
  type Locale,
} from "@/lib/i18n";
import { getDictionary } from "./dictionaries";
import { WHATSAPP_MODAL_LABELS } from "@/lib/whatsapp-modal-labels";

const FAB_STRINGS: Record<Locale, { tooltip: string; aria: string }> = {
  "pt-BR": { tooltip: "Fale com a gente no WhatsApp", aria: "Abrir formulário de WhatsApp" },
  es: { tooltip: "Hablar con nosotros por WhatsApp", aria: "Abrir formulario de WhatsApp" },
  "en-US": { tooltip: "Chat with us on WhatsApp", aria: "Open WhatsApp form" },
  "en-GB": { tooltip: "Chat with us on WhatsApp", aria: "Open WhatsApp form" },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// O layout lê settings do banco em runtime (FAB do WhatsApp, reCAPTCHA).
// Sem `force-dynamic` o Next 16 cacheia o output e mudanças no /admin/settings
// não refletem no site até o próximo build. Custo: cada request renderiza
// no server — aceitável pra páginas dinâmicas com setting flags.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const origin = getOriginForLocale(lang);

  return {
    metadataBase: new URL(origin),
    title: {
      default: dict.home.metadata.title,
      template: `%s | ${dict.common.siteName}`,
    },
    description: dict.home.metadata.description,
    authors: [{ name: "Agathas Web" }],
    creator: "Agathas Web",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale[lang],
      url: `${origin}/`,
      siteName: dict.common.siteName,
      title: dict.home.metadata.title,
      description: dict.home.metadata.description,
      images: [
        {
          url: `${origin}/assets/og-image-home.png`,
          width: 1200,
          height: 630,
          alt: dict.common.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@agathasweb",
      creator: "@agathasweb",
      title: dict.home.metadata.title,
      description: dict.home.metadata.description,
      images: [`${origin}/assets/og-image-home.png`],
    },
    alternates: {
      canonical: `${origin}/`,
      languages: buildHreflangAlternates("/"),
      types: {
        "application/rss+xml": `${origin}/rss.xml`,
      },
    },
    icons: {
      icon: "/assets/favicon.png",
    },
  };
}

// GTM só carrega se NEXT_PUBLIC_GTM_ID estiver definido com um container real
// (formato GTM-XXXXXX). Sem isso, nada é injetado — evita o erro de CSP/console
// que o placeholder "GTM-XXXXXXX" gerava.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const GTM_ENABLED = !!GTM_ID && /^GTM-[A-Z0-9]+$/.test(GTM_ID);

const gtmSnippet = (id: string) => `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`;

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <html
      lang={htmlLangAttr[lang]}
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <head>
        {GTM_ENABLED && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: gtmSnippet(GTM_ID!) }}
          />
        )}
        <MetaPixel />
      </head>
      <body
        className="min-h-screen bg-voyia-dark text-white antialiased flex flex-col"
        suppressHydrationWarning
      >
        {GTM_ENABLED && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        <Header locale={lang} dict={dict} />
        <main id="main-content" role="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <Footer locale={lang} dict={dict} />

        {/* Persiste _fbc do ?fbclid= antes que o usuário navegue pra outra
            página (sem perder a atribuição em mobile lento / com ad-block). */}
        <AttributionCapture />

        {/* RecaptchaProvider sempre ativo — necessário pros forms (contato,
            quote, etc.) mesmo se o FAB estiver desligado. */}
        <RecaptchaProvider siteKey={getRecaptchaSiteKey()} />
        {getBooleanSetting(SETTINGS_KEYS.floatingWhatsappEnabled, true) && (
          <FloatingWhatsAppButton
            locale={lang}
            recaptchaSiteKey={getRecaptchaSiteKey()}
            labels={{ ...FAB_STRINGS[lang], modal: WHATSAPP_MODAL_LABELS[lang] }}
          />
        )}
      </body>
    </html>
  );
}
