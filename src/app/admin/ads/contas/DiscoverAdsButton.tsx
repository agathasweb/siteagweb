"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { discoverAdsAccountsAction } from "../actions";

export default function DiscoverAdsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await discoverAdsAccountsAction();
            if (r.ok) {
              setMsg(`✓ ${r.found} contas sincronizadas`);
              router.refresh();
            } else {
              setMsg(`✗ ${r.errors.join(", ")}`);
            }
          })
        }
        className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        {pending ? "Sincronizando…" : "🔍 Descobrir ad accounts"}
      </button>
      {msg && <span className={`text-xs ${msg.startsWith("✓") ? "text-green-300" : "text-red-300"}`}>{msg}</span>}
    </div>
  );
}
