import { createHash, randomBytes } from 'crypto'

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function createSessionToken() {
  return randomBytes(32).toString('hex')
}

export function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('ADMIN_PASSWORD não definido. Configure no .env.local')
  }

  return password
}
