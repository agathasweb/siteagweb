"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  updateLeadStatus,
  deleteLead,
  getLeadById,
  type LeadStatus,
} from "@/lib/db/leads";
import { setSetting, SETTINGS_KEYS, type LeadQualificationMode } from "@/lib/db/settings";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado.");
}

/** Alterna o modo de qualificação de leads (manual ↔ automático via Voyia). */
export async function setQualificationModeAction(mode: LeadQualificationMode): Promise<void> {
  await requireAdmin();
  setSetting(SETTINGS_KEYS.leadQualificationMode, mode === "auto" ? "auto" : "manual");
  revalidatePath("/admin/leads");
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

export interface QualifyResult {
  ok: boolean;
  /** true = Contact disparado agora (ou já havia sido antes). */
  metaSent: boolean;
  /** quando não enviou: meta_disabled | no_match | already | not_found | error */
  reason?: string;
}

/**
 * Marca o lead como QUALIFICADO no admin. O evento `Contact` (conversão real do
 * funil de atendimento) NÃO é mais disparado pelo site: agora é responsabilidade
 * do VOYIA, que dispara `Contact` (action_source "chat" + telefone) quando o
 * cliente realmente interage por mensagem. Aqui só atualizamos o status local.
 */
export async function qualifyLeadAction(id: number): Promise<QualifyResult> {
  await requireAdmin();
  const lead = getLeadById(id);
  if (!lead) return { ok: false, metaSent: false, reason: "not_found" };

  updateLeadStatus(id, "qualified");
  revalidatePath("/admin/leads");
  return { ok: true, metaSent: false, reason: "voyia_owns_contact" };
}

/**
 * Marca o lead como desqualificado / não respondeu. NÃO envia nada ao Meta —
 * a ausência do `Contact` é justamente o sinal de que não converteu. Apenas
 * registra localmente para o nosso relatório e impede envio acidental futuro.
 */
export async function disqualifyLeadAction(
  id: number,
  status: "lost" | "spam" = "lost",
): Promise<void> {
  await requireAdmin();
  updateLeadStatus(id, status);
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
