import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TypewriterText from "@/components/ui/TypewriterText";

export const metadata: Metadata = {
  title: "Agathas Web Brasil - Soluções Digitais Inteligentes | Desenvolvimento Web, Moodle e Tráfego Pago",
  description: "Transforme seu negócio brasileiro com soluções digitais inteligentes da Agathas Web. Especialistas em desenvolvimento web, plataformas Moodle EAD, tráfego pago e consultoria digital.",
};

const clientLogos = [
  { src: "/assets/clients/01.webp", alt: "Iejur", width: 250, height: 100 },
  { src: "/assets/clients/02.webp", alt: "Bustech", width: 250, height: 100 },
  { src: "/assets/clients/03.webp", alt: "Hifa", width: 250, height: 100 },
  { src: "/assets/clients/04.webp", alt: "Olivercossmet", width: 92, height: 100 },
  { src: "/assets/clients/05.webp", alt: "HIFA", width: 300, height: 100 },
  { src: "/assets/clients/06.webp", alt: "iPos", width: 242, height: 100 },
  { src: "/assets/clients/07.webp", alt: "Fluvitta", width: 212, height: 100 },
  { src: "/assets/clients/08.webp", alt: "IAD", width: 106, height: 97 },
  { src: "/assets/clients/09.webp", alt: "Campos Estabile", width: 400, height: 100 },
  { src: "/assets/clients/10.webp", alt: "MJ", width: 122, height: 100 },
  { src: "/assets/clients/11.webp", alt: "Techlemos", width: 212, height: 100 },
  { src: "/assets/clients/12.webp", alt: "D7", width: 122, height: 100 },
];

const services = [
  {
    title: "Desenvolvimento",
    description: "Sistemas personalizados, aplicativos mobile e soluções web modernas para sua empresa.",
    href: "/servicos/desenvolvimento",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    delay: "0s",
  },
  {
    title: "Moodle",
    description: "Certificação Internacional em Desenvolvimento Moodle. Personalização e sustentação de AVA.",
    href: "/servicos/moodle",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.247 18 17.5 18c-1.746 0-3.332.477-4.5 1.253",
    delay: "0.2s",
  },
  {
    title: "Tráfego Pago",
    description: "Soluções para gestão autônoma e consultoria especializada em tráfego pago.",
    href: "/servicos/trafego-pago",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    delay: "0.4s",
  },
  {
    title: "Consultoria",
    description: "Acompanhamento personalizado para TI e infraestrutura de Web para sistemas empresariais.",
    href: "/servicos/consultoria",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    delay: "0.6s",
  },
];

const products = [
  {
    title: "Hospedagem Moodle",
    description: "Hospedagem especializada e otimizada exclusivamente para plataformas Moodle.",
    href: "/produtos/hospedagem-moodle",
    image: "/assets/Moodle.webp",
    imageAlt: "Moodle",
    imageWidth: 452,
    imageHeight: 356,
  },
  {
    title: "Hospedagem Gerenciada",
    description: "Hospedagem otimizada e segura para sites, sistemas e plataformas educacionais.",
    href: "/produtos/hospedagem-gerenciada",
    image: "/assets/cloud.webp",
    imageAlt: "Cloud Hosting",
    imageWidth: 512,
    imageHeight: 459,
  },
  {
    title: "Voyia",
    description: "Sistema de Gerenciamento de API Oficial do Whatsapp Cloud API para empresas.",
    href: "/produtos/voyia",
    image: "/assets/voyia.webp",
    imageAlt: "Voyia",
    imageWidth: 501,
    imageHeight: 126,
    imageStyle: { width: "200px", height: "auto" },
  },
  {
    title: "SGA",
    description: "Sistema de Gestão de Alunos para plataformas Moodle com automação e relatórios inteligentes.",
    href: "/produtos/sga",
    image: "/assets/logo_sga.webp",
    imageAlt: "SGA",
    imageWidth: 300,
    imageHeight: 100,
    imageStyle: { width: "200px", height: "auto" },
  },
];

const team = [
  {
    name: "Cleverson Gouvêa",
    role: "CTO & Fundador",
    subtitle: "Growth Developer & Full Stack Marketing Developer",
    email: "webmaster@agathas.com.br",
    image: "/assets/team/Cleverson.webp",
  },
  {
    name: "Matheus Santos",
    role: "Especialista em Designer",
    subtitle: "Brand & Graphic Designer",
    email: "designer@agathasweb.com",
    image: "/assets/team/Matheus.webp",
  },
  {
    name: "Pollyanne Gouvêa",
    role: "Especialista em Redes Sociais",
    subtitle: "Social Media Manager & Content Creator",
    email: "pollyanne@agathas.com.br",
    image: "/assets/team/Pollyanne.webp",
  },
];

