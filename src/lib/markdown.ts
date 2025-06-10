import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const postsDirectory = path.join(process.cwd(), 'content/posts')

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
}

// Ensure content directory exists
if (!fs.existsSync(postsDirectory)) {
  fs.mkdirSync(postsDirectory, { recursive: true })
}

export function getAllPosts(): PostMetadata[] {
  try {
    const fileNames = fs.readdirSync(postsDirectory)
    const allPostsData = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, '')
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const matterResult = matter(fileContents)

        return {
          slug,
          title: matterResult.data.title || 'Sem título',
          date: matterResult.data.date || new Date().toISOString(),
          excerpt: matterResult.data.excerpt || '',
          tags: matterResult.data.tags || [],
          author: matterResult.data.author || 'João de Almeida',
          readTime: calculateReadTime(matterResult.content),
        }
      })

    return allPostsData.sort((a, b) => {
      if (a.date < b.date) {
        return 1
      } else {
        return -1
      }
    })
  } catch (error) {
    console.warn('Erro ao ler posts:', error)
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const matterResult = matter(fileContents)

    const processedContent = await remark()
      .use(html, { sanitize: false })
      .process(matterResult.content)
    
    const contentHtml = processedContent.toString()

    return {
      slug,
      title: matterResult.data.title || 'Sem título',
      date: matterResult.data.date || new Date().toISOString(),
      excerpt: matterResult.data.excerpt || '',
      content: contentHtml,
      tags: matterResult.data.tags || [],
      author: matterResult.data.author || 'João de Almeida',
      readTime: calculateReadTime(matterResult.content),
    }
  } catch (error) {
    console.warn(`Erro ao ler post ${slug}:`, error)
    return null
  }
}

export function getAllPostSlugs(): { params: { slug: string } }[] {
  try {
    const fileNames = fs.readdirSync(postsDirectory)
    return fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        return {
          params: {
            slug: fileName.replace(/\.md$/, ''),
          },
        }
      })
  } catch (error) {
    console.warn('Erro ao ler slugs dos posts:', error)
    return []
  }
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const readTime = Math.ceil(words / wordsPerMinute)
  return readTime
}

export function getFeaturedPosts(limit: number = 3): PostMetadata[] {
  const allPosts = getAllPosts()
  return allPosts.slice(0, limit)
} 