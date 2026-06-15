/**
 * @swagger
 * /api/v1/pomodoro/cycle:
 *   post:
 *     summary: Log a completed Pomodoro cycle
 *     tags: [Pomodoro]
 *     security: [{ cookieAuth: [] }, { csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [start_time, cycle_number]
 *             properties:
 *               start_time: { type: string, format: date-time }
 *               end_time: { type: string, format: date-time }
 *               duration_mins: { type: integer }
 *               is_completed: { type: boolean }
 *               cycle_number: { type: integer }
 *     responses:
 *       201:
 *         description: Cycle logged
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid CSRF token
 */


import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { pomodoroCycleSchema } from '@/lib/validators'
import { created, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = pomodoroCycleSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const data = result.data

    const cycle = await prisma.pomodoro_cycle.create({
      data: {
        ...data,
        start_time: new Date(data.start_time),
        end_time: data.end_time ? new Date(data.end_time) : null,
        user_id: user.userId,
      },
    })

    return created({ cycle })
  } catch (error) {
    console.error('[POMODORO CYCLE POST]', error)
    return serverError()
  }
}