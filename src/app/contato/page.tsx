import Link from 'next/link'
import { Mail, Github, Linkedin, MapPin, Building2, ExternalLink } from 'lucide-react'

export const metadata = {
  title: 'Contato',
  description: 'Entre em contato comigo para discutir projetos, oportunidades ou trocar ideias sobre tecnologia.',
}

export default function ContatoPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contato</h1>
          <p className="text-xl text-gray-600">
            Vamos conversar sobre tecnologia, projetos ou oportunidades
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Entre em contato</h2>
              <p className="text-gray-600 mb-8">
                Estou sempre aberto para novas conversas, seja para discutir projetos, 
                trocar ideias sobre tecnologia ou explorar oportunidades de colaboração.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="text-primary-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a 
                    href="mailto:joao@allpines.com.br" 
                    className="text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    joao@allpines.com.br
                  </a>
                  <p className="text-gray-600 text-sm mt-1">
                    A melhor forma de me contactar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 