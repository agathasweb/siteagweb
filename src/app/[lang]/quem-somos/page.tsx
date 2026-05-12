import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getDictionary } from '../dictionaries'
import { isLocale, getOriginForLocale, buildHreflangAlternates } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/quem-somos'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const origin = getOriginForLocale(lang)
  return {
    title: dict.pages.quemSomos.metadata.title,
    description: dict.pages.quemSomos.metadata.description,
    alternates: {
      canonical: `${origin}/quem-somos`,
      languages: buildHreflangAlternates('/quem-somos'),
    },
  }
}

const TIMELINE_COLORS = ['bg-voyia-blue', 'bg-purple-600', 'bg-voyia-blue', 'bg-purple-600', 'bg-voyia-blue', 'bg-purple-600', 'bg-gradient-to-r from-voyia-blue to-purple-600']

export default async function QuemSomosPage({ params }: PageProps<'/[lang]/quem-somos'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const t = dict.pages.quemSomos
  const timeline = t.timeline.items.map((item, i) => ({ ...item, color: TIMELINE_COLORS[i] ?? 'bg-voyia-blue' }))
  const team = t.team.members
  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">{t.hero.titlePrefix} <span className="text-voyia-blue">{t.hero.titleHighlight}</span></h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.hero.lead}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {t.stats.map((stat) => (
              <div key={stat.label} className="bg-voyia-gray/50 border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-voyia-blue mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-voyia-blue/10 to-purple-900/10 border border-voyia-blue/30 rounded-2xl p-8 md:p-12">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                {t.story.paragraph1Before}<strong className="text-voyia-blue">{t.story.paragraph1Brand}</strong>{t.story.paragraph1Middle}<strong className="text-white">{t.story.paragraph1Date}</strong>{t.story.paragraph1After}
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                {t.story.paragraph2Before}<strong className="text-white">{t.story.paragraph2Emphasis}</strong>{t.story.paragraph2After}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-voyia-dark overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t.timeline.heading}</h2>
            <p className="text-lg text-gray-400">{t.timeline.subheading}</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-voyia-blue via-purple-500 to-voyia-blue/30 rounded-full" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div key={item.year} className="relative flex flex-col md:flex-row items-center justify-between group">
                  {i % 2 === 0 ? (
                    <>
                      <div className="w-full md:w-[45%] mb-8 md:mb-0 pr-0 md:pr-8 pl-16 md:pl-0 text-left md:text-right">
                        <div className={`rounded-xl p-6 border shadow-lg relative ${item.featured ? 'bg-gradient-to-r from-voyia-blue/20 to-purple-600/20 border-voyia-blue/50' : 'bg-voyia-gray border-gray-700 hover:border-voyia-blue/50'} transition-colors`}>
                          <span className={`md:hidden absolute -left-[42px] top-6 w-4 h-4 rounded-full ${item.color} border-2 border-voyia-dark ${item.featured ? 'animate-pulse' : ''}`} />
                          <h3 className={`text-xl font-bold mb-2 ${item.featured ? 'text-voyia-blue' : 'text-white'}`}>{item.title}</h3>
                          <p className="text-gray-300 text-sm">{item.desc}</p>
                        </div>
                      </div>
                      <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 ${item.featured ? 'w-14 h-14' : 'w-12 h-12'} ${item.color} rounded-full items-center justify-center text-white font-bold text-sm border-4 border-voyia-dark z-10 shadow-xl group-hover:scale-110 transition-transform ${item.featured ? 'animate-pulse text-xs' : ''}`}>{item.year}</div>
                      <div className="w-full md:w-[45%]" />
                    </>
                  ) : (
                    <>
                      <div className="w-full md:w-[45%] order-2 md:order-1" />
                      <div className={`hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 ${item.color} rounded-full items-center justify-center text-white font-bold text-sm border-4 border-voyia-dark z-10 shadow-xl group-hover:scale-110 transition-transform`}>{item.year}</div>
                      <div className="w-full md:w-[45%] order-1 md:order-2 mb-8 md:mb-0 pl-16 md:pl-8 text-left">
                        <div className="bg-voyia-gray rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-colors shadow-lg relative">
                          <span className={`md:hidden absolute -left-[42px] top-6 w-4 h-4 rounded-full ${item.color} border-2 border-voyia-dark`} />
                          <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                          <p className="text-gray-300 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cleverson */}
      <section className="py-24 sm:py-32 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Image src="/assets/team/Cleverson.webp" alt={t.founder.imageAlt} width={320} height={320} className="w-80 h-80 rounded-2xl object-cover border-4 border-voyia-blue shadow-2xl mx-auto lg:mx-0" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6"><span className="text-voyia-blue">{t.founder.nameHighlight}</span> {t.founder.nameRest}</h2>
              <div className="text-lg text-gray-300 space-y-6 text-justify">
                {t.founder.paragraphs.map((p, i) => (
                  <p key={i}>{p.before}<strong className={i === 1 ? 'text-voyia-blue' : 'text-white'}>{p.emphasis}</strong>{p.after}</p>
                ))}
                <div className="flex flex-wrap gap-3 mt-8">
                  {t.founder.tags.map((tag) => (
                    <span key={tag} className="bg-voyia-blue/20 text-voyia-blue px-3 py-1 rounded-full text-sm font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 sm:py-32 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.team.heading}</h2>
            <p className="mt-6 text-lg text-gray-300">{t.team.subheading}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="bg-voyia-gray rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(147,51,234,0.25)]">
                <div className="mb-6">
                  <Image src={member.image} alt={member.name} width={96} height={96} className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-voyia-blue" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                <p className="text-voyia-blue font-medium mb-2">{member.role}</p>
                <p className="text-gray-300 text-sm mb-3">{member.desc}</p>
                <a href={`mailto:${member.email}`} className="text-voyia-blue hover:text-purple-300 text-sm">{member.email}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
