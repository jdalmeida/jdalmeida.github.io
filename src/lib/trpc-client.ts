import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@/server/api/root'

export function createBrowserTRPCClient(token?: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        headers() {
          if (!token) {
            return {}
          }

          return {
            authorization: `Bearer ${token}`,
          }
        },
      }),
    ],
  })
}
