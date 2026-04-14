import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entre em Contato - Orçamentos e Consultas Gratuitas | Agathas Web',
  description: 'Entre em contato conosco para orçamentos gratuitos e consultas sobre nossos serviços digitais. Resposta rápida garantida em até 2 horas.',
  alternates: { canonical: 'https://agathasweb.com.br/contato' }
}

export default function ContatoPage() {
  return (
    <main id="main-content" role="main">
      <section className="bg-black">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-voyia-blue to-voyia-blue bg-clip-text text-transparent">Entre em Contato</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Estamos aqui para ajudar você a transformar suas ideias em realidade. Entre em contato conosco!</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-8 text-white">Informações de Contato</h2>
              <div className="space-y-6">
                {[
                  { icon: '📍', title: 'Endereço', lines: ['Rua Manoel Ferreira Maia, Nº 231 Qd 18-A Lote 43 Casa 2', 'Senador Canedo - Goiás - Brasil'] },
                  { icon: '📱', title: 'WhatsApp', lines: ['+55 62 99213-9558'] },
                  { icon: '📧', title: 'E-mail', lines: ['webmaster@agathas.com.br'] },
                  { icon: '🕐', title: 'Atendimento', lines: ['Segunda a Sexta: 8h às 18h', 'Resposta em até 2 horas úteis'] }
                ].map((info) => (
                  <div key={info.title} className="flex items-start">
                    <span className="text-2xl mr-4 mt-1">{info.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{info.title}</h3>
                      {info.lines.map((line) => <p key={line} className="text-gray-300">{line}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-voyia-gray rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-6 text-white">Envie sua Mensagem</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome completo *</label>
                    <input type="text" id="name" name="name" required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder="Seu nome completo" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">E-mail *</label>
                    <input type="email" id="email" name="email" required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder="seu@email.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">WhatsApp</label>
                  <input type="tel" id="phone" name="phone" className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder="(62) 99999-9999" />
                </div>
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-2">Serviço de interesse *</label>
                  <select id="service" name="service" required className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent">
                    <option value="">Selecione um serviço</option>
                    <option value="desenvolvimento">Desenvolvimento Web</option>
                    <option value="moodle">Moodle (LMS)</option>
                    <option value="trafego">Tráfego Pago</option>
                    <option value="consultoria">Consultoria TI</option>
                    <option value="hospedagem-moodle">Hospedagem Moodle</option>
                    <option value="hospedagem-gerenciada">Hospedagem Gerenciada</option>
                    <option value="voyia">Voyia</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">Mensagem</label>
                  <textarea id="message" name="message" rows={5} className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-voyia-blue focus:border-transparent" placeholder="Conte-nos mais sobre seu projeto..." />
                </div>
                <div className="flex items-start space-x-2">
                  <input type="checkbox" id="privacy" name="privacy" required className="mt-1 rounded border-gray-300 text-voyia-blue focus:ring-voyia-blue" />
                  <label htmlFor="privacy" className="text-sm text-gray-300">Concordo em receber contato da Agathas Web sobre minha solicitação *</label>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-voyia-blue to-purple-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105">
                  Enviar Mensagem 🚀
                </button>
                <p className="text-xs text-gray-500 text-center">Resposta garantida em até 2 horas úteis</p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
