import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata = {
  title: "Login | Painel Admin Agathas Web",
  robots: { index: false, follow: false },
};

async function loginAction(formData: FormData) {
  "use server";
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    redirect("/admin/login?error=invalid");
  }
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const params = await searchParams;
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;
  const hasError = errorParam === "invalid";

  return (
    <main className="min-h-screen flex items-center justify-center bg-voyia-dark px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Painel Admin</h1>
          <p className="text-gray-400 text-sm">Agathas Web</p>
        </div>
        <form action={loginAction} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 space-y-6">
          {hasError && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-sm text-red-200">
              E-mail ou senha inválidos.
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              placeholder="admin@agathas.com.br"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-voyia-blue hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
