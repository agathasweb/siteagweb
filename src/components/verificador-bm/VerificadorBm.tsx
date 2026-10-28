"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// Verificador de BM (pré-contratação do Voyia).
// 1) CNPJ (digitado ou PDF do cartão CNPJ) → 2) login do Facebook no app do
// Voyia, só para escolher a BM (sem cadastro de número) → 3) resultado.
// Com ?debug=1 mostra o JSON cru que a Meta devolveu.

// App do Voyia na Meta e a configuração de login "Geral" do verificador
// (business_management + whatsapp_business_management). NÃO usar a config do
// Embedded Signup: ela abre o fluxo de cadastro de número.
const META_APP_ID = "517429776771018";
const META_CONFIG_ID = "1123305396753718";

declare global {
  interface Window { FB: any; fbAsyncInit: () => void }
}

type CheckStatus = "ok" | "alerta" | "falha";
interface Check { id: string; titulo: string; status: CheckStatus; detalhe: string }
interface Empresa {
  cnpj: string; razaoSocial: string; nomeFantasia: string | null; situacao: string;
  naturezaJuridica: string | null; mei: boolean | null; uf: string | null; municipio: string | null;
  abertura: string | null; atividade: string | null; fonte: string;
}
interface ResultadoMeta {
  resultado: "aprovado" | "revisao" | "reprovado";
  empresa: Empresa;
  bm: { id: string; nome: string | null; totalAutorizadas: number };
  checks: Check[];
  meta: unknown;
}

const ESTILO: Record<CheckStatus, { caixa: string; bolinha: string; icone: string }> = {
  ok: { caixa: "border-green-500/40 bg-green-500/5", bolinha: "bg-green-500 text-black", icone: "✓" },
  alerta: { caixa: "border-yellow-500/40 bg-yellow-500/5", bolinha: "bg-yellow-400 text-black", icone: "!" },
  falha: { caixa: "border-red-500/40 bg-red-500/5", bolinha: "bg-red-500 text-white", icone: "✕" },
};

function formatarCnpj(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

async function lerResposta(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erro na verificação.");
  return data;
}

function postJson(path: string, body: unknown) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(lerResposta);
}

function ListaChecks({ checks }: { checks: Check[] }) {
  return (
    <div className="flex flex-col gap-2">
      {checks.map((c) => (
        <div key={c.id} className={`flex gap-3 rounded-xl border p-4 ${ESTILO[c.status].caixa}`}>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ESTILO[c.status].bolinha}`}>
            {ESTILO[c.status].icone}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-white">{c.titulo}</div>
            <div className="break-words text-sm text-gray-400">{c.detalhe}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Passos({ atual }: { atual: number }) {
  const nomes = ["Empresa", "Conta Meta", "Resultado"];
  return (
    <div className="mb-8 flex justify-between">
      {nomes.map((n, i) => (
        <div key={n} className="flex-1 text-center">
          <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i <= atual ? "bg-green-500 text-black" : "bg-gray-800 text-gray-400"}`}>
            {i + 1}
          </div>
          <div className={`mt-1 text-xs ${i === atual ? "font-semibold text-white" : "text-gray-500"}`}>{n}</div>
        </div>
      ))}
    </div>
  );
}

const BOTAO = "inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-3 font-bold text-black transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40";
const BOTAO_SECUNDARIO = "rounded-lg px-4 py-3 font-semibold text-gray-300 transition-colors hover:text-white";

