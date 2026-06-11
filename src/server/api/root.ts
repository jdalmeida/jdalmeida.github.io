import { authRouter } from "@/server/api/routers/auth";
import { postsRouter } from "@/server/api/routers/posts";
import { createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
	posts: postsRouter,
	auth: authRouter,
});

export type AppRouter = typeof appRouter;
