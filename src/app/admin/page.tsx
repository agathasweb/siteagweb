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
            href="/admin/posts"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">📝</span>
            <h3 className="text-lg font-semibold text-white mb-2">Posts do Blog</h3>
            <p className="text-sm text-gray-400 mb-4">
              Criar, editar e traduzir automaticamente com IA (DeepSeek) os posts em 4 idiomas.
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
            href="/admin/subscriptions"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">💳</span>
            <h3 className="text-lg font-semibold text-white mb-2">Assinaturas</h3>
            <p className="text-sm text-gray-400">
              Assinaturas ASAAS de Tráfego Pago e Voyia. Status de pagamento, cliente, plano e valor.
            </p>
          </a>

          <a
            href="/admin/settings"
            className="bg-voyia-gray rounded-2xl p-6 border border-gray-700 hover:border-voyia-blue/50 hover:bg-voyia-gray/70 transition-colors block"
          >
            <span className="text-3xl mb-4 block">⚙️</span>
            <h3 className="text-lg font-semibold text-white mb-2">Configurações</h3>
            <p className="text-sm text-gray-400">
              DeepSeek (tradução), Unsplash (imagens), IndexNow (indexação) e reCAPTCHA (anti-bot).
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
