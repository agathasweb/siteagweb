"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelScheduledAction } from "../actions";

export default function CancelButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await cancelScheduledAction(id);
          router.refresh();
        })
      }
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "Cancelando…" : "Cancelar"}
    </button>
  );
}
