import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') ?? '30'), 90)

    const since = new Date()
    since.setDate(since.getDate() - days)

    const tasks = await prisma.task.findMany({
      where: { user_id: user.userId, created_at: { gte: since } },
      select: { status: true, priority: true, completed_at: true, due_date: true },
    })

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length
    const onTime = tasks.filter(
      (t) => t.status === 'COMPLETED' && t.due_date && t.completed_at && t.completed_at <= t.due_date
    ).length

    const byPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => {
      const pt = tasks.filter((t) => t.priority === p)
      const pc = pt.filter((t) => t.status === 'COMPLETED').length
      return { priority: p, total: pt.length, completed: pc, rate: pt.length > 0 ? Math.round((pc / pt.length) * 100) : 0 }
    })

    return ok({
      period_days: days,
      total_tasks: total,
      completed_tasks: completed,
      completion_rate_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      on_time_rate_percent: completed > 0 ? Math.round((onTime / completed) * 100) : 0,
      by_priority: byPriority,
    })
  } catch (error) {
    console.error('[ANALYTICS COMPLETION]', error)
    return serverError()
  }
}