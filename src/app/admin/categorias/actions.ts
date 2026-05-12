"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  upsertCategoryTranslation,
} from "@/lib/db/taxonomy";
import { isLocale } from "@/lib/i18n";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado.");
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "categoria"
  );
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const slugRaw = (formData.get("slug") ?? "").toString().trim();
  const name = (formData.get("name") ?? "").toString().trim();
  const color = (formData.get("color") ?? "").toString().trim() || null;
  if (!name) throw new Error("Nome é obrigatório.");
  const slug = slugRaw ? slugify(slugRaw) : slugify(name);
  const id = createCategory(slug, color);
  upsertCategoryTranslation(id, "pt-BR", name, null);
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/posts/new");
}

export async function updateCategoryAction(
  id: number,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const slug = slugify(
    ((formData.get("slug") ?? "") as string).toString().trim() || `cat-${id}`,
  );
  const color = (formData.get("color") ?? "").toString().trim() || null;
  updateCategory(id, slug, color);
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/posts/new");
}

export async function deleteCategoryAction(id: number): Promise<void> {
  await requireAdmin();
  deleteCategory(id);
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/posts/new");
}

export async function saveCategoryTranslationAction(
  categoryId: number,
  locale: string,
  name: string,
  description: string | null,
): Promise<void> {
  await requireAdmin();
  if (!isLocale(locale)) throw new Error("Locale inválido.");
  if (!name.trim()) throw new Error("Nome é obrigatório.");
  upsertCategoryTranslation(categoryId, locale, name.trim(), description?.trim() || null);
  revalidatePath("/admin/categorias");
  revalidatePath(`/[lang]/blog`, "page");
}
