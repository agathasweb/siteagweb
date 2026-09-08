import "server-only";

/**
 * Envio dos leads do site para o YESHUA (nosso painel), em `POST /api/leads/site`.
 *
 * Por que existe: o lead já era gravado aqui e espelhado no CRM do VOYIA, mas nenhum dos
 * dois acorda ninguém — a oportunidade ficava esperando alguém abrir o /admin/leads. No
 * YESHUA o lead cai no funil do cliente e dispara o aviso imediato (push no celular,
 * e-mail e WhatsApp de plantão), que é o que muda o tempo de resposta.
 *
 * Autenticação pelo `token_publico` do site cadastrado no YESHUA (`YESHUA_LEADS_TOKEN`).
 * O endpoint deduplica o mesmo contato numa janela curta, então reenvio não gera lead
 * dobrado.
 *
 * Disparo é "fire-and-forget", igual ao do VOYIA: erro é logado mas NUNCA propaga, para
 * que uma indisponibilidade do painel jamais derrube a captura do lead aqui.
 *
 * @see syncLeadToVoyia em `@/lib/voyia/leads` — o outro destino do mesmo lead
 */

const YESHUA_LEADS_URL =
  process.env.YESHUA_LEADS_URL?.trim() ||
  "https://yeshua.agathasweb.com/api/leads/site";
const YESHUA_LEADS_TOKEN = process.env.YESHUA_LEADS_TOKEN?.trim() || "";
const YESHUA_LEADS_ORIGIN =
  process.env.YESHUA_LEADS_ORIGIN?.trim() || "https://agathas.com.br";

const TIMEOUT_MS = 8000;

export interface YeshuaLeadInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  /** Rótulo da origem no funil do YESHUA (ex.: "formulario", "whatsapp"). */
  origin?: string | null;
  originPage?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface YeshuaSyncResult {
  ok: boolean;
  /** Motivo quando não enviado/aceito: disabled | no_contact | http_<code> | error */
  reason?: string;
  status?: number;
  leadId?: number;
}

/**
 * Manda (ou reencontra) o lead no YESHUA. Resolve sempre — nunca lança.
 *
 * Pré-condições:
 *  - `YESHUA_LEADS_TOKEN` configurado (sem o token, no-op: útil em dev/local).
 *  - E-mail OU telefone presente — o endpoint recusa lead sem ninguém para contatar,
 *    e mandar assim mesmo só renderia 422 inútil no log.
 */
export async function syncLeadToYeshua(
  input: YeshuaLeadInput,
): Promise<YeshuaSyncResult> {
  if (!YESHUA_LEADS_TOKEN) return { ok: false, reason: "disabled" };

  const name = input.name?.trim();
  const email = input.email?.trim() || undefined;
  const phone = input.phone?.trim() || undefined;
  if (!name || (!email && !phone)) return { ok: false, reason: "no_contact" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(YESHUA_LEADS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // O YESHUA confere o Origin contra o domínio do site cadastrado. Chamada de
        // servidor não manda Origin sozinha, então declaramos o nosso.
        Origin: YESHUA_LEADS_ORIGIN,
      },
      body: JSON.stringify({
        token: YESHUA_LEADS_TOKEN,
        nome: name,
        ...(email ? { email } : {}),
        ...(phone ? { telefone: phone } : {}),
        ...(input.message ? { mensagem: input.message } : {}),
        origem: input.origin || "formulario",
        ...(input.originPage ? { url_origem: input.originPage } : {}),
        ...(input.utm_source ? { utm_source: input.utm_source } : {}),
        ...(input.utm_medium ? { utm_medium: input.utm_medium } : {}),
        ...(input.utm_campaign ? { utm_campaign: input.utm_campaign } : {}),
        ...(input.utm_term ? { utm_term: input.utm_term } : {}),
        ...(input.utm_content ? { utm_content: input.utm_content } : {}),
        ...(input.gclid ? { gclid: input.gclid } : {}),
        ...(input.fbclid ? { fbclid: input.fbclid } : {}),
        ...(input.fbp ? { fbp: input.fbp } : {}),
        ...(input.fbc ? { fbc: input.fbc } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[yeshua-leads] lead recusado (${res.status}) para "${name}": ${body.slice(0, 300)}`,
      );
      return { ok: false, reason: `http_${res.status}`, status: res.status };
    }

    const json = (await res.json().catch(() => null)) as { id?: number } | null;
    return { ok: true, status: res.status, leadId: json?.id };
  } catch (err) {
    console.error("[yeshua-leads] erro ao enviar lead:", err);
    return { ok: false, reason: "error" };
  } finally {
    clearTimeout(timer);
  }
}
