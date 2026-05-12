"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { renameTag, deleteTag, mergeTags } from "@/lib/db/taxonomy";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado.");
}

export async function renameTagAction(id: number, newName: string): Promise<void> {
  await requireAdmin();
  if (!newName.trim()) throw new Error("Nome obrigatório.");
  renameTag(id, newName);
  revalidatePath("/admin/tags");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}

export async function deleteTagAction(id: number): Promise<void> {
  await requireAdmin();
  deleteTag(id);
  revalidatePath("/admin/tags");
}

export async function mergeTagsAction(sourceId: number, targetId: number): Promise<void> {
  await requireAdmin();
  if (sourceId === targetId) throw new Error("Tags de origem e destino são iguais.");
  mergeTags(sourceId, targetId);
  revalidatePath("/admin/tags");
  revalidatePath(`/[lang]/blog/[slug]`, "page");
}
