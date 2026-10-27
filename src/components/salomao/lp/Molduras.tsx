import Image, { type StaticImageData } from 'next/image'

/** Celular com a tela real do app (moldura em CSS, sem imagem extra). */
export function Celular({ src, alt, prioridade = false, className = '' }: { src: StaticImageData; alt: string; prioridade?: boolean; className?: string }) {
  return (
    <div className={`relative mx-auto w-[220px] shrink-0 rounded-[2.4rem] border-[7px] border-[#0f1626] bg-[#0f1626] shadow-[0_30px_60px_-20px_rgba(15,22,38,0.55)] sm:w-[250px] ${className}`}>
      <div className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#0f1626]" aria-hidden />
      <Image src={src} alt={alt} sizes="(max-width: 640px) 220px, 250px" placeholder="blur" priority={prioridade}
        className="h-auto w-full rounded-[1.9rem]" />
    </div>
  )
}

/** Tela de computador/TV com barra de endereço. */
export function Tela({ src, alt, endereco, prioridade = false, className = '' }: { src: StaticImageData; alt: string; endereco: string; prioridade?: boolean; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_30px_60px_-24px_rgba(15,22,38,0.45)] ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate rounded-md bg-white px-2 py-0.5 font-mono text-[11px] text-slate-500">{endereco}</span>
      </div>
      <Image src={src} alt={alt} sizes="(max-width: 768px) 100vw, 720px" placeholder="blur" priority={prioridade} className="h-auto w-full" />
    </div>
  )
}
