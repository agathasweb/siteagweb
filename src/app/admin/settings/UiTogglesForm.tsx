"use client";

import { useState, useTransition } from "react";
import { setFloatingWhatsappEnabledAction } from "./actions";

interface Props {
  initialFloatingWhatsapp: boolean;
}

export default function UiTogglesForm({ initialFloatingWhatsapp }: Props) {
  const [floatingWa, setFloatingWa] = useState(initialFloatingWhatsapp);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function toggleFloatingWa(next: boolean) {
    setFloatingWa(next);
    setFeedback(null);
    startTransition(async () => {
      try {
        await setFloatingWhatsappEnabledAction(next);
        setFeedback(next ? "✓ Botão WhatsApp ativado em todo o site." : "✓ Botão WhatsApp desativado.");
      } catch (err) {
        setFloatingWa(!next); // rollback otimista
        setFeedback(err instanceof Error ? `❌ ${err.message}` : "❌ Erro ao salvar.");
      }
    });
  }

  return (
    <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-5 mt-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Interface pública</h2>
        <p className="text-sm text-gray-400 mt-1">
          Controles visuais aplicados em todas as páginas públicas do site.
        </p>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2 text-sm bg-black/30 border border-gray-700 text-gray-200">
          {feedback}
        </div>
      )}

      <label className="flex items-start justify-between gap-4 p-4 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <span className="text-white font-semibold">Botão flutuante de WhatsApp</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Bolinha verde no canto inferior direito de todas as páginas (não admin).
            Abre modal de captura de lead antes de redirecionar pro WhatsApp.
          </p>
        </div>

        {/* Toggle switch */}
        <div className="relative shrink-0 mt-1">
          <input
            type="checkbox"
            checked={floatingWa}
            onChange={(e) => toggleFloatingWa(e.target.checked)}
            disabled={pending}
            className="sr-only peer"
            aria-label="Ativar botão flutuante de WhatsApp"
          />
          <div className={`w-12 h-7 rounded-full transition-colors ${
            floatingWa ? "bg-green-500" : "bg-gray-600"
          } ${pending ? "opacity-50" : ""}`} />
          <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            floatingWa ? "translate-x-5" : "translate-x-0"
          }`} />
        </div>
      </label>
    </div>
  );
}
