import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const [tasks, sessions, streak] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { user_id: user.userId },
        _count: { status: true },
      }),
      prisma.study_session.aggregate({
        where: { user_id: user.userId },
        _sum: { duration_mins: true },
        _count: { study_session_id: true },
        _avg: { focus_score: true },
      }),
      prisma.study_streak.findUnique({ where: { user_id: user.userId } }),
    ])

    const taskBreakdown = Object.fromEntries(tasks.map((t) => [t.status, t._count.status]))
    const totalTasks = tasks.reduce((acc, t) => acc + t._count.status, 0)
    const completedTasks = taskBreakdown['COMPLETED'] ?? 0

    return ok({
      tasks: {
        total: totalTasks,
        breakdown: taskBreakdown,
        completion_rate_percent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      sessions: {
        total_count: sessions._count.study_session_id,
        total_duration_mins: sessions._sum.duration_mins ?? 0,
        avg_focus_score: sessions._avg.focus_score ? Math.round(sessions._avg.focus_score) : null,
      },
      streak: {
        current: streak?.current_streak ?? 0,
        longest: streak?.longest_streak ?? 0,
        last_study_date: streak?.last_study_date ?? null,
      },
    })
  } catch (error) {
    console.error('[ANALYTICS PROGRESS]', error)
    return serverError()
  }
}