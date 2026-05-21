import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Painel admin sempre reflete o banco ao vivo — nunca estático. O build
// roda em ambiente de dev; estático serviria os dados do banco de dev.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel Admin | Agathas Web",
  description: "Painel administrativo Agathas Web",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-voyia-dark text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
