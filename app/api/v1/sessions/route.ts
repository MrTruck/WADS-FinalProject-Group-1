import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { createSessionSchema } from '@/lib/validators'
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/lib/response'
import { sanitizeObject } from '@/lib/sanitize'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const sessions = await prisma.study_session.findMany({
      where: {
        user_id: user.userId,
        ...(from || to ? { start_time: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
      },
      include: { task: { select: { task_id: true, title: true, priority: true } } },
      orderBy: { start_time: 'desc' },
    })

    return ok({ sessions, count: sessions.length })
  } catch (error) {
    console.error('[SESSIONS GET]', error)
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

    const result = createSessionSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const data = sanitizeObject(result.data)

    let task = null
    if (data.task_id) {
      task = await prisma.task.findFirst({ where: { task_id: data.task_id, user_id: user.userId } })
      if (!task) return badRequest('Task not found or does not belong to you')
    }

    let duration_mins = data.duration_mins
    if (!duration_mins && data.end_time) {
      const diff = new Date(data.end_time).getTime() - new Date(data.start_time).getTime()
      duration_mins = Math.round(diff / 60000)
    }

    const session = await prisma.study_session.create({
      data: {
        ...data,
        start_time: new Date(data.start_time),
        end_time: data.end_time ? new Date(data.end_time) : null,
        duration_mins,
        user_id: user.userId,
      },
      include: { task: { select: { task_id: true, title: true } } },
    })

    await updateStreak(user.userId)
    return created({ session })
  } catch (error) {
    console.error('[SESSIONS POST]', error)
    return serverError()
  }
}

async function updateStreak(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const streak = await prisma.study_streak.findUnique({ where: { user_id: userId } })

    if (!streak) {
      await prisma.study_streak.create({
        data: { user_id: userId, current_streak: 1, longest_streak: 1, last_study_date: today },
      })
      return
    }

    const last = new Date(streak.last_study_date)
    last.setHours(0, 0, 0, 0)
    const diff = Math.floor((today.getTime() - last.getTime()) / 86400000)

    if (diff === 0) return
    if (diff === 1) {
      const newStreak = streak.current_streak + 1
      await prisma.study_streak.update({
        where: { user_id: userId },
        data: {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_study_date: today,
        },
      })
    } else {
      await prisma.study_streak.update({
        where: { user_id: userId },
        data: { current_streak: 1, last_study_date: today },
      })
    }
  } catch {
    // non-critical
  }
}