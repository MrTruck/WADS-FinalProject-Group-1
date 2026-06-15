/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     tags: [Notifications]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: Unauthorized
 */

import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const notifications = await prisma.notification.findMany({
      where: { user_id: user.userId, ...(unreadOnly && { is_read: false }) },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    return ok({
      notifications,
      count: notifications.length,
      unread_count: notifications.filter((n) => !n.is_read).length,
    })
  } catch (error) {
    console.error('[NOTIFICATIONS GET]', error)
    return serverError()
  }
}