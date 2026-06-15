import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { aiBurnoutSchema } from '@/lib/validators'
import { ok, badRequest, unauthorized, forbidden, serverError, serviceUnavailable, gatewayTimeout } from '@/lib/response'
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from '@/lib/rateLimit'

const AI_TIMEOUT_MS = 10000

export async function GET(request: Request) {
  const user = getUserFromRequest(request)

  if (!user) return unauthorized()

  try {
    const insight = await prisma.ai_insight.findFirst({
      where: {
        user_id: user.userId,
      },
      orderBy: {
        generated_at: "desc",
      },
    })

    if (!insight) {
      return ok(null)
    }

    const rawPayload =
      insight.raw_payload &&
      typeof insight.raw_payload === "object" &&
      !Array.isArray(insight.raw_payload)
        ? insight.raw_payload as Record<string, unknown>
        : {}

    const reasons = Array.isArray(rawPayload.reasons)
      ? rawPayload.reasons.filter(
          (reason): reason is string =>
            typeof reason === "string"
        )
      : []

    return ok({
      burnoutRiskScore:
        payload.burnout_risk_score ?? 0,

      riskLevel:
        payload.burnout_risk_label ?? "UNKNOWN",

      reasons,

      recommendations:
        payload.recommendations ?? [],

      generatedAt:
        insight.generated_at,

      insightId:
        insight.ai_insight_id,

      aiAvailable:
        success,

      fallbackUsed:
        !success,
    })
  } catch (error) {
    console.error("[GET BURNOUT]", error)
    return serverError()
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  const user = getUserFromRequest(request)
  if (!user) return unauthorized()

  try {
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`ai-burnout:${user.userId}:${ip}`, AI_RATE_LIMIT)
    if (!allowed) {
      return Response.json({ success: false, error: 'Too Many Requests', message: 'AI rate limit exceeded' }, { status: 429 })
    }

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const body = await request.json().catch(() => null)
    const parsed = aiBurnoutSchema.safeParse(body ?? {})
    const daysBack = parsed.success ? parsed.data.days_back : 7

    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    const [sessions, tasks, streak, breakLogs] = await Promise.all([
      prisma.study_session.findMany({
        where: { user_id: user.userId, start_time: { gte: since } },
        select: { start_time: true, duration_mins: true, focus_score: true, interruption_count: true },
      }),
      prisma.task.findMany({
        where: { user_id: user.userId, updated_at: { gte: since } },
        select: { status: true, priority: true },
      }),
      prisma.study_streak.findUnique({ where: { user_id: user.userId } }),
      prisma.break_log.findMany({
        where: { user_id: user.userId, start_time: { gte: since } },
        select: { duration_mins: true },
      }),
    ])

    const inputData = {
      days_back: daysBack,
      sessions_count: sessions.length,
      total_study_mins: sessions.reduce((a, s) => a + (s.duration_mins ?? 0), 0),
      avg_focus_score: sessions.length ? sessions.reduce((a, s) => a + (s.focus_score ?? 0), 0) / sessions.length : null,
      avg_interruptions: sessions.length ? sessions.reduce((a, s) => a + s.interruption_count, 0) / sessions.length : null,
      current_streak: streak?.current_streak ?? 0,
      break_count: breakLogs.length,
      total_break_mins: breakLogs.reduce((a, b) => a + b.duration_mins, 0),
      task_completion_rate: tasks.length ? tasks.filter((t) => t.status === 'COMPLETED').length / tasks.length : null,
      overdue_tasks: tasks.filter((t) => t.status === 'OVERDUE').length,
    }

    let aiOutput: unknown = null
    let success = false
    let errorMsg: string | null = null

    if (process.env.AI_SERVICE_URL && process.env.AI_SERVICE_KEY) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

        const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/burnout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_SERVICE_KEY}` },
          body: JSON.stringify(inputData),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout))

        if (!aiResponse.ok) {
          errorMsg = `AI service responded with ${aiResponse.status}`
        } else {
          aiOutput = await aiResponse.json()
          success = true
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          await logAiRequest(user.userId, 'burnout', inputData, null, Date.now() - startTime, false, 'Timeout')
          return gatewayTimeout()
        }
        errorMsg = err instanceof Error ? err.message : 'AI service error'
      }
    } else {
      aiOutput = buildBurnoutFallback(inputData)
      errorMsg = 'AI service not configured'
    }

    await logAiRequest(user.userId, 'burnout', inputData, aiOutput, Date.now() - startTime, success, errorMsg)

    if (!success && !aiOutput) return serviceUnavailable()

    const payload = aiOutput as { burnout_risk_score?: number; burnout_risk_label?: string; recommendations?: string[] }

    const insight = await prisma.ai_insight.create({
      data: {
        user_id: user.userId,
        burnout_risk_score: payload.burnout_risk_score ?? null,
        burnout_risk_label: payload.burnout_risk_label ?? null,
        study_streak_days: streak?.current_streak ?? 0,
        recommendations: payload.recommendations ?? [],
        raw_payload: aiOutput as never,
      },
    })

    if ((payload.burnout_risk_score ?? 0) >= 70) {
      await prisma.notification.create({
        data: {
          user_id: user.userId,
          type: 'BURNOUT_ALERT',
          title: 'Burnout Risk Detected',
          message: `Your burnout risk score is ${payload.burnout_risk_score}. Consider taking a break and redistributing your workload.`,
        },
      })
    }

    return ok({ analysis: aiOutput, insight_id: insight.ai_insight_id, ai_available: success, fallback_used: !success })
  } catch (error) {
    console.error('[AI BURNOUT]', error)
    return serverError()
  }
}

async function logAiRequest(userId: string, feature: string, input: unknown, output: unknown, latencyMs: number, success: boolean, errorMsg: string | null) {
  try {
    await prisma.ai_request_log.create({
      data: { user_id: userId, feature, input_data: input as never, output_data: (output ?? {}) as never, latency_ms: latencyMs, success, error_msg: errorMsg },
    })
  } catch { /* non-critical */ }
}

function buildBurnoutFallback(data: { total_study_mins: number; sessions_count: number; current_streak: number; overdue_tasks: number; avg_focus_score: number | null }) {
  let score = 0
  if (data.total_study_mins > 420) score += 30
  if (data.sessions_count > 10) score += 20
  if (data.current_streak > 14) score += 20
  if (data.overdue_tasks > 3) score += 20
  if (data.avg_focus_score !== null && data.avg_focus_score < 50) score += 10

  const label = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'

  return {
    burnout_risk_score: Math.min(score, 100),
    burnout_risk_label: label,
    recommendations: [
      score >= 70 ? 'Take at least one full rest day this week.' : 'Maintain regular break intervals.',
      'Limit study sessions to 90 minutes with breaks in between.',
      'Prioritise sleep and avoid late-night sessions.',
    ],
    note: 'Generated by rule-based fallback. AI service unavailable.',
  }
}