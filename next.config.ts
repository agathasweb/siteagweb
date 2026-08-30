import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hosts permitidos para recursos de dev do Next 16 (HMR, /_next/*).
  // Em produção este campo é ignorado.
  allowedDevOrigins: [
    "agathas-dev.agathasweb.com",
    "agathas-dev.ddev.site",
  ],

  // Imagens de domínios externos permitidos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "agathasweb.com.br",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  experimental: {
    // Inline do CSS no <head> em vez de <link> — elimina requisições
    // render-blocking. Ideal com Tailwind (CSS atômico, pequeno).
    inlineCss: true,
  },

  // Headers de segurança
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // CSP — em dev libera 'unsafe-eval' + ws/wss para HMR do Turbopack.
    // Em prod mantém 'unsafe-inline' em script/style porque o App Router
    // injeta scripts inline para hydration; migrar para nonce exige
    // middleware dedicado. connect-src libera a API do Gemini (admin).
    //
    // Terceiros liberados (corrige bloqueios reportados pelo PageSpeed):
    //  - GTM (www.googletagmanager.com)
    //  - reCAPTCHA v3 (www.google.com + www.gstatic.com, iframe em google.com)
    //  - Cloudflare Web Analytics (static.cloudflareinsights.com), injetado
    //    automaticamente pelo proxy Cloudflare.
    //  - Meta Pixel — connect.facebook.net (script), www.facebook.com
    //    (pixel 1x1 + iframe noscript).
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://static.cloudflareinsights.com",
      "https://connect.facebook.net",
    ];
    if (isDev) scriptSrc.push("'unsafe-eval'");

    const connectSrc = [
      "'self'",
      "https://generativelanguage.googleapis.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://cloudflareinsights.com",
      "https://www.google.com",
      "https://www.facebook.com",
      "https://connect.facebook.net",
    ];
    if (isDev) connectSrc.push("ws:", "wss:");

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      `script-src ${scriptSrc.join(" ")}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      `connect-src ${connectSrc.join(" ")}`,
      "frame-src 'self' https://www.google.com https://www.googletagmanager.com https://www.facebook.com",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },

  // Crawlers podem ter URLs antigas em cache (sitemap/robots descontinuados
  // apontavam /blog/feed.xml). Redireciona pro feed real pra não perder o ping.
  async redirects() {
    return [
      { source: "/blog/feed.xml", destination: "/rss.xml", permanent: true },
      { source: "/blog/feed", destination: "/rss.xml", permanent: true },
      { source: "/feed.xml", destination: "/rss.xml", permanent: true },
      { source: "/feed", destination: "/rss.xml", permanent: true },
    ];
  },

  // IndexNow (Bing/Yandex) exige que o arquivo da key esteja no root do
  // domínio pra autorizar submissão de URLs em qualquer caminho. Rewrite
  // /{key}.txt → /api/indexnow/{key} (route que retorna a key configurada).
  async rewrites() {
    return [
      {
        source: "/:key([a-f0-9]{32,128}).txt",
        destination: "/api/indexnow/:key",
      },
    ];
  },
};

export default nextConfig;
