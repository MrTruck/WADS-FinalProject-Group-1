const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

export function sanitizeString(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char)
}

export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') return sanitizeString(obj) as unknown as T
  if (Array.isArray(obj)) return obj.map(sanitizeObject) as unknown as T
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value)
    }
    return result as T
  }
  return obj
}