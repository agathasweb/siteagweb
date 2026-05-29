import { NextRequest, NextResponse } from "next/server";
import {
  listAbandonedCheckouts,
  markAbandonedFlagged,
} from "@/lib/db/subscriptions";
import { getLeadsBySubscriptionId, addLeadTag } from "@/lib/db/leads";
import { syncLeadToVoyia } from "@/lib/voyia/leads";
import { listSubscriptionPayments } from "@/lib/asaas/client";
import { sendEmail, abandonedCheckoutEmail, isSmtpConfigured } from "@/lib/email";
import { getPlan } from "@/lib/asaas/plans";

export const dynamic = "force-dynamic";

/** Tag aplicada (no admin e no VOYIA) a checkouts não concluídos. */
const ABANDONED_TAG = "Compra não Finalizada";

/** Minutos após o início do checkout para considerar abandonado. */
const ABANDON_AFTER_MIN = 30;

const NOTIFY_EMAIL =
  process.env.ABANDONED_CHECKOUT_NOTIFY_EMAIL?.trim() ||
  process.env.TEAM_NOTIFICATION_EMAIL?.trim() ||
  "webmaster@agathas.com.br";

/**
 * Cron de checkout abandonado.
 *
 * 30+ minutos após o início de um checkout que ainda não foi pago
 * (status fora de CONFIRMED/RECEIVED), para cada assinatura ainda não
 * sinalizada:
 *   1. Marca o lead vinculado com a tag "Compra não Finalizada" (admin local).
 *   2. Espelha a tag no contato do VOYIA (a API mescla tags por telefone).
 *   3. Notifica NOTIFY_EMAIL (webmaster@agathas.com.br) para recontato.
 *   4. Grava `abandoned_flagged_at` para não repetir.
 *
 * Idempotente via `abandoned_flagged_at`. Autenticação: Bearer CRON_SECRET.
 * Recomendado rodar a cada 5 minutos.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron_misconfigured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = listAbandonedCheckouts(ABANDON_AFTER_MIN);
  const processed: Array<Record<string, unknown>> = [];

  for (const sub of candidates) {
    const planName = getPlan(sub.plan_key)?.name ?? sub.plan_key;

    // 1) Tag no(s) lead(s) local(is) vinculado(s) à assinatura.
    const leads = getLeadsBySubscriptionId(sub.id);
    for (const lead of leads) {
      addLeadTag(lead.id, lead.tags, ABANDONED_TAG);
    }

    // 2) Espelha a tag no VOYIA (merge por telefone). Usa os dados da assinatura.
    const voyia = await syncLeadToVoyia({
      name: sub.customer_name,
      phone: sub.customer_phone,
      email: sub.customer_email,
      tags: [ABANDONED_TAG],
    });

    // 3) Link da fatura em aberto (best-effort, não bloqueia o alerta).
    let invoiceUrl: string | null = null;
    try {
      const payments = await listSubscriptionPayments(sub.asaas_subscription_id);
      const open = payments.data.find((p) => p.status !== "RECEIVED" && p.status !== "CONFIRMED");
      invoiceUrl = (open ?? payments.data[0])?.invoiceUrl ?? null;
    } catch {
      // ignora — o alerta sai mesmo sem o link
    }

    // 4) Notificação interna.
    let emailed = false;
    if (isSmtpConfigured()) {
      const tpl = abandonedCheckoutEmail({
        planName,
        customerName: sub.customer_name,
        customerEmail: sub.customer_email,
        customerPhone: sub.customer_phone,
        value: sub.value,
        startedAt: sub.created_at,
        invoiceUrl,
      });
      const r = await sendEmail({ to: NOTIFY_EMAIL, subject: tpl.subject, html: tpl.html });
      emailed = r.ok;
    }

    // 5) Marca como sinalizada (idempotência).
    markAbandonedFlagged(sub.id);

    processed.push({
      subscriptionId: sub.id,
      asaasSubscriptionId: sub.asaas_subscription_id,
      customer: sub.customer_name,
      leadsTagged: leads.length,
      voyia: voyia.ok ? "ok" : voyia.reason,
      emailed,
    });
  }

  return NextResponse.json({ ok: true, flagged: processed.length, processed });
}
