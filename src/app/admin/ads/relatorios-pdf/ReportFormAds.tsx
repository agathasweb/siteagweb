"use client";

import { useState } from "react";

interface Props {
  accounts: Array<{ ad_account_id: string; name: string }>;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
}

export default function ReportFormAds({ accounts }: Props) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [adAccountId, setAdAccountId] = useState("");
  const [days, setDays] = useState("90");
  const [from, setFrom] = useState(daysAgoISO(90));
  const [to, setTo] = useState(todayISO());

  const params = new URLSearchParams();
  if (adAccountId) params.set("ad_account_id", adAccountId);
  if (mode === "preset") {
    params.set("days", days);
  } else {
    params.set("from", from);
    params.set("to", to);
  }
  const href = `/api/admin/reports/ads?${params.toString()}`;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Ad Account</label>
        <select
          value={adAccountId}
          onChange={(e) => setAdAccountId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">Todas as contas gerenciadas ({accounts.length})</option>
          {accounts.map((a) => (
            <option key={a.ad_account_id} value={a.ad_account_id}>{a.name} ({a.ad_account_id})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Período</label>
        <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1 mb-2">
          <button
            type="button"
            onClick={() => setMode("preset")}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${mode === "preset" ? "bg-orange-500 text-white" : "text-gray-300"}`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${mode === "custom" ? "bg-orange-500 text-white" : "text-gray-300"}`}
          >
            Datas personalizadas
          </button>
        </div>

        {mode === "preset" ? (
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="14">Últimos 14 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                max={to}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                min={from}
                max={todayISO()}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              />
            </div>
          </div>
        )}
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold"
      >
        📄 Gerar PDF
      </a>
      <p className="text-[10px] text-gray-500 text-center">
        Render demora 5-15s (chamadas ao Meta Marketing API por campanha).
      </p>
    </div>
  );
}
