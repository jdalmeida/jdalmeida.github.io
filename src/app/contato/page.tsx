import Link from 'next/link'
import { Mail, Github, Linkedin, MapPin, Building2, ExternalLink, MessageCircle, Clock } from 'lucide-react'

export const metadata = {
  title: 'Contato',
  description: 'Entre em contato comigo para discutir projetos, oportunidades ou trocar ideias sobre tecnologia.',
}

export default function ContatoPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Contato</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Vamos conversar sobre tecnologia, projetos ou oportunidades
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Entre em contato</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Estou sempre aberto para novas conversas, seja para discutir projetos, 
                trocar ideias sobre tecnologia ou explorar oportunidades de colaboração.
              </p>
            </div>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="text-primary-600 dark:text-primary-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Email</h3>
                  <a 
                    href="mailto:joao@allpines.com.br" 
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    joao@allpines.com.br
                  </a>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    A melhor forma de me contactar
                  </p>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Linkedin className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">LinkedIn</h3>
                  <a 
                    href="https://linkedin.com/in/joao-de-almeida9" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center"
                  >
                    /in/joao-de-almeida9
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Conecte-se comigo profissionalmente
                  </p>
                </div>
              </div>

              {/* GitHub */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Github className="text-gray-700 dark:text-gray-300" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">GitHub</h3>
                  <a 
                    href="https://github.com/jdalmeida" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center"
                  >
                    github.com/jdalmeida
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Veja meus projetos e contribuições
                  </p>
                </div>
              </div>

              {/* Localização */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Localização</h3>
                  <p className="text-gray-700 dark:text-gray-300">Santa Cruz do Sul, RS</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Brasil (GMT-3)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Allpines Info */}
            <div className="glass-card p-6">
              <div className="flex items-center mb-4">
                <Building2 className="text-primary-600 dark:text-primary-400 mr-3" size={24} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Allpines</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Como CTO da Allpines, lidero projetos de transformação digital e desenvolvimento de software.
              </p>
              <a 
                href="https://allpines.com.br" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Conheça a Allpines
                <ExternalLink size={16} className="ml-2" />
              </a>
            </div>

            {/* Response Time */}
            <div className="glass-card p-6">
              <div className="flex items-center mb-4">
                <Clock className="text-blue-600 dark:text-blue-400 mr-3" size={24} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tempo de Resposta</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Normalmente respondo emails dentro de 24-48 horas. Para assuntos urgentes, mencione no assunto.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>• Segunda a Sexta: Até 24h</p>
                <p>• Fins de Semana: Até 48h</p>
              </div>
            </div>

            {/* Topics */}
            <div className="glass-card p-6">
              <div className="flex items-center mb-4">
                <MessageCircle className="text-purple-600 dark:text-purple-400 mr-3" size={24} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vamos conversar sobre</h3>
              </div>
              <div className="space-y-2">
                {[
                  'Desenvolvimento de Software',
                  'Liderança Técnica',
                  'Transformação Digital',
                  'Projetos de IA',
                  'Arquitetura de Sistemas',
                  'Mentoria em Tecnologia'
                ].map((topic) => (
                  <div key={topic} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full mr-3"></div>
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center glass-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Pronto para começar nossa conversa?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Seja qual for o assunto, estou ansioso para trocar ideias e conhecer mais sobre seus projetos.
          </p>
          <a 
            href="mailto:joao@allpines.com.br?subject=Olá João! Gostaria de conversar sobre..."
            className="btn-primary"
          >
            Enviar Email
          </a>
        </div>
      </div>
    </div>
  )
} 