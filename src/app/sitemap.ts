import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getLocaleFromHost, getOriginForLocale } from "@/lib/i18n";

const STATIC_PATHS = [
  "",
  "/quem-somos",
  "/contato",
  "/blog",
  "/servicos",
  "/servicos/desenvolvimento",
  "/servicos/desenvolvimento-sites",
  "/servicos/moodle",
  "/servicos/trafego-pago",
  "/servicos/consultoria",
  "/produtos",
  "/produtos/hospedagem-moodle",
  "/produtos/hospedagem-gerenciada",
  "/produtos/voyia",
  "/produtos/sga",
  "/privacidade",
  "/termos",
  "/politica-cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host");
  const locale = getLocaleFromHost(host);
  const origin = getOriginForLocale(locale);
  const now = new Date();

  return STATIC_PATHS.map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1.0 : 0.7,
  }));
}
