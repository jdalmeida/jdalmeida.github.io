import { and, desc, eq, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { posts } from '@/server/db/schema'

const postInputSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(3).max(255),
  excerpt: z.string().trim().min(10),
  content: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).default([]),
  author: z.string().trim().min(2).max(120).default('João de Almeida'),
  published: z.boolean().default(false),
})

function countReadTime(markdown: string) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function withComputedFields<T extends { content: string }>(post: T) {
  const wordCount = post.content.trim().split(/\s+/).filter(Boolean).length

  return {
    ...post,
    readTime: countReadTime(post.content),
    wordCount,
  }
}

export const postsRouter = createTRPCRouter({
  listPublished: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))

    return rows.map((row) => withComputedFields(row))
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(posts)
        .where(and(eq(posts.slug, input.slug), eq(posts.published, true)))
        .limit(1)

      return row ? withComputedFields(row) : null
    }),

  listAll: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(posts)
      .orderBy(desc(posts.updatedAt), desc(posts.createdAt))

    return rows.map((row) => withComputedFields(row))
  }),

  upsert: protectedProcedure
    .input(postInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date()
      const normalizedTags = input.tags.map((tag) => tag.trim()).filter(Boolean)

      if (input.id) {
        const [updated] = await ctx.db
          .update(posts)
          .set({
            slug: input.slug,
            title: input.title,
            excerpt: input.excerpt,
            content: input.content,
            tags: normalizedTags,
            author: input.author,
            published: input.published,
            publishedAt: input.published ? now : null,
            updatedAt: now,
          })
          .where(eq(posts.id, input.id))
          .returning()

        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Artigo não encontrado para atualização.',
          })
        }

        return withComputedFields(updated)
      }

      const [created] = await ctx.db
        .insert(posts)
        .values({
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt,
          content: input.content,
          tags: normalizedTags,
          author: input.author,
          published: input.published,
          publishedAt: input.published ? now : null,
          updatedAt: now,
        })
        .returning()

      if (!created) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar artigo.',
        })
      }

      return withComputedFields(created)
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(posts).where(eq(posts.id, input.id))
      return { success: true }
    }),

  healthcheck: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.execute(sql`select 1 as ok`)
    return { ok: Boolean(result.rows?.[0]) }
  }),
})
