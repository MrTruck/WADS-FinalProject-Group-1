import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError } from '@/lib/response'

type Params = { params: Promise<{ taskId: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { taskId } = await params

    const task = await prisma.task.findFirst({ where: { task_id: taskId, user_id: user.userId } })
    if (!task) return notFound('Task')

    const sessions = await prisma.study_session.findMany({
      where: { task_id: taskId, user_id: user.userId },
      orderBy: { start_time: 'desc' },
    })

    const totalMins = sessions.reduce((acc, s) => acc + (s.duration_mins ?? 0), 0)

    return ok({
      task: { task_id: task.task_id, title: task.title },
      sessions,
      count: sessions.length,
      total_duration_mins: totalMins,
    })
  } catch (error) {
    console.error('[SESSIONS TASK GET]', error)
    return serverError()
  }
}