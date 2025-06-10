import Link from 'next/link'
import { getAllPosts } from '@/lib/markdown'
import { ArrowRight, Code, Lightbulb, Users, Sparkles, Rocket, Brain, Target, ChevronDown } from 'lucide-react'

export default async function Home() {
  const posts = getAllPosts().slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* Hero Section Impressionante */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradiente Animado */}
        <div className="absolute inset-0 hero-gradient dark:bg-gradient-to-br dark:from-gray-900/50 dark:via-blue-900/30 dark:to-purple-900/40"></div>
        
        {/* Elementos Flutuantes Decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-400/20 dark:bg-primary-400/10 rounded-full blur-xl floating-element"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-400/20 dark:bg-purple-400/10 rounded-full blur-xl floating-element animate-delay-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-indigo-400/20 dark:bg-indigo-400/10 rounded-full blur-xl floating-element animate-delay-500"></div>
        </div>

        <div className="container relative z-10 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Badge Animado */}
            <div className="inline-flex items-center glass-card px-6 py-3 slide-in-up">
              <Sparkles size={16} className="text-primary-500 dark:text-primary-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CTO da Allpines • Especialista em Tecnologia</span>
            </div>

            {/* Título Principal com Efeito Gradient */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight slide-in-up animate-delay-200">
              <span className="block text-gray-900 dark:text-gray-100 mb-4">Olá, eu sou</span>
              <span className="gradient-text">João de Almeida</span>
            </h1>

            {/* Subtítulo com Animação de Digitação */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed slide-in-up animate-delay-300">
              CTO especializado em <span className="gradient-text font-semibold">transformação digital</span>, 
              desenvolvimento de software e liderança técnica. 
              Criando soluções inovadoras na <span className="gradient-text font-semibold">Allpines</span>.
            </p>

            {/* Botões de Ação com Efeitos */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 slide-in-up animate-delay-500">
              <Link href="/blog" className="btn-primary group">
                <span className="relative z-10 flex items-center">
                  Explore o Blog
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
              <Link href="/sobre" className="btn-secondary group">
                <span className="relative z-10 flex items-center">
                  Sobre Mim
                  <Target size={20} className="ml-2 group-hover:scale-110 transition-transform duration-300" />
                </span>
              </Link>
            </div>

            {/* Stats Impressionantes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-16 slide-in-up animate-delay-700">
              {[
                { number: '4+', label: 'Anos de Experiência', icon: Brain },
                { number: '15+', label: 'Projetos Entregues', icon: Rocket },
                { number: '10+', label: 'Tecnologias Dominadas', icon: Code }
              ].map((stat, index) => (
                <div key={stat.label} className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                  <stat.icon size={32} className="text-primary-500 dark:text-primary-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-3xl font-bold gradient-text mb-2">{stat.number}</div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Especialidades */}
      <section className="py-24 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 slide-in-up">
              Minha <span className="gradient-text">Expertise</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto slide-in-up animate-delay-200">
              Combinando liderança técnica com visão estratégica para transformar ideias em soluções tecnológicas de impacto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Code,
                title: 'Desenvolvimento Full-Stack',
                description: 'Especialista em Next.js, React, Node.js e arquiteturas modernas. Criando aplicações web escaláveis e performáticas.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Users,
                title: 'Liderança Técnica',
                description: 'Formação e mentoria de equipes de desenvolvimento. Gestão de projetos complexos e processos ágeis.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Lightbulb,
                title: 'Inovação & Estratégia',
                description: 'Transformação digital empresarial. Implementação de soluções de IA, automação e cloud computing.',
                gradient: 'from-orange-500 to-red-500'
              }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className={`
                  glass-card p-8 group hover:scale-105 transition-all duration-500 glow-effect
                  slide-in-up animate-delay-${index * 200}
                `}
              >
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Posts Destacados */}
      <section className="py-24 bg-gradient-to-br from-primary-50/50 to-purple-50/50 dark:from-gray-800/30 dark:to-gray-900/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 slide-in-up">
              Últimos <span className="gradient-text">Insights</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto slide-in-up animate-delay-200">
              Compartilhando conhecimento sobre tecnologia, liderança e inovação para inspirar a próxima geração de desenvolvedores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {posts.map((post, index) => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className={`
                  group block glass-card overflow-hidden hover:scale-105 transition-all duration-500 glow-effect
                  slide-in-up animate-delay-${index * 200}
                `}
              >
                <div className="p-8">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <time dateTime={post.date}>{post.date}</time>
                    <span className="mx-2">•</span>
                    <span>{post.readTime}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300">
                    Ler mais
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center slide-in-up animate-delay-700">
            <Link href="/blog" className="group">
              <span className="relative z-10 flex items-center">
                Ver Todos os Posts
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-purple-700 dark:from-primary-800 dark:to-purple-900"></div>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-300/20 dark:bg-purple-300/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 slide-in-up">
              Vamos Construir Algo <span className="text-yellow-300 dark:text-yellow-200">Incrível</span> Juntos?
            </h2>
            <p className="text-xl text-white/90 dark:text-white/80 mb-8 slide-in-up animate-delay-200">
              Estou sempre aberto para discutir novas ideias, projetos desafiadores ou oportunidades de colaboração.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 slide-in-up animate-delay-500">
              <Link 
                href="/contato" 
                className="bg-white/20 dark:bg-white/10 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-xl border border-white/30 dark:border-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl group"
              >
                <span className="flex items-center">
                  Entre em Contato
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
              <Link 
                href="/blog" 
                className="text-white hover:text-yellow-300 dark:hover:text-yellow-200 font-semibold py-4 px-8 rounded-xl border border-white/30 dark:border-white/20 hover:border-white/50 dark:hover:border-white/40 transition-all duration-300 group"
              >
                <span className="flex items-center">
                  Explore o Blog
                  <Sparkles size={20} className="ml-2 group-hover:rotate-12 transition-transform duration-300" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 