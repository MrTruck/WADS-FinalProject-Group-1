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

    const notification = await prisma.notification.create({ data: { user_id, type, title, message } })
    return created({ notification })
  } catch (error) {
    console.error('[NOTIF SEND]', error)
    return serverError()
  }
}