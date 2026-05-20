"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  storageKey: string;
  title: string;
  body: string;
  ctaContact: string;
  ctaClose: string;
};

export default function BrazilOnlyPricingModal({ storageKey, title, body, ctaContact, ctaClose }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(storageKey) === "dismissed") return;
    } catch {}
    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  function dismiss() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(storageKey, "dismissed");
    } catch {}
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brazil-only-title"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={dismiss}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-900 p-6 lg:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">🇧🇷</span>
          <div className="flex-1">
            <h2 id="brazil-only-title" className="text-lg font-semibold text-white mb-2">
              {title}
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">{body}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {ctaClose}
          </button>
          <Link
            href="/contato"
            onClick={dismiss}
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            {ctaContact} →
          </Link>
        </div>
      </div>
    </div>
  );
}
