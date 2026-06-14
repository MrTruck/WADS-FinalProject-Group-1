import { clearAuthCookies, getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()
    await clearAuthCookies()
    return ok({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[LOGOUT]', error)
    return serverError()
  }
}