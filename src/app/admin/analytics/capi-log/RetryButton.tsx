"use client";

import { useState, useTransition } from "react";
import { triggerMetaRetryAction, type RetryResult } from "./actions";

export default function RetryButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RetryResult | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await triggerMetaRetryAction();
            setResult(r);
          })
        }
        className="px-4 py-2 bg-voyia-blue hover:bg-purple-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {pending ? "Retentando…" : "Retentar agora"}
      </button>
      {result && (
        <span
          className={`text-xs ${
            result.ok ? "text-green-300" : "text-red-300"
          }`}
        >
          {result.ok
            ? `${result.retriedSuccess} reenviados · ${result.retriedFailed} falharam · ${result.pruned} removidos`
            : result.error}
        </span>
      )}
    </div>
  );
}
