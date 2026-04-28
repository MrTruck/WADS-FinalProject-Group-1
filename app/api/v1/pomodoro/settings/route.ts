import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { pomodoroSettingsSchema } from '@/lib/validators'
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    let settings = await prisma.pomodoro_settings.findUnique({ where: { user_id: user.userId } })
    if (!settings) {
      settings = await prisma.pomodoro_settings.create({ data: { user_id: user.userId } })
    }

    return ok({ settings })
  } catch (error) {
    console.error('[POMODORO SETTINGS GET]', error)
    return serverError()
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = pomodoroSettingsSchema.partial().safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const settings = await prisma.pomodoro_settings.upsert({
      where: { user_id: user.userId },
      update: result.data,
      create: { ...result.data, user_id: user.userId },
    })

    return ok({ settings })
  } catch (error) {
    console.error('[POMODORO SETTINGS PUT]', error)
    return serverError()
  }
}