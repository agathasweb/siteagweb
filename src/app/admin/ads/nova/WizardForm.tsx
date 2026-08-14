"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFullCampaignAction,
  searchInterestsAction,
  searchCitiesAction,
  listIgPostsAction,
} from "./actions";

interface AdAccount { ad_account_id: string; name: string; }
interface SocialAccount { id: number; username: string; ig_user_id: string | null; fb_page_id: string | null; }

const OBJECTIVES = [
  { value: "OUTCOME_TRAFFIC", label: "Tráfego — cliques pro site/WhatsApp", emoji: "🌐" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engajamento — likes/comments/saves", emoji: "❤️" },
  { value: "OUTCOME_LEADS", label: "Leads — formulários + DMs", emoji: "📨" },
  { value: "OUTCOME_SALES", label: "Vendas — conversões via Pixel", emoji: "🛒" },
  { value: "OUTCOME_AWARENESS", label: "Reconhecimento — alcance e impressões", emoji: "📡" },
] as const;

const CTAS = [
  { value: "LEARN_MORE", label: "Saiba mais" },
  { value: "SHOP_NOW", label: "Comprar agora" },
  { value: "SIGN_UP", label: "Cadastrar" },
  { value: "SUBSCRIBE", label: "Assinar" },
  { value: "CONTACT_US", label: "Fale conosco" },
  { value: "GET_OFFER", label: "Aproveitar oferta" },
  { value: "DOWNLOAD", label: "Baixar" },
  { value: "APPLY_NOW", label: "Inscrever-se" },
  { value: "WHATSAPP_MESSAGE", label: "WhatsApp" },
  { value: "SEND_MESSAGE", label: "Enviar mensagem" },
];

interface Props {
  adAccounts: AdAccount[];
  socialAccounts: SocialAccount[];
  maxDailyBudget: number;
  minSpendCap: number;
}

export default function WizardForm({ adAccounts, socialAccounts, maxDailyBudget, minSpendCap }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — conta + objetivo + nome
  const [adAccountId, setAdAccountId] = useState(adAccounts[0]?.ad_account_id ?? "");
  const [objective, setObjective] = useState<typeof OBJECTIVES[number]["value"]>("OUTCOME_TRAFFIC");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"PAUSED" | "ACTIVE">("PAUSED");

  // Step 2 — budget + cap + cronograma
  const [dailyBudget, setDailyBudget] = useState(20);
  const [spendCap, setSpendCap] = useState(Math.max(minSpendCap, 200));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Step 3 — segmentação
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(55);
  const [gendersSel, setGendersSel] = useState<"all" | "M" | "F">("all");
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<Array<{ key: string; name: string; region: string }>>([]);
  const [selectedCities, setSelectedCities] = useState<Array<{ key: string; label: string }>>([]);
  const [interestQuery, setInterestQuery] = useState("");
  const [interestSuggestions, setInterestSuggestions] = useState<Array<{ id: string; name: string; audience_size_lower?: number }>>([]);
  const [selectedInterests, setSelectedInterests] = useState<Array<{ id: string; name: string }>>([]);

  // Step 4 — criativo
  const [creativeMode, setCreativeMode] = useState<"new" | "boost">("new");
  const [socialAccountIdx, setSocialAccountIdx] = useState(0);
  const [boostablePosts, setBoostablePosts] = useState<Array<{ id: string; caption?: string; thumbnail_url?: string; permalink?: string }>>([]);
  const [boostPostId, setBoostPostId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("https://agathas.com.br/produtos/voyia");
  const [cta, setCta] = useState("LEARN_MORE");
  const [utmCampaign, setUtmCampaign] = useState("");

  const selectedSocialAccount = socialAccounts[socialAccountIdx];

  // ---- Step 3 helpers ----
  async function searchInterests(q: string) {
    setInterestQuery(q);
    if (q.length < 2) { setInterestSuggestions([]); return; }
    const r = await searchInterestsAction(q);
    setInterestSuggestions(r);
  }
  async function searchCities(q: string) {
    setCityQuery(q);
    if (q.length < 2) { setCitySuggestions([]); return; }
    const r = await searchCitiesAction(q);
    setCitySuggestions(r);
  }
  function addInterest(i: { id: string; name: string }) {
    if (selectedInterests.find((s) => s.id === i.id)) return;
    setSelectedInterests((prev) => [...prev, i]);
    setInterestQuery("");
    setInterestSuggestions([]);
  }
  function addCity(c: { key: string; name: string; region: string }) {
    if (selectedCities.find((s) => s.key === c.key)) return;
    setSelectedCities((prev) => [...prev, { key: c.key, label: `${c.name}${c.region ? ", " + c.region : ""}` }]);
    setCityQuery("");
    setCitySuggestions([]);
  }

  // ---- Step 4 helpers ----
  async function loadBoostable() {
    if (!selectedSocialAccount?.ig_user_id) return;
    const r = await listIgPostsAction(selectedSocialAccount.ig_user_id);
    setBoostablePosts(r);
  }
  async function uploadCreative(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/ads-upload", { method: "POST", body: fd });
      const j = (await r.json()) as { ok: boolean; url?: string; error?: string };
      if (!j.ok || !j.url) { setError(`Upload: ${j.error}`); return; }
      setImageUrl(j.url);
    } finally {
      setUploading(false);
    }
  }

  // ---- Validações por step ----
  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!adAccountId) return "Escolha uma ad account.";
      if (!name.trim()) return "Dê um nome à campanha.";
      return null;
    }
    if (s === 2) {
      if (dailyBudget < 10) return "Budget diário mínimo R$ 10.";
      if (dailyBudget > maxDailyBudget) return `Budget diário máximo R$ ${maxDailyBudget} (ajuste em /admin/settings).`;
      if (spendCap < minSpendCap) return `Spend cap mínimo R$ ${minSpendCap}.`;
      if (spendCap < dailyBudget) return "Spend cap não pode ser menor que o budget diário.";
      return null;
    }
    if (s === 3) {
      if (ageMin < 13 || ageMax > 65 || ageMin > ageMax) return "Faixa etária inválida (13-65).";
      return null;
    }
    if (s === 4) {
      if (!selectedSocialAccount?.fb_page_id) return "Conta IG sem page FB vinculada.";
      if (creativeMode === "boost" && !boostPostId) return "Escolha um post pra impulsionar.";
      if (creativeMode === "new") {
        if (!imageUrl) return "Faça upload da imagem do anúncio.";
        if (!message.trim()) return "Escreva o texto principal.";
        if (!link.trim()) return "URL de destino é obrigatória.";
      }
      return null;
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => (s + 1) as typeof step);
  }

  function submit() {
    const err = validateStep(4);
    if (err) { setError(err); return; }
    setError(null);

    const genders = gendersSel === "all" ? [] : gendersSel === "M" ? [1] : [2];

    startTransition(async () => {
      const r = await createFullCampaignAction({
        ad_account_id: adAccountId,
        name,
        objective,
        status,
        daily_budget_brl: dailyBudget,
        spend_cap_brl: spendCap,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        countries: ["BR"],
        age_min: ageMin,
        age_max: ageMax,
        genders,
        city_keys: selectedCities.map((c) => c.key),
        interest_ids: selectedInterests,
        creative_mode: creativeMode,
        ig_post_id: creativeMode === "boost" ? boostPostId : undefined,
        page_id: selectedSocialAccount?.fb_page_id ?? undefined,
        ig_user_id: selectedSocialAccount?.ig_user_id ?? undefined,
        image_path: creativeMode === "new" ? imageUrl : undefined,
        message: creativeMode === "new" ? message : undefined,
        link: creativeMode === "new" ? link : undefined,
        headline: creativeMode === "new" ? headline : undefined,
        description: creativeMode === "new" ? description : undefined,
        cta,
        utm_source: "meta",
        utm_medium: status === "ACTIVE" ? "cpc" : "cpc",
        utm_campaign: utmCampaign || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });
      if (!r.ok) { setError(`${r.step ?? "?"}: ${r.error}`); return; }
      router.push(`/admin/ads/campanhas/${r.campaign_id}`);
    });
  }

  if (adAccounts.length === 0) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/40 rounded-xl p-6 text-center">
        <p className="text-yellow-100 mb-3">Você precisa ativar pelo menos 1 ad account antes.</p>
        <a href="/admin/ads/contas" className="text-voyia-blue hover:underline">Ir para Contas →</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step >= n ? "text-white" : "text-gray-500"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${step >= n ? "bg-voyia-blue text-white" : "bg-gray-700 text-gray-400"}`}>
                {n}
              </span>
              <span className="text-xs hidden sm:inline">
                {n === 1 ? "Conta & Objetivo" : n === 2 ? "Orçamento" : n === 3 ? "Segmentação" : "Criativo"}
              </span>
            </div>
            {n < 4 && <div className={`h-0.5 flex-1 mx-2 ${step > n ? "bg-voyia-blue" : "bg-gray-700"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ad Account</label>
            <select
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
            >
              {adAccounts.map((a) => (
                <option key={a.ad_account_id} value={a.ad_account_id}>{a.name} ({a.ad_account_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Objetivo</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {OBJECTIVES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setObjective(o.value)}
                  className={`text-left px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                    objective === o.value
                      ? "border-voyia-blue bg-voyia-blue/10 text-white"
                      : "border-gray-700 hover:border-gray-600 text-gray-300"
                  }`}
                >
                  <span className="mr-2">{o.emoji}</span>{o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome da campanha</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VOYIA - Tráfego Q2 2026"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status inicial</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("PAUSED")}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                  status === "PAUSED" ? "border-yellow-500 bg-yellow-500/10 text-yellow-200" : "border-gray-700 text-gray-300"
                }`}
              >
                Pausada (recomendado) — ativa depois
              </button>
              <button
                type="button"
                onClick={() => setStatus("ACTIVE")}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                  status === "ACTIVE" ? "border-green-500 bg-green-500/10 text-green-200" : "border-gray-700 text-gray-300"
                }`}
              >
                Ativa imediatamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Budget diário (BRL) <span className="text-xs text-gray-500">— máx R$ {maxDailyBudget}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                <input
                  type="number"
                  min={10}
                  max={maxDailyBudget}
                  step={5}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Spend cap total (teto absoluto) <span className="text-xs text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                <input
                  type="number"
                  min={minSpendCap}
                  step={50}
                  value={spendCap}
                  onChange={(e) => setSpendCap(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <p className="text-xs text-yellow-300 mt-1">
                Meta para a campanha automaticamente quando atinge esse valor.
                Mínimo R$ {minSpendCap}.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Início (opcional)</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fim (opcional)</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Idade</label>
              <div className="flex items-center gap-2">
                <input type="number" min={13} max={65} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))}
                  className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm" />
                <span className="text-gray-400">até</span>
                <input type="number" min={13} max={65} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))}
                  className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gênero</label>
              <div className="flex gap-2">
                {(["all", "M", "F"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGendersSel(g)}
                    className={`flex-1 px-3 py-2 border rounded text-sm ${
                      gendersSel === g ? "border-voyia-blue bg-voyia-blue/10 text-white" : "border-gray-700 text-gray-300"
                    }`}
                  >
                    {g === "all" ? "Todos" : g === "M" ? "Homens" : "Mulheres"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cidades (opcional) — Brasil já é default</label>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => searchCities(e.target.value)}
              placeholder="Digite uma cidade (ex.: Vitória, Vila Velha…)"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
            />
            {citySuggestions.length > 0 && (
              <div className="border border-gray-700 rounded mt-1 max-h-40 overflow-y-auto">
                {citySuggestions.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => addCity(c)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-800 text-sm text-gray-300"
                  >
                    {c.name}{c.region && `, ${c.region}`}
                  </button>
                ))}
              </div>
            )}
            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCities.map((c) => (
                  <span key={c.key} className="inline-flex items-center gap-1 bg-voyia-blue/20 text-blue-200 px-2 py-0.5 rounded text-xs">
                    {c.label}
                    <button type="button" onClick={() => setSelectedCities((p) => p.filter((s) => s.key !== c.key))}
                      className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Interesses (opcional)</label>
            <input
              type="text"
              value={interestQuery}
              onChange={(e) => searchInterests(e.target.value)}
              placeholder="Digite um interesse (ex.: WhatsApp, marketing digital…)"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
            />
            {interestSuggestions.length > 0 && (
              <div className="border border-gray-700 rounded mt-1 max-h-40 overflow-y-auto">
                {interestSuggestions.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => addInterest({ id: i.id, name: i.name })}
                    className="w-full text-left px-3 py-2 hover:bg-gray-800 text-sm flex justify-between"
                  >
                    <span className="text-gray-300">{i.name}</span>
                    {i.audience_size_lower && (
                      <span className="text-[10px] text-gray-500">~{(i.audience_size_lower / 1e6).toFixed(1)}M pessoas</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedInterests.map((i) => (
                  <span key={i.id} className="inline-flex items-center gap-1 bg-voyia-blue/20 text-blue-200 px-2 py-0.5 rounded text-xs">
                    {i.name}
                    <button type="button" onClick={() => setSelectedInterests((p) => p.filter((s) => s.id !== i.id))}
                      className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="space-y-4">
          {socialAccounts.length === 0 ? (
            <div className="bg-red-900/20 border border-red-500/40 rounded p-4 text-sm text-red-200">
              Você precisa ter pelo menos 1 conta Instagram conectada em /admin/ads/contas-instagram
              (com page_id) pra criar anúncios.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Conta que vai postar o anúncio</label>
                <select
                  value={socialAccountIdx}
                  onChange={(e) => setSocialAccountIdx(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                >
                  {socialAccounts.map((a, i) => (
                    <option key={a.id} value={i}>@{a.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setCreativeMode("new")}
                  className={`flex-1 px-3 py-2 border rounded text-sm ${creativeMode === "new" ? "border-voyia-blue bg-voyia-blue/10 text-white" : "border-gray-700 text-gray-300"}`}>
                  Criar novo anúncio
                </button>
                <button type="button" onClick={() => { setCreativeMode("boost"); if (!boostablePosts.length) void loadBoostable(); }}
                  className={`flex-1 px-3 py-2 border rounded text-sm ${creativeMode === "boost" ? "border-voyia-blue bg-voyia-blue/10 text-white" : "border-gray-700 text-gray-300"}`}>
                  Impulsionar post existente
                </button>
              </div>

              {creativeMode === "new" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do anúncio</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
                      onChange={(e) => e.target.files?.[0] && uploadCreative(e.target.files[0])}
                      className="text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-voyia-blue file:text-white file:text-xs" />
                    {imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="mt-2 max-w-xs rounded border border-gray-700" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Texto principal <span className="text-xs text-gray-500">({message.length}/2200)</span></label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2200}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Título (40 chars)</label>
                      <input type="text" value={headline} maxLength={40} onChange={(e) => setHeadline(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Descrição (30 chars)</label>
                      <input type="text" value={description} maxLength={30} onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">URL de destino</label>
                      <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..."
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm" />
                      <p className="text-[10px] text-gray-500 mt-1">UTMs serão adicionadas automaticamente.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Botão de ação (CTA)</label>
                      <select value={cta} onChange={(e) => setCta(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm">
                        {CTAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">utm_campaign (opcional)</label>
                    <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder={name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm" />
                  </div>
                </div>
              )}

              {creativeMode === "boost" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Posts disponíveis pra impulsionar</label>
                  {boostablePosts.length === 0 ? (
                    <div className="text-xs text-gray-500 py-4 text-center">
                      Sem posts ainda. <button type="button" onClick={loadBoostable} className="text-voyia-blue hover:underline">Recarregar</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto p-2 bg-black/40 rounded">
                      {boostablePosts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setBoostPostId(p.id)}
                          className={`block bg-gray-800 rounded overflow-hidden border-2 ${boostPostId === p.id ? "border-voyia-blue" : "border-transparent"}`}
                        >
                          {p.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.thumbnail_url} alt="" className="w-full aspect-square object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full aspect-square bg-gray-700" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-2 border-t border-gray-800">
        <button
          type="button"
          onClick={() => step > 1 && setStep((s) => (s - 1) as typeof step)}
          disabled={step === 1 || pending}
          className="px-4 py-2.5 text-sm text-gray-300 hover:text-white disabled:opacity-30"
        >
          ← Voltar
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 bg-voyia-blue hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold"
          >
            Continuar →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending || uploading}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-bold"
          >
            {pending ? "Criando campanha…" : `Criar campanha (${status === "PAUSED" ? "pausada" : "ATIVA"})`}
          </button>
        )}
      </div>
    </div>
  );
}
