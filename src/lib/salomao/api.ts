import "server-only";
import crypto from "node:crypto";

/**
 * Cliente da API do Salomão (painel da Agathas: /api/v1). Requisição assinada com HMAC-SHA256:
 * X-Salomao-Assinatura = hex(hmac(timestamp + "." + "POST" + "." + caminho + "." + corpo, SALOMAO_API_SEGREDO)).
 * Método e caminho entram na assinatura e o Salomão recusa assinatura repetida.
 * SALOMAO_API_URL = https://<painel do Salomão>/api/v1
 */
async function chamar<T>(rota: string, dados: unknown): Promise<{ status: number; corpo: T | null }> {
  const base = process.env.SALOMAO_API_URL?.trim();
  const segredo = process.env.SALOMAO_API_SEGREDO?.trim();
  if (!base || !segredo) throw new Error("SALOMAO_API_URL/SALOMAO_API_SEGREDO não configurados");

  const corpo = JSON.stringify(dados);
  const ts = Math.floor(Date.now() / 1000);
  const url = new URL(`${base.replace(/\/$/, "")}/${rota}`);
  const assinatura = crypto.createHmac("sha256", segredo).update(`${ts}.POST.${url.pathname}${url.search}.${corpo}`).digest("hex");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Salomao-Timestamp": String(ts),
      "X-Salomao-Assinatura": assinatura,
    },
    body: corpo,
    signal: AbortSignal.timeout(30_000),
  });
  let json: T | null = null;
  try {
    json = (await res.json()) as T;
  } catch {
    json = null;
  }
  return { status: res.status, corpo: json };
}

export interface Disponibilidade {
  disponivel: boolean;
  motivo: string | null;
  endereco: string;
}

export async function verificarEndereco(slug: string): Promise<Disponibilidade> {
  const r = await chamar<Disponibilidade>("disponibilidade", { slug });
  if (r.status !== 200 || !r.corpo) throw new Error(`Salomão respondeu ${r.status}`);
  return r.corpo;
}

export async function criarEscola(dados: {
  assinatura_id: string;
  nome: string;
  slug: string;
  plano: "250" | "500";
  periodicidade: "mensal" | "anual";
  admin_nome: string;
  admin_email: string;
  cliente_email: string;
}): Promise<{ escola_id: number; endereco: string; criada: boolean }> {
  const r = await chamar<{ escola_id: number; endereco: string; criada: boolean }>("escolas", dados);
  if ((r.status !== 200 && r.status !== 201) || !r.corpo) throw new Error(`Salomão respondeu ${r.status}`);
  return r.corpo;
}

export type EventoSalomao = "pagamento_confirmado" | "pagamento_atrasado" | "assinatura_cancelada";

export async function enviarEvento(assinaturaId: string, evento: EventoSalomao, vencimento?: string): Promise<void> {
  const r = await chamar("eventos", { assinatura_id: assinaturaId, evento, vencimento });
  if (r.status !== 200 && r.status !== 404) throw new Error(`Salomão respondeu ${r.status}`);
}
