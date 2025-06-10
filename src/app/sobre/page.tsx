import Link from 'next/link'
import { Building2, MapPin, Calendar, Users, Zap, Target } from 'lucide-react'

export const metadata = {
  title: 'Sobre',
  description: 'Conheça mais sobre João de Almeida, CTO da Allpines e sua trajetória na tecnologia.',
}

export default function SobrePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Sobre mim</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Conheça minha trajetória e paixão pela tecnologia
          </p>
        </div>

        {/* Main content */}
        <div className="space-y-12">
          {/* Bio */}
          <section className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Sou <strong className="text-gray-900 dark:text-gray-100">João de Almeida</strong>, CTO da <strong className="text-primary-600 dark:text-primary-400">Allpines</strong>, uma empresa de soluções digitais 
              que fundamos em 2023 com o propósito de transformar ideias em tecnologia. Como Chief Technology Officer, 
              lidero nossa equipe técnica na criação de soluções inovadoras que impactam positivamente os negócios 
              de nossos clientes.
            </p>
            
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Minha paixão pela tecnologia vai além do código. Acredito no poder da tecnologia como ferramenta 
              de transformação social e empresarial, e trabalho constantemente para entregar soluções que 
              realmente fazem a diferença na vida das pessoas e no crescimento das empresas.
            </p>
          </section>

          {/* Company Info */}
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Building2 className="mr-3 text-primary-600 dark:text-primary-400" />
              Allpines
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Nossa missão</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Transformar ideias em soluções tecnológicas que impulsionam o crescimento 
                  e a inovação de empresas médias e pequenas.
                </p>
                
                <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                  <MapPin size={16} className="mr-2" />
                  Santa Cruz do Sul, RS
                </div>
                
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar size={16} className="mr-2" />
                  Fundada em 2023
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Nossa equipe</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Ruan Ferreira</span>
                    <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">CEO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">João de Almeida</span>
                    <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">CTO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Douglas Hariel</span>
                    <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">GCO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Bruno Eliel</span>
                    <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">CI/CD</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
              O que fazemos na Allpines
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6 text-center group hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Desenvolvimento de Software</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Aplicações web e mobile personalizadas com tecnologias modernas
                </p>
              </div>
              
              <div className="card p-6 text-center group hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Automação de Processos</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Otimização de fluxos de trabalho para aumentar eficiência
                </p>
              </div>
              
              <div className="card p-6 text-center group hover:scale-105 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Business Intelligence</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Transformamos dados em insights para decisões estratégicas
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center glass-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Vamos conversar sobre tecnologia?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Seja para trocar ideias, discutir projetos ou conhecer mais sobre a Allpines,
              estou sempre aberto para novas conversas e oportunidades.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contato" className="btn-primary">
                Entrar em contato
              </Link>
              <a
                href="https://allpines.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Conhecer a Allpines
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 