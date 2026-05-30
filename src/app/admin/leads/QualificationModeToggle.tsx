"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setQualificationModeAction } from "./actions";
import type { LeadQualificationMode } from "@/lib/db/settings";

export default function QualificationModeToggle({
  mode: initialMode,
}: {
  mode: LeadQualificationMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<LeadQualificationMode>(initialMode);
  const [pending, startTransition] = useTransition();

  function change(next: LeadQualificationMode) {
    if (next === mode) return;
    setMode(next);
    startTransition(async () => {
      await setQualificationModeAction(next);
      router.refresh();
    });
  }

  return (
    <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-white">Modo de qualificação de leads</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Define como o evento <code className="text-voyia-blue">Contact</code> (conversão real) é
            enviado ao Meta.
          </p>
        </div>

        <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => change("manual")}
            disabled={pending}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50 ${
              mode === "manual" ? "bg-voyia-blue text-white" : "text-gray-300 hover:text-white"
            }`}
          >
            ✋ Manual
          </button>
          <button
            type="button"
            onClick={() => change("auto")}
            disabled={pending}
            className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50 ${
              mode === "auto" ? "bg-green-600 text-white" : "text-gray-300 hover:text-white"
            }`}
          >
            ⚡ Automático
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
        {mode === "manual" ? (
          <>
            <span className="text-gray-300 font-semibold">Manual (ativo):</span> você marca cada lead
            como <span className="text-green-400">Qualificado</span> ou{" "}
            <span className="text-gray-300">Não respondeu</span> nos botões da tabela. O{" "}
            <code className="text-voyia-blue">Contact</code> só dispara quando você confirma a
            interação real — zero falsos positivos.
          </>
        ) : (
          <>
            <span className="text-green-400 font-semibold">Automático (selecionado):</span> a
            qualificação será disparada pelo Voyia quando o cliente interagir de verdade. A
            integração ainda será configurada — por enquanto os botões manuais continuam disponíveis
            como override.
          </>
        )}
      </p>
    </div>
  );
}
