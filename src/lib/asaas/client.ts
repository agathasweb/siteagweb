/**
 * Cliente mínimo para API ASAAS v3.
 *
 * Docs: https://docs.asaas.com/reference/comece-por-aqui
 *
 * Endpoints usados:
 *   - POST /customers          → cria cliente
 *   - POST /subscriptions      → cria assinatura recorrente
 *   - GET  /subscriptions/{id} → consulta assinatura
 *   - GET  /payments?subscription={id} → lista pagamentos da assinatura
 *
 * Autenticação: header `access_token: <chave>` (obtida no painel ASAAS).
 */

const SANDBOX_BASE = "https://api-sandbox.asaas.com/v3";
const PRODUCTION_BASE = "https://api.asaas.com/v3";

function baseUrl(): string {
  return process.env.ASAAS_ENV === "production" ? PRODUCTION_BASE : SANDBOX_BASE;
}

function accessToken(): string {
  const token = process.env.ASAAS_API_KEY;
  if (!token) throw new Error("ASAAS_API_KEY não definida no ambiente");
  return token;
}

async function asaasFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(`${baseUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken(),
      ...(rest.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    // ASAAS retorna { errors: [{ code, description }] }. Extrai as
    // descrições legíveis em vez de despejar o JSON cru pro usuário.
    let message = `ASAAS ${res.status}`;
    if (typeof data === "object" && data !== null && "errors" in data) {
      const errs = (data as { errors: unknown }).errors;
      if (Array.isArray(errs) && errs.length > 0) {
        const descs = errs
          .map((e) => (e && typeof e === "object" && "description" in e ? String((e as { description: unknown }).description) : null))
          .filter((d): d is string => !!d);
        if (descs.length > 0) message = descs.join(" ");
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  externalReference?: string;
}

export async function createCustomer(input: CreateCustomerInput): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", { method: "POST", json: input });
}

export type AsaasBillingType = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
export type AsaasCycle = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";

export interface CreateSubscriptionInput {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  description?: string;
  externalReference?: string;
  /**
   * IP do cliente (não do servidor). Exigido pela ASAAS em assinaturas
   * com billingType CREDIT_CARD para análise antifraude.
   */
  remoteIp?: string;
  /**
   * Redireciona o cliente de volta ao nosso site após o pagamento.
   * `autoRedirect` true → redireciona automaticamente.
   */
  callback?: {
    successUrl: string;
    autoRedirect?: boolean;
  };
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  status: string;
  value: number;
  cycle: AsaasCycle;
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", { method: "POST", json: input });
}

/**
 * Consulta uma assinatura já existente na ASAAS pelo ID (`sub_xxx`).
 *
 * Usado pelo fluxo manual "registrar existente": quando a assinatura foi
 * criada à mão no painel ASAAS, buscamos value/cycle/billingType/customer
 * direto da fonte em vez de redigitar.
 */
export async function getSubscription(id: string): Promise<AsaasSubscription & { billingType?: AsaasBillingType }> {
  return asaasFetch<AsaasSubscription & { billingType?: AsaasBillingType }>(`/subscriptions/${id}`);
}

/** Consulta um cliente ASAAS pelo ID (`cus_xxx`) para preencher os dados de contato. */
export async function getCustomer(id: string): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${id}`);
}

export interface AsaasPayment {
  id: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  status: string;
  value: number;
  dueDate: string;
}

/**
 * Lista pagamentos de uma assinatura. O primeiro pagamento serve como link
 * de checkout — redirecionamos o cliente para `invoiceUrl`.
 */
export async function listSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
  return asaasFetch<{ data: AsaasPayment[] }>(`/payments?subscription=${subscriptionId}`);
}
