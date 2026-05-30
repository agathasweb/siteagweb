"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  updateLeadStatus,
  deleteLead,
  getLeadById,
  markLeadContactSent,
  type LeadStatus,
} from "@/lib/db/leads";
import { sendCapiEvent } from "@/lib/meta/capi";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autorizado.");
}

/**
 * Reconstrói o `_fbc` a partir do `fbclid` quando o cookie não foi capturado.
 * Formato Meta: `fb.1.<timestamp_ms>.<fbclid>`.
 */
function fbcFromFbclid(fbclid: string | null, createdAt: string): string | null {
  if (!fbclid) return null;
  const iso = createdAt.includes("T") ? createdAt : createdAt.replace(" ", "T") + "Z";
  const ms = Date.parse(iso);
  return `fb.1.${Number.isFinite(ms) ? ms : Date.now()}.${fbclid}`;
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
 * Marca o lead como QUALIFICADO (cliente respondeu/interagiu de verdade) e
 * dispara o evento `Contact` na CAPI — o sinal de conversão real do funil de
 * atendimento, atribuído ao anúncio via fbc/fbp + e-mail/telefone hashados.
 *
 * Idempotente: só dispara uma vez por lead (meta_contact_sent_at).
 * action_source = "chat" (a interação acontece no WhatsApp).
 */
export async function qualifyLeadAction(id: number): Promise<QualifyResult> {
  await requireAdmin();
  const lead = getLeadById(id);
  if (!lead) return { ok: false, metaSent: false, reason: "not_found" };

  updateLeadStatus(id, "qualified");

  if (lead.meta_contact_sent_at) {
    revalidatePath("/admin/leads");
    return { ok: true, metaSent: true, reason: "already" };
  }

  const fbc = lead.fbc ?? fbcFromFbclid(lead.fbclid, lead.created_at);

  const res = await sendCapiEvent({
    eventName: "Contact",
    eventId: `lead-${id}-contact`,
    actionSource: "chat",
    userData: {
      email: lead.email,
      phone: lead.phone,
      fullName: lead.name,
      fbp: lead.fbp,
      fbc,
      clientIp: lead.ip,
      clientUserAgent: lead.user_agent,
    },
    customData: {
      content_name: lead.service ?? "lead_qualificado",
      content_category: "lead",
      lead_source: lead.source,
    },
    leadId: id,
  });

  if (res.ok) {
    markLeadContactSent(id);
    revalidatePath("/admin/leads");
    return { ok: true, metaSent: true };
  }

  revalidatePath("/admin/leads");
  // Meta desligado em dev/sandbox não é falha de UX — o lead já foi qualificado.
  return { ok: true, metaSent: false, reason: res.error === "meta_disabled" ? "meta_disabled" : "error" };
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
