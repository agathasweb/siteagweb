"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createManualSubscriptionAction,
  registerExistingSubscriptionAction,
  type ManualSubscriptionResult,
} from "./actions";

type Mode = "create" | "register";

const inputCls =
  "w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent";
const labelCls = "block text-sm font-medium text-gray-300 mb-1.5";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="flex gap-2">
        <input readOnly value={value} className={`${inputCls} font-mono text-xs`} />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="shrink-0 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-3 rounded-lg text-xs font-semibold transition-colors"
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

export default function ManualSubscriptionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ManualSubscriptionResult | null>(null);

  function handleSubmit(form: FormData) {
    setResult(null);
    startTransition(async () => {
      const action =
        mode === "create" ? createManualSubscriptionAction : registerExistingSubscriptionAction;
      const res = await action(form);
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-voyia-blue hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          + Nova assinatura manual
        </button>
      </div>
    );
  }

  return (
    <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Nova assinatura manual</h2>
          <p className="text-sm text-gray-400 mt-1">
            Assinatura recorrente com preço personalizado. Após o cadastro, webhook,
            e-mail de confirmação, conta Voyia (por token) e eventos Meta funcionam
            automaticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); setResult(null); }}
          className="text-gray-400 hover:text-white text-sm"
        >
          Fechar ✕
        </button>
      </div>

      {/* Seletor de modo */}
      <div className="flex gap-2 mb-6">
        {([
          { k: "create", label: "Criar nova (gera link)" },
          { k: "register", label: "Registrar existente (sub_…)" },
        ] as const).map((m) => (
          <button
            key={m.k}
            type="button"
            onClick={() => { setMode(m.k); setResult(null); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              mode === m.k
                ? "bg-voyia-blue border-voyia-blue text-white"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form action={handleSubmit} className="space-y-4">
        {mode === "create" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="ms-name">Nome do cliente *</label>
                <input id="ms-name" name="name" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ms-email">E-mail *</label>
                <input id="ms-email" name="email" type="email" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ms-cpf">CPF/CNPJ *</label>
                <input id="ms-cpf" name="cpfCnpj" required className={inputCls} placeholder="Apenas dígitos" />
              </div>
              <div>
                <label className={labelCls} htmlFor="ms-phone">Telefone (WhatsApp)</label>
                <input id="ms-phone" name="phone" className={inputCls} placeholder="DDD + número" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelCls} htmlFor="ms-category">Categoria *</label>
                <select id="ms-category" name="category" defaultValue="voyia" className={inputCls}>
                  <option value="voyia">Voyia (conta por token)</option>
                  <option value="trafego">Tráfego</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="ms-value">Valor por ciclo (R$) *</label>
                <input id="ms-value" name="value" required className={inputCls} placeholder="549,90" inputMode="decimal" />
              </div>
              <div>
                <label className={labelCls} htmlFor="ms-cycle">Ciclo *</label>
                <select id="ms-cycle" name="cycle" defaultValue="MONTHLY" className={inputCls}>
                  <option value="MONTHLY">Mensal</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="SEMIANNUALLY">Semestral</option>
                  <option value="YEARLY">Anual</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quinzenal</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="ms-billing">Forma de pagamento *</label>
                <select id="ms-billing" name="billingType" defaultValue="UNDEFINED" className={inputCls}>
                  <option value="UNDEFINED">Cliente escolhe (Pix/boleto/cartão)</option>
                  <option value="CREDIT_CARD">Cartão de crédito</option>
                  <option value="PIX">Pix</option>
                  <option value="BOLETO">Boleto</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="ms-due">1ª cobrança (opcional)</label>
                <input id="ms-due" name="firstDueDate" type="date" className={inputCls} />
                <p className="text-xs text-gray-500 mt-1">Em branco = amanhã.</p>
              </div>
              <div>
                <label className={labelCls} htmlFor="ms-desc">Descrição na fatura (opcional)</label>
                <input id="ms-desc" name="description" className={inputCls} placeholder="Ex.: Voyia — Plano Empresa X" />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="ms-subid">ID <code>sub_…</code> ou e-mail do cliente *</label>
              <input id="ms-subid" name="asaasSubscriptionId" required className={inputCls} placeholder="sub_xxxxxxxx ou cliente@email.com" />
              <p className="text-xs text-gray-500 mt-1">
                Cole o ID da API <code>sub_…</code> ou o <strong>e-mail do cliente</strong> (resolve sozinho).
                Não use o número de <code>/subscription/show/123</code> nem o link <code>/i/…</code> — esses são IDs do painel, não da API.
                Cliente, valor e ciclo são puxados da ASAAS.
              </p>
            </div>
            <div>
              <label className={labelCls} htmlFor="ms-rcategory">Categoria *</label>
              <select id="ms-rcategory" name="category" defaultValue="voyia" className={inputCls}>
                <option value="voyia">Voyia (conta por token)</option>
                <option value="trafego">Tráfego</option>
              </select>
            </div>
          </div>
        )}

        {result && (
          <div
            className={`rounded-lg px-4 py-3 text-sm border space-y-3 ${
              result.ok
                ? "bg-green-900/30 border-green-500/40 text-green-200"
                : "bg-red-900/30 border-red-500/40 text-red-200"
            }`}
          >
            {result.ok ? (
              <>
                <p className="font-semibold">
                  ✓ Assinatura {mode === "create" ? "criada" : "registrada"} para {result.customerName} — status {result.status}.
                </p>
                {result.checkoutUrl && (
                  <CopyField label="Link de pagamento (enviar ao cliente)" value={result.checkoutUrl} />
                )}
                {result.accountLink && (
                  <div>
                    <CopyField label="Link conta Voyia (criar-conta?token) — válido após o pagamento" value={result.accountLink} />
                    <p className="text-xs text-green-300/80 mt-1">
                      Enviado automaticamente por e-mail ao cliente quando o pagamento confirmar.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p>{result.error}</p>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-700">
          <button
            type="submit"
            disabled={pending}
            className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {pending
              ? "Processando…"
              : mode === "create"
                ? "Criar assinatura e gerar link"
                : "Registrar assinatura"}
          </button>
        </div>
      </form>
    </div>
  );
}
