import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') ?? '14'), 30)

    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const until = new Date()
    until.setDate(until.getDate() + days)

    const tasks = await prisma.task.findMany({
      where: { user_id: user.userId, due_date: { gte: since, lte: until } },
      select: {
        task_id: true, title: true, priority: true,
        difficulty: true, status: true, due_date: true, estimated_hours: true,
      },
      orderBy: { due_date: 'asc' },
    })

    const densityMap = new Map<string, typeof tasks>()
    for (const task of tasks) {
      if (!task.due_date) continue
      const day = task.due_date.toISOString().split('T')[0]
      if (!densityMap.has(day)) densityMap.set(day, [])
      densityMap.get(day)!.push(task)
    }

    const workload = Array.from(densityMap.entries()).map(([date, dayTasks]) => ({
      date,
      task_count: dayTasks.length,
      pending_count: dayTasks.filter((t) => t.status !== 'COMPLETED').length,
      estimated_hours_total: dayTasks.reduce((acc, t) => acc + (t.estimated_hours ?? 0), 0),
      has_urgent: dayTasks.some((t) => t.priority === 'URGENT'),
      tasks: dayTasks,
    }))

    return ok({ workload, period_days: days })
  } catch (error) {
    console.error('[ANALYTICS WORKLOAD]', error)
    return serverError()
  }
}