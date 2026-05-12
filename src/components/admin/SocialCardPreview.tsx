"use client";

interface Props {
  variant: "facebook" | "twitter";
  cardType?: "summary" | "summary_large_image";
  title: string;
  description: string;
  image: string | null;
  domain: string;
}

export default function SocialCardPreview({
  variant,
  cardType = "summary_large_image",
  title,
  description,
  image,
  domain,
}: Props) {
  const displayTitle = title || "Título do post";
  const displayDesc = description || "Resumo / og:description do post";

  if (variant === "twitter" && cardType === "summary") {
    return (
      <div className="bg-black rounded-2xl border border-gray-800 overflow-hidden flex">
        {image ? (
          <img src={image} alt="" className="w-32 h-32 object-cover flex-shrink-0" />
        ) : (
          <div className="w-32 h-32 bg-gray-800 flex items-center justify-center text-gray-600 text-xs flex-shrink-0">
            sem imagem
          </div>
        )}
        <div className="p-3 flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1">{domain}</p>
          <p className="text-sm font-semibold text-white line-clamp-2">{displayTitle}</p>
          <p className="text-xs text-gray-400 line-clamp-2 mt-1">{displayDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 rounded-lg border border-gray-200 overflow-hidden">
      {image ? (
        <img src={image} alt="" className="w-full aspect-[1.91/1] object-cover bg-gray-100" />
      ) : (
        <div className="w-full aspect-[1.91/1] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          1200 × 630 — Sem imagem (og:image)
        </div>
      )}
      <div className="p-3 border-t border-gray-200">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{domain}</p>
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 mt-0.5">{displayTitle}</p>
        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{displayDesc}</p>
      </div>
    </div>
  );
}
