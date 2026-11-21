"use client";

import { useEffect, useState } from "react";

/**
 * Checkout e portal do SK Render no exterior. O token da conta chega no fragmento (#t=…&item=…), sai do endereço
 * antes de qualquer coisa (os pixels do site não veem) e só vai no corpo do POST para a nossa API.
 */
type Props = {
  modo: "checkout" | "portal";
  lang: string;
  idioma: "en" | "es";
  moeda: "usd" | "eur";
  precos: Record<string, number>;
  textos: Record<string, string>;
  conta: string;
};

export default function PagamentoSkr({ modo, lang, idioma, moeda, precos, textos: t, conta }: Props) {
  const [token, setToken] = useState("");
  const [item, setItem] = useState("");
  const [erro, setErro] = useState("");
  const [indo, setIndo] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams((location.hash || "").slice(1));
    const tk = p.get("t") || "", it = p.get("item") || "";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    setToken(/^[\w-]{20,40}$/.test(tk) ? tk : "");
    setItem(it in precos ? it : "");
  }, [precos]);

  const fmt = (c: number) => new Intl.NumberFormat(idioma === "es" ? "es-ES" : "en-US", { style: "currency", currency: moeda.toUpperCase() }).format(c / 100);
  const renders = Number(item.replace(/\D/g, ""));
  const assinatura = item.startsWith("mensal");

  async function ir() {
    setIndo(true); setErro("");
    try {
      const r = await fetch(modo === "checkout" ? "/api/stripe/checkout" : "/api/stripe/portal", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, item, lang: modo === "checkout" ? lang : idioma }),
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || t.erro);
      location.href = j.url;
    } catch (e) {
      setErro(e instanceof Error ? e.message : t.erro); setIndo(false);
    }
  }

  const invalido = !token || (modo === "checkout" && !item);
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      {invalido ? (
        <>
          <p className="mb-4">{t.invalido}</p>
          <a href={conta} className="inline-block rounded-xl bg-[#e08a5b] px-5 py-3 font-bold text-white">{t.voltar}</a>
        </>
      ) : modo === "checkout" ? (
        <>
          <p className="text-sm uppercase tracking-wide text-white/60">{assinatura ? t.assinatura : t.pacote}</p>
          <h2 className="mt-1 text-2xl font-bold">{renders} renders{assinatura ? ` ${t.porMes}` : ""}</h2>
          <p className="mt-3 text-4xl font-extrabold">{fmt(precos[item])}<span className="ml-1 text-base font-normal text-white/60">{assinatura ? t.porMes : ""}</span></p>
          <p className="mt-2 text-white/70">{fmt(Math.round(precos[item] / renders))} {t.porRender} · {assinatura ? t.notaAssinatura : t.notaPacote}</p>
          <button onClick={ir} disabled={indo} className="mt-6 w-full rounded-xl bg-[#e08a5b] px-5 py-4 text-lg font-bold text-white disabled:opacity-60">{indo ? t.abrindo : t.pagar}</button>
          {erro && <p className="mt-3 text-red-300">{erro}</p>}
          <p className="mt-4 text-sm text-white/60">{t.seguro}</p>
          <a href={conta} className="mt-3 inline-block text-sm text-white/60 underline">{t.voltar}</a>
        </>
      ) : (
        <>
          <p className="mb-4">{t.portalTexto}</p>
          <button onClick={ir} disabled={indo} className="w-full rounded-xl bg-[#e08a5b] px-5 py-4 text-lg font-bold text-white disabled:opacity-60">{indo ? t.abrindo : t.portal}</button>
          {erro && <p className="mt-3 text-red-300">{erro}</p>}
          <a href={conta} className="mt-3 inline-block text-sm text-white/60 underline">{t.voltar}</a>
        </>
      )}
    </div>
  );
}
