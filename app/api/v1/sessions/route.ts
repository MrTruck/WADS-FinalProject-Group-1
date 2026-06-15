/**
 * @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: Get all study sessions for the current user
 *     tags: [Study Sessions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of sessions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Start a new study session
 *     tags: [Study Sessions]
 *     security:
 *       - cookieAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task_id, subject, comprehension, start_time]
 *             properties:
 *               task_id: { type: string }
 *               subject: { type: string }
 *               comprehension: { type: integer, minimum: 0, maximum: 100 }
 *               start_time: { type: string, format: date-time }
 *               session_type: { type: string, enum: [FOCUS, REVIEW, PRACTICE, READING] }
 *               end_time: { type: string, format: date-time }
 *               duration_mins: { type: integer }
 *               break_minutes: { type: integer }
 *               session_tags: { type: array, items: { type: string } }
 *               focus_score: { type: integer, minimum: 0, maximum: 100 }
 *               interruption_count: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Session created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid CSRF token
 *       500:
 *         description: Server error
 */

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

    const where: any = { user_id: user.userId }
    if (from || to) {
      where.start_time = {}
      if (from) where.start_time.gte = new Date(from)
      if (to) where.start_time.lte = new Date(to)
    }

    const sessions = await prisma.study_session.findMany({
      where,
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
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) {
      return forbidden('Invalid or missing CSRF token')
    }

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    // Validate core fields with Zod (task_id, start_time, etc.)
    const result = createSessionSchema.safeParse(body)
    if (!result.success) {
      return badRequest('Validation failed', result.error.flatten().fieldErrors)
    }

    const validatedData = result.data
    const sanitized = sanitizeObject(validatedData)

    // Extract fields required by Prisma that are not in the Zod schema
    const subject = body.subject
    const comprehension = body.comprehension
    if (!subject || comprehension === undefined) {
      return badRequest('Missing required fields: subject, comprehension')
    }

    const taskId = sanitized.task_id
    if (!taskId) return badRequest('Task ID is required')

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { task_id: taskId, user_id: user.userId },
    })
    if (!task) return badRequest('Task not found or does not belong to you')

    // Calculate duration if not provided but end_time exists
    let duration_mins = sanitized.duration_mins
    if (!duration_mins && sanitized.end_time) {
      const diff = new Date(sanitized.end_time).getTime() - new Date(sanitized.start_time).getTime()
      duration_mins = Math.round(diff / 60000)
    }

    // Create session – all fields from Prisma schema are provided
    const session = await prisma.study_session.create({
      data: {
        user_id: user.userId,
        task_id: taskId,
        subject: subject,
        comprehension: comprehension,
        session_type: sanitized.session_type ?? 'FOCUS',
        session_tags: body.session_tags ?? [],
        start_time: new Date(sanitized.start_time),
        end_time: sanitized.end_time ? new Date(sanitized.end_time) : null,
        duration_mins: duration_mins ?? null,
        break_minutes: body.break_minutes ?? null,
        focus_score: sanitized.focus_score ?? null,
        interruption_count: sanitized.interruption_count ?? 0,
        interruption_reason: sanitized.interruption_reason ?? null,
        notes: sanitized.notes ?? null,
      },
      include: { task: { select: { task_id: true, title: true } } },
    })

    // Update study streak in the background (non‑blocking)
    updateStreak(user.userId).catch((err) => console.error('Streak update failed:', err))

    return created({ session })
  } catch (error) {
    console.error('[SESSIONS POST]', error)
    return serverError()
  }
}

async function updateStreak(userId: string) {
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
}