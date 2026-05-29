import "server-only";

/**
 * Sincronização de leads do site com o CRM de contatos do VOYIA.
 *
 * Toda captura de lead (formulário de contato, CTA do WhatsApp e checkout de
 * assinatura — ver `createLead` em `@/lib/db/leads`) é espelhada como contato
 * no VOYIA via a API pública `POST /api/v1/public/leads`.
 *
 * Autenticação por `client` + `key` (segredo `lk_...` por empresa). A API
 * deduplica por telefone, então reenvios apenas atualizam o contato.
 *
 * Disparo é "fire-and-forget": erros são logados mas NUNCA propagam, para que
 * uma falha do VOYIA jamais derrube a captura do lead no banco local.
 */

const VOYIA_LEADS_URL =
  process.env.VOYIA_LEADS_URL?.trim() ||
  "https://voyia.agathasweb.com/api/v1/public/leads";
const VOYIA_LEADS_CLIENT = process.env.VOYIA_LEADS_CLIENT?.trim() || "agathasweb";
const VOYIA_LEADS_KEY = process.env.VOYIA_LEADS_KEY?.trim() || "";

const TIMEOUT_MS = 8000;

export interface VoyiaLeadInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  /** Tags em array ou string separada por vírgula. */
  tags?: string[] | string | null;
}

export interface VoyiaSyncResult {
  ok: boolean;
  /** Motivo quando não enviado/aceito: disabled | no_name | no_phone | http_<code> | error */
  reason?: string;
  status?: number;
}

function normalizeTags(tags: VoyiaLeadInput["tags"]): string {
  const list = Array.isArray(tags) ? tags : (tags ?? "").split(",");
  const unique = Array.from(
    new Set(list.map((t) => t.trim()).filter(Boolean)),
  );
  return unique.join(",");
}

/**
 * Envia (ou atualiza) um lead no CRM do VOYIA. Resolve sempre — nunca lança.
 *
 * Pré-condições para envio:
 *  - `VOYIA_LEADS_KEY` configurado (sem a chave, no-op: útil em dev/local).
 *  - Telefone com ao menos 10 dígitos (o VOYIA exige telefone BR válido e
 *    rejeita o cadastro sem ele — pulamos para não gerar 400 inúteis).
 */
export async function syncLeadToVoyia(
  input: VoyiaLeadInput,
): Promise<VoyiaSyncResult> {
  if (!VOYIA_LEADS_KEY) return { ok: false, reason: "disabled" };

  const name = input.name?.trim();
  if (!name) return { ok: false, reason: "no_name" };

  const phone = (input.phone ?? "").trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return { ok: false, reason: "no_phone" };

  const email = input.email?.trim() || undefined;
  const tags = normalizeTags(input.tags);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(VOYIA_LEADS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: VOYIA_LEADS_CLIENT,
        key: VOYIA_LEADS_KEY,
        name,
        phone,
        ...(email ? { email } : {}),
        ...(tags ? { tags } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[voyia-leads] cadastro rejeitado (${res.status}) para "${name}": ${body.slice(0, 300)}`,
      );
      return { ok: false, reason: `http_${res.status}`, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.error("[voyia-leads] erro ao sincronizar lead:", err);
    return { ok: false, reason: "error" };
  } finally {
    clearTimeout(timer);
  }
}
