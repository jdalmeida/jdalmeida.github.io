import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Clock, Tag, Calendar, User } from 'lucide-react'
import { getPostBySlug, getAllPostSlugs } from '@/lib/markdown'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const posts = getAllPostSlugs()
  return posts.map((post) => ({
    slug: post.params.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Post não encontrado',
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors group"
          >
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Voltar para o blog
          </Link>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none dark:prose-invert">
          {/* Header */}
          <header className="not-prose mb-12">
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-700/50"
                  >
                    <Tag size={14} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-center">
                <User size={18} className="mr-2" />
                <span>{post.author}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar size={18} className="mr-2" />
                <time>
                  {format(new Date(post.date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </time>
              </div>
              
              <div className="flex items-center">
                <Clock size={18} className="mr-2" />
                <span>{post.readTime} min de leitura</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100 dark:prose-pre:text-gray-200 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-blockquote:border-primary-500 dark:prose-blockquote:border-primary-400 prose-blockquote:bg-primary-50/50 dark:prose-blockquote:bg-primary-900/20 prose-table:w-full prose-table:table-auto prose-thead:bg-gray-100 dark:prose-thead:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:font-semibold prose-th:text-left prose-tr:border-b prose-tr:border-gray-200 dark:prose-tr:border-gray-700 prose-td:px-4 prose-td:py-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Gostou do artigo?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Compartilhe suas opiniões e dúvidas. Vamos conversar sobre tecnologia!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contato" className="btn-primary">
                Entrar em contato
              </Link>
              <Link href="/blog" className="btn-secondary">
                Ver mais artigos
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
} 