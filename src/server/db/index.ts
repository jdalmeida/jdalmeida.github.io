import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  pool?: Pool
  db?: ReturnType<typeof drizzle<typeof schema>>
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definido. Configure no .env.local')
  }

  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  return globalForDb.pool
}

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getPool(), {
      schema,
    })
  }

  return globalForDb.db
}
