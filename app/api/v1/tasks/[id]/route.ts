/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }, { csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [PENDING, IN_PROGRESS, COMPLETED, OVERDUE] }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *     responses:
 *       200:
 *         description: Task updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid CSRF token
 *       404:
 *         description: Task not found
 */


import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { updateTaskSchema } from '@/lib/validators'
import { ok, noContent, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { sanitizeObject } from '@/lib/sanitize'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { id } = await params

    const task = await prisma.task.findFirst({
      where: { task_id: id, user_id: user.userId },
      include: {
        category: { select: { category_id: true, name: true, color: true } },
        study_sessions: { orderBy: { start_time: 'desc' }, take: 5 },
      },
    })

    if (!task) return notFound('Task')
    return ok({ task })
  } catch (error) {
    console.error('[TASK GET]', error)
    return serverError()
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    const existing = await prisma.task.findFirst({ where: { task_id: id, user_id: user.userId } })
    if (!existing) return notFound('Task')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = updateTaskSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const data = sanitizeObject(result.data)
    const updateData: Record<string, unknown> = { ...data }

    if (data.status === 'COMPLETED' && !existing.completed_at) {
      updateData.completed_at = new Date()
    }
    if (data.due_date) {
      updateData.due_date = new Date(data.due_date as string)
    }

    const task = await prisma.task.update({
      where: { task_id: id },
      data: updateData,
      include: {
        category: { select: { category_id: true, name: true, color: true } },
      },
    })

    return ok({ task })
  } catch (error) {
    console.error('[TASK PUT]', error)
    return serverError()
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    const existing = await prisma.task.findFirst({ where: { task_id: id, user_id: user.userId } })
    if (!existing) return notFound('Task')

    await prisma.task.delete({ where: { task_id: id } })
    return noContent()
  } catch (error) {
    console.error('[TASK DELETE]', error)
    return serverError()
  }
}