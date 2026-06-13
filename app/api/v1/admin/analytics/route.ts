/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Get system-wide analytics (admin only)
 *     tags: [Admin]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: System statistics (users, tasks, AI requests, etc.)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden('Admin access required')

    const [totalUsers, totalTasks, totalSessions, totalAiRequests, recentUsers, taskStatusBreakdown, aiStats] =
      await Promise.all([
        prisma.user.count(),
        prisma.task.count(),
        prisma.study_session.count(),
        prisma.ai_request_log.count(),
        prisma.user.count({ where: { created_at: { gte: new Date(Date.now() - 7 * 86400000) } } }),
        prisma.task.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.ai_request_log.aggregate({ _avg: { latency_ms: true }, where: { success: true } }),
      ])

    const aiFailures = await prisma.ai_request_log.count({ where: { success: false } })
    const aiSuccess = totalAiRequests - aiFailures

    return ok({
      users: { total: totalUsers, new_last_7_days: recentUsers },
      tasks: {
        total: totalTasks,
        by_status: Object.fromEntries(taskStatusBreakdown.map((t: any) => [t.status, t._count.status])),
      },
      sessions: { total: totalSessions },
      ai: {
        total_requests: totalAiRequests,
        successful: aiSuccess,
        failed: aiFailures,
        success_rate_percent: totalAiRequests > 0 ? Math.round((aiSuccess / totalAiRequests) * 100) : 0,
        avg_latency_ms: Math.round(aiStats._avg.latency_ms ?? 0),
      },
    })
  } catch (error) {
    console.error('[ADMIN ANALYTICS GET]', error)
    return serverError()
  }
}