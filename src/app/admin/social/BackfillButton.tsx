"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { backfillSocialAction } from "./actions";

export default function BackfillButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [details, setDetails] = useState<Array<{ account: string; ok: boolean; posts: number; insights: number; error?: string }> | null>(null);

  function run() {
    startTransition(async () => {
      setResult("Sincronizando 90 dias…");
      setDetails(null);
      const r = await backfillSocialAction(90);
      if (!r.ok) {
        setResult(`✗ ${r.error}`);
        return;
      }
      const totalPosts = r.results.reduce((s, x) => s + x.posts, 0);
      const totalInsights = r.results.reduce((s, x) => s + x.insights, 0);
      setResult(`✓ ${r.totalAccounts} contas · ${totalPosts} posts · ${totalInsights} insights diários`);
      setDetails(r.results);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={run}
          className="text-xs px-3 py-2 border border-gray-700 hover:border-orange-500/50 text-gray-300 hover:text-white rounded-lg disabled:opacity-50"
        >
          {pending ? "Sincronizando…" : "↻ Backfill 90 dias"}
        </button>
        {result && <span className="text-xs text-gray-400">{result}</span>}
      </div>
      {details && (
        <div className="mt-2 text-[10px] bg-black/40 rounded p-2 grid grid-cols-1 md:grid-cols-3 gap-1">
          {details.map((d) => (
            <div key={d.account} className={d.ok ? "text-gray-400" : "text-red-300"}>
              {d.ok ? "✓" : "✗"} @{d.account}: {d.posts}p · {d.insights}d{d.error ? ` · ${d.error}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
