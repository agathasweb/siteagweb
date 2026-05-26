"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { discoverAccountsAction } from "../actions";

export default function DiscoverButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await discoverAccountsAction();
            if (r.ok) {
              const parts = [
                `${r.found} encontradas`,
                r.created ? `${r.created} novas` : null,
                r.updated ? `${r.updated} atualizadas` : null,
                r.skipped ? `${r.skipped} já removidas (não reativadas)` : null,
              ].filter(Boolean);
              setResult(`✓ ${parts.join(" · ")}`);
              router.refresh();
            } else {
              setResult(`✗ Falha: ${r.error}`);
            }
          })
        }
        className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {pending ? "Descobrindo…" : "🔍 Descobrir contas do Meta"}
      </button>
      {result && (
        <span className={`text-xs ${result.startsWith("✓") ? "text-green-300" : "text-red-300"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
