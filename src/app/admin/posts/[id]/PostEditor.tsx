"use client";

import { useMemo, useState, useTransition } from "react";
import {
  upsertTranslationAction,
  translateAction,
  type TranslateActionResult,
} from "../actions";
import type { Locale } from "@/lib/i18n";
import CharCounter from "@/components/admin/CharCounter";
import SerpPreview from "@/components/admin/SerpPreview";
import SocialCardPreview from "@/components/admin/SocialCardPreview";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ReadabilityPanel from "@/components/admin/ReadabilityPanel";
import SeoScorePanel from "@/components/admin/SeoScorePanel";
import Tooltip from "@/components/admin/Tooltip";

const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "🇧🇷 Português",
  es: "🇪🇸 Español",
  "en-US": "🇺🇸 English (US)",
  "en-GB": "🇬🇧 English (UK)",
};

const DOMAIN_BY_LOCALE: Record<string, string> = {
  "pt-BR": "agathas.com.br",
  es: "agathas.es",
  "en-US": "agathasweb.com",
  "en-GB": "uk.agathasweb.com",
};

const LOCALES: Locale[] = ["pt-BR", "es", "en-US", "en-GB"];

export interface TranslationData {
  title: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  twitter_card_type: string;
  focus_keyword: string;
  secondary_keywords: string;
  cover_image_alt: string;
  source: string;
  exists: boolean;
}

