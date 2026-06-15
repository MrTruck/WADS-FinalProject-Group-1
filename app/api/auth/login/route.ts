import { prisma } from '@/lib/prisma'
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from '@/lib/auth'
import { generateCsrfToken } from '@/lib/csrf'
import { loginSchema } from '@/lib/validators'
import {
  ok,
  badRequest,
  unauthorized,
  serverError,
} from '@/lib/response'
import {
  checkRateLimit,
  AUTH_RATE_LIMIT,
  getClientIp,
} from '@/lib/rateLimit'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)

    const { allowed } = checkRateLimit(
      `login:${ip}`,
      AUTH_RATE_LIMIT
    )

    if (!allowed) {
      return Response.json(
        {
          success: false,
          error: 'Too Many Requests',
          message:
            'Too many login attempts. Try again in 15 minutes.',
        },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)

    if (!body) {
      return badRequest('Request body is required')
    }

    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return badRequest(
        'Validation failed',
        result.error.flatten().fieldErrors
      )
    }

    const { email, password } = result.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return unauthorized('Invalid email or password')
    }

    const match = await comparePassword(
      password,
      user.password
    )

    if (!match) {
      return unauthorized('Invalid email or password')
    }

    const payload = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    await setAuthCookies(accessToken, refreshToken)

    // CREATE TOKEN FIRST
    const csrfToken = generateCsrfToken(user.user_id)

    // THEN STORE TOKEN
    const cookieStore = await cookies()

    cookieStore.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return ok({
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      csrf_token: csrfToken,
    })
  } 
  catch (error) {
  console.error("LOGIN API ERROR:", error)

  return Response.json(
    {
      error: "Login failed",
      message:
        error instanceof Error
          ? error.message
          : String(error),
    },
    { status: 500 }
  )
  }
}