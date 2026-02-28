import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  content: string
  tags: string[]
  author: string
  readTime: number
}

export interface PostMetadata {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  author: string
  readTime: number
  wordCount: number
}

async function getCaller() {
  const ctx = await createTRPCContext()
  return appRouter.createCaller(ctx)
}

function normalizeDate(date: Date | string | null) {
  if (!date) {
    return new Date().toISOString()
  }

  return new Date(date).toISOString()
}

export async function getAllPosts(): Promise<PostMetadata[]> {
  const caller = await getCaller()
  const posts = await caller.posts.listPublished()

  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: normalizeDate(post.publishedAt ?? post.createdAt),
    excerpt: post.excerpt,
    tags: post.tags,
    author: post.author,
    readTime: post.readTime,
    wordCount: post.wordCount,
  }))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const caller = await getCaller()
  const post = await caller.posts.getBySlug({ slug })

  if (!post) {
    return null
  }

  return {
    slug: post.slug,
    title: post.title,
    date: normalizeDate(post.publishedAt ?? post.createdAt),
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags,
    author: post.author,
    readTime: post.readTime,
  }
}

export async function getAllPostSlugs(): Promise<{ params: { slug: string } }[]> {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    params: { slug: post.slug },
  }))
}

export async function getFeaturedPosts(limit: number = 3): Promise<PostMetadata[]> {
  const allPosts = await getAllPosts()
  return allPosts.slice(0, limit)
}
