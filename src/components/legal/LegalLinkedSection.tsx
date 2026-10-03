// Seção de página legal com links embutidos (ex.: YouTube API Services).
// O conteúdo vem dos dicionários como parágrafos de segmentos: texto puro
// ou { label, href }. Links externos abrem em nova aba.
type Segment = string | { label: string; href: string }

type Props = {
  id: string
  heading: string
  paragraphs: Segment[][]
}

export default function LegalLinkedSection({ id, heading, paragraphs }: Props) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-white mt-8">
        <a href={`#${id}`} className="text-white no-underline hover:text-white">{heading}</a>
      </h2>
      {paragraphs.map((segments, i) => (
        <p key={i}>
          {segments.map((s, j) => {
            if (typeof s === 'string') return <span key={j}>{s}</span>
            const external = /^https?:\/\//.test(s.href)
            return (
              <a
                key={j}
                href={s.href}
                className="text-voyia-blue hover:text-purple-300 break-words"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {s.label}
              </a>
            )
          })}
        </p>
      ))}
    </section>
  )
}
