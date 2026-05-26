"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateAccountAction } from "../actions";

export default function ReactivateButton({ id, username }: { id: number; username: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await reactivateAccountAction(id);
          router.refresh();
        })
      }
      className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
      title={`Reativar @${username}`}
    >
      {pending ? "Reativando…" : "↻ Reativar"}
    </button>
  );
}
