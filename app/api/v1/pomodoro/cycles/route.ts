import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const cycles = await prisma.pomodoro_cycle.findMany({
      where: {
        user_id: user.userId,
        ...(from || to ? { start_time: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
      },
      orderBy: { start_time: 'desc' },
    })

    return ok({
      cycles,
      count: cycles.length,
      completed_count: cycles.filter((c) => c.is_completed).length,
    })
  } catch (error) {
    console.error('[POMODORO CYCLES GET]', error)
    return serverError()
  }
}