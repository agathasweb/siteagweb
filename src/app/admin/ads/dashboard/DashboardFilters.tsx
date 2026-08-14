"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface Props {
  accounts: Array<{ ad_account_id: string; name: string }>;
}

const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
];

export default function DashboardFilters({ accounts }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const conta = params.get("conta") ?? "";
  const days = params.get("days") ?? "30";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.replace(`/admin/ads/dashboard?${next.toString()}`);
    });
  }

  return (
    <div className={`flex flex-wrap items-end gap-4 ${pending ? "opacity-60" : ""}`}>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Conta</label>
        <select
          value={conta}
          onChange={(e) => update("conta", e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-w-[220px]"
        >
          <option value="">Todas as contas ({accounts.length})</option>
          {accounts.map((a) => (
            <option key={a.ad_account_id} value={a.ad_account_id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Período</label>
        <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => update("days", p.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                days === p.value ? "bg-voyia-blue text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {pending && <span className="text-xs text-gray-500 pb-2">Atualizando…</span>}
    </div>
  );
}
