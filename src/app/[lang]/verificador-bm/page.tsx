import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import VerificadorBm from "@/components/verificador-bm/VerificadorBm";

// Verificação de conformidade antes da contratação do Voyia (só pt-BR: o
// Voyia é vendido apenas no Brasil). Fora do índice até o fluxo estabilizar.
export const metadata: Metadata = {
  title: "Verificador de BM | Voyia — Agathas Web",
  description: "Confira se sua empresa e sua conta da Meta estão aptas para a API Oficial do WhatsApp antes de contratar o Voyia.",
  robots: { index: false, follow: false },
};

export default async function VerificadorBmPage({ params }: PageProps<"/[lang]/verificador-bm">) {
  const { lang } = await params;
  if (lang !== "pt-BR") notFound();
  return (
    <Suspense>
      <VerificadorBm />
    </Suspense>
  );
}
