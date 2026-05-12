import "server-only";
import type { Locale } from "@/lib/i18n";

const dictionaries = {
  "pt-BR": () =>
    import("@/messages/pt-BR.json").then((mod) => mod.default),
  es: () => import("@/messages/es.json").then((mod) => mod.default),
  "en-US": () => import("@/messages/en-US.json").then((mod) => mod.default),
  "en-GB": () => import("@/messages/en-GB.json").then((mod) => mod.default),
} as const;

export type Dictionary = Awaited<ReturnType<typeof dictionaries["pt-BR"]>>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
