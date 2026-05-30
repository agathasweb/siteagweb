"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateLeadStatusAction,
  deleteLeadAction,
  deleteLeadsBulkAction,
} from "./actions";
import type { LeadRow, LeadStatus } from "@/lib/db/leads";

interface Props {
  leads: LeadRow[];
}

const STATUS_OPTS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "🆕 Novo", color: "bg-blue-900/30 text-blue-300 border-blue-500/40" },
  { value: "contacted", label: "📞 Contatado", color: "bg-purple-900/30 text-purple-300 border-purple-500/40" },
  { value: "qualified", label: "✅ Qualificado", color: "bg-green-900/30 text-green-300 border-green-500/40" },
  { value: "lost", label: "❌ Perdido", color: "bg-gray-800 text-gray-400 border-gray-600" },
  { value: "spam", label: "🚫 Spam", color: "bg-red-900/30 text-red-300 border-red-500/40" },
];

const SOURCE_LABEL: Record<string, string> = {
  contact_form: "Formulário",
  whatsapp_cta: "WhatsApp CTA",
  quote_request: "Orçamento",
  other: "Outro",
};

function scoreColor(score: number | null): string {
  if (score == null) return "text-gray-500";
  if (score >= 0.7) return "text-green-300";
  if (score >= 0.5) return "text-yellow-300";
  return "text-red-300";
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  // O SQLite grava em UTC sem marcador ("YYYY-MM-DD HH:MM:SS"). Sem o "Z" o
  // JS interpreta como horário local e a hora aparece 3h adiantada. Marcamos
  // como UTC e formatamos explicitamente no fuso de Brasília.
  const utc = iso.includes("T") ? iso : iso.replace(" ", "T") + "Z";
  return new Date(utc).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function exportCsv(leads: LeadRow[]) {
  const headers = [
    "id", "created_at", "source", "status", "tags", "name", "email", "phone",
    "service", "message", "recaptcha_score", "origin_page", "locale", "ip",
  ];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const lead of leads) {
    lines.push(headers.map((h) => escape((lead as unknown as Record<string, unknown>)[h])).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-agathas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsTable({ leads }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = leads.filter((l) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterSource !== "all" && l.source !== filterSource) return false;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function changeStatus(id: number, status: LeadStatus) {
    startTransition(async () => {
      await updateLeadStatusAction(id, status);
      router.refresh();
    });
  }

  function deleteOne(id: number) {
    if (!confirm("Apagar este lead?")) return;
    startTransition(async () => {
      await deleteLeadAction(id);
      router.refresh();
    });
  }

  function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Apagar ${selected.size} lead(s) selecionado(s)?`)) return;
    startTransition(async () => {
      await deleteLeadsBulkAction([...selected]);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
        >
          <option value="all">Todas as fontes</option>
          {Object.entries(SOURCE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {filtered.length} de {leads.length} lead(s)
        </span>
        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              disabled={pending}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              🗑 Excluir {selected.size}
            </button>
          )}
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="bg-voyia-gray hover:bg-gray-700 disabled:opacity-50 border border-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-12 text-center">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-gray-400">Nenhum lead com esses filtros.</p>
        </div>
      ) : (
        <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-black/30 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-500" />
                </th>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Nome / Contato</th>
                <th className="px-3 py-3">Fonte</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" title="Score reCAPTCHA (0=bot, 1=humano)">Score</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const isExpanded = expandedId === lead.id;
                const statusOpt = STATUS_OPTS.find((s) => s.value === lead.status);
                return (
                  <>
                    <tr
                      key={lead.id}
                      className={`border-b border-gray-700 last:border-0 ${
                        selected.has(lead.id) ? "bg-red-950/10" : "hover:bg-black/20"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(lead.id)}
                          onChange={() => toggleOne(lead.id)}
                          className="rounded border-gray-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-white flex items-center gap-1.5 flex-wrap">
                          {lead.name}
                          {lead.tags
                            ?.split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-voyia-blue/20 text-voyia-blue border border-voyia-blue/40"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                        <div className="text-xs text-gray-400">
                          <a href={`mailto:${lead.email}`} className="hover:text-voyia-blue">{lead.email}</a>
                          {lead.phone && (
                            <>
                              {" · "}
                              <a
                                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-green-400"
                              >
                                💬 {lead.phone}
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-300">
                        {SOURCE_LABEL[lead.source] ?? lead.source}
                        {lead.service && (
                          <div className="text-gray-500 mt-0.5">{lead.service}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatus)}
                          disabled={pending}
                          className={`text-xs px-2 py-1 rounded border ${statusOpt?.color ?? ""} bg-transparent`}
                        >
                          {STATUS_OPTS.map((s) => (
                            <option key={s.value} value={s.value} className="bg-gray-800 text-white">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={`px-3 py-3 text-xs font-mono ${scoreColor(lead.recaptcha_score)}`}>
                        {lead.recaptcha_score?.toFixed(2) ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                          className="text-voyia-blue hover:text-purple-300 text-xs font-semibold mr-3"
                        >
                          {isExpanded ? "Recolher" : "Detalhes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOne(lead.id)}
                          disabled={pending}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-black/20 border-b border-gray-700">
                        <td colSpan={7} className="px-6 py-4">
                          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                            {lead.message && (
                              <div className="col-span-full">
                                <dt className="text-gray-500 mb-1">Mensagem</dt>
                                <dd className="text-gray-200 whitespace-pre-wrap bg-gray-900/40 p-3 rounded">{lead.message}</dd>
                              </div>
                            )}
                            {lead.origin_page && (
                              <div>
                                <dt className="text-gray-500">Página de origem</dt>
                                <dd className="text-gray-200 font-mono">{lead.origin_page}</dd>
                              </div>
                            )}
                            {lead.locale && (
                              <div>
                                <dt className="text-gray-500">Locale</dt>
                                <dd className="text-gray-200 font-mono">{lead.locale}</dd>
                              </div>
                            )}
                            {lead.ip && (
                              <div>
                                <dt className="text-gray-500">IP</dt>
                                <dd className="text-gray-200 font-mono">{lead.ip}</dd>
                              </div>
                            )}
                            {lead.contacted_at && (
                              <div>
                                <dt className="text-gray-500">Contatado em</dt>
                                <dd className="text-gray-200">{formatDate(lead.contacted_at)}</dd>
                              </div>
                            )}
                            {lead.user_agent && (
                              <div className="col-span-full">
                                <dt className="text-gray-500">User-Agent</dt>
                                <dd className="text-gray-400 text-[10px] font-mono break-all">{lead.user_agent}</dd>
                              </div>
                            )}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        <Link href="/admin" className="hover:text-white">← Voltar ao Dashboard</Link>
      </p>
    </div>
  );
}
