import Link from "next/link";
import { listAllTags } from "@/lib/db/taxonomy";
import TagsAdmin from "./TagsAdmin";

export const metadata = {
  title: "Tags | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function TagsPage() {
  const tags = listAllTags();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin"
        className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
      >
        ← Voltar ao Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Tags</h1>
      <p className="text-gray-400 mb-8">
        Tags são criadas automaticamente quando você digita novos termos no
        campo "Tags" ao criar um post. Aqui você pode renomear (clique e edite),
        apagar ou mesclar tags duplicadas.
      </p>

      <TagsAdmin initial={tags} />
    </div>
  );
}
