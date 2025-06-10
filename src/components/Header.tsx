'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Github, Linkedin, Mail, Sparkles } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Sobre', href: '/sobre' },
    { name: 'Contato', href: '/contato' },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/30' 
          : 'bg-transparent'
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo com efeito especial */}
          <Link 
            href="/" 
            className="group relative font-bold text-2xl text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center">
              <Sparkles size={24} className="mr-2 text-primary-500 dark:text-primary-400 group-hover:rotate-12 transition-transform duration-300" />
              João de Almeida
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-purple-400/20 dark:from-primary-400/30 dark:to-purple-400/30 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </Link>

          {/* Desktop Navigation com efeitos */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  relative px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium 
                  transition-all duration-300 rounded-xl group overflow-hidden
                  slide-in-up animate-delay-${index * 100}
                `}
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-purple-500 dark:from-primary-400 dark:to-purple-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
              </Link>
            ))}
          </nav>

          {/* Social Links com animações */}
          <div className="hidden md:flex items-center space-x-2">
            {[
              { icon: Github, href: 'https://github.com/jdalmeida', label: 'GitHub' },
              { icon: Linkedin, href: 'https://linkedin.com/in/joao-de-almeida9', label: 'LinkedIn' },
              { icon: Mail, href: 'mailto:joao@allpines.com.br', label: 'Email' }
            ].map((social, index) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className={`
                  group relative p-3 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400
                  transition-all duration-300 rounded-xl
                  slide-in-up animate-delay-${(index + 4) * 100}
                `}
                aria-label={social.label}
              >
                <social.icon size={20} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <div className="absolute inset-0 ring-2 ring-primary-400/0 group-hover:ring-primary-400/50 dark:group-hover:ring-primary-400/60 transition-all duration-300 rounded-xl"></div>
              </a>
            ))}
            
            {/* Theme Toggle */}
            <div className="ml-4 slide-in-up animate-delay-700">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile menu button com animação */}
          <button
            className={`
              md:hidden relative p-3 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400
              transition-all duration-300 rounded-xl group
              ${isMenuOpen ? 'bg-primary-50 dark:bg-primary-900/30' : ''}
            `}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative z-10">
              {isMenuOpen ? (
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Menu size={24} className="group-hover:scale-110 transition-transform duration-300" />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          </button>
        </div>

        {/* Mobile Navigation com animações deslizantes */}
        <div className={`
          md:hidden overflow-hidden transition-all duration-500 ease-out
          ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="glass-card m-4 p-6 space-y-4">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  block px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium 
                  transition-all duration-300 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30
                  slide-in-left animate-delay-${index * 100}
                `}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile Social Links */}
            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-center space-x-4">
                {[
                  { icon: Github, href: 'https://github.com/jdalmeida', label: 'GitHub' },
                  { icon: Linkedin, href: 'https://linkedin.com/in/jdalmeida', label: 'LinkedIn' },
                  { icon: Mail, href: 'mailto:joao@allpines.com.br', label: 'Email' }
                ].map((social, index) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className={`
                      group p-3 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400
                      transition-all duration-300 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30
                      slide-in-up animate-delay-${(index + 4) * 100}
                    `}
                    aria-label={social.label}
                  >
                    <social.icon size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 