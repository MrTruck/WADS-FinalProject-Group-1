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