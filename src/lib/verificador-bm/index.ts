// Verificador de BM: conformidade ANTES da contratação do Voyia.
//
// Etapa 1: CNPJ informado (ou lido do PDF do cartão CNPJ) consultado em fonte
// pública (BrasilAPI, com fallback no CNPJá aberto).
// Etapa 2: o cliente faz o Embedded Signup do app do Voyia só para nos dar
// leitura da WABA/BM. NÃO registramos número nem assinamos webhook aqui.
//
// A Meta não expõe o CNPJ da BM pela API: a comparação com a empresa do
// cliente é por nome (razão social/fantasia × nome da BM, da WABA e o nome
// verificado do número).
//
// Mesma lógica do módulo `compliance` do voyia-dev.

export type CheckStatus = "ok" | "alerta" | "falha";

export interface Check {
  id: string;
  titulo: string;
  status: CheckStatus;
  detalhe: string;
}

export interface EmpresaCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  situacao: string;
  naturezaJuridica: string | null;
  mei: boolean | null;
  porte: string | null;
  uf: string | null;
  municipio: string | null;
  abertura: string | null;
  atividade: string | null;
  fonte: "brasilapi" | "cnpja";
}

export class ErroVerificacao extends Error {}

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v26.0"}`;

// Natureza jurídica 213-5 = Empresário (Individual), que inclui o MEI.
const NATUREZA_EMPRESARIO_INDIVIDUAL = 2135;

const CAMPOS_WABA = [
  "id", "name", "account_review_status", "business_verification_status",
  "health_status", "owner_business_info", "on_behalf_of_business_info",
  "country", "currency", "timezone_id", "ownership_type", "status",
];
const CAMPOS_BM = [
  "id", "name", "verification_status", "created_time", "link",
  "primary_page", "two_factor_type", "vertical", "timezone_id",
];
const CAMPOS_NUMERO = [
  "id", "display_phone_number", "verified_name", "name_status",
  "quality_rating", "messaging_limit_tier", "code_verification_status",
  "status", "platform_type", "account_mode", "health_status",
  "is_official_business_account",
];

// Palavras que não ajudam a comparar nomes de empresa.
const RUIDO_NOME = new Set([
  "ltda", "me", "epp", "eireli", "sa", "s", "a", "cia", "mei", "slu", "ss",
  "de", "da", "do", "das", "dos", "e", "em", "com", "para", "the", "and",
  "comercio", "servicos", "empresa", "grupo", "brasil", "oficial",
]);

export function normalizarCnpj(valor: string): string {
  return (valor || "").replace(/\D/g, "");
}

