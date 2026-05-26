"use client";

import { useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { toggleAdsAccountAction } from "../actions";

export default function ToggleAccountSwitch({
  ad_account_id,
  initial,
}: {
  ad_account_id: string;
  initial: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(initial);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !optimistic;
        setOptimistic(next);
        startTransition(async () => {
          await toggleAdsAccountAction(ad_account_id, next);
          router.refresh();
        });
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        optimistic ? "bg-voyia-blue" : "bg-gray-600"
      } ${pending ? "opacity-60" : ""}`}
      aria-label={optimistic ? "Desativar" : "Ativar"}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          optimistic ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
