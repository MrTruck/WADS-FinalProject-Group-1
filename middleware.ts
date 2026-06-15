import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ACCESS_COOKIE = 'wr_access'

const PUBLIC_ROUTES = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api-doc'
]

const ADMIN_ROUTES = ['/api/v1/admin']
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  if (isPublic) return response

  if (!pathname.startsWith('/api')) return response

  const token = request.cookies.get(ACCESS_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  let payload: { userId?: string; role?: string } = {}
  try {
    const base64Payload = token.split('.')[1]
    payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'))
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Invalid token format' },
      { status: 401 }
    )
  }

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  if (isAdminRoute && payload.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  if (MUTATING_METHODS.includes(method)) {
  const csrfToken =
    request.headers.get("x-csrf-token");

  if (!csrfToken) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "CSRF token missing",
      },
      { status: 403 }
    );
  }
}

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId || '')
  requestHeaders.set('x-user-role', payload.role || '')

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}