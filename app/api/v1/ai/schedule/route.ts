/**
 * @swagger
 * /api/v1/ai/schedule:
 *   post:
 *     summary: Generate AI study schedule
 *     tags: [AI]
 *     security:
 *       - cookieAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task_ids]
 *             properties:
 *               task_ids: { type: array, items: { type: string } }
 *               days: { type: integer, default: 7 }
 *     responses:
 *       201: { description: Schedule created }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Invalid CSRF token }
 *       429: { description: Rate limit exceeded }
 *       503: { description: AI unavailable (fallback) }
 *       504: { description: AI timeout }
 */
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { aiScheduleSchema } from '@/lib/validators'
import { created, badRequest, unauthorized, forbidden, serverError, serviceUnavailable, gatewayTimeout } from '@/lib/response'
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from '@/lib/rateLimit'
import { callLLM, type LLMMessage } from '@/lib/ai/groq'
import { fetchUserAnalytics } from '@/lib/ai/analytics'

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

    const analytics = await fetchUserAnalytics(user.userId)

    const inputData = { tasks, analytics, preferences: result.data.preferences }

    let aiOutput: unknown = null
    let success = false
    let errorMsg: string | null = null
    let suggestions: unknown[] = []

    try {
      const systemInstruction = `You are a study schedule optimizer. Output **only** valid JSON.`
      const userPrompt = `
Tasks: ${JSON.stringify(tasks)}
User analytics: ${JSON.stringify(analytics)}
Preferences: ${JSON.stringify(result.data.preferences)}
Output JSON: { "suggestions": [{ "title": "string", "description": "string", "scheduled_at": "ISO datetime or null" }] }
`
      const messages: LLMMessage[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ]
      const llmPromise = callLLM(messages, { temperature: 0.3, max_tokens: 2000 })
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), AI_TIMEOUT_MS))
      const llmResponse = (await Promise.race([llmPromise, timeoutPromise])) as string
      aiOutput = JSON.parse(llmResponse)
      success = true
    } catch (err) {
      if (err instanceof Error && err.message === 'Timeout') {
        await logAiRequest(user.userId, 'schedule', inputData, null, Date.now() - startTime, false, 'Timeout')
        return gatewayTimeout()
      }
      errorMsg = err instanceof Error ? err.message : 'LLM error'
      aiOutput = buildScheduleFallback(tasks)
      success = false
    }

    await logAiRequest(user.userId, 'schedule', inputData, aiOutput, Date.now() - startTime, success, errorMsg)

    if (!success && !aiOutput) return serviceUnavailable()

    if (success && aiOutput && typeof aiOutput === 'object' && 'suggestions' in aiOutput && Array.isArray(aiOutput.suggestions)) {
      suggestions = await Promise.all(
        aiOutput.suggestions.map((s: any) =>
          prisma.ai_suggestion.create({
            data: {
              user_id: user.userId,
              title: s.title,
              description: s.description,
              scheduled_at: s.scheduled_at ? new Date(s.scheduled_at) : null,
            },
          })
        )
      )
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