"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  placeholder: string;
  ariaLabel: string;
  initial?: string;
}

export default function BlogSearchBox({ placeholder, ariaLabel, initial = "" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/blog/busca?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl mx-auto" role="search">
      <label htmlFor="blog-search" className="sr-only">{ariaLabel}</label>
      <div className="relative">
        <input
          id="blog-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full px-6 py-4 pr-16 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white placeholder-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-voyia-blue focus:bg-white/15 transition-all"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label={ariaLabel}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-voyia-blue hover:bg-purple-600 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
