import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { noContent, unauthorized, forbidden, notFound, serverError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden('Admin access required')

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    if (id === user.userId) return forbidden('Admins cannot delete their own account')

    const target = await prisma.user.findUnique({ where: { user_id: id } })
    if (!target) return notFound('User')

    await prisma.user.delete({ where: { user_id: id } })
    return noContent()
  } catch (error) {
    console.error('[ADMIN USER DELETE]', error)
    return serverError()
  }
}