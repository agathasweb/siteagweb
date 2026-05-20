import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Módulos nativos (.node): exige `require()` nativo do Node em vez de
  // empacotar no bundle do Turbopack. Sem isto o build de produção quebra
  // com "Failed to load external module better-sqlite3-<hash>".
  serverExternalPackages: ["better-sqlite3", "sharp"],

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

  // Headers de segurança
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    // CSP — em dev libera 'unsafe-eval' + ws/wss para HMR do Turbopack.
    // Em prod mantém 'unsafe-inline' em script/style porque o App Router
    // injeta scripts inline para hydration; migrar para nonce exige
    // middleware dedicado. connect-src libera a API DeepSeek (admin).
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' https://api.deepseek.com${isDev ? " ws: wss:" : ""}`,
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
};

export default nextConfig;
