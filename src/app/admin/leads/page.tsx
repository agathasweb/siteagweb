import Link from "next/link";
import { listLeads, countLeadsByStatus } from "@/lib/db/leads";
import LeadsTable from "./LeadsTable";

export const metadata = {
  title: "Leads | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function LeadsPage() {
  const leads = listLeads(1000);
  const counts = countLeadsByStatus();
  const newCount = counts.new ?? 0;
  const total = leads.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/admin" className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2">
        ← Voltar ao Dashboard
      </Link>
      <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 mt-1">
            {total} {total === 1 ? "lead" : "leads"} capturado{total === 1 ? "" : "s"}
            {newCount > 0 && (
              <span className="ml-2 inline-block bg-blue-900/40 text-blue-200 text-xs px-2 py-0.5 rounded-full border border-blue-500/40">
                {newCount} novo{newCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Capturados via formulário /contato e CTAs WhatsApp.
          Score 0.0-1.0 do reCAPTCHA (acima de 0.5 = humano, abaixo = bot rejeitado).
        </div>
      </div>

      <LeadsTable leads={leads} />
    </div>
  );
}
