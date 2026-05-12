import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

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
      async authorize(raw) {
        const parsed = parseCredentials(raw);
        if (!parsed) return null;
        return authenticateAdmin(parsed.email, parsed.password);
      },
    }),
  ],
});
