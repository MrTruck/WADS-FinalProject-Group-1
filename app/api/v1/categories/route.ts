import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { createCategorySchema } from '@/lib/validators'
import { ok, created, badRequest, unauthorized, forbidden, conflict, serverError } from '@/lib/response'
import { sanitizeObject } from '@/lib/sanitize'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const categories = await prisma.category.findMany({
      where: { user_id: user.userId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { created_at: 'asc' },
    })

    return ok({ categories, count: categories.length })
  } catch (error) {
    console.error('[CATEGORIES GET]', error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = createCategorySchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const data = sanitizeObject(result.data)

    const existing = await prisma.category.findFirst({ where: { user_id: user.userId, name: data.name } })
    if (existing) return conflict(`Category "${data.name}" already exists`)

    const category = await prisma.category.create({ data: { ...data, user_id: user.userId } })
    return created({ category })
  } catch (error) {
    console.error('[CATEGORIES POST]', error)
    return serverError()
  }
}