import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const latest = await prisma.ai_insight.findFirst({
      where: { user_id: user.userId },
      orderBy: { generated_at: 'desc' },
    })

    const history = await prisma.ai_insight.findMany({
      where: { user_id: user.userId },
      orderBy: { generated_at: 'desc' },
      take: 5,
      select: {
        ai_insight_id: true,
        burnout_risk_score: true,
        burnout_risk_label: true,
        study_streak_days: true,
        weekly_hours: true,
        recommendations: true,
        generated_at: true,
      },
    })

    return ok({ latest, history })
  } catch (error) {
    console.error('[AI INSIGHTS GET]', error)
    return serverError()
  }
}