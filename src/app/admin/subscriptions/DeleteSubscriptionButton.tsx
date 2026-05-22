"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSubscriptionAction } from "./actions";

interface Props {
  id: number;
  customerName: string;
}

export default function DeleteSubscriptionButton({ id, customerName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Excluir a assinatura de ${customerName}? O lead vinculado em /admin/leads também será removido. Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteSubscriptionAction(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-red-400 hover:text-red-300 text-xs font-semibold disabled:opacity-50"
    >
      {pending ? "Excluindo…" : "Excluir"}
    </button>
  );
}
