import crypto from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || 'fallback-csrf-secret-change-in-prod'
export const CSRF_HEADER = 'x-csrf-token'

export function generateCsrfToken(userId: string): string {
  const timestamp = Date.now().toString()
  const hmac = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${userId}:${timestamp}`)
    .digest('hex')
  return `${timestamp}.${hmac}`
}

export function validateCsrfToken(token: string, userId: string): boolean {
  try {
    const [timestamp, hmac] = token.split('.')
    if (!timestamp || !hmac) return false

    const age = Date.now() - parseInt(timestamp, 10)
    if (age > 60 * 60 * 1000) return false

    const expected = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(`${userId}:${timestamp}`)
      .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}