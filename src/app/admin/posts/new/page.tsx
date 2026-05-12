import Link from "next/link";
import { listCategories } from "@/lib/db/taxonomy";
import NewPostForm from "./NewPostForm";

export const metadata = {
  title: "Novo post | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const categories = listCategories("pt-BR");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin/posts"
        className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
      >
        ← Voltar para Posts
      </Link>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Novo post</h1>
          <p className="text-gray-400 max-w-2xl">
            Escreva o post completo no idioma de origem com todos os sinais
            de SEO. Quando salvar, você terá a tela de edição com as 4 abas de
            idioma e o botão de tradução automática com IA.
          </p>
        </div>
        <div className="hidden md:block text-right text-xs text-gray-500 bg-black/20 rounded-lg p-3 border border-gray-700">
          <p className="font-semibold text-gray-300 mb-1">📋 Checklist SEO 2026</p>
          <ul className="space-y-0.5">
            <li>✓ Título 40-60 chars</li>
            <li>✓ Meta description 120-160</li>
            <li>✓ Imagem 1200×630 (alt!)</li>
            <li>✓ Focus keyword no H1, slug e content</li>
            <li>✓ Schema BlogPosting + Breadcrumbs</li>
            <li>✓ Open Graph + Twitter card</li>
            <li>✓ FAQ schema (próximo passo)</li>
          </ul>
        </div>
      </div>

      <NewPostForm categories={categories} />
    </div>
  );
}
