import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  return tags.map((tag) => String(tag).trim()).filter(Boolean)
}

function normalizeDate(value) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function buildExcerpt(frontmatterExcerpt, content) {
  const excerpt = String(frontmatterExcerpt ?? '').trim()
  if (excerpt) return excerpt

  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[>#*_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

async function migrate() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL não definido no ambiente.')
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const fileNames = await fs.readdir(POSTS_DIR)
    const markdownFiles = fileNames.filter((fileName) => fileName.endsWith('.md'))

    let migratedCount = 0

    for (const fileName of markdownFiles) {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(POSTS_DIR, fileName)
      const fileContents = await fs.readFile(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      const title = String(data.title ?? slug).trim()
      const excerpt = buildExcerpt(data.excerpt, content)
      const author = String(data.author ?? 'João de Almeida').trim()
      const tags = normalizeTags(data.tags)
      const publishedAt = normalizeDate(data.date)

      await client.query(
        `
        INSERT INTO posts (
          slug,
          title,
          excerpt,
          content,
          tags,
          author,
          published,
          published_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, TRUE, $7, NOW())
        ON CONFLICT (slug)
        DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          tags = EXCLUDED.tags,
          author = EXCLUDED.author,
          published = EXCLUDED.published,
          published_at = EXCLUDED.published_at,
          updated_at = NOW()
      `,
        [slug, title, excerpt, content, JSON.stringify(tags), author, publishedAt],
      )

      migratedCount += 1
      console.log(`Migrado: ${slug}`)
    }

    console.log(`\nTotal migrado: ${migratedCount} artigo(s).`)
  } finally {
    await client.end()
  }
}

migrate().catch((error) => {
  console.error('Falha na migração dos artigos:', error.message)
  process.exit(1)
})
