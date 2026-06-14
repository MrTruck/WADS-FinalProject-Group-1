import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    const existing = await prisma.notification.findFirst({ where: { notification_id: id, user_id: user.userId } })
    if (!existing) return notFound('Notification')

    await prisma.notification.delete({ where: { notification_id: id } })
    return noContent()
  } catch (error) {
    console.error('[NOTIF DELETE]', error)
    return serverError()
  }
}