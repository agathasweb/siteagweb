"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { maskPhone, validatePhone, maskCpfCnpj, validateCpfCnpj } from "@/lib/phone";
import { trackPixelEventSingle } from "@/lib/meta/pixel";
import { newEventId } from "@/lib/meta/event-id";
import { identificarTikTok, trackTikTok } from "@/lib/tiktok/pixel";
import { snapshotAttribution } from "@/lib/meta/attribution";

type Faixa = "250" | "500";
type Periodo = "mensal" | "anual";

const PRECOS: Record<Faixa, Record<Periodo, number>> = {
  "250": { mensal: 249, anual: 2490 },
  "500": { mensal: 499, anual: 4990 },
};

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Endereço sugerido a partir do nome da escola: "Colégio São José" → "colegiosaojose". */
function sugerirSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

interface Props {
  /** Domínio base dos endereços das escolas (ex.: salomao.agathas.com.br). */
  dominioBase: string;
  /** Cupom já preenchido (página de oferta). */
  cupomInicial?: string;
  /** Pixel exclusivo do Salomão (null = pixels do site). */
  pixelId: string | null;
  faixaInicial?: Faixa;
}

/**
 * Compra do Salomão: escolhe faixa e período, preenche responsável, escola e administrador e vai para o
 * checkout seguro da ASAAS (cartão). A escola é criada sozinha quando o 1º pagamento é confirmado.
 */
