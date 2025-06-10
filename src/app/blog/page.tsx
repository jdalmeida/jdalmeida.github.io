import Link from 'next/link'
import { getAllPosts } from '@/lib/markdown'
import { Calendar, Clock, ArrowRight, Search, BookOpen, Clock10 } from 'lucide-react'

export const metadata = {
  title: 'Blog',
  description: 'Artigos sobre desenvolvimento de software, liderança técnica e inovação tecnológica.',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 to-purple-50/80 dark:from-gray-800/40 dark:to-gray-900/60"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-400/10 dark:bg-primary-400/5 rounded-full blur-2xl floating-element"></div>
          <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-2xl floating-element animate-delay-300"></div>
        </div>

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center glass-card px-6 py-3 mb-8 slide-in-up">
              <BookOpen size={20} className="text-primary-500 dark:text-primary-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Conhecimento Compartilhado</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-gray-100 mb-6 slide-in-up animate-delay-200">
              Explore Meus{' '}
              <span className="gradient-text">Insights</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed slide-in-up animate-delay-300">
              Compartilho experiências, aprendizados e reflexões sobre desenvolvimento de software, 
              liderança técnica e as últimas tendências em tecnologia.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12 slide-in-up animate-delay-500">
              {[
                { number: posts.length, label: 'Artigos Publicados', icon: BookOpen },
                { number: posts.reduce((acc, post) => acc + post.readTime, 0), label: 'Minutos de Conteúdo', icon: Clock10 },
              ].map((stat, index) => (
                <div key={stat.label} className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                  <stat.icon size={24} className="text-primary-500 dark:text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-2xl font-bold gradient-text mb-1">{stat.number}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm border-y border-gray-200/50 dark:border-gray-700/50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-6 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar artigos..."
                  className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Filter Tags */}
              <div className="flex flex-wrap gap-3">
                {posts.reduce((acc, post) => [...acc, ...post.tags], [] as string[]).slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      tag === 'Todos'
                        ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-lg'
                        : 'bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`
                  group block glass-card overflow-hidden hover:scale-105 transition-all duration-500 glow-effect
                  slide-in-up animate-delay-${index * 100}
                `}
              >
                {/* Post Header */}
                <div className="p-8 flex flex-col h-full">
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2" />
                      <time dateTime={post.date}>{post.date}</time>
                    </div>
                    <div className="flex items-center bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full">
                      <Clock size={14} className="mr-1" />
                      <span className="text-xs font-medium">{post.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-2 leading-tight">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100/80 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Read More */}
                  <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300">
                    <span>Ler artigo completo</span>
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 dark:from-primary-400/10 dark:to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {posts.length > 6 && (
            <div className="text-center mt-16 slide-in-up animate-delay-700">
              <button className="btn-primary group">
                <span className="relative z-10 flex items-center">
                  Carregar Mais Artigos
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-purple-700 dark:from-primary-700 dark:to-purple-800"></div>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        
        {/* Elementos decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-purple-300/20 dark:bg-purple-300/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative z-10 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 slide-in-up">
              Não Perca Nenhum <span className="text-yellow-300 dark:text-yellow-200">Insight</span>
            </h2>
            <p className="text-xl mb-8 opacity-90 dark:opacity-80 slide-in-up animate-delay-200">
              Receba notificações sobre novos artigos e conteúdos exclusivos sobre tecnologia e liderança.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto slide-in-up animate-delay-300">
              <input
                type="email"
                placeholder="Seu melhor email"
                className="flex-1 px-6 py-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-xl text-white placeholder-white/70 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/40"
              />
              <button className="bg-white/20 dark:bg-white/10 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl border border-white/30 dark:border-white/20 transition-all duration-300 whitespace-nowrap">
                <span className="relative z-10">Inscrever-se</span>
              </button>
            </div>
            
            <p className="text-sm opacity-70 dark:opacity-60 mt-4">
              📧 Sem spam. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
} 