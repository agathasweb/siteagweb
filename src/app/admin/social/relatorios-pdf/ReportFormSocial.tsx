"use client";

import { useState } from "react";

interface Props {
  accounts: Array<{ id: number; username: string; display_name: string }>;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
}

export default function ReportFormSocial({ accounts }: Props) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [days, setDays] = useState("90");
  const [from, setFrom] = useState(daysAgoISO(90));
  const [to, setTo] = useState(todayISO());

  const params = new URLSearchParams();
  params.set("account_id", String(accountId));
  if (mode === "preset") {
    params.set("days", days);
  } else {
    params.set("from", from);
    params.set("to", to);
  }
  const href = `/api/admin/reports/social?${params.toString()}`;

  return (
    <form action="/api/admin/reports/social" method="get" target="_blank" className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Conta Instagram</label>
        <select
          name="account_id"
          required
          value={accountId}
          onChange={(e) => setAccountId(Number(e.target.value))}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>@{a.username} — {a.display_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Período</label>
        <div className="flex gap-1 bg-black/40 border border-gray-700 rounded-lg p-1 mb-2">
          <button
            type="button"
            onClick={() => setMode("preset")}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${mode === "preset" ? "bg-voyia-blue text-white" : "text-gray-300"}`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium ${mode === "custom" ? "bg-voyia-blue text-white" : "text-gray-300"}`}
          >
            Datas personalizadas
          </button>
        </div>

        {mode === "preset" ? (
          <select
            name="days"
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
                name="from"
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
                name="to"
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
        className="block text-center bg-voyia-blue hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold"
      >
        📄 Gerar PDF
      </a>
      <p className="text-[10px] text-gray-500 text-center">
        Abre em nova aba. Pode demorar 3-10s pra renderizar.
      </p>
    </form>
  );
}
