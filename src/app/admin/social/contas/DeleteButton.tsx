"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccountAction } from "../actions";

export default function DeleteAccountButton({ id, username }: { id: number; username: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs text-red-400 hover:text-red-300"
      >
        Remover
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteAccountAction(id);
            router.refresh();
          })
        }
        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded"
      >
        Confirmar remover @{username}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="text-xs text-gray-400 hover:text-white"
      >
        Cancelar
      </button>
    </span>
  );
}
