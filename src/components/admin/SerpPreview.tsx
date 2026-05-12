"use client";

interface Props {
  title: string;
  description: string;
  domain: string;
  slug: string;
}

export default function SerpPreview({ title, description, domain, slug }: Props) {
  const url = `https://${domain}/blog/${slug || "..."}`;
  const breadcrumb = url.replace(/^https?:\/\//, "").replace(/\//g, " › ");
  const displayTitle = (title || "Título do post").slice(0, 60);
  const displayDesc =
    description?.length > 0
      ? description.slice(0, 160) + (description.length > 160 ? "…" : "")
      : "A meta descrição aparecerá aqui. Escreva entre 120 e 160 caracteres para ocupar bem o espaço do snippet do Google.";

  return (
    <div className="bg-white text-gray-900 rounded-lg p-4 font-sans">
      <div className="flex items-center gap-2 text-xs text-gray-700 mb-1">
        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-[10px] font-bold">
          AW
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-gray-900">Agathas Web</span>
          <span className="text-[11px] text-gray-500">{breadcrumb}</span>
        </div>
      </div>
      <a href="#" className="block text-[20px] leading-snug text-[#1a0dab] hover:underline">
        {displayTitle}
      </a>
      <p className="text-[13px] text-gray-700 leading-snug mt-1">{displayDesc}</p>
    </div>
  );
}
