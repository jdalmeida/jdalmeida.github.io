import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { getDb } from '@/server/db'
import { adminSessions } from '@/server/db/schema'
import { and, gt, eq } from 'drizzle-orm'
import { hashToken } from '@/server/auth'

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice(7)
}

export async function createTRPCContext(request?: Request) {
  const db = getDb()
  const token = request ? getBearerToken(request) : null
  let isAuthenticated = false

  if (token) {
    const tokenHash = hashToken(token)
    const [session] = await db
      .select({ tokenHash: adminSessions.tokenHash })
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.tokenHash, tokenHash),
          gt(adminSessions.expiresAt, new Date()),
        ),
      )
      .limit(1)

    isAuthenticated = Boolean(session)
  }

  return {
    db,
    isAuthenticated,
    token,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.isAuthenticated) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Faça login para acessar o editor.',
    })
  }

  return next({
    ctx,
  })
})
