import { verifyRefreshToken, generateAccessToken, generateRefreshToken, getRefreshTokenFromRequest, setAuthCookies } from '@/lib/auth'
import { generateCsrfToken } from '@/lib/csrf'
import { ok, unauthorized, serverError } from '@/lib/response'

export async function POST(request: Request) {
  try {
    const refreshToken = getRefreshTokenFromRequest(request)
    if (!refreshToken) return unauthorized('Refresh token missing')

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) return unauthorized('Refresh token is invalid or expired')

    const newPayload = { userId: payload.userId, email: payload.email, role: payload.role }
    const newAccess = generateAccessToken(newPayload)
    const newRefresh = generateRefreshToken(newPayload)

    await setAuthCookies(newAccess, newRefresh)

    const csrfToken = generateCsrfToken(payload.userId)
    return ok({ csrf_token: csrfToken, message: 'Token refreshed successfully' })
  } catch (error) {
    console.error('[REFRESH]', error)
    return serverError()
  }
}