"use client";

import { useEffect } from "react";
import { medirOpenAi } from "@/lib/openai/pixel";

/** Conversão de compra do SK Render (exterior) no pixel da OpenAI, com o id da sessão da Stripe. */
export default function MedirCompraSkr({ sessao }: { sessao: string }) {
  useEffect(() => {
    const t = setTimeout(() => medirOpenAi("order_created", `stripe-${sessao}`), 1500);
    return () => clearTimeout(t);
  }, [sessao]);
  return null;
}
