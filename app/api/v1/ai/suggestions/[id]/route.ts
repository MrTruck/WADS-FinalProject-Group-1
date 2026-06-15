import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { ok, unauthorized, forbidden, notFound, serverError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken || !validateCsrfToken(csrfToken, user.userId)) return forbidden('Invalid or missing CSRF token')

    const { id } = await params
    const url = new URL(request.url)
    const isAccept = url.pathname.endsWith('/accept')

    const suggestion = await prisma.ai_suggestion.findFirst({ where: { ai_suggestion_id: id, user_id: user.userId } })
    if (!suggestion) return notFound('AI suggestion')

    if (isAccept) {
      const updated = await prisma.ai_suggestion.update({
        where: { ai_suggestion_id: id },
        data: { status: 'ACCEPTED', accepted_at: new Date() },
      })

      if (suggestion.scheduled_at) {
        const endTime = new Date(suggestion.scheduled_at)
        endTime.setHours(endTime.getHours() + 1)
        await prisma.calendar_event.create({
          data: {
            user_id: user.userId,
            title: suggestion.title,
            start_time: suggestion.scheduled_at,
            end_time: endTime,
            source: 'MANUAL',
            is_ai_generated: true,
          },
        })
      }

      return ok({ suggestion: updated, message: 'Suggestion accepted and added to calendar' })
    }

    const updated = await prisma.ai_suggestion.update({
      where: { ai_suggestion_id: id },
      data: { status: 'DISMISSED', dismissed_at: new Date() },
    })

    return ok({ suggestion: updated, message: 'Suggestion dismissed' })
  } catch (error) {
    console.error('[AI SUGGESTION PUT]', error)
    return serverError()
  }
}