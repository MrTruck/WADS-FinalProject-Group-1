/**
 * @swagger
 * /api/v1/analytics/trends:
 *   get:
 *     summary: Get cached AI‑ready analytics
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: Analytics data }
 *       401: { description: Unauthorized }
 */
import { getUserFromRequest } from '@/lib/auth'
import { fetchUserAnalytics } from '@/lib/ai/analytics'
import { ok, unauthorized, serverError } from '@/lib/response'

const cache = new Map<string, { data: any; expires: number }>()

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    const cacheKey = `analytics:${user.userId}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) return ok(cached.data)
    const analytics = await fetchUserAnalytics(user.userId)
    cache.set(cacheKey, { data: analytics, expires: Date.now() + 5 * 60 * 1000 })
    return ok(analytics)
  } catch (error) {
    console.error('[ANALYTICS_TRENDS]', error)
    return serverError()
  }
}