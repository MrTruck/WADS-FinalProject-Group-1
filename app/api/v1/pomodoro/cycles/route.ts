/**
 * @swagger
 * /api/v1/pomodoro/cycles:
 *   get:
 *     summary: Get all Pomodoro cycles for the current user
 *     tags: [Pomodoro]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of Pomodoro cycles
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { user_id: user.userId }
    if (from || to) {
      where.start_time = {}
      if (from) where.start_time.gte = new Date(from)
      if (to) where.start_time.lte = new Date(to)
    }

    const cycles = await prisma.pomodoro_cycle.findMany({
      where,
      orderBy: { start_time: 'desc' },
    })

    const completedCount = cycles.filter((c) => c.is_completed).length

    return ok({
      cycles,
      count: cycles.length,
      completed_count: completedCount,
    })
  } catch (error) {
    console.error('[POMODORO CYCLES GET]', error)
    return serverError()
  }
}