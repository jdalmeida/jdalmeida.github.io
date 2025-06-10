import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, Tag } from 'lucide-react'
import { getAllPosts } from '@/lib/markdown'

export const metadata = {
  title: 'Blog',
  description: 'Artigos sobre tecnologia, desenvolvimento e liderança técnica.',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-xl text-gray-600">
            Insights sobre tecnologia, desenvolvimento e liderança técnica
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Nenhum post encontrado. Em breve novos conteúdos!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="card p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col space-y-4">
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
                        >
                          <Tag size={14} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-600 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Por {post.author}</span>
                      <span>•</span>
                      <time>
                        {format(new Date(post.date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </time>
                      <span>•</span>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {post.readTime} min de leitura
                      </div>
                    </div>
                    
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      Ler mais →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 