import "server-only";
import { db } from "./index";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor";
  bio: string | null;
  avatar_url: string | null;
  social_links: string | null;
}

const findByEmailStmt = db.prepare(
  "SELECT id, email, name, role, bio, avatar_url, social_links FROM users WHERE email = ?",
);
const insertUserStmt = db.prepare(
  "INSERT INTO users (email, name, role) VALUES (?, ?, 'admin')",
);
const updateProfileStmt = db.prepare(`
  UPDATE users SET name = ?, bio = ?, avatar_url = ?, social_links = ?, updated_at = datetime('now')
  WHERE id = ?
`);

export function getOrCreateUserByEmail(email: string, name: string): AdminUser {
  const existing = findByEmailStmt.get(email) as AdminUser | undefined;
  if (existing) return existing;
  insertUserStmt.run(email, name);
  return findByEmailStmt.get(email) as AdminUser;
}

export function updateUserProfile(
  id: number,
  data: {
    name: string;
    bio: string | null;
    avatar_url: string | null;
    social_links: string | null;
  },
): void {
  updateProfileStmt.run(data.name, data.bio, data.avatar_url, data.social_links, id);
}