export default function VerificadorBm() {
  const params = useSearchParams();
  const debug = params.get("debug") === "1";

  const [passo, setPasso] = useState(0);
  const [cnpj, setCnpj] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [checksCnpj, setChecksCnpj] = useState<Check[]>([]);
  const [resultado, setResultado] = useState<ResultadoMeta | null>(null);
  const [fbPronto, setFbPronto] = useState(false);

  useEffect(() => {
    if (window.FB?.login) { setFbPronto(true); return; }
    if (document.getElementById("facebook-jssdk")) return;
    window.fbAsyncInit = () => {
      window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: "v26.0" });
      setFbPronto(true);
    };
    const s = document.createElement("script");
    s.id = "facebook-jssdk";
    s.src = "https://connect.facebook.net/pt_BR/sdk.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const aplicarCnpj = (data: { empresa: Empresa; checks: Check[] }) => {
    setEmpresa(data.empresa);
    setCnpj(formatarCnpj(data.empresa.cnpj));
    setChecksCnpj(data.checks);
  };

  const consultar = async () => {
    setErro(""); setCarregando(true);
    try {
      aplicarCnpj(await postJson("/api/verificador-bm/cnpj", { cnpj }));
    } catch (e) {
      setErro((e as Error).message); setEmpresa(null);
    } finally { setCarregando(false); }
  };

  const enviarPdf = async (arquivo?: File) => {
    if (!arquivo) return;
    setErro(""); setCarregando(true);
    try {
      const form = new FormData();
      form.append("file", arquivo);
      aplicarCnpj(await fetch("/api/verificador-bm/cnpj-pdf", { method: "POST", body: form }).then(lerResposta));
    } catch (e) {
      setErro((e as Error).message); setEmpresa(null);
    } finally { setCarregando(false); }
  };

  const conectarMeta = useCallback(() => {
    if (!window.FB?.login || !empresa) return;
    setErro(""); setCarregando(true);
    window.FB.login((response: any) => {
      const auth = response?.authResponse;
      if (!auth?.code && !auth?.accessToken) {
        setCarregando(false);
        setErro("A autorização na Meta não foi concluída.");
        return;
      }
      postJson("/api/verificador-bm/meta", { cnpj: empresa.cnpj, code: auth.code, accessToken: auth.accessToken })
        .then((r: ResultadoMeta) => { setResultado(r); setPasso(2); })
        .catch((e: Error) => setErro(e.message))
        .finally(() => setCarregando(false));
    }, { config_id: META_CONFIG_ID });
  }, [empresa]);

  const reiniciar = () => {
    setPasso(0); setResultado(null); setEmpresa(null); setChecksCnpj([]); setCnpj(""); setErro("");
  };

  const cnpjCompleto = cnpj.replace(/\D/g, "").length === 14;
  const cnpjReprovado = checksCnpj.some((c) => c.status === "falha");

  return (
    <section className="bg-black px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-300">
            Voyia · API Oficial do WhatsApp
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">Verificador de BM</h1>
          <p className="mt-3 text-gray-400">
            Antes de contratar, confirmamos que sua empresa e sua conta da Meta estão aptas para a API Oficial do WhatsApp.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-5 sm:p-8">
          <Passos atual={passo} />
          {erro && <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{erro}</div>}

          {passo === 0 && (
            <>
              <label htmlFor="cnpj" className="mb-2 block font-semibold text-white">CNPJ da sua empresa</label>
              <div className="flex gap-2">
                <input
                  id="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00"
                  className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
                  value={cnpj} onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && cnpjCompleto && consultar()}
                />
                <button className={BOTAO} disabled={carregando || !cnpjCompleto} onClick={consultar}>
                  {carregando ? "…" : "Consultar"}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                ou envie o PDF do cartão CNPJ:{" "}
                <label className="cursor-pointer text-green-400 underline">
                  escolher arquivo
                  <input type="file" accept="application/pdf" hidden onChange={(e) => enviarPdf(e.target.files?.[0])} />
                </label>
              </p>

              {empresa && (
                <>
                  <div className="my-5 rounded-xl border border-gray-800 p-4 text-sm text-gray-300">
                    <div className="text-base font-semibold text-white">{empresa.razaoSocial}</div>
                    {empresa.nomeFantasia && <div>Fantasia: {empresa.nomeFantasia}</div>}
                    <div>{empresa.naturezaJuridica}</div>
                    <div>
                      {[empresa.municipio, empresa.uf].filter(Boolean).join(" / ")}
                      {empresa.abertura && ` · aberta em ${empresa.abertura.split("-").reverse().join("/")}`}
                    </div>
                    {empresa.atividade && <div className="text-gray-500">{empresa.atividade}</div>}
                  </div>
                  <ListaChecks checks={checksCnpj} />
                  <div className="mt-6 text-right">
                    <button className={BOTAO} disabled={cnpjReprovado} onClick={() => setPasso(1)}>
                      Esta é minha empresa — continuar
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {passo === 1 && empresa && (
            <>
              <p className="text-gray-300">
                Agora entre com o Facebook da <strong className="text-white">{empresa.nomeFantasia || empresa.razaoSocial}</strong> e
                selecione o Business Manager que será usado no Voyia.
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-500">
                <li>Só <strong className="text-gray-300">lemos</strong> o status da BM e das contas do WhatsApp: nada é criado, enviado ou ativado.</li>
                <li>O Business Manager precisa estar no mesmo CNPJ ({formatarCnpj(empresa.cnpj)}).</li>
                <li>Contas compradas de terceiros, restritas ou não verificadas são recusadas pela Meta.</li>
              </ul>
              <div className="mt-8 flex flex-wrap justify-between gap-3">
                <button className={BOTAO_SECUNDARIO} onClick={() => setPasso(0)}>Voltar</button>
                <button className={BOTAO} disabled={!fbPronto || carregando} onClick={conectarMeta}>
                  {carregando ? "Verificando…" : "Entrar com Facebook e verificar"}
                </button>
              </div>
            </>
          )}

          {passo === 2 && resultado && (
            <>
              {resultado.resultado === "aprovado" && (
                <div className="mb-5 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-green-200">
                  <strong>Tudo certo!</strong> Sua empresa e sua conta da Meta estão aptas para o Voyia.
                </div>
              )}
              {resultado.resultado === "revisao" && (
                <div className="mb-5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-200">
                  <strong>Precisamos confirmar alguns pontos.</strong> Nossa equipe vai analisar os itens em amarelo antes de liberar a contratação.
                </div>
              )}
              {resultado.resultado === "reprovado" && (
                <div className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                  <strong>Sua conta ainda não está apta.</strong> Corrija os itens em vermelho e verifique novamente.
                </div>
              )}
              <p className="mb-3 text-sm text-gray-500">
                BM avaliada: <span className="text-gray-300">{resultado.bm.nome || resultado.bm.id}</span>
                {resultado.bm.totalAutorizadas > 1 && ` (a melhor entre ${resultado.bm.totalAutorizadas} autorizadas)`}
              </p>
              <ListaChecks checks={resultado.checks} />

              {debug && (
                <pre className="mt-6 max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-300">
                  {JSON.stringify(resultado.meta, null, 2)}
                </pre>
              )}

              <div className="mt-8 flex flex-wrap justify-between gap-3">
                <button className={BOTAO_SECUNDARIO} onClick={reiniciar}>Verificar novamente</button>
                {resultado.resultado === "aprovado" && (
                  <Link href="/produtos/voyia#planos" className={BOTAO}>Continuar contratação</Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
