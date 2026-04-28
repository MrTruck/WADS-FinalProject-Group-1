import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { updateSessionSchema } from '@/lib/validators'
import { ok, noContent, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { sanitizeObject } from '@/lib/sanitize'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { id } = await params
    const session = await prisma.study_session.findFirst({
      where: { study_session_id: id, user_id: user.userId },
      include: { task: { select: { task_id: true, title: true, priority: true } } },
    })

    if (!session) return notFound('Study session')
    return ok({ session })
  } catch (error) {
    console.error('[SESSION GET]', error)
    return serverError()
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    const existing = await prisma.study_session.findFirst({ where: { study_session_id: id, user_id: user.userId } })
    if (!existing) return notFound('Study session')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = updateSessionSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const data = sanitizeObject(result.data)

    const session = await prisma.study_session.update({
      where: { study_session_id: id },
      data: {
        ...data,
        ...(data.start_time && { start_time: new Date(data.start_time as string) }),
        ...(data.end_time && { end_time: new Date(data.end_time as string) }),
      },
    })

    return ok({ session })
  } catch (error) {
    console.error('[SESSION PUT]', error)
    return serverError()
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    const existing = await prisma.study_session.findFirst({ where: { study_session_id: id, user_id: user.userId } })
    if (!existing) return notFound('Study session')

    await prisma.study_session.delete({ where: { study_session_id: id } })
    return noContent()
  } catch (error) {
    console.error('[SESSION DELETE]', error)
    return serverError()
  }
}