export default function HomePage() {
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Agathas Web Brasil",
            alternateName: "Agathas Web",
            description: "Soluções digitais inteligentes para empresas brasileiras",
            url: "https://agathasweb.com.br",
            logo: { "@type": "ImageObject", url: "https://agathasweb.com.br/assets/logo_white.png", width: 250, height: 60 },
            foundingDate: "2020",
            areaServed: { "@type": "Country", name: "Brasil" },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", reviewCount: "17", bestRating: "5", worstRating: "1" },
            sameAs: ["https://linkedin.com/company/agathasweb", "https://instagram.com/agathasweb", "https://facebook.com/agathasweb"],
          }),
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black">
        <div className="relative mx-auto max-w-7xl px-6 pt-4 pb-24 sm:py-32 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            {/* Vídeo Cubo 3D */}
            <div className="relative mb-0 lg:mb-0 animate-slide-up z-10 order-first lg:order-last flex-shrink-0">
              <div className="relative w-full max-w-lg mx-auto lg:mx-0 z-10 bg-black rounded-3xl p-8">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto animate-float relative z-10"
                >
                  <source src="/assets/cube.mp4" type="video/mp4" />
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              </div>
            </div>

            {/* Conteúdo de Texto */}
            <div className="text-center lg:text-left flex-1 relative z-[9999]">
              <h1 className="font-bold tracking-tight text-white animate-slide-up mobile-h1-size">
                Soluções Inteligentes
                <br />
                <span className="text-white">para </span>
                <TypewriterText />
              </h1>
              <p className="mx-auto lg:mx-0 mt-6 max-w-3xl text-lg text-gray-300 sm:text-xl animate-slide-up">
                Há mais de 15 anos desenvolvendo soluções tecnológicas
                <br />
                inteligentes para o mercado digital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Logos Section */}
      <section className="py-20 bg-voyia-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center" style={{ marginBottom: "72px" }}>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nossos Clientes
            </h2>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex animate-carousel-scroll" style={{ gap: "20px" }}>
              {/* Duas sequências para efeito infinito */}
              {[0, 1].map((loop) =>
                clientLogos.map((logo, idx) => (
                  <img
                    key={`${loop}-${idx}`}
                    src={logo.src}
                    alt={logo.alt}
                    className="client-logo"
                    width={logo.width}
                    height={logo.height}
                    loading="lazy"
                    decoding="async"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 sm:py-32 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
              Excelência em cada linha de código
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Desde <strong className="text-voyia-blue">2009</strong>, construímos
              soluções digitais que transcendem expectativas. Mais de{" "}
              <strong className="text-white">500 projetos</strong> entregues. Mais de{" "}
              <strong className="text-white">15 anos</strong> de expertise consolidada.
            </p>
            <p className="text-lg text-gray-400 mt-6 max-w-2xl mx-auto">
              Trabalhamos com tecnologias de ponta para empresas que pensam grande.
            </p>
          </div>

          {/* Team Section */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {team.map((member) => (
                <div key={member.name} className="feature-card bg-voyia-gray rounded-2xl p-8 text-center">
                  <div className="mb-6">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-voyia-blue"
                      style={{ aspectRatio: "1/1" }}
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                  <p className="text-voyia-blue font-medium mb-2">{member.role}</p>
                  <p className="text-gray-300 text-sm mb-3">{member.subtitle}</p>
                  <a href={`mailto:${member.email}`} className="text-voyia-blue hover:text-purple-300 text-sm">
                    {member.email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 sm:py-32 bg-voyia-dark" id="servicos">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nossos Serviços
            </h2>
            <p className="mt-6 text-lg text-gray-300">
              Soluções completas para impulsionar seu negócio no mundo digital
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div key={service.title} className="feature-card bg-voyia-gray rounded-2xl p-8 text-center">
                <div className="mb-6">
                  <div
                    className="w-16 h-16 bg-voyia-blue rounded-lg flex items-center justify-center mx-auto animate-float"
                    style={{ animationDelay: service.delay }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon} />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{service.title}</h3>
                <p className="text-gray-300 mb-6">{service.description}</p>
                <Link
                  href={service.href}
                  className="inline-block bg-voyia-blue hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Saiba mais
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24 sm:py-32 bg-black" id="produtos">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nossos Produtos
            </h2>
            <p className="mt-6 text-lg text-gray-300">
              Soluções prontas e inovadoras para acelerar seu negócio
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.title} className="feature-card bg-voyia-gray rounded-2xl p-4 text-center">
                <div className="mb-6">
                  <div className="w-24 h-24 rounded-lg flex items-center justify-center mx-auto">
                    <Image
                      src={product.image}
                      alt={product.imageAlt}
                      width={product.imageWidth}
                      height={product.imageHeight}
                      className="w-20 h-auto object-contain"
                      style={product.imageStyle}
                      loading="lazy"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{product.title}</h3>
                <p className="text-gray-300 mb-6">{product.description}</p>
                <Link
                  href={product.href}
                  className="inline-block bg-voyia-blue hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Saiba mais
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="reviews-section" className="py-24 sm:py-32 bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Nossas Avaliações
            </h2>
            <a
              href="https://maps.app.goo.gl/YhjGwaBvR3sdGy7r9"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="mt-6 cursor-pointer transition-all duration-300 hover:scale-105">
                <p className="text-lg text-gray-300 mb-4 hover:text-voyia-blue transition-colors">
                  Somos 5 estrelas nas avaliações do Google!
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xl font-semibold text-white">5.0</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 hover:text-gray-400 transition-colors">
                  17 Avaliações no Google
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
