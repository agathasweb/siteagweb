import { auth, signOut } from "@/auth";

export const metadata = {
  title: "Dashboard | Painel Admin Agathas Web",
  robots: { index: false, follow: false },
};

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/admin/login" });
}

export default async function AdminDashboard() {
  const session = await auth();
  const userName = session?.user?.name ?? "Admin";
  const userEmail = session?.user?.email ?? "";

  return (
    <main className="min-h-screen bg-voyia-dark">
      <header className="border-b border-gray-700 bg-black/50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
            <p className="text-xs text-gray-400">Agathas Web</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-medium">{userName}</p>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm font-medium text-white transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo, {userName}</h2>
        <p className="text-gray-400 mb-12">Gerencie o conteúdo dos 4 domínios Agathas Web.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            href="/admin/analytics"
            className="bg-gradient-to-br from-voyia-blue/20 to-voyia-gray rounded-2xl p-6 border border-voyia-blue/40 hover:border-voyia-blue hover:from-voyia-blue/30 transition-colors block"
          >
            <span className="text-3xl mb-4 block">📊</span>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics & Conversões</h3>
            <p className="text-sm text-gray-400 mb-4">
              Funil VOYIA, atribuição (Meta/Google/UTM), performance por plano e health do Meta CAPI em tempo real.
            </p>
            <span className="inline-block text-xs px-2 py-1 bg-voyia-blue/30 border border-voyia-blue/50 rounded text-blue-200">
              Novo
            </span>
          </a>

          <a
            href="/admin/ads"
            className="bg-gradient-to-br from-orange-500/20 to-voyia-gray rounded-2xl p-6 border border-orange-500/40 hover:border-orange-500 hover:from-orange-500/30 transition-colors block"
          >
            <span className="text-3xl mb-4 block">🎯</span>
            <h3 className="text-lg font-semibold text-white mb-2">Ads — Campanhas de Tráfego</h3>
            <p className="text-sm text-gray-400 mb-4">
              Cria e gerencia campanhas Meta direto do painel. Spend cap obrigatório, UTMs auto, integração com Pixel + CAPI. Wizard de 4 steps.
            </p>
            <span className="inline-block text-xs px-2 py-1 bg-orange-500/30 border border-orange-500/50 rounded text-orange-200">
              Novo
            </span>
          </a>

          <a
            href="/admin/posts"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">📝</span>
            <h3 className="text-lg font-semibold text-white mb-2">Posts do Blog</h3>
            <p className="text-sm text-gray-400 mb-4">
              Criar, editar e traduzir automaticamente com IA (Gemini) os posts em 4 idiomas.
            </p>
            <span className="inline-block text-xs px-2 py-1 bg-green-900/30 border border-green-500/40 rounded text-green-300">
              Ativo
            </span>
          </a>

          <div className="bg-voyia-gray rounded-2xl p-6 border border-gray-700">
            <span className="text-3xl mb-4 block">🌍</span>
            <h3 className="text-lg font-semibold text-white mb-2">Domínios Ativos</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>🇧🇷 agathas.com.br (pt-BR)</li>
              <li>🇪🇸 agathas.es (es)</li>
              <li>🇺🇸 agathasweb.com (en-US)</li>
              <li>🇬🇧 uk.agathasweb.com (en-GB)</li>
            </ul>
          </div>

          <a
            href="/admin/categorias"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">🗂️</span>
            <h3 className="text-lg font-semibold text-white mb-2">Categorias</h3>
            <p className="text-sm text-gray-400">
              Organize os posts em 3-8 categorias amplas com nomes traduzidos por idioma.
            </p>
          </a>

          <a
            href="/admin/tags"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">🏷️</span>
            <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
            <p className="text-sm text-gray-400">
              Termos granulares dos posts. Renomear, apagar, mesclar duplicatas.
            </p>
          </a>

          <a
            href="/admin/profile"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">👤</span>
            <h3 className="text-lg font-semibold text-white mb-2">Perfil do autor</h3>
            <p className="text-sm text-gray-400">
              Bio, avatar e perfis sociais — sinal E-E-A-T para Google.
            </p>
          </a>

          <a
            href="/admin/leads"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">📨</span>
            <h3 className="text-lg font-semibold text-white mb-2">Leads</h3>
            <p className="text-sm text-gray-400">
              Capturados via formulário /contato e CTAs WhatsApp. Filtra por status, marca como contatado, exporta CSV.
            </p>
          </a>

          <a
            href="/admin/settings"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">⚙️</span>
            <h3 className="text-lg font-semibold text-white mb-2">Configurações</h3>
            <p className="text-sm text-gray-400">
              Gemini (tradução), Unsplash (imagens), IndexNow (indexação) e reCAPTCHA (anti-bot).
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
