import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { aiScheduleSchema } from '@/lib/validators'
import { created, badRequest, unauthorized, forbidden, serverError, serviceUnavailable, gatewayTimeout } from '@/lib/response'
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from '@/lib/rateLimit'

const AI_TIMEOUT_MS = 10000

export async function POST(request: Request) {
  const startTime = Date.now()
  const user = getUserFromRequest(request)
  if (!user) return unauthorized()

  try {
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`ai-schedule:${user.userId}:${ip}`, AI_RATE_LIMIT)
    if (!allowed) {
      return Response.json({ success: false, error: 'Too Many Requests', message: 'AI rate limit exceeded' }, { status: 429 })
    }

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    const result = aiScheduleSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    const tasks = await prisma.task.findMany({
      where: { task_id: { in: result.data.task_ids }, user_id: user.userId, status: { not: 'COMPLETED' } },
      select: { task_id: true, title: true, priority: true, difficulty: true, due_date: true, estimated_hours: true },
    })

    const preferences = await prisma.user_preferences.findUnique({ where: { user_id: user.userId } })
    const inputData = { tasks, preferences, user_preferences: result.data.preferences }

    let aiOutput: unknown = null
    let success = false
    let errorMsg: string | null = null
    let suggestions: unknown[] = []

    if (process.env.AI_SERVICE_URL && process.env.AI_SERVICE_KEY) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

        const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/schedule`, {
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
          await logAiRequest(user.userId, 'schedule', inputData, null, Date.now() - startTime, false, 'Timeout')
          return gatewayTimeout()
        }
        errorMsg = err instanceof Error ? err.message : 'AI service error'
      }
    } else {
      aiOutput = buildScheduleFallback(tasks)
      errorMsg = 'AI service not configured'
    }

    await logAiRequest(user.userId, 'schedule', inputData, aiOutput, Date.now() - startTime, success, errorMsg)

    if (!success && !aiOutput) return serviceUnavailable()

    if (success && aiOutput) {
      const payload = aiOutput as { suggestions?: Array<{ title: string; description: string; scheduled_at?: string }> }
      if (Array.isArray(payload.suggestions)) {
        suggestions = await Promise.all(
          payload.suggestions.map((s) =>
            prisma.ai_suggestion.create({
              data: { user_id: user.userId, title: s.title, description: s.description, scheduled_at: s.scheduled_at ? new Date(s.scheduled_at) : null },
            })
          )
        )
      }
    }

    return created({ schedule: aiOutput, suggestions, ai_available: success, fallback_used: !success })
  } catch (error) {
    console.error('[AI SCHEDULE]', error)
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

function buildScheduleFallback(tasks: Array<{ title: string; due_date: Date | null; priority: string }>) {
  return {
    message: 'AI service unavailable. Showing basic schedule based on priority and deadlines.',
    suggestions: tasks
      .sort((a, b) => (a.due_date ? new Date(a.due_date).getTime() : Infinity) - (b.due_date ? new Date(b.due_date).getTime() : Infinity))
      .map((t) => ({
        title: `Study: ${t.title}`,
        description: `Priority: ${t.priority}. Due: ${t.due_date ? new Date(t.due_date).toDateString() : 'no deadline'}`,
      })),
  }
}