import { and, eq, gt, lte } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createSessionToken, getAdminPassword, hashToken } from '@/server/auth'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import { adminSessions } from '@/server/db/schema'

const SESSION_TTL_DAYS = 7

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const adminPassword = getAdminPassword()

      if (input.password !== adminPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Senha inválida.',
        })
      }

      const token = createSessionToken()
      const tokenHash = hashToken(token)
      const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

      await ctx.db.delete(adminSessions).where(lte(adminSessions.expiresAt, new Date()))
      await ctx.db.insert(adminSessions).values({
        tokenHash,
        expiresAt,
      })

      return {
        token,
        expiresAt,
      }
    }),

  me: protectedProcedure.query(async () => {
    return { authenticated: true }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.token) {
      return { success: true }
    }

    const tokenHash = hashToken(ctx.token)

    await ctx.db
      .delete(adminSessions)
      .where(
        and(
          eq(adminSessions.tokenHash, tokenHash),
          gt(adminSessions.expiresAt, new Date()),
        ),
      )

    return { success: true }
  }),
})