export default function SalomaoCheckout({ dominioBase, cupomInicial = "", pixelId, faixaInicial = "250" }: Props) {
  const [faixa, setFaixa] = useState<Faixa>(faixaInicial);
  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const [escolaNome, setEscolaNome] = useState("");
  // endereço segue o nome da escola até a pessoa mexer nele
  const [slugDigitado, setSlugDigitado] = useState<string | null>(null);
  const slug = slugDigitado ?? sugerirSlug(escolaNome);
  // resultado da última consulta, guardado junto do endereço consultado
  const [consulta, setConsulta] = useState<{ slug: string; ok: boolean; msg: string } | null>(null);
  const slugStatus: { ok: boolean | null; msg: string } = !slug
    ? { ok: null, msg: "" }
    : consulta?.slug === slug
      ? { ok: consulta.ok, msg: consulta.msg }
      : { ok: null, msg: "Conferindo…" };
  const [souAdmin, setSouAdmin] = useState(true);
  const [doc, setDoc] = useState("");
  const [fone, setFone] = useState("");
  const [cupom, setCupom] = useState(cupomInicial);
  const [cupomResposta, setCupomResposta] = useState<{ chave: string; ok: boolean; valor?: number; meses?: number; motivo?: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, startTransition] = useTransition();

  const planKey = `salomao-${faixa}-${periodo}`;
  const preco = PRECOS[faixa][periodo];

  // confere se o endereço está livre (com espera para não consultar a cada letra)
  useEffect(() => {
    if (!slug) return;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/salomao/disponibilidade?slug=${encodeURIComponent(slug)}`);
        const j = (await r.json()) as { disponivel: boolean; motivo: string | null };
        setConsulta({ slug, ok: j.disponivel, msg: j.disponivel ? "Endereço livre" : j.motivo ?? "Indisponível" });
      } catch {
        setConsulta(null);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [slug]);

  // cupom: só no mensal
  const chaveCupom = `${cupom.trim()}|${planKey}`;
  useEffect(() => {
    if (!cupom.trim() || periodo !== "mensal") return;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/salomao/cupom?codigo=${encodeURIComponent(cupom)}&plano=${planKey}`);
        setCupomResposta({ chave: chaveCupom, ...(await r.json()) });
      } catch {
        setCupomResposta(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [cupom, periodo, planKey, chaveCupom]);
  const cupomInfo = !cupom.trim()
    ? null
    : periodo === "anual"
      ? { ok: false, motivo: "O cupom vale só no plano mensal." } as { ok: boolean; valor?: number; meses?: number; motivo?: string }
      : cupomResposta?.chave === chaveCupom
        ? cupomResposta
        : null;

  const resumo = useMemo(() => {
    if (cupomInfo?.ok && cupomInfo.valor !== undefined) {
      return `${moeda(cupomInfo.valor)}/mês nos ${cupomInfo.meses} primeiros meses, depois ${moeda(preco)}/mês`;
    }
    return periodo === "anual" ? `${moeda(preco)} por ano (equivale a 10 mensalidades)` : `${moeda(preco)} por mês`;
  }, [cupomInfo, periodo, preco]);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const data = new FormData(e.currentTarget);
    const docCheck = validateCpfCnpj(doc);
    if (!docCheck.ok) return setErro(docCheck.error ?? "CPF/CNPJ inválido.");
    let phone = "";
    if (fone.trim()) {
      const check = validatePhone(fone);
      if (!check.ok) return setErro(check.error ?? "WhatsApp inválido.");
      phone = check.country === "BR" ? check.normalized!.replace(/^\+55/, "") : check.normalized!.replace(/\D/g, "");
    }
    if (slugStatus.ok === false) return setErro(slugStatus.msg);
    if (cupom.trim() && cupomInfo && !cupomInfo.ok) return setErro(cupomInfo.motivo ?? "Cupom inválido.");

    const nome = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const eventId = newEventId();
    const a = snapshotAttribution();
    const payload = {
      planKey,
      name: nome,
      email,
      cpfCnpj: docCheck.normalized!,
      phone,
      escolaNome: escolaNome.trim(),
      escolaSlug: slug,
      adminNome: souAdmin ? nome : String(data.get("adminNome") ?? "").trim(),
      adminEmail: souAdmin ? email : String(data.get("adminEmail") ?? "").trim().toLowerCase(),
      cupom: periodo === "mensal" ? cupom.trim() : "",
      metaEventId: eventId,
      fbp: a.fbp, fbc: a.fbc, fbclid: a.fbclid, gclid: a.gclid,
      utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign, utm_term: a.utm_term, utm_content: a.utm_content,
      eventSourceUrl: a.eventSourceUrl,
    };

    trackPixelEventSingle(pixelId, "InitiateCheckout", eventId, {
      content_name: `Salomão até ${faixa} alunos (${periodo})`, content_category: "salomao", content_ids: [planKey],
      content_type: "product", num_items: 1, currency: "BRL", value: cupomInfo?.ok ? cupomInfo.valor : preco,
    });
    identificarTikTok(email, phone);
    trackTikTok("InitiateCheckout", eventId, {
      contents: [{ content_id: planKey, content_type: "product", content_name: `Salomão até ${faixa} alunos (${periodo})`, quantity: 1 }],
      currency: "BRL", value: cupomInfo?.ok ? cupomInfo.valor : preco,
    });

    startTransition(async () => {
      try {
        const res = await fetch("/api/asaas/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { ok: boolean; checkoutUrl?: string; error?: string };
        if (!json.ok || !json.checkoutUrl) return setErro(json.error ?? "Não foi possível iniciar o pagamento. Tente de novo.");
        window.location.href = json.checkoutUrl;
      } catch {
        setErro("Não foi possível iniciar o pagamento. Tente de novo.");
      }
    });
  }

  const campo = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-[#1f2a44] focus:outline-none focus:ring-2 focus:ring-[#d4a72c]/40";
  const rotulo = "block text-sm font-medium text-slate-700";
  const opcao = (ativa: boolean) =>
    `flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${ativa ? "border-[#1f2a44] bg-[#1f2a44] text-white" : "border-slate-300 bg-white text-slate-700 hover:border-[#1f2a44]"}`;

  return (
    <form onSubmit={enviar} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <fieldset>
        <legend className={rotulo}>Quantos alunos a escola tem?</legend>
        <div className="mt-2 flex gap-2">
          <button type="button" className={opcao(faixa === "250")} onClick={() => setFaixa("250")}>Até 250</button>
          <button type="button" className={opcao(faixa === "500")} onClick={() => setFaixa("500")}>Até 500</button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">Mais de 500 alunos ou rede com mais de 3 unidades: fale com a gente para um orçamento.</p>
      </fieldset>
      <fieldset>
        <legend className={rotulo}>Como prefere pagar?</legend>
        <div className="mt-2 flex gap-2">
          <button type="button" className={opcao(periodo === "mensal")} onClick={() => setPeriodo("mensal")}>Mensal</button>
          <button type="button" className={opcao(periodo === "anual")} onClick={() => setPeriodo("anual")}>Anual · 2 meses grátis</button>
        </div>
      </fieldset>

      <div className="rounded-xl bg-[#f6efd9] px-4 py-3 text-sm text-[#1f2a44]">
        <span className="font-semibold">{resumo}</span>
        <span className="block text-xs text-slate-600">Cartão de crédito, renovação automática. Cancele quando quiser.</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="sal-escola" className={rotulo}>Nome da escola</label>
          <input id="sal-escola" required maxLength={120} value={escolaNome} onChange={(e) => setEscolaNome(e.target.value)} className={campo} placeholder="Colégio Exemplo" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sal-slug" className={rotulo}>Endereço do app</label>
          <input id="sal-slug" required maxLength={42} value={slug} inputMode="url" autoCapitalize="off" placeholder="suaescola"
            onChange={(e) => setSlugDigitado(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={campo} />
          <p className="mt-1 break-all text-xs text-slate-500">https://<strong className="text-slate-700">{slug || "suaescola"}</strong>.{dominioBase}</p>
          {slugStatus.msg && (
            <p className={`mt-1 text-xs ${slugStatus.ok === true ? "text-green-700" : slugStatus.ok === false ? "text-red-600" : "text-slate-500"}`}>{slugStatus.msg}</p>
          )}
        </div>
        <div>
          <label htmlFor="sal-nome" className={rotulo}>Seu nome (responsável pelo pagamento)</label>
          <input id="sal-nome" name="name" required maxLength={120} autoComplete="name" className={campo} />
        </div>
        <div>
          <label htmlFor="sal-email" className={rotulo}>E-mail</label>
          <input id="sal-email" name="email" type="email" required autoComplete="email" className={campo} />
        </div>
        <div>
          <label htmlFor="sal-doc" className={rotulo}>CPF ou CNPJ</label>
          <input id="sal-doc" required inputMode="numeric" value={doc} onChange={(e) => setDoc(maskCpfCnpj(e.target.value))} className={campo} />
        </div>
        <div>
          <label htmlFor="sal-fone" className={rotulo}>WhatsApp <span className="font-normal text-slate-400">(opcional)</span></label>
          <input id="sal-fone" inputMode="tel" value={fone} onChange={(e) => setFone(maskPhone(e.target.value))} className={campo} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={souAdmin} onChange={(e) => setSouAdmin(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        Eu vou administrar o app da escola
      </label>
      {!souAdmin && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sal-admin-nome" className={rotulo}>Nome do administrador</label>
            <input id="sal-admin-nome" name="adminNome" required maxLength={120} className={campo} />
          </div>
          <div>
            <label htmlFor="sal-admin-email" className={rotulo}>E-mail do administrador</label>
            <input id="sal-admin-email" name="adminEmail" type="email" required className={campo} />
          </div>
        </div>
      )}

      {periodo === "mensal" && (
        <div>
          <label htmlFor="sal-cupom" className={rotulo}>Cupom <span className="font-normal text-slate-400">(opcional)</span></label>
          <input id="sal-cupom" value={cupom} onChange={(e) => setCupom(e.target.value.toUpperCase())} className={`${campo} uppercase sm:max-w-xs`} />
          {cupomInfo && (
            <p className={`mt-1 text-xs ${cupomInfo.ok ? "text-green-700" : "text-red-600"}`}>
              {cupomInfo.ok ? "Cupom aplicado." : cupomInfo.motivo}
            </p>
          )}
        </div>
      )}

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <button type="submit" disabled={enviando}
        className="w-full rounded-lg bg-[#d4a72c] px-5 py-3.5 text-base font-bold text-[#1f2a44] shadow-sm transition-colors hover:bg-[#e0b84a] disabled:opacity-60">
        {enviando ? "Preparando o pagamento…" : "Ir para o pagamento seguro"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Pagamento processado pela ASAAS. Assim que for aprovado, o app da escola é criado e o acesso chega no e-mail do administrador.
      </p>
    </form>
  );
}
