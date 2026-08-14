"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCampaignBudgetAction } from "../../actions";

interface Props {
  external_id: string;
  current_daily: number | null;
  current_cap: number;
}

export default function EditBudgetButton({ external_id, current_daily, current_cap }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [daily, setDaily] = useState(current_daily ?? 0);
  const [cap, setCap] = useState(current_cap);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-voyia-blue hover:underline"
      >
        Editar orçamento
      </button>
    );
  }

  return (
    <div className="bg-black/40 border border-gray-700 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="block">
          <span className="text-gray-400">Budget diário (R$)</span>
          <input
            type="number"
            min={10}
            step={5}
            value={daily}
            onChange={(e) => setDaily(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
          />
        </label>
        <label className="block">
          <span className="text-gray-400">Spend cap (só sobe)</span>
          <input
            type="number"
            min={current_cap}
            step={50}
            value={cap}
            onChange={(e) => setCap(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
          />
        </label>
      </div>
      {error && <div className="text-xs text-red-300">{error}</div>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await updateCampaignBudgetAction(external_id, {
                daily_budget_brl: daily,
                spend_cap_brl: cap,
              });
              if (!r.ok) setError(r.error ?? "erro");
              else { setOpen(false); router.refresh(); }
            })
          }
          className="text-xs bg-voyia-blue hover:bg-purple-600 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {pending ? "..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
