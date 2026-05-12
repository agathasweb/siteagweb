"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getOrCreateUserByEmail, updateUserProfile } from "@/lib/db/users";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Não autorizado.");
  return session.user;
}

export async function saveProfileAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const dbUser = getOrCreateUserByEmail(user.email!, user.name ?? "Admin");
  const name = (formData.get("name") ?? "").toString().trim() || dbUser.name;
  const bio = (formData.get("bio") ?? "").toString().trim() || null;
  const avatar = (formData.get("avatar_url") ?? "").toString().trim() || null;
  const linkedin = (formData.get("linkedin") ?? "").toString().trim();
  const twitter = (formData.get("twitter") ?? "").toString().trim();
  const github = (formData.get("github") ?? "").toString().trim();
  const instagram = (formData.get("instagram") ?? "").toString().trim();
  const website = (formData.get("website") ?? "").toString().trim();

  const links: Record<string, string> = {};
  if (linkedin) links.linkedin = linkedin;
  if (twitter) links.twitter = twitter;
  if (github) links.github = github;
  if (instagram) links.instagram = instagram;
  if (website) links.website = website;

  updateUserProfile(dbUser.id, {
    name,
    bio,
    avatar_url: avatar,
    social_links: Object.keys(links).length > 0 ? JSON.stringify(links) : null,
  });

  revalidatePath("/admin/profile");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}
