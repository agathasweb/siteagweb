"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  updateLeadStatus,
  deleteLead,
  type LeadStatus,
} from "@/lib/db/leads";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado.");
}

export async function updateLeadStatusAction(
  id: number,
  status: LeadStatus,
  notes?: string,
): Promise<void> {
  await requireAdmin();
  updateLeadStatus(id, status, notes ?? null);
  revalidatePath("/admin/leads");
}

export async function deleteLeadAction(id: number): Promise<void> {
  await requireAdmin();
  deleteLead(id);
  revalidatePath("/admin/leads");
}

export async function deleteLeadsBulkAction(ids: number[]): Promise<{ deleted: number }> {
  await requireAdmin();
  let deleted = 0;
  for (const id of ids) {
    if (Number.isFinite(id) && id > 0) {
      deleteLead(id);
      deleted++;
    }
  }
  revalidatePath("/admin/leads");
  return { deleted };
}
