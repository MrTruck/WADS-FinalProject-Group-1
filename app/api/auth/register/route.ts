/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Test1234
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 *       429:
 *         description: Too many requests
 */

import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'
import { created, badRequest, conflict, serverError } from '@/lib/response'
import { checkRateLimit, AUTH_RATE_LIMIT, getClientIp } from '@/lib/rateLimit'
import { sanitizeObject } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    // Rate limiting: prevent brute force registration
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`register:${ip}`, AUTH_RATE_LIMIT)
    if (!allowed) {
      return Response.json(
        { success: false, error: 'Too Many Requests', message: 'Too many registration attempts. Try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Request body is required')

    // Validate input with Zod schema
    const result = registerSchema.safeParse(body)
    if (!result.success) return badRequest('Validation failed', result.error.flatten().fieldErrors)

    // Sanitize input to prevent XSS
    const { name, email, password } = sanitizeObject(result.data)

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return conflict('An account with this email already exists')

    // Hash password before storing
    const hashedPassword = await hashPassword(password)

    // Create user in database
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { user_id: true, name: true, email: true, role: true, created_at: true },
    })

    // Create default settings for new user
    await prisma.notification_settings.create({ data: { user_id: user.user_id } })
    await prisma.pomodoro_settings.create({ data: { user_id: user.user_id } })

    // Return created user (excludes password)
    return created({ user })
  } catch (error) {
    console.error('[REGISTER]', error)
    return serverError()
  }
}