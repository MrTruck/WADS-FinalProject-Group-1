/**
 * @swagger
 * /api/v1/ai/summary:
 *   post:
 *     summary: Get AI productivity summary
 *     tags: [AI]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days: { type: integer, default: 14 }
 *     responses:
 *       200: { description: Summary and recommendations }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       429: { description: Rate limit exceeded }
 *       503: { description: AI unavailable }
 *       504: { description: AI timeout }
 */
import { getUserFromRequest } from '@/lib/auth'
import { fetchUserAnalytics } from '@/lib/ai/analytics'
import { callLLM, type LLMMessage } from '@/lib/ai/groq'
import { ok, badRequest, unauthorized, serverError, serviceUnavailable, gatewayTimeout } from '@/lib/response'
import { checkRateLimit, AI_RATE_LIMIT, getClientIp } from '@/lib/rateLimit'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const AI_TIMEOUT_MS = 10000
const summarySchema = z.object({ days: z.number().min(1).max(30).default(14) })

export async function POST(request: Request) {
  const startTime = Date.now()
  const user = getUserFromRequest(request)
  if (!user) return unauthorized()

  try {
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`ai-summary:${user.userId}:${ip}`, AI_RATE_LIMIT)
    if (!allowed) return Response.json({ success: false, error: 'Too Many Requests' }, { status: 429 })

    const body = await request.json().catch(() => null)
    const parsed = summarySchema.safeParse(body ?? {})
    if (!parsed.success) return badRequest('Invalid input', parsed.error.flatten().fieldErrors)

    const days = parsed.data.days
    const analytics = await fetchUserAnalytics(user.userId)
    const inputData = { days, analytics }

    let aiOutput: unknown = null
    let success = false
    let errorMsg: string | null = null

    try {
      const systemInstruction = `You are a productivity coach. Output **only** valid JSON.`
      const userPrompt = `Data (last ${days} days): ${JSON.stringify(analytics)}. Output JSON: { "summaryText": "string", "recommendations": ["string"] }`
      const messages: LLMMessage[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ]
      const llmPromise = callLLM(messages, { temperature: 0.5, max_tokens: 800 })
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), AI_TIMEOUT_MS))
      const llmResponse = (await Promise.race([llmPromise, timeoutPromise])) as string
      aiOutput = JSON.parse(llmResponse)
      success = true
    } catch (err) {
      if (err instanceof Error && err.message === 'Timeout') {
        await logAiRequest(user.userId, 'summary', inputData, null, Date.now() - startTime, false, 'Timeout')
        return gatewayTimeout()
      }
      errorMsg = err instanceof Error ? err.message : 'LLM error'
      aiOutput = buildFallbackSummary(analytics)
      success = false
    }

    await logAiRequest(user.userId, 'summary', inputData, aiOutput, Date.now() - startTime, success, errorMsg)
    if (!aiOutput) return serviceUnavailable()
    return ok({ analysis: aiOutput, ai_available: success, fallback_used: !success })
  } catch (error) {
    console.error('[AI SUMMARY]', error)
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

function buildFallbackSummary(analytics: any) {
  const completion = analytics.completionRate ?? 0
  const studyMins = analytics.totalStudyMins ?? 0
  let summaryText = `You have completed ${completion}% of your tasks and studied ${Math.round(studyMins / 60)} hours in the last 30 days.`
  if (studyMins < 60) {
    summaryText += ' Try to establish a consistent study routine.'
  } else if (completion < 50) {
    summaryText += ' Focus on breaking tasks into smaller steps to improve completion rate.'
  } else {
    summaryText += ' Great job! Keep up the momentum.'
  }
  return {
    summaryText,
    recommendations: [
      'Schedule short breaks during study sessions.',
      'Prioritise tasks with upcoming deadlines.',
      'Review your weekly progress every Sunday.',
    ],
  }
}