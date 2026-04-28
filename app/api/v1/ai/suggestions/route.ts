import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const suggestions = await prisma.ai_suggestion.findMany({
      where: { user_id: user.userId, status: 'ACTIVE' },
      orderBy: { created_at: 'desc' },
    })

    return ok({ suggestions, count: suggestions.length })
  } catch (error) {
    console.error('[AI SUGGESTIONS GET]', error)
    return serverError()
  }
}