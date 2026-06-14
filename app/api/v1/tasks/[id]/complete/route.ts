import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    const existing = await prisma.task.findFirst({ where: { task_id: id, user_id: user.userId } })
    if (!existing) return notFound('Task')

    const task = await prisma.task.update({
      where: { task_id: id },
      data: {
        status: 'COMPLETED',
        completed_at: existing.completed_at ?? new Date(),
      },
    })

    return ok({ task, message: 'Task marked as completed' })
  } catch (error) {
    console.error('[TASK COMPLETE]', error)
    return serverError()
  }
}