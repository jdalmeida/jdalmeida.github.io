import Link from 'next/link'
import { Github, Linkedin, Mail, Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="md:col-span-2">
            <h3 className="font-bold text-lg text-gray-900 mb-4">João de Almeida</h3>
            <p className="text-gray-600 mb-4">
              CTO da Allpines, apaixonado por tecnologia e inovação. 
              Compartilho insights sobre desenvolvimento de software, 
              liderança técnica e empreendedorismo digital.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/jdalmeida"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Github size={20} />
              </a>
              <a
                href="https://linkedin.com/in/jdalmeida"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="mailto:joao@allpines.com.br"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Allpines</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://allpines.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Site Oficial
                </a>
              </li>
              <li>
                <a
                  href="https://allpines.com.br/sobre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Sobre a Empresa
                </a>
              </li>
              <li>
                <a
                  href="https://allpines.com.br/contato"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Serviços
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © {currentYear} João de Almeida. Todos os direitos reservados.
          </p>
          <p className="text-gray-600 text-sm flex items-center mt-4 md:mt-0">
            Feito com <Heart size={16} className="mx-1 text-red-500" /> usando Next.js e Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
} 