"use client";

import { useEffect, useState } from "react";

type Locale = "pt-BR" | "es" | "en-US" | "en-GB";

const WORDS_BY_LOCALE: Record<Locale, string[]> = {
  "pt-BR": [
    "Moodle",
    "Tráfego Pago",
    "Tráfego Orgânico",
    "Apps Mobile",
    "Desenvolvimento Web",
    "Desenvolvimento Mobile",
    "API Oficial do Whatsapp",
  ],
  es: [
    "Moodle",
    "Tráfico Pago",
    "Tráfico Orgánico",
    "Apps Mobile",
    "Desarrollo Web",
    "Desarrollo Mobile",
    "API Oficial de WhatsApp",
  ],
  "en-US": [
    "Moodle",
    "Paid Traffic",
    "Organic Traffic",
    "Mobile Apps",
    "Web Development",
    "Mobile Development",
    "Official WhatsApp API",
  ],
  "en-GB": [
    "Moodle",
    "Paid Traffic",
    "Organic Traffic",
    "Mobile Apps",
    "Web Development",
    "Mobile Development",
    "Official WhatsApp API",
  ],
};

export default function TypewriterText({ locale = "pt-BR" }: { locale?: Locale }) {
  const words = WORDS_BY_LOCALE[locale];
  // SSR/SEO: começa com a primeira palavra completa pra crawler ver um H1 com keyword.
  // No client a animação reinicia normalmente (deletando do estado completo).
  const [text, setText] = useState(words[0]);
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(true);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentWord.slice(0, text.length + 1));
          if (text.length === currentWord.length) {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          setText(currentWord.slice(0, text.length - 1));
          if (text.length === 0) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? 50 : 100,
    );

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words]);

  return (
    <>
      <span className="text-voyia-blue typewriter-text">{text}</span>
      <span className="typewriter-cursor">|</span>
    </>
  );
}
