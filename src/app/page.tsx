import Link from 'next/link'
import { ArrowRight, Code, Coffee, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Olá, eu sou{' '}
            <span className="gradient-text">João de Almeida</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            CTO da Allpines, apaixonado por tecnologia e inovação. 
            Compartilho insights sobre desenvolvimento de software, 
            liderança técnica e transformação digital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/blog" className="btn-primary inline-flex items-center">
              Ver meus artigos
              <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link href="/sobre" className="btn-secondary">
              Sobre mim
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Desenvolvimento</h3>
            <p className="text-gray-600">
              Insights sobre arquitetura de software, melhores práticas 
              e tecnologias emergentes no desenvolvimento web.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inovação</h3>
            <p className="text-gray-600">
              Explorando novas tecnologias, ferramentas e metodologias 
              que estão transformando o mundo da tecnologia.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Liderança</h3>
            <p className="text-gray-600">
              Experiências e aprendizados sobre liderança técnica, 
              gestão de equipes e cultura organizacional.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50">
        <div className="container py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quer saber mais sobre meu trabalho?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Conheça a Allpines e descubra como estamos transformando 
              ideias em soluções tecnológicas inovadoras.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://allpines.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Visitar Allpines
              </a>
              <Link href="/contato" className="btn-secondary">
                Entrar em contato
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 