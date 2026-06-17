import { notification_type } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { ok, unauthorized, forbidden, serverError } from '@/lib/response'

type NotificationCandidate = {
  type: notification_type
  title: string
  message: string
}

function notificationKey(notification: NotificationCandidate) {
  return `${notification.type}:${notification.title}:${notification.message}`
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) {
      return forbidden('Invalid or missing CSRF token')
    }

    const settings = await prisma.notification_settings.findUnique({
      where: { user_id: user.userId },
    })

    if (settings && !settings.in_app_enabled) {
      return ok({ created_count: 0, notifications: [] })
    }

    const now = new Date()
    const reminderMinutes = settings?.reminder_before_minutes ?? 24 * 60
    const reminderUntil = new Date(now.getTime() + reminderMinutes * 60 * 1000)

    const tasks = await prisma.task.findMany({
      where: {
        user_id: user.userId,
        status: { not: 'COMPLETED' },
        OR: [
          { due_date: { lt: now } },
          { due_date: { gte: now, lte: reminderUntil } },
          { priority: 'URGENT' },
        ],
      },
      select: {
        title: true,
        due_date: true,
        priority: true,
      },
      orderBy: { due_date: 'asc' },
    })

    const candidates: NotificationCandidate[] = tasks.map((task) => {
      const dueDate = task.due_date ? new Date(task.due_date) : null

      if (dueDate && dueDate < now) {
        return {
          type: notification_type.DEADLINE_ALERT,
          title: 'Overdue Task',
          message: `${task.title} is overdue.`,
        }
      }

      if (dueDate && dueDate <= reminderUntil) {
        return {
          type: notification_type.DEADLINE_ALERT,
          title: 'Assignment Due Soon',
          message: `${task.title} is due soon.`,
        }
      }

      return {
        type: notification_type.AI_REMINDER,
        title: 'Urgent Task',
        message: `${task.title} is marked urgent.`,
      }
    })

    if (candidates.length === 0) {
      return ok({ created_count: 0, notifications: [] })
    }

    const existingNotifications = await prisma.notification.findMany({
      where: {
        user_id: user.userId,
        OR: candidates.map((notification) => ({
          type: notification.type,
          title: notification.title,
          message: notification.message,
        })),
      },
      select: {
        type: true,
        title: true,
        message: true,
      },
    })

    const seenKeys = new Set(existingNotifications.map(notificationKey))
    const newNotifications = candidates.filter((notification) => {
      const key = notificationKey(notification)
      if (seenKeys.has(key)) return false
      seenKeys.add(key)
      return true
    })

    if (newNotifications.length === 0) {
      return ok({ created_count: 0, notifications: [] })
    }

    await prisma.notification.createMany({
      data: newNotifications.map((notification) => ({
        ...notification,
        user_id: user.userId,
      })),
    })

    return ok({
      created_count: newNotifications.length,
      notifications: newNotifications,
    })
  } catch (error) {
    console.error('[NOTIFICATIONS SYNC]', error)
    return serverError()
  }
}
