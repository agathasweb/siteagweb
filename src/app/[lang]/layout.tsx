import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "../globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  htmlLangAttr,
  isLocale,
  locales,
  openGraphLocale,
  getOriginForLocale,
  buildHreflangAlternates,
} from "@/lib/i18n";
import { getDictionary } from "./dictionaries";

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

const GTM_SNIPPET = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');`;

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
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: GTM_SNIPPET }}
        />
      </head>
      <body
        className="min-h-screen bg-voyia-dark text-white antialiased flex flex-col"
        suppressHydrationWarning
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Header locale={lang} dict={dict} />
        <main id="main-content" role="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <Footer locale={lang} dict={dict} />
      </body>
    </html>
  );
}
