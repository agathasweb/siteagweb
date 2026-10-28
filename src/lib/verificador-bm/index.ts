// Verificador de BM: conformidade ANTES da contratação do Voyia.
//
// Etapa 1: CNPJ informado (ou lido do PDF do cartão CNPJ) consultado em fonte
// pública (BrasilAPI, com fallback no CNPJá aberto).
// Etapa 2: o cliente entra com o Facebook (app do Voyia, configuração de login
// "Geral", sem o cadastro de número do Embedded Signup) e escolhe a BM; só
// lemos BM, contas do WhatsApp e números.
//
// A Meta não expõe o CNPJ da BM pela API: a comparação com a empresa do
// cliente é por nome (razão social/fantasia × nome da BM, da WABA e o nome
// verificado do número).
//

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

export interface AutorizacaoMeta {
  code?: string;
  accessToken?: string;
}

// Lê BM → WABAs → números com o token do login do cliente. O login usa uma
// configuração "Geral" do Login do Facebook para Empresas (business_management
// + whatsapp_business_management): o cliente só escolhe a BM, sem o fluxo de
// cadastro de número do Embedded Signup.
export async function verificarMeta(cnpjEntrada: string, auth: AutorizacaoMeta) {
  const { empresa, checks: checksDoCnpj } = await consultarCnpj(cnpjEntrada);
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new ErroVerificacao("Integração com a Meta não configurada no servidor.");
  const appToken = `${appId}|${appSecret}`;

  let token = auth.accessToken;
  if (auth.code) {
    const tokenRes = await getJson(
      `${GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: appId, client_secret: appSecret, code: auth.code })}`,
    );
    token = tokenRes.data?.access_token;
    if (!token) {
      throw new ErroVerificacao(`Falha ao autorizar na Meta: ${tokenRes.data?.error?.message || "token não devolvido"}`);
    }
  }
  if (!token) throw new ErroVerificacao("Autorização da Meta ausente.");

  // O token precisa ser do NOSSO app (token vindo do navegador pode ser de outro).
  const dbg = await getJson(`${GRAPH}/debug_token?${new URLSearchParams({ input_token: token, access_token: appToken })}`)
    .then((r) => r.data?.data).catch(() => null);
  if (!dbg?.is_valid || String(dbg.app_id) !== String(appId)) {
    throw new ErroVerificacao("Autorização da Meta inválida. Entre com o Facebook novamente.");
  }
  const escopos: Array<{ scope: string; target_ids?: string[] }> = dbg.granular_scopes || [];
  const alvos = (scope: string) => escopos.find((s) => s.scope === scope)?.target_ids || [];

  const indisponiveis: Record<string, string[]> = {};
  const g = (path: string, fields: string) =>
    getJson(`${GRAPH}/${path}?${new URLSearchParams({ fields, access_token: token!, limit: "50" })}`);

  // BMs autorizadas: /me/businesses (token de usuário) + alvos do escopo.
  const idsBm = new Set<string>(alvos("business_management"));
  const me = await g("me/businesses", "id").catch(() => null);
  if (me?.ok) for (const b of me.data?.data || []) idsBm.add(b.id);
  else if (me) indisponiveis.me_businesses = [me.data?.error?.message || String(me.status)];

  // WABAs autorizadas sem BM conhecida: descobre a dona.
  const idsWabaSoltas = new Set<string>([...alvos("whatsapp_business_management"), ...alvos("whatsapp_business_messaging")]);
  for (const wabaId of idsWabaSoltas) {
    const w = await g(wabaId, "owner_business_info").catch(() => null);
    const dono = w?.data?.owner_business_info?.id;
    if (dono) idsBm.add(dono);
  }
  if (!idsBm.size) {
    throw new ErroVerificacao("Nenhum Business Manager foi autorizado. Entre de novo e selecione a BM da empresa.");
  }

  // Avalia cada BM e fica com a melhor (menos falhas; empate → nome mais parecido).
  const avaliacoes = [];
  for (const bmId of idsBm) {
    const bm = await lerCampos(token, bmId, CAMPOS_BM, indisponiveis, `bm_${bmId}`);
    const wabasRes = await g(`${bmId}/owned_whatsapp_business_accounts`, "id").catch(() => null);
    if (wabasRes && !wabasRes.ok) indisponiveis[`wabas_${bmId}`] = [wabasRes.data?.error?.message || String(wabasRes.status)];
    const idsWaba: string[] = (wabasRes?.data?.data || []).map((w: any) => w.id);
    for (const id of idsWabaSoltas) if (!idsWaba.includes(id)) idsWaba.push(id);

    const wabas = [];
    for (const wabaId of idsWaba) {
      const waba = await lerCampos(token, wabaId, CAMPOS_WABA, indisponiveis, `waba_${wabaId}`);
      if (!waba || (waba.owner_business_info?.id && waba.owner_business_info.id !== bmId)) continue;
      let nums = await g(`${wabaId}/phone_numbers`, CAMPOS_NUMERO.join(",")).catch(() => null);
      if (!nums?.ok) {
        indisponiveis[`numeros_${wabaId}`] = [`${nums?.data?.error?.message || "erro"} — lido só o básico`];
        nums = await g(`${wabaId}/phone_numbers`, "id,display_phone_number,verified_name,status,quality_rating").catch(() => null);
      }
      wabas.push({ ...waba, numeros: nums?.ok ? nums.data?.data || [] : [] });
    }

    const checks = checksMeta(empresa, bm, wabas, bmId);
    avaliacoes.push({
      bmId, bm, wabas, checks,
      falhas: checks.filter((c) => c.status === "falha").length,
      nome: checks.find((c) => c.id === "nome_confere")?.status === "ok" ? 1 : 0,
    });
  }
  avaliacoes.sort((a, b) => a.falhas - b.falhas || b.nome - a.nome);
  const escolhida = avaliacoes[0];

  const checks = [...checksDoCnpj, ...escolhida.checks];
  const resultado = checks.some((c) => c.status === "falha")
    ? "reprovado"
    : checks.some((c) => c.status === "alerta") ? "revisao" : "aprovado";

  console.log(`[verificador-bm] CNPJ ${empresa.cnpj} / BM ${escolhida.bmId} (${avaliacoes.length} autorizada(s)): ${resultado}`);

  return {
    resultado,
    empresa,
    checks,
    bm: { id: escolhida.bmId, nome: escolhida.bm?.name || null, totalAutorizadas: avaliacoes.length },
    meta: {
      escoposConcedidos: escopos.map((s) => s.scope),
      avaliacoes: avaliacoes.map(({ bmId, bm, wabas, checks }) => ({ bmId, bm, wabas, checks })),
      camposIndisponiveis: indisponiveis,
    },
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

function checksMeta(empresa: EmpresaCnpj, bm: any, wabas: any[], bmId: string): Check[] {
  const checks: Check[] = [];
  const numeros: any[] = wabas.flatMap((w) => w.numeros || []);

  // 1. Nome da BM/WABA/número × empresa do CNPJ
  const nomesEmpresa = [empresa.razaoSocial, empresa.nomeFantasia].filter(Boolean) as string[];
  const nomesMeta = [
    bm?.name, ...wabas.map((w) => w.name), ...numeros.map((n) => n.verified_name),
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
        : `Nenhum nome da Meta (${[...new Set(nomesMeta)].map((n) => `"${n}"`).join(", ")}) confere com "${nomesEmpresa.join('" / "')}". Indício de BM de terceiros.`,
  });

  // 2. Verificação da empresa na Meta
  const verif = String(bm?.verification_status || wabas.find((w) => w.business_verification_status)?.business_verification_status || "").toLowerCase();
  checks.push({
    id: "bm_verificada",
    titulo: "Empresa verificada na Meta",
    status: verif === "verified" ? "ok" : !verif || verif === "pending" ? "alerta" : "falha",
    detalhe: verif === "verified"
      ? `A BM "${bm?.name || bmId}" concluiu a verificação de empresa.`
      : !verif
        ? "Não foi possível ler o status de verificação da BM."
        : verif === "pending"
          ? "Verificação em análise pela Meta."
          : `Status de verificação: ${verif}. Conclua a verificação no Business Manager antes de contratar.`,
  });

  if (!wabas.length) {
    checks.push({
      id: "sem_waba",
      titulo: "Conta do WhatsApp",
      status: "ok",
      detalhe: "A BM ainda não tem conta do WhatsApp (WABA) autorizada. Tudo bem para quem vai começar do zero; ela será criada na ativação do Voyia.",
    });
    return checks;
  }

  // 3. Saúde (restrições na BM, WABA, número ou app) — pior caso entre as WABAs
  const problemas: string[] = [];
  let pior: "AVAILABLE" | "LIMITED" | "BLOCKED" | "" = "";
  const ordem = { "": 0, AVAILABLE: 1, LIMITED: 2, BLOCKED: 3 } as const;
  for (const w of wabas) {
    const pode = w.health_status?.can_send_message || "";
    if (ordem[pode as keyof typeof ordem] > ordem[pior]) pior = pode;
    for (const e of w.health_status?.entities || []) {
      if (!e.can_send_message || e.can_send_message === "AVAILABLE") continue;
      for (const er of e.errors?.length ? e.errors : [{}]) {
        problemas.push(`${e.entity_type}: ${er.error_description || e.can_send_message}${er.possible_solution ? ` — ${er.possible_solution}` : ""}`);
      }
    }
  }
  checks.push({
    id: "sem_restricao",
    titulo: "Sem restrições de envio",
    status: pior === "AVAILABLE" ? "ok" : pior === "BLOCKED" ? "falha" : "alerta",
    detalhe: pior === "AVAILABLE"
      ? "BM, contas do WhatsApp e números liberados para enviar mensagens."
      : !pior
        ? "A Meta não devolveu o status de saúde."
        : `${pior === "BLOCKED" ? "Bloqueada" : "Limitada"}: ${[...new Set(problemas)].join(" | ") || "sem detalhe da Meta."}`,
  });

  // 4. Revisão das contas WhatsApp
  const revisoes = wabas.map((w) => String(w.account_review_status || "").toUpperCase());
  checks.push({
    id: "waba_revisao",
    titulo: "Conta WhatsApp aprovada",
    status: revisoes.includes("REJECTED") ? "falha" : revisoes.every((r) => r === "APPROVED") ? "ok" : "alerta",
    detalhe: wabas.map((w, i) => `${w.name || w.id}: ${revisoes[i] || "não disponível"}`).join(" | "),
  });

  // 5. Origem da conta (moeda/país fora do Brasil é comum em BM comprada)
  const estrangeiras = wabas.filter((w) => (w.currency && w.currency !== "BRL") || (w.country && w.country !== "BR"));
  checks.push({
    id: "waba_brasil",
    titulo: "Conta configurada no Brasil",
    status: estrangeiras.length ? "alerta" : "ok",
    detalhe: estrangeiras.length
      ? estrangeiras.map((w) => `${w.name || w.id}: moeda ${w.currency || "?"} / país ${w.country || "?"}`).join(" | ") + " — confira se a BM é mesmo da empresa."
      : `Moeda ${wabas.map((w) => w.currency).filter(Boolean).join(", ") || "não informada"}.`,
  });

  // 6. Qualidade dos números
  const vermelhos = numeros.filter((n) => n.quality_rating === "RED");
  const amarelos = numeros.filter((n) => n.quality_rating === "YELLOW");
  checks.push({
    id: "qualidade_numero",
    titulo: "Qualidade do número",
    status: vermelhos.length ? "falha" : amarelos.length || !numeros.length ? "alerta" : "ok",
    detalhe: !numeros.length
      ? "Nenhum número cadastrado ainda."
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
