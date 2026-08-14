import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import {
  checkLoginLockout,
  getClientIp,
  pruneLoginAttempts,
  recordLoginAttempt,
} from "@/lib/db/login-attempts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCredentials(raw: unknown): { email: string; password: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const email = typeof obj.email === "string" ? obj.email.trim() : null;
  const password = typeof obj.password === "string" ? obj.password : null;
  if (!email || !password) return null;
  if (!EMAIL_RE.test(email)) return null;
  return { email, password };
}

async function authenticateAdmin(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const adminName = process.env.ADMIN_NAME ?? "Admin";

  if (!adminEmail || !adminHash) return null;
  if (email.toLowerCase() !== adminEmail.toLowerCase()) return null;

  const ok = await bcrypt.compare(password, adminHash);
  if (!ok) return null;

  return { id: "admin", email: adminEmail, name: adminName };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = parseCredentials(raw);
        const ip = getClientIp(request.headers);
        const userAgent = request.headers.get("user-agent");

        // Credencial malformada nem chega no bcrypt, mas conta como falha —
        // é exatamente o que um script de brute force manda.
        if (!parsed) {
          recordLoginAttempt({ ip, email: null, success: false, userAgent });
          return null;
        }

        // Bloqueado é bloqueado mesmo com a senha certa: é o que impede o
        // atacante de descobrir a senha por tentativa e erro.
        const lockout = checkLoginLockout(ip, parsed.email);
        if (lockout.blocked) {
          console.warn(
            `[auth] login bloqueado (${lockout.scope}) ip=${ip} falhas=${lockout.failures} libera_em=${lockout.retryAfterSeconds}s`,
          );
          recordLoginAttempt({ ip, email: parsed.email, success: false, userAgent });
          return null;
        }

        const user = await authenticateAdmin(parsed.email, parsed.password);
        recordLoginAttempt({ ip, email: parsed.email, success: !!user, userAgent });

        // Limpeza oportunista — evita depender de cron só pra isso.
        if (user) pruneLoginAttempts();

        return user;
      },
    }),
  ],
});