export function cnpjValido(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digito = (base: string) => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(cnpj.slice(0, 12));
  const d2 = digito(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

function tokensNome(nome: string): string[] {
  return (nome || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !RUIDO_NOME.has(t) && !/^\d+$/.test(t));
}

// Semelhança entre dois nomes: fração dos tokens do nome MENOR presentes no
// outro (nome fantasia curto dentro de razão social longa conta como igual).
export function semelhancaNomes(a: string, b: string): number {
  const ta = new Set(tokensNome(a));
  const tb = new Set(tokensNome(b));
  if (!ta.size || !tb.size) return 0;
  const [menor, maior] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let comuns = 0;
  for (const t of menor) {
    if ([...maior].some((m) => m === t || (t.length >= 4 && (m.startsWith(t) || t.startsWith(m))))) comuns++;
  }
  return comuns / menor.size;
}

async function getJson(url: string, timeoutMs = 10_000): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── Etapa 1: CNPJ ────────────────────────────────────────────────

export async function consultarCnpj(entrada: string): Promise<{ empresa: EmpresaCnpj; checks: Check[] }> {
  const cnpj = normalizarCnpj(entrada);
  if (!cnpjValido(cnpj)) throw new ErroVerificacao("CNPJ inválido.");

  const empresa = (await buscarBrasilApi(cnpj)) || (await buscarCnpja(cnpj));
  if (!empresa) {
    throw new ErroVerificacao("Não foi possível consultar o CNPJ agora. Tente novamente em alguns minutos.");
  }
  return { empresa, checks: checksCnpj(empresa) };
}

export async function extrairCnpjDoPdf(buffer: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const achados = (text as string).match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g) || [];
  const cnpj = achados.map(normalizarCnpj).find(cnpjValido);
  if (!cnpj) {
    throw new ErroVerificacao("Não encontramos um CNPJ válido no PDF. Envie o Comprovante de Inscrição (cartão CNPJ) emitido no site da Receita.");
  }
  return cnpj;
}

async function buscarBrasilApi(cnpj: string): Promise<EmpresaCnpj | null> {
  try {
    const { ok, status, data: d } = await getJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (status === 404) throw new ErroVerificacao("CNPJ não encontrado na Receita Federal.");
    if (!ok) return null;
    return {
      cnpj,
      razaoSocial: d.razao_social,
      nomeFantasia: d.nome_fantasia || null,
      situacao: d.descricao_situacao_cadastral || String(d.situacao_cadastral ?? ""),
      naturezaJuridica: d.codigo_natureza_juridica
        ? `${d.codigo_natureza_juridica} - ${d.natureza_juridica}` : (d.natureza_juridica || null),
      mei: typeof d.opcao_pelo_mei === "boolean"
        ? d.opcao_pelo_mei
        : Number(d.codigo_natureza_juridica) === NATUREZA_EMPRESARIO_INDIVIDUAL ? null : false,
      porte: d.porte || null,
      uf: d.uf || null,
      municipio: d.municipio || null,
      abertura: d.data_inicio_atividade || null,
      atividade: d.cnae_fiscal_descricao || null,
      fonte: "brasilapi",
    };
  } catch (err) {
    if (err instanceof ErroVerificacao) throw err;
    console.warn(`[verificador-bm] BrasilAPI falhou para ${cnpj}: ${(err as Error).message}`);
    return null;
  }
}

async function buscarCnpja(cnpj: string): Promise<EmpresaCnpj | null> {
  try {
    const { ok, data: d } = await getJson(`https://open.cnpja.com/office/${cnpj}`);
    if (!ok) return null;
    return {
      cnpj,
      razaoSocial: d.company?.name,
      nomeFantasia: d.alias || null,
      situacao: (d.status?.text || "").toUpperCase(),
      naturezaJuridica: d.company?.nature ? `${d.company.nature.id} - ${d.company.nature.text}` : null,
      mei: typeof d.company?.simei?.optant === "boolean" ? d.company.simei.optant : null,
      porte: d.company?.size?.text || null,
      uf: d.address?.state || null,
      municipio: d.address?.city || null,
      abertura: d.founded || null,
      atividade: d.mainActivity?.text || null,
      fonte: "cnpja",
    };
  } catch (err) {
    console.warn(`[verificador-bm] CNPJá falhou para ${cnpj}: ${(err as Error).message}`);
    return null;
  }
}

function checksCnpj(e: EmpresaCnpj): Check[] {
  const checks: Check[] = [];
  const ativa = e.situacao.toUpperCase() === "ATIVA";
  checks.push({
    id: "cnpj_ativo",
    titulo: "CNPJ ativo na Receita",
    status: ativa ? "ok" : "falha",
    detalhe: ativa ? "Situação cadastral ATIVA." : `Situação cadastral: ${e.situacao || "desconhecida"}.`,
  });
  const individual = (e.naturezaJuridica || "").startsWith(String(NATUREZA_EMPRESARIO_INDIVIDUAL));
  checks.push({
    id: "cnpj_mei",
    titulo: "Tipo de empresa",
    status: e.mei ? "alerta" : "ok",
    detalhe: e.mei
      ? "CNPJ é MEI. Tudo bem se for a empresa real; a BM precisa estar neste mesmo CNPJ."
      : individual && e.mei === null
        ? "Empresário individual (não foi possível confirmar se é MEI)."
        : `${e.naturezaJuridica || "Natureza jurídica não informada"}.`,
  });
  return checks;
}

// ── Etapa 2: Meta (BM / WABA / número) ───────────────────────────

export async function verificarMeta(cnpjEntrada: string, code: string, wabaIdInformado?: string) {
  const { empresa, checks: checksDoCnpj } = await consultarCnpj(cnpjEntrada);
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new ErroVerificacao("Integração com a Meta não configurada no servidor.");

  const tokenRes = await getJson(
    `${GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: appId, client_secret: appSecret, code })}`,
  );
  const token: string | undefined = tokenRes.data?.access_token;
  if (!token) {
    throw new ErroVerificacao(`Falha ao autorizar na Meta: ${tokenRes.data?.error?.message || "token não devolvido"}`);
  }

  // Escopos concedidos e a WABA (mesmo método do Embedded Signup do Voyia).
  const dbg = await getJson(
    `${GRAPH}/debug_token?${new URLSearchParams({ input_token: token, access_token: `${appId}|${appSecret}` })}`,
  ).then((r) => r.data?.data).catch(() => null);
  const escopos: Array<{ scope: string; target_ids?: string[] }> = dbg?.granular_scopes || [];
  const wabaId = wabaIdInformado
    || escopos.find((s) => s.scope === "whatsapp_business_management" && s.target_ids?.length)?.target_ids?.[0]
    || escopos.find((s) => s.scope === "whatsapp_business_messaging" && s.target_ids?.length)?.target_ids?.[0];
  if (!wabaId) throw new ErroVerificacao("Não identificamos a conta do WhatsApp (WABA) autorizada.");

  const indisponiveis: Record<string, string[]> = {};
  const waba = await lerCampos(token, wabaId, CAMPOS_WABA, indisponiveis, "waba");

  const bmId: string | undefined = waba?.owner_business_info?.id
    || escopos.find((s) => s.scope === "business_management" && s.target_ids?.length)?.target_ids?.[0];
  const bm = bmId ? await lerCampos(token, bmId, CAMPOS_BM, indisponiveis, "bm") : null;

  const urlNumeros = (fields: string) =>
    `${GRAPH}/${wabaId}/phone_numbers?${new URLSearchParams({ fields, access_token: token })}`;
  let numerosRes = await getJson(urlNumeros(CAMPOS_NUMERO.join(","))).catch(() => null);
  if (!numerosRes?.ok) {
    // Algum campo não suportado: tenta só o básico.
    indisponiveis.numeros = [`lista completa falhou: ${numerosRes?.data?.error?.message || "erro"} — lido só o básico`];
    numerosRes = await getJson(urlNumeros("id,display_phone_number,verified_name,status,quality_rating")).catch(() => null);
  }
  const numeros: any[] = numerosRes?.ok ? numerosRes.data?.data || [] : [];

  const checks = [...checksDoCnpj, ...checksMeta(empresa, waba, bm, numeros, bmId)];
  const resultado = checks.some((c) => c.status === "falha")
    ? "reprovado"
    : checks.some((c) => c.status === "alerta") ? "revisao" : "aprovado";

  console.log(`[verificador-bm] CNPJ ${empresa.cnpj} / WABA ${wabaId} / BM ${bmId || "-"}: ${resultado}`);

  return {
    resultado,
    empresa,
    checks,
    meta: { escoposConcedidos: escopos.map((s) => s.scope), waba, bm, numeros, camposIndisponiveis: indisponiveis },
  };
}

// Lê os campos de um nó; se a chamada inteira falhar (campo inexistente ou
// sem permissão), tenta campo a campo e anota o que a Meta não devolveu.
async function lerCampos(
  token: string, id: string, campos: string[], indisponiveis: Record<string, string[]>, chave: string,
): Promise<any | null> {
  const get = (fields: string) => getJson(`${GRAPH}/${id}?${new URLSearchParams({ fields, access_token: token })}`);
  const tudo = await get(campos.join(","));
  if (tudo.ok) return tudo.data;

  const parcial: any = {};
  const falhas: string[] = [];
  for (const campo of campos) {
    const r = await get(campo);
    if (r.ok) Object.assign(parcial, r.data);
    else falhas.push(`${campo}: ${r.data?.error?.message || r.status}`);
  }
  if (falhas.length) indisponiveis[chave] = falhas;
  return Object.keys(parcial).length ? parcial : null;
}

function checksMeta(empresa: EmpresaCnpj, waba: any, bm: any, numeros: any[], bmId?: string): Check[] {
  const checks: Check[] = [];

  // 1. Nome da BM/WABA/número × empresa do CNPJ
  const nomesEmpresa = [empresa.razaoSocial, empresa.nomeFantasia].filter(Boolean) as string[];
  const nomesMeta = [
    bm?.name, waba?.owner_business_info?.name, waba?.name,
    ...numeros.map((n) => n.verified_name),
  ].filter(Boolean) as string[];
  let melhor = { score: 0, empresa: "", meta: "" };
  for (const a of nomesEmpresa) {
    for (const b of nomesMeta) {
      const score = semelhancaNomes(a, b);
      if (score > melhor.score) melhor = { score, empresa: a, meta: b };
    }
  }
  const pct = Math.round(melhor.score * 100);
  checks.push({
    id: "nome_confere",
    titulo: "Empresa da BM confere com o CNPJ",
    status: !nomesMeta.length ? "alerta" : melhor.score >= 0.6 ? "ok" : melhor.score >= 0.3 ? "alerta" : "falha",
    detalhe: !nomesMeta.length
      ? "A Meta não devolveu o nome da BM."
      : melhor.score >= 0.3
        ? `"${melhor.meta}" × "${melhor.empresa}" (${pct}% de semelhança).`
        : `Nenhum nome da Meta (${nomesMeta.map((n) => `"${n}"`).join(", ")}) confere com "${nomesEmpresa.join('" / "')}". Indício de BM de terceiros.`,
  });

  // 2. Verificação da empresa na Meta
  const verif = String(bm?.verification_status || waba?.business_verification_status || "").toLowerCase();
  checks.push({
    id: "bm_verificada",
    titulo: "Empresa verificada na Meta",
    status: verif === "verified" ? "ok" : !verif || verif === "pending" ? "alerta" : "falha",
    detalhe: verif === "verified"
      ? "A BM concluiu a verificação de empresa."
      : !verif
        ? `Não foi possível ler o status de verificação${bmId ? "" : " (BM não identificada)"}.`
        : verif === "pending"
          ? "Verificação em análise pela Meta."
          : `Status de verificação: ${verif}. Conclua a verificação no Business Manager antes de contratar.`,
  });

  // 3. Saúde (restrições na BM, WABA, número ou app)
  const saude = waba?.health_status;
  const pode = saude?.can_send_message;
  const problemas: string[] = (saude?.entities || [])
    .filter((e: any) => e.can_send_message && e.can_send_message !== "AVAILABLE")
    .flatMap((e: any) => (e.errors?.length ? e.errors : [{}]).map((er: any) =>
      `${e.entity_type}: ${er.error_description || e.can_send_message}${er.possible_solution ? ` — ${er.possible_solution}` : ""}`));
  checks.push({
    id: "sem_restricao",
    titulo: "Sem restrições de envio",
    status: pode === "AVAILABLE" ? "ok" : pode === "BLOCKED" ? "falha" : "alerta",
    detalhe: pode === "AVAILABLE"
      ? "BM, WABA e número liberados para enviar mensagens."
      : !pode
        ? "A Meta não devolveu o status de saúde."
        : `${pode === "BLOCKED" ? "Bloqueada" : "Limitada"}: ${problemas.join(" | ") || "sem detalhe da Meta."}`,
  });

  // 4. Revisão da conta WhatsApp
  const revisao = String(waba?.account_review_status || "").toUpperCase();
  checks.push({
    id: "waba_revisao",
    titulo: "Conta WhatsApp aprovada",
    status: revisao === "APPROVED" ? "ok" : revisao === "REJECTED" ? "falha" : "alerta",
    detalhe: revisao ? `Revisão da WABA: ${revisao}.` : "Status de revisão não disponível.",
  });

  // 5. Origem da conta (moeda/país fora do Brasil é comum em BM comprada)
  const estrangeira = (waba?.currency && waba.currency !== "BRL") || (waba?.country && waba.country !== "BR");
  checks.push({
    id: "waba_brasil",
    titulo: "Conta configurada no Brasil",
    status: estrangeira ? "alerta" : "ok",
    detalhe: estrangeira
      ? `Moeda ${waba.currency || "?"} / país ${waba.country || "?"} — confira se a BM é mesmo da empresa.`
      : `Moeda ${waba?.currency || "não informada"}${waba?.country ? ` / país ${waba.country}` : ""}.`,
  });

  // 6. Qualidade dos números
  const vermelhos = numeros.filter((n) => n.quality_rating === "RED");
  const amarelos = numeros.filter((n) => n.quality_rating === "YELLOW");
  checks.push({
    id: "qualidade_numero",
    titulo: "Qualidade do número",
    status: vermelhos.length ? "falha" : amarelos.length || !numeros.length ? "alerta" : "ok",
    detalhe: !numeros.length
      ? "Nenhum número na WABA ainda."
      : numeros.map((n) => `${n.display_phone_number} (${n.verified_name || "sem nome"}): ${n.quality_rating || "—"}`).join(" | "),
  });

  return checks;
}

// Limite simples por IP (memória do processo; o site roda em 1 instância PM2).
const acessos = new Map<string, number[]>();
export function limiteExcedido(ip: string, limite: number, janelaMs = 60_000): boolean {
  const agora = Date.now();
  const recentes = (acessos.get(ip) || []).filter((t) => agora - t < janelaMs);
  recentes.push(agora);
  acessos.set(ip, recentes);
  if (acessos.size > 5000) acessos.clear();
  return recentes.length > limite;
}

export function ipDa(req: Request): string {
  return req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || "local";
}
