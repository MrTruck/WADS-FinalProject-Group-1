/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update a category name or color
 *     tags: [Categories]
 *     security: [{ cookieAuth: [] }, { csrfToken: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               color: { type: string, pattern: '^#[0-9A-Fa-f]{6}$' }
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid CSRF token
 *       404:
 *         description: Category not found
 */


import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { updateCategorySchema } from '@/lib/validators'
import { ok, noContent, badRequest, unauthorized, forbidden, notFound, serverError } from '@/lib/response'
import { sanitizeObject } from '@/lib/sanitize'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params

    const existing = await prisma.category.findFirst({ where: { category_id: id, user_id: user.userId } })
    if (!existing) return notFound('Category')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = updateCategorySchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const category = await prisma.category.update({ where: { category_id: id }, data: sanitizeObject(result.data) })
    return ok({ category })
  } catch (error) {
    console.error('[CATEGORY PUT]', error)
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

    const existing = await prisma.category.findFirst({ where: { category_id: id, user_id: user.userId } })
    if (!existing) return notFound('Category')

    await prisma.category.delete({ where: { category_id: id } })
    return noContent()
  } catch (error) {
    console.error('[CATEGORY DELETE]', error)
    return serverError()
  }
}