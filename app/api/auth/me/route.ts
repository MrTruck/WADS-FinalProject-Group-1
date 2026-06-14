import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, notFound, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const tokenPayload = getUserFromRequest(request)
    if (!tokenPayload) return unauthorized()

    const user = await prisma.user.findUnique({
      where: { user_id: tokenPayload.userId },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
        user_preferences: true,
        notification_settings: true,
      },
    })

    if (!user) return notFound('User')
    return ok({ user })
  } catch (error) {
    console.error('[ME]', error)
    return serverError()
  }
}