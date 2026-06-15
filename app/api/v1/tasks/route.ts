/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks for current user
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, IN_PROGRESS, COMPLETED, OVERDUE] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT] }
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security: [{ cookieAuth: [] }, { csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Study Prisma" }
 *               description: { type: string }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, URGENT], default: MEDIUM }
 *               difficulty: { type: string, enum: [EASY, MEDIUM, HARD, VERY_HARD], default: MEDIUM }
 *               due_date: { type: string, format: date-time }
 *               estimated_hours: { type: number }
 *               category_id: { type: string }
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Validation error (e.g., missing title, payload too large)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing or invalid CSRF token
 */


import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { createTaskSchema } from '@/lib/validators'
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'
import { sanitizeObject } from '@/lib/sanitize'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category_id = searchParams.get('category_id')

    const tasks = await prisma.task.findMany({
      where: {
        user_id: user.userId,
        ...(status && { status: status as never }),
        ...(priority && { priority: priority as never }),
        ...(category_id && { category_id }),
      },
      include: {
        category: { select: { category_id: true, name: true, color: true } },
      },
      orderBy: [{ due_date: 'asc' }, { created_at: 'desc' }],
    })

    return ok({ tasks, count: tasks.length })
  } catch (error) {
    console.error('[TASKS GET]', error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = createTaskSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const data = sanitizeObject(result.data)

    if (data.category_id) {
      const cat = await prisma.category.findFirst({
        where: { category_id: data.category_id, user_id: user.userId },
      })
      if (!cat) return badRequest('Category not found or does not belong to you')
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        due_date: data.due_date ? new Date(data.due_date) : null,
        user_id: user.userId,
      },
      include: {
        category: { select: { category_id: true, name: true, color: true } },
      },
    })

    return created({ task })
  } catch (error) {
    console.error('[TASKS POST]', error)
    return serverError()
  }
}