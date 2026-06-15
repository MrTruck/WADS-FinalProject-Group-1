/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    if (user.role !== 'ADMIN') return forbidden('Admin access required')

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          user_id: true, name: true, email: true, role: true, created_at: true,
          _count: { select: { tasks: true, study_sessions: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count(),
    ])

    return ok({ users, pagination: { total, page, limit, total_pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[ADMIN USERS GET]', error)
    return serverError()
  }
}