import Link from "next/link";
import {
  listSubscriptions,
  getSubscriptionStats,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "@/lib/db/subscriptions";
import { getPlan } from "@/lib/asaas/plans";

export const metadata = {
  title: "Assinaturas | Painel Admin",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<SubscriptionStatus, { label: string; cls: string }> = {
  PENDING: { label: "Pendente", cls: "bg-yellow-900/40 text-yellow-200 border-yellow-500/40" },
  CONFIRMED: { label: "Confirmado", cls: "bg-blue-900/40 text-blue-200 border-blue-500/40" },
  RECEIVED: { label: "Pago", cls: "bg-green-900/40 text-green-200 border-green-500/40" },
  OVERDUE: { label: "Vencido", cls: "bg-orange-900/40 text-orange-200 border-orange-500/40" },
  CANCELED: { label: "Cancelado", cls: "bg-red-900/40 text-red-200 border-red-500/40" },
};

function fmtDate(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function SubscriptionsPage({
  searchParams,
}: PageProps<"/admin/subscriptions">) {
  const sp = await searchParams;
  const statusFilter = typeof sp.status === "string" ? sp.status : "";
  const categoryFilter = typeof sp.categoria === "string" ? sp.categoria : "";

  const stats = getSubscriptionStats();
  const rows: SubscriptionRow[] = listSubscriptions({
    status: (statusFilter || undefined) as SubscriptionStatus | undefined,
    category: categoryFilter || undefined,
  });

  const statCards = [
    { label: "Total", value: stats.total, color: "text-white" },
    { label: "Pendentes", value: stats.pending, color: "text-yellow-300" },
    { label: "Ativas", value: stats.active, color: "text-green-300" },
    { label: "Vencidas", value: stats.overdue, color: "text-orange-300" },
    { label: "Canceladas", value: stats.canceled, color: "text-red-300" },
  ];

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: "Todas", href: "/admin/subscriptions", active: !statusFilter && !categoryFilter },
    { label: "Pendentes", href: "/admin/subscriptions?status=PENDING", active: statusFilter === "PENDING" },
    { label: "Pagas", href: "/admin/subscriptions?status=RECEIVED", active: statusFilter === "RECEIVED" },
    { label: "Confirmadas", href: "/admin/subscriptions?status=CONFIRMED", active: statusFilter === "CONFIRMED" },
    { label: "Vencidas", href: "/admin/subscriptions?status=OVERDUE", active: statusFilter === "OVERDUE" },
    { label: "Tráfego", href: "/admin/subscriptions?categoria=trafego", active: categoryFilter === "trafego" },
    { label: "Voyia", href: "/admin/subscriptions?categoria=voyia", active: categoryFilter === "voyia" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/admin" className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2">
        ← Voltar ao Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-white mb-1">Assinaturas</h1>
      <p className="text-gray-400 mb-8">Assinaturas ASAAS de Tráfego Pago e Voyia.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-voyia-gray rounded-xl border border-gray-700 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              f.active
                ? "bg-voyia-blue border-voyia-blue text-white"
                : "bg-voyia-gray border-gray-700 text-gray-300 hover:border-gray-500"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      {rows.length === 0 ? (
        <div className="bg-voyia-gray rounded-2xl border border-gray-700 p-12 text-center text-gray-400">
          Nenhuma assinatura encontrada.
        </div>
      ) : (
        <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  {["Cliente", "Plano", "Valor", "Ciclo", "Pgto", "Status", "Conta Voyia", "Criada em"].map((th) => (
                    <th key={th} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rows.map((r) => {
                  const st = STATUS_STYLE[r.status];
                  const planName = getPlan(r.plan_key)?.name ?? r.plan_key;
                  return (
                    <tr key={r.id} className="hover:bg-black/20">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{r.customer_name}</div>
                        <div className="text-xs text-gray-400">{r.customer_email}</div>
                        {r.customer_phone && <div className="text-xs text-gray-500">{r.customer_phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {planName}
                        <span className={`ml-2 text-[10px] uppercase ${r.category === "voyia" ? "text-green-400" : "text-blue-400"}`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-mono whitespace-nowrap">R$ {fmtBRL(r.value)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{r.cycle}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{r.billing_type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {r.category !== "voyia" ? (
                          <span className="text-gray-600">—</span>
                        ) : r.account_created ? (
                          <span className="text-green-400">✓ criada</span>
                        ) : (
                          <span className="text-gray-400">aguardando</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Status atualizado automaticamente pelo webhook da ASAAS. Mostrando até 500 assinaturas mais recentes.
      </p>
    </div>
  );
}
