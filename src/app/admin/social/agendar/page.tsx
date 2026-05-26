import Link from "next/link";
import { listSocialAccounts } from "@/lib/db/social-accounts";
import AgendarForm from "./AgendarForm";

export const metadata = {
  title: "Agendar | Social | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function AgendarPage() {
  const accounts = listSocialAccounts();

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link href="/admin/social" className="text-xs text-gray-400 hover:text-white">
            ← Voltar à visão geral
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">Novo agendamento</h1>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3 flex gap-4 text-sm flex-wrap">
          <Link href="/admin/social" className="text-gray-400 hover:text-white">Visão geral</Link>
          <Link href="/admin/social/contas" className="text-gray-400 hover:text-white">Contas</Link>
          <span className="text-voyia-blue font-semibold">Agendar</span>
          <Link href="/admin/social/agendamentos" className="text-gray-400 hover:text-white">Agendamentos</Link>
          <Link href="/admin/social/biblioteca" className="text-gray-400 hover:text-white">Biblioteca</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="bg-voyia-gray rounded-xl border border-gray-700 p-6">
          <AgendarForm accounts={accounts} />
        </div>
      </div>
    </main>
  );
}
