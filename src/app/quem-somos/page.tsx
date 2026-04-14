import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Quem Somos - Agathas Web | Nossa História e Equipe',
  description: 'Conheça a história da Agathas Web, fundada em 2008 por Cleverson Gouvêa. Mais de 15 anos desenvolvendo soluções digitais inteligentes para empresas no Brasil e exterior.',
  alternates: { canonical: 'https://agathasweb.com.br/quem-somos' }
}

const timeline = [
  { year: '2008', title: 'Fundação', desc: 'Nasce a Agathas Web, com foco em soluções tecnológicas personalizadas para pequenas e médias empresas.', color: 'bg-voyia-blue' },
  { year: '2010', title: 'Sistema de Nutrição Parenteral', desc: 'Desenvolvemos um sistema pioneiro para hospitais, com filtros de segurança específicos da área médica.', color: 'bg-purple-600' },
  { year: '2014', title: 'Especialização em Moodle', desc: 'Início da atuação como especialistas em plataformas Moodle, atendendo instituições educacionais.', color: 'bg-voyia-blue' },
  { year: '2018', title: '10 Anos & Expansão Internacional', desc: 'Comemoramos uma década e iniciamos operações internacionais atendendo clientes no Reino Unido e EUA.', color: 'bg-purple-600' },
  { year: '2020', title: 'Era do EAD', desc: 'Com a pandemia, multiplicamos nosso impacto apoiando centenas de instituições na transição para o ensino online.', color: 'bg-voyia-blue' },
  { year: '2023', title: 'Voyia & SGA', desc: 'Lançamento dos produtos Voyia (WhatsApp Business API) e SGA (Sistema de Gestão de Alunos).', color: 'bg-purple-600' },
  { year: '✨', title: 'Hoje', desc: 'Continuamos crescendo e inovando, com foco em IA, automação e soluções educacionais de última geração.', color: 'bg-gradient-to-r from-voyia-blue to-purple-600', featured: true }
]

const team = [
  { name: 'Cleverson Gouvêa', role: 'CTO & Fundador', desc: 'Growth Developer & Full Stack Marketing Developer', email: 'webmaster@agathas.com.br', image: '/assets/team/Cleverson.webp' },
  { name: 'Matheus Santos', role: 'Especialista em Designer', desc: 'Brand & Graphic Designer', email: 'designer@agathasweb.com', image: '/assets/team/Matheus.webp' },
  { name: 'Pollyanne Gouvêa', role: 'Especialista em Redes Sociais', desc: 'Social Media Manager & Content Creator', email: 'pollyanne@agathas.com.br', image: '/assets/team/Pollyanne.webp' }
]

export default function QuemSomosPage() {
  return (
    <main id="main-content" role="main">
      {/* Hero */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">Nossa <span className="text-voyia-blue">História</span></h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Mais de 15 anos transformando negócios através da tecnologia</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { value: '2008', label: 'Fundação' },
              { value: '500+', label: 'Projetos Realizados' },
              { value: '100%', label: 'Clientes Satisfeitos' },
              { value: '+100', label: 'Clientes Atendidos' }
            ].map((stat) => (
              <div key={stat.label} className="bg-voyia-gray/50 border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-voyia-blue mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-voyia-blue/10 to-purple-900/10 border border-voyia-blue/30 rounded-2xl p-8 md:p-12">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                A <strong className="text-voyia-blue">Agathas Web</strong> foi fundada em <strong className="text-white">dezembro de 2008</strong>, carregando no nome a homenagem à filha primogênita de seu fundador. Nossa jornada começou após uma experiência profissional bem-sucedida na gestão do setor de TI de uma farmácia de manipulação com 8 lojas espalhadas pela região da Grande Vitória.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Foi nesse ambiente desafiador que percebemos a necessidade de criar uma empresa de tecnologia especializada em atender empresas que buscavam <strong className="text-white">qualidade e inovação</strong>. Assim nasceu a Agathas Web, tendo como primeiro cliente justamente a empresa onde nosso fundador havia trabalhado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-voyia-dark overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">Nossa Trajetória</h2>
            <p className="text-lg text-gray-400">Marcos importantes da nossa evolução</p>
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
              <Image src="/assets/team/Cleverson.webp" alt="Cleverson Gouvêa - CTO e Fundador" width={320} height={320} className="w-80 h-80 rounded-2xl object-cover border-4 border-voyia-blue shadow-2xl mx-auto lg:mx-0" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6"><span className="text-voyia-blue">Cleverson</span> Gouvêa</h2>
              <div className="text-lg text-gray-300 space-y-6 text-justify">
                <p><strong className="text-white">Desenvolvedor Full Stack</strong> com mais de 15 anos de experiência, formado em Análise e Desenvolvimento de Sistemas. Fundou a Agathas Web em 2008 e desde então atua como CTO em diversas empresas educacionais no Brasil e no exterior.</p>
                <p>Possui <strong className="text-voyia-blue">certificação internacional em desenvolvimento Moodle</strong>, sendo reconhecido como especialista em plataformas educacionais. Sua expertise inclui gestão de infraestruturas web e clouds como AWS e Google Cloud Platform.</p>
                <p>Além de suas habilidades técnicas, Cleverson também é especialista em <strong className="text-white">gestão de tráfego pago e tecnologias mobile reativas</strong>, garantindo soluções completas e integradas para nossos clientes.</p>
                <div className="flex flex-wrap gap-3 mt-8">
                  {['Full Stack Developer', 'Moodle Certified', 'Cloud Expert', 'Tráfego Pago'].map((tag) => (
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
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Nossa Equipe</h2>
            <p className="mt-6 text-lg text-gray-300">Profissionais especializados trabalhando juntos para criar soluções excepcionais</p>
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
