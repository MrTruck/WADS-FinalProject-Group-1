import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 30)

    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const sessions = await prisma.study_session.findMany({
      where: { user_id: user.userId, start_time: { gte: since } },
      select: { start_time: true, duration_mins: true, focus_score: true },
      orderBy: { start_time: 'asc' },
    })

    const dailyMap = new Map<string, { study_mins: number; session_count: number; focus_scores: number[] }>()

    for (const s of sessions) {
      const day = s.start_time.toISOString().split('T')[0]
      if (!dailyMap.has(day)) dailyMap.set(day, { study_mins: 0, session_count: 0, focus_scores: [] })
      const entry = dailyMap.get(day)!
      entry.study_mins += s.duration_mins ?? 0
      entry.session_count += 1
      if (s.focus_score !== null) entry.focus_scores.push(s.focus_score)
    }

    const trends = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      study_mins: data.study_mins,
      session_count: data.session_count,
      avg_focus_score: data.focus_scores.length > 0
        ? Math.round(data.focus_scores.reduce((a, b) => a + b, 0) / data.focus_scores.length)
        : null,
    }))

    return ok({ trends, period_days: days })
  } catch (error) {
    console.error('[ANALYTICS PRODUCTIVITY]', error)
    return serverError()
  }
}