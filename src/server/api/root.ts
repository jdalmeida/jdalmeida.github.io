import { createTRPCRouter } from '@/server/api/trpc'
import { postsRouter } from '@/server/api/routers/posts'
import { authRouter } from '@/server/api/routers/auth'

export const appRouter = createTRPCRouter({
  posts: postsRouter,
  auth: authRouter,
})

export type AppRouter = typeof appRouter
