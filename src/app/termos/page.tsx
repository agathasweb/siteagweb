import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso | Agathas Web',
  description: 'Termos de uso e condições do site da Agathas Web. Leia nossos termos antes de utilizar nossos serviços.',
  alternates: { canonical: 'https://agathasweb.com.br/termos' }
}

export default function TermosPage() {
  return (
    <main id="main-content" role="main" className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Termos de <span className="text-voyia-blue">Uso</span></h1>
        <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
          <p><strong>Última atualização:</strong> Janeiro de 2026</p>
          <p>Ao acessar e utilizar o site da Agathas Web, você concorda com os seguintes termos e condições de uso.</p>
          <h2 className="text-2xl font-bold text-white mt-8">1. Uso do Site</h2>
          <p>O conteúdo deste site é fornecido pela Agathas Web para fins informativos. É proibida a reprodução, distribuição ou modificação do conteúdo sem autorização prévia.</p>
          <h2 className="text-2xl font-bold text-white mt-8">2. Propriedade Intelectual</h2>
          <p>Todo o conteúdo do site, incluindo textos, imagens, logos, vídeos e código-fonte, é de propriedade da Agathas Web e está protegido por leis de propriedade intelectual.</p>
          <h2 className="text-2xl font-bold text-white mt-8">3. Serviços</h2>
          <p>Os serviços oferecidos estão sujeitos a disponibilidade e podem ser alterados sem aviso prévio. Os preços e condições serão estabelecidos em contrato específico.</p>
          <h2 className="text-2xl font-bold text-white mt-8">4. Limitação de Responsabilidade</h2>
          <p>A Agathas Web não se responsabiliza por danos diretos ou indiretos decorrentes do uso do site ou de informações nele contidas.</p>
          <h2 className="text-2xl font-bold text-white mt-8">5. Contato</h2>
          <p>Para dúvidas sobre estes termos, entre em contato pelo e-mail <a href="mailto:webmaster@agathas.com.br" className="text-voyia-blue hover:text-purple-300">webmaster@agathas.com.br</a>.</p>
        </div>
      </div>
    </main>
  )
}
