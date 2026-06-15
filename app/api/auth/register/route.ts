import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'
import { created, badRequest, conflict, serverError } from '@/lib/response'
import { checkRateLimit, AUTH_RATE_LIMIT, getClientIp } from '@/lib/rateLimit'
import { sanitizeObject } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`register:${ip}`, AUTH_RATE_LIMIT)
    if (!allowed) {
      return Response.json(
        { success: false, error: 'Too Many Requests', message: 'Too many registration attempts. Try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = registerSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const { name, email, password } = sanitizeObject(result.data)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return conflict('An account with this email already exists')

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { user_id: true, name: true, email: true, role: true, created_at: true },
    })

    await prisma.notification_settings.create({ data: { user_id: user.user_id } })
    await prisma.pomodoro_settings.create({ data: { user_id: user.user_id } })

    return created({ user })
  } catch (error) {
    console.error('[REGISTER]', error)
    return serverError()
  }
}