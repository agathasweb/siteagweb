"use client";

import { useEffect, useState } from "react";

type Locale = "pt-BR" | "es" | "en-US" | "en-GB";

const WORDS_BY_LOCALE: Record<Locale, string[]> = {
  "pt-BR": [
    "seu Negócio",
    "sua Empresa",
    "seu E-commerce",
    "sua Escola",
    "seu Moodle",
  ],
  es: [
    "tu Negocio",
    "tu Empresa",
    "tu E-commerce",
    "tu Escuela",
    "tu Moodle",
  ],
  "en-US": [
    "your Business",
    "your Company",
    "your E-commerce",
    "your School",
    "your Moodle",
  ],
  "en-GB": [
    "your Business",
    "your Company",
    "your E-commerce",
    "your School",
    "your Moodle",
  ],
};

export default function TypewriterText({ locale = "pt-BR" }: { locale?: Locale }) {
  const words = WORDS_BY_LOCALE[locale];
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

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
  }, [text, isDeleting, wordIndex]);

  return (
    <>
      <span className="text-voyia-blue typewriter-text">{text}</span>
      <span className="typewriter-cursor">|</span>
    </>
  );
}