interface Props {
  postId: number;
  slug: string;
  sourceLocale: Locale;
  coverImage: string | null;
  categoryId: string;
  initial: Record<Locale, TranslationData>;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PostEditor({ postId, slug, sourceLocale, coverImage, categoryId, initial }: Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>(sourceLocale);
  const [data, setData] = useState<Record<Locale, TranslationData>>(initial);
  const [saving, startSaving] = useTransition();
  const [translating, startTranslating] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const current = data[activeLocale];
  const domain = DOMAIN_BY_LOCALE[activeLocale] ?? "agathas.com.br";

  function updateField<K extends keyof TranslationData>(key: K, value: TranslationData[K]) {
    setData((prev) => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale], [key]: value },
    }));
  }

  const focusOk = useMemo(() => {
    const kw = current.focus_keyword.trim().toLowerCase();
    if (!kw) return null;
    return {
      inTitle: current.title.toLowerCase().includes(kw),
      inSlug: slug.toLowerCase().includes(slugify(kw).split("-")[0]),
      inMetaDesc: current.meta_description.toLowerCase().includes(kw),
      inContent: current.content.toLowerCase().includes(kw),
      inFirstParagraph: current.content.slice(0, 400).toLowerCase().includes(kw),
    };
  }, [current.focus_keyword, current.title, current.meta_description, current.content, slug]);

  function handleSave() {
    setFeedback(null);
    startSaving(async () => {
      try {
        const form = new FormData();
        form.set("locale", activeLocale);
        form.set("title", current.title);
        form.set("excerpt", current.excerpt);
        form.set("content", current.content);
        form.set("meta_title", current.meta_title);
        form.set("meta_description", current.meta_description);
        form.set("og_title", current.og_title);
        form.set("og_description", current.og_description);
        form.set("twitter_card_type", current.twitter_card_type);
        form.set("focus_keyword", current.focus_keyword);
        form.set("secondary_keywords", current.secondary_keywords);
        form.set("cover_image_alt", current.cover_image_alt);
        await upsertTranslationAction(postId, form);
        setData((prev) => ({
          ...prev,
          [activeLocale]: { ...prev[activeLocale], exists: true, source: "manual" },
        }));
        setFeedback({ kind: "success", text: `Tradução em ${LOCALE_LABELS[activeLocale]} salva.` });
      } catch (err) {
        setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Erro ao salvar." });
      }
    });
  }

  function handleTranslate() {
    setFeedback(null);
    startTranslating(async () => {
      const result: TranslateActionResult = await translateAction(postId, activeLocale);
      if (!result.ok || !result.translation) {
        setFeedback({ kind: "error", text: result.error ?? "Falha ao traduzir." });
        return;
      }
      setData((prev) => ({
        ...prev,
        [activeLocale]: {
          ...prev[activeLocale],
          title: result.translation!.title,
          excerpt: result.translation!.excerpt ?? "",
          content: result.translation!.content_html,
          meta_title: result.translation!.meta_title ?? "",
          meta_description: result.translation!.meta_description ?? "",
          og_title: result.translation!.og_title ?? "",
          og_description: result.translation!.og_description ?? "",
          exists: true,
          source: "ai-gemini",
        },
      }));
      setFeedback({ kind: "success", text: `Tradução gerada em ${LOCALE_LABELS[activeLocale]}.` });
    });
  }

  const isSource = activeLocale === sourceLocale;
  const sourceData = data[sourceLocale];
  const canTranslate = !isSource && sourceData.exists && sourceData.title.trim().length > 0;

  const serpTitle = current.meta_title || current.title;
  const serpDesc = current.meta_description || current.excerpt;
  const socialTitle = current.og_title || current.meta_title || current.title;
  const socialDesc = current.og_description || current.meta_description || current.excerpt;

  return (
    <div className="space-y-6">
      {/* Abas de locale */}
      <div className="bg-voyia-gray rounded-2xl border border-gray-700 overflow-hidden">
        <nav className="flex flex-wrap border-b border-gray-700 bg-black/30">
          {LOCALES.map((locale) => {
            const isActive = locale === activeLocale;
            const item = data[locale];
            const isSrc = locale === sourceLocale;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
                  isActive ? "border-voyia-blue text-white" : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {LOCALE_LABELS[locale]}
                {isSrc && <span className="ml-2 text-xs px-1.5 py-0.5 bg-voyia-blue/30 text-voyia-blue rounded">origem</span>}
                {!isSrc && item.exists && item.source?.startsWith("ai-") && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-purple-900/40 text-purple-300 rounded">IA</span>
                )}
                {!isSrc && item.exists && item.source === "manual" && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-900/40 text-green-300 rounded">manual</span>
                )}
                {!isSrc && !item.exists && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded">vazio</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 space-y-6">
          {/* Botão de tradução IA */}
          {!isSource && (
            <div className="flex items-center justify-between bg-purple-900/10 border border-purple-500/30 rounded-lg p-4">
              <div>
                <p className="text-sm text-purple-200 font-medium">Traduzir automaticamente com Gemini</p>
                <p className="text-xs text-purple-300/70 mt-1">
                  Usa {LOCALE_LABELS[sourceLocale]} como origem e preenche todos os campos.
                </p>
              </div>
              <button
                type="button"
                disabled={!canTranslate || translating || saving}
                onClick={handleTranslate}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {translating ? "Traduzindo…" : "✨ Traduzir com IA"}
              </button>
            </div>
          )}

          {feedback && (
            <div className={`rounded-lg px-4 py-3 text-sm border ${
              feedback.kind === "success"
                ? "bg-green-900/30 border-green-500/40 text-green-200"
                : "bg-red-900/30 border-red-500/40 text-red-200"
            }`}>
              {feedback.text}
            </div>
          )}

          {/* 1. Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título (H1)
              <Tooltip text="Título principal. 30-60 chars ideal. Inclua a keyword principal." />
            </label>
            <input
              type="text"
              value={current.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
            <div className="flex justify-end mt-1">
              <CharCounter value={current.title} min={20} max={70} ideal={[40, 60]} />
            </div>
          </div>

          {/* 2. Resumo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resumo (excerpt)
              <Tooltip text="120-160 chars ideal. Usado em listagens e RSS." />
            </label>
            <textarea
              rows={3}
              value={current.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
            />
            <div className="flex justify-end mt-1">
              <CharCounter value={current.excerpt} min={80} max={200} ideal={[120, 160]} />
            </div>
          </div>

          {/* 3. Keyword principal */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Palavra-chave principal (focus keyword)
              <Tooltip text="Frase que você quer rankear. Deve aparecer no título, slug, meta description, primeiro parágrafo e pelo menos um H2." />
            </label>
            <input
              type="text"
              value={current.focus_keyword}
              onChange={(e) => updateField("focus_keyword", e.target.value)}
              placeholder="Ex.: hospedagem moodle"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
            {current.focus_keyword && focusOk && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                {[
                  { ok: focusOk.inTitle, label: "no título" },
                  { ok: focusOk.inSlug, label: "no slug" },
                  { ok: focusOk.inMetaDesc, label: "na meta desc" },
                  { ok: focusOk.inFirstParagraph, label: "no 1º parágrafo" },
                  { ok: focusOk.inContent, label: "no conteúdo" },
                ].map(({ ok, label }) => (
                  <span key={label} className={ok ? "text-green-300" : "text-yellow-300"}>
                    {ok ? "✓" : "○"} {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4. Keywords secundárias */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Keywords secundárias (LSI)
              <Tooltip text="Termos relacionados semanticamente. Separados por vírgula. Use 3-5 termos para cobrir variações de busca e reforçar contexto semântico." />
            </label>
            <input
              type="text"
              value={current.secondary_keywords}
              onChange={(e) => updateField("secondary_keywords", e.target.value)}
              placeholder="plataforma ead, lms moodle, servidor moodle"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
            />
            {current.secondary_keywords && (
              <p className="text-xs text-gray-400 mt-1">
                {current.secondary_keywords.split(",").filter((k) => k.trim()).length} keyword(s) secundária(s)
              </p>
            )}
          </div>

          {/* 5. Alt text da capa */}
          {coverImage && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Alt text da imagem de capa
                <Tooltip text="Descrição da capa com keyword. Obrigatório para acessibilidade e SEO de imagens." />
              </label>
              <input
                type="text"
                value={current.cover_image_alt}
                onChange={(e) => updateField("cover_image_alt", e.target.value)}
                placeholder="Descrição da imagem incluindo a keyword principal"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />
              <div className="flex justify-end mt-1">
                <CharCounter value={current.cover_image_alt} min={10} max={125} ideal={[40, 100]} />
              </div>
            </div>
          )}

          {/* 6. Conteúdo (WYSIWYG) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conteúdo
              <Tooltip text="Use H2 e H3 (não pule níveis). Inclua keyword no primeiro parágrafo e em pelo menos um H2." />
            </label>
            <RichTextEditor
              value={current.content}
              onChange={(val) => updateField("content", val)}
              postSlug={slug}
              placeholder="Comece com um parágrafo que responde à pergunta principal…"
            />
          </div>

          {/* 7. Score SEO */}
          <SeoScorePanel
            title={current.title}
            slug={slug}
            metaTitle={current.meta_title}
            metaDescription={current.meta_description}
            excerpt={current.excerpt}
            content={current.content}
            focusKeyword={current.focus_keyword}
            secondaryKeywords={current.secondary_keywords}
            coverImage={coverImage}
            coverImageAlt={current.cover_image_alt}
            categoryId={categoryId}
          />

          {/* 8. Legibilidade */}
          <ReadabilityPanel content={current.content} />

          {/* 9. SEO básico */}
          <div className="rounded-xl border border-gray-700 bg-black/20 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">SEO (meta tags)</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta título
                <Tooltip text="Título da aba/SERP. Ideal 40-60 chars. Vazio = usa H1." />
              </label>
              <input
                type="text"
                maxLength={80}
                value={current.meta_title}
                onChange={(e) => updateField("meta_title", e.target.value)}
                placeholder={current.title || "Deixe vazio para usar o H1"}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              />
              <div className="flex justify-end mt-1">
                <CharCounter value={current.meta_title} max={60} ideal={[40, 60]} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta description
                <Tooltip text="Resumo que aparece no Google. Não é ranking direto mas afeta muito o CTR. 120-160 chars." />
              </label>
              <textarea
                rows={3}
                maxLength={180}
                value={current.meta_description}
                onChange={(e) => updateField("meta_description", e.target.value)}
                placeholder="Descrição para o Google. 120-160 chars ideal."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent"
              />
              <div className="flex justify-end mt-1">
                <CharCounter value={current.meta_description} min={120} max={160} ideal={[140, 160]} />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Preview SERP</p>
              <SerpPreview title={serpTitle} description={serpDesc} domain={domain} slug={slug} />
            </div>
          </div>

          {/* 10. Social (OG + Twitter) */}
          <div className="rounded-xl border border-gray-700 bg-black/20 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Redes sociais (Open Graph + Twitter)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">og:title</label>
                <input
                  type="text"
                  maxLength={95}
                  value={current.og_title}
                  onChange={(e) => updateField("og_title", e.target.value)}
                  placeholder={current.meta_title || current.title || "Vazio = usa meta título"}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
                <div className="flex justify-end mt-1">
                  <CharCounter value={current.og_title} max={70} ideal={[40, 70]} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Twitter Card</label>
                <select
                  value={current.twitter_card_type}
                  onChange={(e) => updateField("twitter_card_type", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="summary_large_image">Imagem grande (recomendado)</option>
                  <option value="summary">Resumo compacto</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">og:description</label>
              <textarea
                rows={2}
                maxLength={250}
                value={current.og_description}
                onChange={(e) => updateField("og_description", e.target.value)}
                placeholder={current.meta_description || current.excerpt || "Vazio = usa meta description"}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />
              <div className="flex justify-end mt-1">
                <CharCounter value={current.og_description} max={200} ideal={[120, 200]} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Preview Facebook / WhatsApp</p>
                <SocialCardPreview
                  variant="facebook"
                  title={socialTitle}
                  description={socialDesc}
                  image={coverImage}
                  domain={domain}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Preview Twitter / X</p>
                <SocialCardPreview
                  variant="twitter"
                  cardType={current.twitter_card_type as "summary" | "summary_large_image"}
                  title={socialTitle}
                  description={socialDesc}
                  image={coverImage}
                  domain={domain}
                />
              </div>
            </div>
          </div>

          {/* Salvar */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={saving || translating}
              onClick={handleSave}
              className="bg-voyia-blue hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {saving ? "Salvando…" : `Salvar — ${LOCALE_LABELS[activeLocale]}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
