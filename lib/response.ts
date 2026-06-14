// lib/response.ts
import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(message: string, errors?: unknown) {
  return NextResponse.json(
    { success: false, error: 'Bad Request', message, ...(errors ? { errors } : {}) },
    { status: 400 }
  )
}

export function unauthorized(message = 'Missing or invalid authentication token') {
  return NextResponse.json(
    { success: false, error: 'Unauthorized', message },
    { status: 401 }
  )
}

export function forbidden(message = 'You do not have permission to perform this action') {
  return NextResponse.json(
    { success: false, error: 'Forbidden', message },
    { status: 403 }
  )
}

export function notFound(resource = 'Resource') {
  return NextResponse.json(
    { success: false, error: 'Not Found', message: `${resource} not found` },
    { status: 404 }
  )
}

export function conflict(message: string) {
  return NextResponse.json(
    { success: false, error: 'Conflict', message },
    { status: 409 }
  )
}

export function tooManyRequests(message = 'Too many requests. Please slow down.') {
  return NextResponse.json(
    { success: false, error: 'Too Many Requests', message },
    { status: 429 }
  )
}

export function serverError(message = 'An unexpected error occurred') {
  return NextResponse.json(
    { success: false, error: 'Internal Server Error', message },
    { status: 500 }
  )
}

export function serviceUnavailable(message = 'AI service is currently unavailable') {
  return NextResponse.json(
    { success: false, error: 'Service Unavailable', message },
    { status: 503 }
  )
}

export function gatewayTimeout(message = 'AI service did not respond in time') {
  return NextResponse.json(
    { success: false, error: 'Gateway Timeout', message },
    { status: 504 }
  )
}