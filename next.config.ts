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

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
