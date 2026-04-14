import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Agathas Web',
  description: 'Política de privacidade da Agathas Web. Saiba como tratamos e protegemos seus dados pessoais em conformidade com a LGPD.',
  alternates: { canonical: 'https://agathasweb.com.br/privacidade' }
}

export default function PrivacidadePage() {
  return (
    <main id="main-content" role="main" className="bg-black min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Política de <span className="text-voyia-blue">Privacidade</span></h1>
        <div className="prose prose-invert prose-lg max-w-none space-y-6 text-gray-300">
          <p><strong>Última atualização:</strong> Janeiro de 2026</p>
          <p>A Agathas Web (&quot;nós&quot;, &quot;nosso&quot;) está comprometida em proteger a privacidade dos visitantes do nosso site e clientes. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.</p>
          <h2 className="text-2xl font-bold text-white mt-8">1. Dados que Coletamos</h2>
          <p>Coletamos informações quando você preenche formulários em nosso site, incluindo nome, e-mail, telefone e informações sobre seu projeto. Também coletamos dados de navegação automaticamente através de cookies e ferramentas de analytics.</p>
          <h2 className="text-2xl font-bold text-white mt-8">2. Como Usamos seus Dados</h2>
          <p>Utilizamos seus dados para responder solicitações de contato, enviar orçamentos, melhorar nossos serviços e, quando autorizado, enviar comunicações sobre novos produtos e serviços.</p>
          <h2 className="text-2xl font-bold text-white mt-8">3. Proteção dos Dados</h2>
          <p>Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, uso indevido ou divulgação. Seus dados são armazenados em servidores seguros.</p>
          <h2 className="text-2xl font-bold text-white mt-8">4. Seus Direitos (LGPD)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir, deletar ou solicitar a portabilidade dos seus dados pessoais. Para exercer esses direitos, entre em contato conosco.</p>
          <h2 className="text-2xl font-bold text-white mt-8">5. Contato</h2>
          <p>Para questões relacionadas à privacidade, entre em contato pelo e-mail <a href="mailto:webmaster@agathas.com.br" className="text-voyia-blue hover:text-purple-300">webmaster@agathas.com.br</a>.</p>
        </div>
      </div>
    </main>
  )
}
