'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createBrowserTRPCClient } from '@/lib/trpc-client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Code } from 'lucide-react'

type AdminPost = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  author: string
  published: boolean
  updatedAt: string | Date
}

const EMPTY_POST = {
  id: undefined as number | undefined,
  slug: '',
  title: '',
  excerpt: '',
  content: '# Novo artigo\n\nComece escrevendo aqui...',
  tagsInput: '',
  author: 'João de Almeida',
  published: false,
}

const TOKEN_KEY = 'admin_token'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState(EMPTY_POST)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (saved) {
      setToken(saved)
    }
  }, [])

  const trpc = useMemo(() => createBrowserTRPCClient(token ?? undefined), [token])

  async function loadPosts() {
    if (!token) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await trpc.posts.listAll.query()
      setPosts(
        data.map((post) => ({
          ...post,
          updatedAt: post.updatedAt,
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar artigos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const result = await trpc.auth.login.mutate({ password })
      localStorage.setItem(TOKEN_KEY, result.token)
      setToken(result.token)
      setPassword('')
      setMessage('Login realizado com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login.')
    }
  }

  async function handleLogout() {
    try {
      await trpc.auth.logout.mutate()
    } catch {
      // ignore logout errors
    }

    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setPosts([])
    setForm(EMPTY_POST)
  }

  function loadPostIntoEditor(post: AdminPost) {
    setForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      tagsInput: post.tags.join(', '),
      author: post.author,
      published: post.published,
    })
  }

  async function savePost(event: FormEvent) {
    event.preventDefault()
    if (!token) {
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await trpc.posts.upsert.mutate({
        id: form.id,
        slug: form.slug.trim(),
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        tags: form.tagsInput
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        author: form.author.trim() || 'João de Almeida',
        published: form.published,
      })

      setMessage(form.id ? 'Artigo atualizado.' : 'Artigo criado.')
      setForm(EMPTY_POST)
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar artigo.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePost(id: number) {
    if (!token) {
      return
    }

    const confirmed = window.confirm('Deseja realmente excluir este artigo?')
    if (!confirmed) {
      return
    }

    setError('')
    setMessage('')

    try {
      await trpc.posts.delete.mutate({ id })
      setMessage('Artigo excluído.')
      if (form.id === id) {
        setForm(EMPTY_POST)
      }
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir artigo.')
    }
  }

  if (!token) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto glass-card p-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Editor de Artigos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Faça login com a senha definida em <code>ADMIN_PASSWORD</code>.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha do editor"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70"
              required
            />
            <button type="submit" className="btn-primary w-full">
              Entrar
            </button>
          </form>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-green-600">{message}</p> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin de Artigos</h1>
        <button onClick={handleLogout} className="btn-secondary">
          Sair
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-green-600">{message}</p> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 glass-card p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Artigos</h2>
          {loading ? <p className="text-sm text-gray-500">Carregando...</p> : null}

          <div className="space-y-3 max-h-[70vh] overflow-auto pr-2">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{post.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {post.published ? 'Publicado' : 'Rascunho'} · {new Date(post.updatedAt).toLocaleString('pt-BR')}
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => loadPostIntoEditor(post)} className="btn-secondary text-xs py-1 px-3">
                    Editar
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-xs py-1 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-8">
          <form onSubmit={savePost} className="glass-card p-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Título"
                className="flex-1 min-w-[240px] px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 text-white"
                required
              />
              <input
                type="text"
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value.toLowerCase() }))}
                placeholder="slug-do-artigo"
                className="flex-1 min-w-[240px] px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 text-white"
                required
              />
            </div>

            <textarea
              value={form.excerpt}
              onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
              placeholder="Resumo"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 text-white"
              rows={2}
              required
            />

            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                value={form.tagsInput}
                onChange={(event) => setForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
                placeholder="tags separadas por vírgula"
                className="flex-1 min-w-[240px] px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 text-white"
              />
              <input
                type="text"
                value={form.author}
                onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
                placeholder="Autor"
                className="flex-1 min-w-[240px] px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 text-white"
              />
            </div>

            <div className="flex flex-col w-full h-[600px] mb-4">
              {/* Header com Toggle */}
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/80 px-4 py-3 border border-b-0 border-gray-300 dark:border-gray-700 rounded-t-xl">
                <div className="font-semibold text-gray-700 dark:text-gray-200">
                  {showPreview ? 'Preview (Visualizar)' : 'Markdown (Escrever)'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {showPreview ? (
                    <>
                      <Code size={16} />
                      <span>Editar Fonte</span>
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      <span>Visualizar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Corpo principal do Editor / Preview */}
              <div className="flex-1 min-h-0 border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 rounded-b-xl overflow-hidden shadow-sm flex flex-col">
                {!showPreview ? (
                  <textarea
                    value={form.content}
                    onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="Escreva seu artigo em markdown..."
                    className="flex-1 w-full bg-transparent p-4 resize-none font-mono text-[13px] sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                ) : (
                  <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 bg-white dark:bg-gray-950">
                    <div className="prose prose-lg max-w-none prose-headings:text-gray-200 dark:prose-headings:text-gray-100 prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-200 dark:prose-strong:text-gray-100 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100 dark:prose-pre:text-gray-200 prose-p:text-gray-200 dark:prose-p:text-gray-300 prose-li:text-gray-200 dark:prose-li:text-gray-300 prose-blockquote:border-primary-500 dark:prose-blockquote:border-primary-400 prose-blockquote:bg-primary-50/50 dark:prose-blockquote:bg-primary-900/20 prose-table:w-full prose-table:table-auto prose-thead:bg-gray-100 dark:prose-thead:bg-gray-300 prose-th:px-4 prose-th:py-2 prose-th:font-semibold prose-th:text-left prose-tr:border-b prose-tr:border-gray-200 dark:prose-tr:border-gray-700 prose-td:px-4 prose-td:py-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {form.content || '*Nenhum conteúdo adicionado.*'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
              />
              Publicar artigo
            </label>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : form.id ? 'Atualizar artigo' : 'Criar artigo'}
              </button>
              <button type="button" onClick={() => setForm(EMPTY_POST)} className="btn-secondary">
                Novo
              </button>
            </div>
          </form>


        </div>
      </div>
    </div>
  )
}
