import Link from "next/link";
import { listLeads, countLeadsByStatus } from "@/lib/db/leads";
import { getLeadQualificationMode } from "@/lib/db/settings";
import LeadsTable from "./LeadsTable";
import QualificationModeToggle from "./QualificationModeToggle";

export const metadata = {
  title: "Leads | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function LeadsPage() {
  const leads = listLeads(1000);
  const counts = countLeadsByStatus();
  const newCount = counts.new ?? 0;
  const total = leads.length;
  const qualificationMode = getLeadQualificationMode();

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

      {/*
        Aviso, e não decoração: esta tela mostra `source` (formulário, CTA de WhatsApp) e
        parecia mostrar a REDE. Não mostra — e o botão de qualificar aqui não alimenta
        campanha nenhuma. Quem guarda gclid/fbclid e vira conversão offline é o YESHUA.
        Sem este texto, a pergunta "de onde veio esse lead?" volta toda semana.
      */}
      <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
        <strong className="text-amber-200">Este painel é o status interno.</strong>{" "}
        Qualificar aqui não envia conversão ao Meta nem ao Google.
        A rede de origem (Google / Meta / orgânico) e a qualificação que vira{" "}
        <em>conversão offline</em> ficam no{" "}
        <a href="https://yeshua.agathasweb.com/leads" target="_blank" rel="noopener"
           className="underline decoration-amber-400/50 hover:text-amber-100">YESHUA → Leads</a>.
        <span className="block text-amber-200/60 mt-1 text-xs">
          O evento do Pixel já é disparado automaticamente na entrada do lead — não depende de clique aqui.
        </span>
      </div>

      <div className="mb-6">
        <QualificationModeToggle mode={qualificationMode} />
      </div>

      <LeadsTable leads={leads} />
    </div>
  );
}
