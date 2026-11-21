"use client";

import { useEffect } from "react";
import { carregarOpenAiPixel } from "@/lib/openai/pixel";

/** Carrega o pixel da OpenAI Ads (ChatGPT) em todas as páginas do site. */
export default function OpenAiPixel() {
  useEffect(() => {
    carregarOpenAiPixel();
  }, []);
  return null;
}
