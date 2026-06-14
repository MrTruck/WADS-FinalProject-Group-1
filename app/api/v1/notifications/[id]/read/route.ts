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

    const existing = await prisma.notification.findFirst({ where: { notification_id: id, user_id: user.userId } })
    if (!existing) return notFound('Notification')

    const notification = await prisma.notification.update({
      where: { notification_id: id },
      data: { is_read: true, read_at: new Date() },
    })

    return ok({ notification })
  } catch (error) {
    console.error('[NOTIF READ]', error)
    return serverError()
  }
}