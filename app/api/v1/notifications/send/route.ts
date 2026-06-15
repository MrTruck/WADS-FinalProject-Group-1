/**
 * @swagger
 * /api/v1/notifications/send:
 *   post:
 *     summary: Create a notification (internal cron endpoint)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, type, title, message]
 *             properties:
 *               user_id: { type: string }
 *               type: { type: string, enum: [DEADLINE_ALERT, AI_REMINDER, SYSTEM, STREAK_UPDATE, BURNOUT_ALERT, PUSH_TEST] }
 *               title: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Notification created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (invalid cron secret)
 *       500:
 *         description: Server error
 */

import { prisma } from '@/lib/prisma'
import { sendNotificationSchema } from '@/lib/validators'
import { created, badRequest, unauthorized, serverError } from '@/lib/response'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return unauthorized('This endpoint is restricted to internal services')
    }

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = sendNotificationSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const { user_id, type, title, message } = result.data

    const notification = await prisma.notification.create({
      data: { user_id, type, title, message },
    })

    return created({ notification })
  } catch (error) {
    console.error('[NOTIF SEND]', error)
    return serverError()
  }
}