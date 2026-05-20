"use client";

import { useState, useTransition } from "react";
import {
  saveRecaptchaSettingsAction,
  clearRecaptchaKeysAction,
  type RecaptchaSettingsStatus,
} from "./actions";

interface Props {
  initial: RecaptchaSettingsStatus;
}

export default function RecaptchaForm({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [keepSecret, setKeepSecret] = useState(initial.hasSecret);
  const [siteKey, setSiteKey] = useState(initial.siteKey ?? "");
  const [secretInput, setSecretInput] = useState("");

  function handleSave(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      try {
        formData.set("keep_secret", keepSecret && !secretInput ? "1" : "0");
        await saveRecaptchaSettingsAction(formData);
        setFeedback({ kind: "ok", text: "Chaves salvas." });
        setSecretInput("");
        setKeepSecret(true);
      } catch (err) {
        setFeedback({ kind: "err", text: err instanceof Error ? err.message : "Erro." });
      }
    });
  }

  function handleClear() {
    if (!confirm("Remover as 2 chaves reCAPTCHA? Os formulários públicos vão funcionar SEM verify (vulnerável a bots) até reconfigurar.")) return;
    startTransition(async () => {
      await clearRecaptchaKeysAction();
      setSiteKey("");
      setSecretInput("");
      setKeepSecret(false);
      setFeedback({ kind: "ok", text: "Chaves removidas." });
    });
  }

  return (
    <form
      action={handleSave}
      className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 space-y-5 mt-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">reCAPTCHA v3 (anti-bot)</h2>
          <p className="text-sm text-gray-400 mt-1">
            Usado no form de contato e no modal de captura antes de redirecionar
            pro WhatsApp. v3 invisível — sem checkbox, roda em background e dá
            score 0.0-1.0 (abaixo de 0.5 = bot, rejeitado).{" "}
            <a
              href="https://www.google.com/recaptcha/admin/create"
              target="_blank"
              rel="noreferrer"
              className="text-voyia-blue hover:text-purple-300 underline"
            >
              Crie um par de chaves grátis aqui
            </a>{" "}
            (tipo reCAPTCHA v3, domínios:{" "}
            <code className="text-gray-300">agathas.com.br, agathas.es, agathasweb.com, uk.agathasweb.com, agathas-dev.agathasweb.com</code>
            ).
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${
            initial.configured
              ? "bg-green-900/30 border-green-500/40 text-green-300"
              : "bg-yellow-900/30 border-yellow-500/40 text-yellow-300"
          }`}
        >
          {initial.configured ? "configurada" : "não configurada"}
        </span>
      </div>

      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border ${
            feedback.kind === "ok"
              ? "bg-green-900/30 border-green-500/40 text-green-200"
              : "bg-red-900/30 border-red-500/40 text-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div>
        <label htmlFor="recaptcha_site_key" className="block text-sm font-medium text-gray-300 mb-2">
          Site Key (pública — vai no HTML)
        </label>
        <input
          id="recaptcha_site_key"
          name="recaptcha_site_key"
          type="text"
          value={siteKey}
          onChange={(e) => setSiteKey(e.target.value)}
          placeholder="6Lc..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
        />
      </div>

      <div>
        <label htmlFor="recaptcha_secret_key" className="block text-sm font-medium text-gray-300 mb-2">
          Secret Key (privada — só servidor)
        </label>
        <input
          id="recaptcha_secret_key"
          name="recaptcha_secret_key"
          type="password"
          autoComplete="off"
          value={secretInput}
          onChange={(e) => {
            setSecretInput(e.target.value);
            if (e.target.value.length > 0) setKeepSecret(false);
          }}
          placeholder={initial.hasSecret ? "Deixe em branco para manter a chave atual" : "6Lc..."}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm"
        />
        {initial.hasSecret && (
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={keepSecret}
              onChange={(e) => setKeepSecret(e.target.checked)}
              disabled={secretInput.length > 0}
              className="rounded border-gray-500 text-voyia-blue"
            />
            Manter a Secret Key atual
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-700">
        {initial.configured && initial.source === "db" ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={pending}
            className="text-red-300 hover:text-red-200 text-sm transition-colors"
          >
            Remover ambas as chaves
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
