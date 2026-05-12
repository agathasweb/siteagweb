import Link from "next/link";
import { listAllCategories } from "@/lib/db/taxonomy";
import CategoriesAdmin from "./CategoriesAdmin";

export const metadata = {
  title: "Categorias | Painel Admin",
  robots: { index: false, follow: false },
};

export default async function CategoriasPage() {
  const categories = listAllCategories();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/admin"
        className="text-xs text-gray-400 hover:text-white inline-flex items-center mb-2"
      >
        ← Voltar ao Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Categorias</h1>
      <p className="text-gray-400 mb-8">
        Cada post pode pertencer a uma categoria. Categorias geram páginas de
        listagem, breadcrumbs com schema.org/BreadcrumbList e ajudam o Google a
        entender a estrutura do site. Recomendado: 3-8 categorias amplas.
      </p>

      <CategoriesAdmin initial={categories} />
    </div>
  );
}
