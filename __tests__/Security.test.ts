/**
 * @jest-environment jsdom
 */

import { sanitizeObject, sanitizeString } from '@/lib/sanitize'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notification_settings: {
      create: jest.fn(),
    },
    pomodoro_settings: {
      create: jest.fn(),
    },
  },
}))

const mockSetCookie = jest.fn()

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: mockSetCookie,
  })),
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async (password: string) => `hashed-${password}`),
  comparePassword: jest.fn(async (password: string, hash: string) => password === 'Password123'),
  generateAccessToken: jest.fn(() => 'access-token'),
  generateRefreshToken: jest.fn(() => 'refresh-token'),
  setAuthCookies: jest.fn(async () => undefined),
  getAccessTokenFromRequest: jest.fn((request: Request) => {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/(?:^|;\s*)wr_access=([^;]+)/)
    return match ? match[1] : null
  }),
  verifyAccessToken: jest.fn((token: string) => {
    if (token === 'user-token') return { userId: 'user-1', email: 'test@example.com', role: 'USER' }
    if (token === 'admin-token') return { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }
    return null
  }),
  getUserFromRequest: jest.fn((request: Request) => {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/(?:^|;\s*)wr_access=([^;]+)/)
    const token = match ? match[1] : null
    if (token === 'user-token') return { userId: 'user-1', email: 'test@example.com', role: 'USER' }
    if (token === 'admin-token') return { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }
    return null
  }),
}))

jest.mock('@/lib/csrf', () => ({
  generateCsrfToken: jest.fn(() => 'csrf-token'),
}))

const { POST: registerPost } = require('@/app/api/auth/register/route')
const { POST: loginPost } = require('@/app/api/auth/login/route')
const { GET: meGet } = require('@/app/api/auth/me/route')
const { GET: adminUsersGet } = require('@/app/api/v1/admin/users/route')

function buildRequest(url: string, options: RequestInit = {}) {
  const request = new Request(url, options)
  if (options.headers) {
    const headers = new Headers(options.headers as HeadersInit)
    Object.defineProperty(request, 'headers', {
      value: headers,
      writable: false,
      configurable: true,
    })
  }
  return request
}

describe('Security coverage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('escapes dangerous characters in sanitizeString', () => {
    expect(sanitizeString('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;')
    expect(sanitizeString('" onmouseover="evil()')).toBe('&quot; onmouseover=&quot;evil()')
  })

  it('recursively escapes nested objects and arrays', () => {
    const input = {
      name: '<img src=x onerror=alert(1)>',
      metadata: ['<b>bold</b>', { note: "<script>evil()</script>" }],
    }

    expect(sanitizeObject(input)).toEqual({
      name: '&lt;img src=x onerror=alert(1)&gt;',
      metadata: ['&lt;b&gt;bold&lt;&#x2F;b&gt;', { note: '&lt;script&gt;evil()&lt;&#x2F;script&gt;' }],
    })
  })

  it('rejects invalid registration payloads that resemble injection attempts', async () => {
    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: "Robert'); DROP TABLE users;--",
        email: "' OR '1'='1",
        password: 'Password123',
      }),
    })

    const response = await registerPost(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Bad Request')
    expect(body.message).toBe('Validation failed')
  })

  it('passes sanitized registration values through to Prisma create', async () => {
    const userCreate = (prisma.user.create as jest.Mock).mockResolvedValue({
      user_id: 'user-1',
      name: '&lt;script&gt;alert(1)&lt;/script&gt;',
      email: 'test@example.com',
      role: 'USER',
      created_at: '2026-06-16T00:00:00.000Z',
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.notification_settings.create as jest.Mock).mockResolvedValue({})
    ;(prisma.pomodoro_settings.create as jest.Mock).mockResolvedValue({})

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '<script>alert(1)</script>',
        email: 'Test@Example.com',
        password: 'Password123',
      }),
    })

    const response = await registerPost(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;',
          email: 'test@example.com',
        }),
      })
    )
    expect(body.success).toBe(true)
    expect(body.data.user.email).toBe('test@example.com')
  })

  it('rejects invalid login payloads that look like injection strings', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: "admin' OR '1'='1", password: 'Password123' }),
    })

    const response = await loginPost(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Bad Request')
    expect(body.message).toBe('Validation failed')
  })

  it('enforces authentication on /api/auth/me without access token', async () => {
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {},
    })

    const response = await meGet(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('rejects non-admin access to admin endpoints', async () => {
    const request = {
      url: 'http://localhost/api/v1/admin/users',
      headers: {
        get: (name: string) => (name.toLowerCase() === 'cookie' ? 'wr_access=user-token' : null),
      },
    } as unknown as Request

    const response = await adminUsersGet(request)
    const body = await response.json()

    expect([401, 403]).toContain(response.status)
    expect(body.success).toBe(false)
  })
})
