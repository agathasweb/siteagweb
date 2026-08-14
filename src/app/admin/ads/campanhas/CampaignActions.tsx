"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  pauseCampaignAction,
  resumeCampaignAction,
  deleteCampaignAction,
} from "../actions";

interface Props {
  external_id: string;
  status: string;
}

export default function CampaignActions({ external_id, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "erro");
      else { setError(null); router.refresh(); }
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "ACTIVE" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => pauseCampaignAction(external_id))}
          className="text-yellow-300 hover:text-yellow-200 disabled:opacity-50"
        >
          {pending ? "..." : "⏸ Pausar"}
        </button>
      )}
      {status === "PAUSED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => resumeCampaignAction(external_id))}
          className="text-green-400 hover:text-green-300 disabled:opacity-50"
        >
          {pending ? "..." : "▶ Reativar"}
        </button>
      )}
      {!confirmDel && status !== "DELETED" && (
        <button
          type="button"
          onClick={() => setConfirmDel(true)}
          className="text-red-400 hover:text-red-300"
        >
          🗑
        </button>
      )}
      {confirmDel && (
        <span className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => deleteCampaignAction(external_id))}
            className="bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDel(false)}
            className="text-gray-400"
          >
            cancelar
          </button>
        </span>
      )}
      {error && <span className="text-red-300 text-[10px]">{error}</span>}
    </div>
  );
}
