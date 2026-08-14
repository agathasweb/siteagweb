import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { auth, signIn } from "@/auth";
import {
  checkLoginLockout,
  formatRetryAfter,
  getClientIp,
} from "@/lib/db/login-attempts";

export const metadata = {
  title: "Login | Painel Admin Agathas Web",
  robots: { index: false, follow: false },
};

async function loginAction(formData: FormData) {
  "use server";
  const email = formData.get("email");
  const password = formData.get("password");

  // Pré-checagem só pela UX — quem de fato barra o brute force é o `authorize`
  // em auth.ts, que também cobre POST direto no /api/auth/callback/credentials.
  const ip = getClientIp(await headers());
  const lockout = checkLoginLockout(ip, typeof email === "string" ? email : null);
  if (lockout.blocked) {
    redirect(`/admin/login?error=locked&retry=${lockout.retryAfterSeconds}`);
  }

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
  const retryParam = Array.isArray(params.retry) ? params.retry[0] : params.retry;

  const hasError = errorParam === "invalid";
  const isLocked = errorParam === "locked";
  const retrySeconds = Number(retryParam) > 0 ? Number(retryParam) : 0;

  return (
    <main className="min-h-screen flex items-center justify-center bg-voyia-dark px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <picture>
            <source srcSet="/assets/logo_white.webp" type="image/webp" />
            <Image
              src="/assets/logo_white.png"
              alt="Agathas Web"
              width={501}
              height={126}
              priority
              className="h-12 w-auto mx-auto mb-6"
            />
          </picture>
          <h1 className="text-3xl font-bold text-white mb-2">Painel Admin</h1>
          <p className="text-gray-400 text-sm">Agathas Web</p>
        </div>
        <form action={loginAction} className="bg-voyia-gray rounded-2xl p-8 border border-gray-700 space-y-6">
          {hasError && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-sm text-red-200">
              E-mail ou senha inválidos.
            </div>
          )}
          {isLocked && (
            <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-lg px-4 py-3 text-sm text-yellow-100">
              <strong>Acesso bloqueado temporariamente.</strong>
              <p className="mt-1 text-yellow-200/90">
                Tentativas demais a partir deste IP.
                {retrySeconds > 0 ? ` Tente de novo em ${formatRetryAfter(retrySeconds)}.` : " Tente de novo mais tarde."}
              </p>
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
