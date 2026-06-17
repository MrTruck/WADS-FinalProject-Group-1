import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'
import { z } from 'zod'

const settingsSchema = z.object({
  in_app_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  reminder_before_minutes: z.number().int().min(0).max(10080).optional(),
  daily_digest: z.boolean().optional(),
  weekly_report: z.boolean().optional(),
  burnout_alerts: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const settings = await prisma.notification_settings.upsert({
      where: { user_id: user.userId },
      update: {},
      create: { user_id: user.userId },
    })

    return ok({ settings })
  } catch (error) {
    console.error('[NOTIFICATION SETTINGS GET]', error)
    return serverError()
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) {
      return forbidden('Invalid or missing CSRF token')
    }

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = settingsSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Validation failed', result.error.flatten().fieldErrors)
    }

    const settings = await prisma.notification_settings.upsert({
      where: { user_id: user.userId },
      update: result.data,
      create: { user_id: user.userId, ...result.data },
    })

    return ok({ settings })
  } catch (error) {
    console.error('[NOTIFICATION SETTINGS PUT]', error)
    return serverError()
  }
}
