"use client"
import Link from 'next/link'
import { Github, Linkedin, Mail, Heart, ArrowUp, Code, Sparkles } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-black dark:via-gray-900 dark:to-gray-950 text-white overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-10 dark:opacity-15">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500 dark:bg-primary-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500 dark:bg-purple-400 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <Sparkles size={32} className="text-primary-400 dark:text-primary-300" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 dark:from-gray-100 dark:to-gray-200 bg-clip-text text-transparent">
                João de Almeida
              </h3>
            </div>
            
            <p className="text-gray-300 dark:text-gray-400 leading-relaxed max-w-md">
              CTO da Allpines, especialista em transformação digital e liderança técnica. 
              Compartilhando conhecimento e criando soluções inovadoras que fazem a diferença.
            </p>

            {/* Social Links com efeitos especiais */}
            <div className="flex items-center space-x-4">
              {[
                { icon: Github, href: 'https://github.com/jdalmeida', label: 'GitHub', color: 'hover:bg-gray-700 dark:hover:bg-gray-600' },
                { icon: Linkedin, href: 'https://linkedin.com/in/jdalmeida', label: 'LinkedIn', color: 'hover:bg-blue-600 dark:hover:bg-blue-500' },
                { icon: Mail, href: 'mailto:joao@allpines.com.br', label: 'Email', color: 'hover:bg-red-600 dark:hover:bg-red-500' }
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  className={`
                    group relative p-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10
                    ${social.color} transition-all duration-300 hover:scale-110 hover:border-white/40 dark:hover:border-white/20
                  `}
                  aria-label={social.label}
                >
                  <social.icon size={20} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-white/5 dark:bg-white/3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white/90 dark:text-white/80 flex items-center">
              <Code size={20} className="mr-2 text-primary-400 dark:text-primary-300" />
              Navegação
            </h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'Blog', href: '/blog' },
                { name: 'Sobre', href: '/sobre' },
                { name: 'Contato', href: '/contato' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-100 transition-colors duration-300 hover:translate-x-1 transform inline-block relative group"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-purple-400 dark:from-primary-300 dark:to-purple-300 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white/90 dark:text-white/80 flex items-center">
              <Sparkles size={20} className="mr-2 text-purple-400 dark:text-purple-300" />
              Allpines
            </h4>
            <ul className="space-y-3">
              {[
                { name: 'Website', href: 'https://allpines.com.br' },
                { name: 'Serviços', href: 'https://allpines.com.br/servicos' },
                { name: 'Portfolio', href: 'https://allpines.com.br/portfolio' },
                { name: 'Contato', href: 'https://allpines.com.br/contato' }
              ].map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-100 transition-colors duration-300 hover:translate-x-1 transform inline-block relative group"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-300 dark:to-pink-300 group-hover:w-full transition-all duration-300"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider com gradiente */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"></div>

        {/* Bottom Section */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              © {currentYear} João de Almeida. Feito com{' '}
              <Heart size={16} className="inline text-red-400 dark:text-red-300 mx-1 animate-pulse" />
              usando Next.js 14 e Tailwind CSS.
            </p>
          </div>

          {/* Scroll to top button */}
          <button
            onClick={scrollToTop}
            className="group relative p-3 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 hover:bg-primary-500 dark:hover:bg-primary-600 transition-all duration-300 hover:scale-110 hover:border-primary-400 dark:hover:border-primary-300"
            aria-label="Voltar ao topo"
          >
            <ArrowUp size={20} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-purple-400/20 dark:from-primary-300/20 dark:to-purple-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 dark:from-primary-400 dark:via-purple-400 dark:to-primary-400 opacity-50 dark:opacity-70"></div>
      </div>
    </footer>
  )
} 