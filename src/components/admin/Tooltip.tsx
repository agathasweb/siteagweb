"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
  href?: string;
}

export default function Tooltip({ text, href }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded-full bg-gray-700 text-gray-300 text-[10px] font-bold hover:bg-voyia-blue hover:text-white transition-colors"
        aria-label="Ajuda"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 p-3 bg-gray-900 border border-gray-600 rounded-lg text-xs text-gray-200 shadow-xl"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <span className="block leading-relaxed">{text}</span>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-voyia-blue hover:text-purple-300 underline"
            >
              Saiba mais →
            </a>
          )}
        </span>
      )}
    </span>
  );
}
