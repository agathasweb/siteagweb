import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agathas Web Brasil - Soluções Digitais Inteligentes",
    template: "%s | Agathas Web Brasil",
  },
  description:
    "Transforme seu negócio brasileiro com soluções digitais inteligentes da Agathas Web. Especialistas em desenvolvimento web, plataformas Moodle EAD, tráfego pago e consultoria digital.",
  keywords: [
    "desenvolvimento web brasil",
    "moodle ead",
    "tráfego pago brasil",
    "consultoria digital",
    "marketing digital",
    "hospedagem gerenciada",
    "soluções empresariais",
    "plataformas elearning",
    "wordpress brasil",
    "seo brasil",
    "google ads",
    "facebook ads",
  ],
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
    locale: "pt_BR",
    url: "https://agathasweb.com.br/",
    siteName: "Agathas Web Brasil",
    title: "Agathas Web Brasil - Soluções Digitais Inteligentes para Empresas Brasileiras",
    description:
      "Líder no Brasil em desenvolvimento web, plataformas Moodle EAD, tráfego pago e consultoria digital. Transforme seu negócio com nossas soluções inteligentes.",
    images: [
      {
        url: "https://agathasweb.com.br/assets/og-image-home.png",
        width: 1200,
        height: 630,
        alt: "Agathas Web Brasil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@agathasweb",
    creator: "@agathasweb",
    title: "Agathas Web Brasil - Soluções Digitais Inteligentes",
    description:
      "Líder no Brasil em desenvolvimento web, Moodle EAD, tráfego pago e consultoria digital.",
    images: ["https://agathasweb.com.br/assets/og-image-home.png"],
  },
  alternates: {
    canonical: "https://agathasweb.com.br/",
    languages: {
      "pt-BR": "https://agathasweb.com.br/",
      "en-US": "https://agathasweb.com/",
      "en-GB": "https://agathasweb.co.uk/",
      "es-ES": "https://agathas.es/",
    },
  },
  icons: {
    icon: "/assets/favicon.png",
  },
  other: {
    "geo.region": "BR",
    "geo.placename": "Brasil",
    "geo.position": "-14.2350;-51.9253",
    ICBM: "-14.2350, -51.9253",
    "DC.title": "Agathas Web Brasil - Soluções Digitais",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-XXXXXXX');`,
          }}
        />
      </head>
      <body className="min-h-screen bg-voyia-dark text-white antialiased flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Header />
        <main id="main-content" role="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
