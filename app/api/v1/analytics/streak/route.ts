/**
 * @swagger
 * /api/v1/analytics/streak:
 *   get:
 *     summary: Get current study streak
 *     tags: [Analytics]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Streak information (current, longest, last study date)
 *       401:
 *         description: Unauthorized
 */


import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const streak = await prisma.study_streak.findUnique({ where: { user_id: user.userId } })

    return ok({
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      last_study_date: streak?.last_study_date ?? null,
    })
  } catch (error) {
    console.error('[ANALYTICS STREAK]', error)
    return serverError()
  }
}