"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const languageLinks = [
  {
    code: "pt-br",
    label: "Português (Brasil)",
    short: "BR",
    flag: "🇧🇷",
    href: "https://agathasweb.com.br",
  },
  {
    code: "es-es",
    label: "Español (España)",
    short: "ES",
    flag: "🇪🇸",
    href: "https://agathas.es",
  },
  {
    code: "en-us",
    label: "English (USA)",
    short: "US",
    flag: "🇺🇸",
    href: "https://agathasweb.com",
  },
  {
    code: "en-gb",
    label: "English (UK)",
    short: "UK",
    flag: "🇬🇧",
    href: "https://uk.agathasweb.com",
  },
];

const currentLanguage = "pt-br";

const servicesMenu = [
  { href: "/servicos/desenvolvimento", label: "Desenvolvimento Web" },
  { href: "/servicos/desenvolvimento-sites", label: "Desenvolvimento de Sites" },
  { href: "/servicos/moodle", label: "Moodle (LMS)" },
  { href: "/servicos/trafego-pago", label: "Tráfego Pago" },
  { href: "/servicos/consultoria", label: "Consultoria TI" },
];

const productsMenu = [
  { href: "/produtos/hospedagem-moodle", label: "Hospedagem Moodle" },
  { href: "/produtos/hospedagem-gerenciada", label: "Hospedagem Gerenciada" },
  { href: "/produtos/voyia", label: "Voyia" },
  { href: "/produtos/sga", label: "SGA" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [langDesktopOpen, setLangDesktopOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);

  const langDesktopRef = useRef<HTMLDivElement>(null);
  const activeLanguage = languageLinks.find((l) => l.code === currentLanguage)!;

  // Fechar dropdown desktop ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langDesktopRef.current &&
        !langDesktopRef.current.contains(event.target as Node)
      ) {
        setLangDesktopOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative z-[20000] bg-[#0A0A0A]" role="banner">
      <nav
        className="mx-auto max-w-7xl px-6 lg:px-8"
        aria-label="Navegação principal"
      >
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" aria-label="Agathas Web - Página Inicial">
                <picture>
                  <source srcSet="/assets/logo_white.webp" type="image/webp" />
                  <Image
                    src="/assets/logo_white.png"
                    alt="Agathas Web"
                    width={250}
                    height={63}
                    className="h-8 lg:h-10 w-auto"
                    style={{ maxHeight: "2.5rem" }}
                    priority
                  />
                </picture>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Menu Desktop */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors font-bold"
                >
                  Página Inicial
                </Link>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors font-bold"
                >
                  Blog
                </Link>

                {/* Dropdown Serviços */}
                <div className="relative group">
                  <button className="text-gray-300 hover:text-white transition-colors font-bold flex items-center gap-1">
                    Serviços
                    <svg
                      className="w-4 h-4 transition-transform group-hover:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-voyia-gray rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-600">
                    <div className="py-2">
                      {servicesMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-600 my-1" />
                      <Link
                        href="/servicos"
                        className="block px-4 py-2 text-voyia-blue hover:text-purple-400 font-semibold transition-colors"
                      >
                        Ver todos os serviços →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Dropdown Produtos */}
                <div className="relative group">
                  <button className="text-gray-300 hover:text-white transition-colors font-bold flex items-center gap-1">
                    Produtos
                    <svg
                      className="w-4 h-4 transition-transform group-hover:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-voyia-gray rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border border-gray-600">
                    <div className="py-2">
                      {productsMenu.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-600 my-1" />
                      <Link
                        href="/produtos"
                        className="block px-4 py-2 text-voyia-blue hover:text-purple-400 font-semibold transition-colors"
                      >
                        Ver todos os produtos →
                      </Link>
                    </div>
                  </div>
                </div>

                <Link
                  href="/quem-somos"
                  className="text-gray-300 hover:text-white transition-colors font-bold"
                >
                  Quem Somos
                </Link>
                <Link
                  href="/contato"
                  className="text-gray-300 hover:text-white transition-colors font-bold"
                >
                  Contato
                </Link>
              </div>
            </div>

            {/* Seletor de idioma - Desktop */}
            <div className="relative hidden md:block" ref={langDesktopRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-gray-700 px-3 py-2 text-sm font-semibold uppercase text-gray-200 transition-colors hover:border-voyia-blue hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-voyia-blue"
                onClick={() => setLangDesktopOpen(!langDesktopOpen)}
                aria-haspopup="true"
                aria-expanded={langDesktopOpen}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {activeLanguage.flag}
                </span>
                <span>{activeLanguage.short}</span>
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {langDesktopOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-700 bg-[#111111]/95 p-2 shadow-2xl backdrop-blur"
                  role="menu"
                >
                  {languageLinks.map((lang) => {
                    const isActive = lang.code === currentLanguage;
                    return (
                      <a
                        key={lang.code}
                        href={lang.href}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-voyia-blue/20 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                        role="menuitem"
                        {...(isActive ? { "aria-current": "page" as const } : {})}
                      >
                        <span className="flex items-center gap-2">
                          <span aria-hidden="true" className="text-lg leading-none">
                            {lang.flag}
                          </span>
                          <span className="font-semibold uppercase">
                            {lang.short}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400 hidden lg:inline">
                          {lang.label}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seletor de idioma - Mobile */}
            <button
              type="button"
              className="md:hidden flex items-center gap-2 rounded-full border border-gray-700 px-3 py-2 text-xs font-semibold uppercase text-gray-200 transition-colors hover:border-voyia-blue hover:text-white"
              onClick={() => setLangModalOpen(true)}
              aria-haspopup="dialog"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {activeLanguage.flag}
              </span>
              <span>{activeLanguage.short}</span>
            </button>

            {/* Botão Hamburger Mobile */}
            <div className="md:hidden">
              <button
                id="mobile-menu-button"
                className="text-gray-300 hover:text-white transition-colors p-2"
                aria-label="Abrir menu de navegação"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      mobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden bg-voyia-gray rounded-lg mt-2 border border-gray-600 shadow-xl"
            aria-label="Menu de navegação mobile"
          >
            <div className="px-4 py-2 space-y-1">
              <Link
                href="/"
                className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Página Inicial
              </Link>
              <Link
                href="/blog"
                className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>

              {/* Serviços móvel */}
              <div className="relative">
                <button
                  className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors flex items-center justify-between"
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                >
                  Serviços
                  <svg
                    className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {mobileServicesOpen && (
                  <div className="bg-gray-700 rounded mt-1 ml-4">
                    {servicesMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block text-gray-300 hover:text-white hover:bg-gray-600 px-3 py-2 rounded transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-600 my-1 mx-3" />
                    <Link
                      href="/servicos"
                      className="block text-voyia-blue hover:text-purple-400 px-3 py-2 rounded transition-colors font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Ver todos →
                    </Link>
                  </div>
                )}
              </div>

              {/* Produtos móvel */}
              <div className="relative">
                <button
                  className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors flex items-center justify-between"
                  onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                >
                  Produtos
                  <svg
                    className={`w-4 h-4 transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {mobileProductsOpen && (
                  <div className="bg-gray-700 rounded mt-1 ml-4">
                    {productsMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block text-gray-300 hover:text-white hover:bg-gray-600 px-3 py-2 rounded transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-600 my-1 mx-3" />
                    <Link
                      href="/produtos"
                      className="block text-voyia-blue hover:text-purple-400 px-3 py-2 rounded transition-colors font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Ver todos →
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/quem-somos"
                className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Quem Somos
              </Link>
              <Link
                href="/contato"
                className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contato
              </Link>
            </div>
          </nav>
        )}
      </nav>

      {/* Modal seletor de idioma (mobile) */}
      {langModalOpen && (
        <div
          className="fixed inset-0 z-[2147483647]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="language-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setLangModalOpen(false)}
          />
          <div className="relative z-10 flex min-h-full items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-950 via-gray-900/95 to-gray-800/95 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="language-modal-title"
                    className="text-lg font-semibold text-white"
                  >
                    Selecione o idioma
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">
                    Escolha a versão do site que deseja visitar.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-gray-400 transition-colors hover:text-white"
                  onClick={() => setLangModalOpen(false)}
                  aria-label="Fechar seletor de idioma"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-6 grid gap-3">
                {languageLinks.map((lang) => {
                  const isActive = lang.code === currentLanguage;
                  return (
                    <a
                      key={lang.code}
                      href={lang.href}
                      className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3 text-left transition-colors hover:border-voyia-blue hover:bg-gray-800"
                      {...(isActive ? { "aria-current": "page" as const } : {})}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="text-2xl leading-none"
                        >
                          {lang.flag}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold uppercase text-white">
                            {lang.short}
                          </span>
                          <span className="block text-xs text-gray-300">
                            {lang.label}
                          </span>
                        </span>
                      </span>
                      {isActive && (
                        <span className="rounded-full bg-voyia-blue/20 px-3 py-1 text-xs font-semibold text-voyia-blue">
                          Atual
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
