import Image from "next/image";
import Link from "next/link";

const techIcons = {
  row1: [
    { title: "HTML5", path: "M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z", viewBox: "0 0 24 24" },
    { title: "JavaScript", path: "M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z", viewBox: "0 0 24 24" },
    { title: "React", path: "M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.866.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z", viewBox: "0 0 24 24" },
    { title: "Node.js", path: "M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.570,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.28-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z", viewBox: "0 0 24 24" },
    { title: "Tailwind CSS", path: "M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z", viewBox: "0 0 24 24" },
  ],
  row2: [
    { title: "Python", path: "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09-.33.22z", viewBox: "0 0 24 24" },
    { title: "Git", path: "M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.721.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187", viewBox: "0 0 24 24" },
    { title: "Docker", path: "M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z", viewBox: "0 0 24 24" },
    { title: "WordPress", path: "M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.135-2.85-.135-.584-.03-.661.854-.078.884 0 0 .541.105 1.123.105l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.692-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.395-2.326.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0", viewBox: "0 0 24 24" },
  ],
};

type Locale = "pt-BR" | "es" | "en-US" | "en-GB";

type FooterLabels = {
  tagline: string;
  company: string;
  services: string;
  products: string;
  blog: string;
  copyright: string;
  links: {
    home: string;
    about: string;
    privacy: string;
    terms: string;
    cookies: string;
    moodlePlatform: string;
    paidTraffic: string;
    development: string;
    consulting: string;
    moodleHosting: string;
    managedHosting: string;
    sga: string;
    voyia: string;
    allPosts: string;
    moodleEad: string;
    digitalMarketing: string;
    devCategory: string;
  };
};

const LABELS: Record<Locale, FooterLabels> = {
  "pt-BR": {
    tagline: "Há mais de 15 anos desenvolvendo soluções inteligentes.",
    company: "Empresa",
    services: "Serviços",
    products: "Produtos",
    blog: "Blog",
    copyright: "Todos os direitos reservados.",
    links: {
      home: "Página Inicial",
      about: "Quem Somos",
      privacy: "Privacidade",
      terms: "Termos",
      cookies: "Cookies",
      moodlePlatform: "Plataforma Moodle",
      paidTraffic: "Tráfego Pago",
      development: "Desenvolvimento",
      consulting: "Consultoria",
      moodleHosting: "Hospedagem Moodle",
      managedHosting: "Hospedagem Gerenciada",
      sga: "SGA",
      voyia: "Voyia",
      allPosts: "Todos os Posts",
      moodleEad: "Moodle & EAD",
      digitalMarketing: "Marketing Digital",
      devCategory: "Desenvolvimento",
    },
  },
  es: {
    tagline: "Más de 15 años desarrollando soluciones inteligentes.",
    company: "Empresa",
    services: "Servicios",
    products: "Productos",
    blog: "Blog",
    copyright: "Todos los derechos reservados.",
    links: {
      home: "Inicio",
      about: "Quiénes Somos",
      privacy: "Privacidad",
      terms: "Términos",
      cookies: "Cookies",
      moodlePlatform: "Plataforma Moodle",
      paidTraffic: "Tráfico de Pago",
      development: "Desarrollo",
      consulting: "Consultoría",
      moodleHosting: "Alojamiento Moodle",
      managedHosting: "Alojamiento Gestionado",
      sga: "SGA",
      voyia: "Voyia",
      allPosts: "Todos los Posts",
      moodleEad: "Moodle & EAD",
      digitalMarketing: "Marketing Digital",
      devCategory: "Desarrollo",
    },
  },
  "en-US": {
    tagline: "Over 15 years developing intelligent solutions.",
    company: "Company",
    services: "Services",
    products: "Products",
    blog: "Blog",
    copyright: "All rights reserved.",
    links: {
      home: "Home",
      about: "About Us",
      privacy: "Privacy",
      terms: "Terms",
      cookies: "Cookies",
      moodlePlatform: "Moodle Platform",
      paidTraffic: "Paid Traffic",
      development: "Development",
      consulting: "Consulting",
      moodleHosting: "Moodle Hosting",
      managedHosting: "Managed Hosting",
      sga: "SGA",
      voyia: "Voyia",
      allPosts: "All Posts",
      moodleEad: "Moodle & E-Learning",
      digitalMarketing: "Digital Marketing",
      devCategory: "Development",
    },
  },
  "en-GB": {
    tagline: "Over 15 years developing intelligent solutions.",
    company: "Company",
    services: "Services",
    products: "Products",
    blog: "Blog",
    copyright: "All rights reserved.",
    links: {
      home: "Home",
      about: "About Us",
      privacy: "Privacy",
      terms: "Terms",
      cookies: "Cookies",
      moodlePlatform: "Moodle Platform",
      paidTraffic: "Paid Traffic",
      development: "Development",
      consulting: "Consultancy",
      moodleHosting: "Moodle Hosting",
      managedHosting: "Managed Hosting",
      sga: "SGA",
      voyia: "Voyia",
      allPosts: "All Posts",
      moodleEad: "Moodle & E-Learning",
      digitalMarketing: "Digital Marketing",
      devCategory: "Development",
    },
  },
};

