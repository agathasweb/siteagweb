import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies | Agathas Web',
  description: 'Política de cookies da Agathas Web. Saiba como utilizamos cookies para melhorar sua experiência de navegação.',
  alternates: { canonical: 'https://agathasweb.com.br/politica-cookies' }
}

export default function CookiesPage() {
  return (
    <main id="main-content" role="main" className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Política de <span className="text-voyia-blue">Cookies</span></h1>
        <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
          <p><strong>Última atualização:</strong> Janeiro de 2026</p>
          <p>Este site utiliza cookies para melhorar sua experiência de navegação. Ao continuar navegando, você concorda com o uso de cookies conforme descrito nesta política.</p>
          <h2 className="text-2xl font-bold text-white mt-8">1. O que são Cookies</h2>
          <p>Cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você visita um site. Eles ajudam a lembrar suas preferências e a melhorar a experiência de navegação.</p>
          <h2 className="text-2xl font-bold text-white mt-8">2. Cookies que Utilizamos</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white">Cookies Essenciais:</strong> Necessários para o funcionamento básico do site.</li>
            <li><strong className="text-white">Cookies de Analytics:</strong> Google Analytics para entender como os visitantes usam o site.</li>
            <li><strong className="text-white">Cookies de Marketing:</strong> Google Tag Manager, Facebook Pixel para campanhas publicitárias.</li>
          </ul>
          <h2 className="text-2xl font-bold text-white mt-8">3. Como Gerenciar Cookies</h2>
          <p>Você pode configurar seu navegador para recusar cookies ou alertá-lo quando cookies estão sendo enviados. No entanto, algumas funcionalidades do site podem não funcionar adequadamente sem cookies.</p>
          <h2 className="text-2xl font-bold text-white mt-8">4. Contato</h2>
          <p>Para questões sobre cookies, entre em contato pelo e-mail <a href="mailto:webmaster@agathas.com.br" className="text-voyia-blue hover:text-purple-300">webmaster@agathas.com.br</a>.</p>
        </div>
      </div>
    </main>
  )
}
