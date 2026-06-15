/**
 * @swagger
 * /api/v1/ai/reschedule:
 *   post:
 *     summary: Suggest rescheduling for a task
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
 *             required: [task_id]
 *             properties:
 *               task_id: { type: string }
 *     responses:
 *       200: { description: Reschedule suggestion }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Invalid CSRF token }
 *       404: { description: Task not found }
 *       429: { description: Rate limit exceeded }
 *       503: { description: AI unavailable }
 *       504: { description: AI timeout }
 */
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { fetchUserAnalytics } from '@/lib/ai/analytics'
import { callLLM, type LLMMessage } from '@/lib/ai/groq'
import { ok, badRequest, unauthorized, forbidden, notFound, serverError, serviceUnavailable, gatewayTimeout } from '@/lib/response'
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from '@/lib/rateLimit'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createRescheduleSuggestion } from '@/lib/notifications/aiAlerts'

const AI_TIMEOUT_MS = 10000
const rescheduleSchema = z.object({ task_id: z.string(), missed_session_id: z.string().optional() })

export async function POST(request: Request) {
  const startTime = Date.now()
  const user = getUserFromRequest(request)
  if (!user) return unauthorized()

  try {
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`ai-reschedule:${user.userId}:${ip}`, AI_RATE_LIMIT)
    if (!allowed) return Response.json({ success: false, error: 'Too Many Requests' }, { status: 429 })

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body required')
    const parsed = rescheduleSchema.safeParse(body)
    if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten().fieldErrors)

    const { task_id } = parsed.data
    const task = await prisma.task.findFirst({
      where: { task_id, user_id: user.userId },
      select: { title: true, due_date: true, estimated_hours: true, status: true },
    })
    if (!task) return notFound('Task')

    const analytics = await fetchUserAnalytics(user.userId)
    const inputData = { task, analytics }
    let aiOutput: unknown = null
    let success = false
    let errorMsg: string | null = null

    try {
      const systemInstruction = `You are a study planner. Output JSON only.`
      const userPrompt = `Task: ${JSON.stringify(task)}. User availability: ${JSON.stringify(analytics)}. Suggest new time slot. Output JSON: { "newStartTime": "ISO datetime", "newEndTime": "ISO datetime", "reason": "string", "alternativeDuration": number }`
      const messages: LLMMessage[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ]
      const llmPromise = callLLM(messages, { temperature: 0.4, max_tokens: 500 })
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), AI_TIMEOUT_MS))
      const llmResponse = (await Promise.race([llmPromise, timeoutPromise])) as string
      aiOutput = JSON.parse(llmResponse)
      success = true
    } catch (err) {
      if (err instanceof Error && err.message === 'Timeout') {
        await logAiRequest(user.userId, 'reschedule', inputData, null, Date.now() - startTime, false, 'Timeout')
        return gatewayTimeout()
      }
      errorMsg = err instanceof Error ? err.message : 'LLM error'
      aiOutput = buildRescheduleFallback(task, analytics)
      success = false
    }

    await logAiRequest(user.userId, 'reschedule', inputData, aiOutput, Date.now() - startTime, success, errorMsg)
    if (!aiOutput) return serviceUnavailable()
    await createRescheduleSuggestion(user.userId, task_id, aiOutput)
    return ok({ suggestion: aiOutput, ai_available: success, fallback_used: !success })
  } catch (error) {
    console.error('[AI RESCHEDULE]', error)
    return serverError()
  }
}

async function logAiRequest(
  userId: string,
  feature: string,
  input: unknown,
  output: unknown,
  latencyMs: number,
  success: boolean,
  errorMsg: string | null
) {
  try {
    await prisma.ai_request_log.create({
      data: {
        user_id: userId,
        feature,
        input_data: input as never,
        output_data: (output ?? {}) as never,
        latency_ms: latencyMs,
        success,
        error_msg: errorMsg,
      },
    })
  } catch {
    /* non-critical */
  }
}

function buildRescheduleFallback(task: any, analytics: any) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0) // default 9am
  const startTime = tomorrow.toISOString()
  const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString()
  return {
    newStartTime: startTime,
    newEndTime: endTime,
    reason: 'AI service unavailable – suggested default slot tomorrow morning.',
    alternativeDuration: 60,
  }
}