export default function Footer({
  locale,
}: {
  locale: Locale;
  dict?: unknown;
}) {
  const t = LABELS[locale];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-voyia-gray" role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 text-center lg:text-left">
          <div className="lg:col-span-3">
            <picture>
              <source srcSet="/assets/logo_white.webp" type="image/webp" />
              <Image
                src="/assets/logo_white.png"
                alt="Agathas Web"
                width={250}
                height={63}
                className="h-12 w-auto mb-4 mx-auto lg:mx-0"
                loading="lazy"
              />
            </picture>
            <p className="mt-4 text-gray-300">{t.tagline}</p>
            <div className="mt-6">
              <div className="flex space-x-4 mb-4 justify-center lg:justify-start">
                {techIcons.row1.map((icon) => (
                  <span
                    key={icon.title}
                    className="text-gray-400 hover:text-voyia-blue transition-colors cursor-default"
                    title={icon.title}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox={icon.viewBox}>
                      <path d={icon.path} />
                    </svg>
                  </span>
                ))}
              </div>
              <div className="flex space-x-4 justify-center lg:justify-start">
                {techIcons.row2.map((icon) => (
                  <span
                    key={icon.title}
                    className="text-gray-400 hover:text-voyia-blue transition-colors cursor-default"
                    title={icon.title}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox={icon.viewBox}>
                      <path d={icon.path} />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-4">{t.company}</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">{t.links.home}</Link></li>
              <li><Link href="/quem-somos" className="text-gray-300 hover:text-white transition-colors">{t.links.about}</Link></li>
              <li><Link href="/privacidade" className="text-gray-300 hover:text-white transition-colors">{t.links.privacy}</Link></li>
              <li><Link href="/termos" className="text-gray-300 hover:text-white transition-colors">{t.links.terms}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-4">{t.services}</h3>
            <ul className="space-y-3">
              <li><Link href="/servicos/moodle" className="text-gray-300 hover:text-white transition-colors">{t.links.moodlePlatform}</Link></li>
              <li><Link href="/servicos/trafego-pago" className="text-gray-300 hover:text-white transition-colors">{t.links.paidTraffic}</Link></li>
              <li><Link href="/servicos/desenvolvimento" className="text-gray-300 hover:text-white transition-colors">{t.links.development}</Link></li>
              <li><Link href="/servicos/consultoria" className="text-gray-300 hover:text-white transition-colors">{t.links.consulting}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-4">{t.products}</h3>
            <ul className="space-y-3">
              <li><Link href="/produtos/hospedagem-moodle" className="text-gray-300 hover:text-white transition-colors">{t.links.moodleHosting}</Link></li>
              <li><Link href="/produtos/hospedagem-gerenciada" className="text-gray-300 hover:text-white transition-colors">{t.links.managedHosting}</Link></li>
              <li><Link href="/produtos/sga" className="text-gray-300 hover:text-white transition-colors">{t.links.sga}</Link></li>
              <li><Link href="/produtos/voyia" className="text-gray-300 hover:text-white transition-colors">{t.links.voyia}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold mb-4">{t.blog}</h3>
            <ul className="space-y-3">
              <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors">{t.links.allPosts}</Link></li>
              <li><Link href="/blog?categoria=moodle-ead" className="text-gray-300 hover:text-white transition-colors">{t.links.moodleEad}</Link></li>
              <li><Link href="/blog?categoria=marketing-digital" className="text-gray-300 hover:text-white transition-colors">{t.links.digitalMarketing}</Link></li>
              <li><Link href="/blog?categoria=desenvolvimento" className="text-gray-300 hover:text-white transition-colors">{t.links.devCategory}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-center lg:text-left">
            <p className="text-gray-300">
              © {currentYear} Agathas Web. {t.copyright}
            </p>
            <div className="mt-4 flex space-x-6 lg:mt-0 justify-center lg:justify-start">
              <Link href="/privacidade" className="text-gray-300 hover:text-white transition-colors">{t.links.privacy}</Link>
              <Link href="/termos" className="text-gray-300 hover:text-white transition-colors">{t.links.terms}</Link>
              <Link href="/politica-cookies" className="text-gray-300 hover:text-white transition-colors">{t.links.cookies}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
