"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncInsightsNowAction } from "./actions";

export default function SyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await syncInsightsNowAction();
            if (r.ok) {
              setMsg(`✓ ${r.totalUpdated} campanhas atualizadas`);
              router.refresh();
            } else {
              setMsg("✗ falha");
            }
          })
        }
        className="text-xs px-3 py-2 border border-gray-700 hover:border-voyia-blue/50 text-gray-300 hover:text-white rounded-lg"
      >
        {pending ? "Sincronizando…" : "↻ Sync agora"}
      </button>
      {msg && <span className="text-xs text-gray-400">{msg}</span>}
    </div>
  );
}
