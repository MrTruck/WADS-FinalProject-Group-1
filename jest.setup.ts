import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'
import { ReadableStream } from 'node:stream/web'
import { MessageChannel, MessagePort } from 'worker_threads'

declare global {
  var TextDecoder: typeof TextDecoder
  var TextEncoder: typeof TextEncoder
  var ReadableStream: typeof ReadableStream
  var MessageChannel: typeof MessageChannel
  var MessagePort: typeof MessagePort
  var Request: any
  var Response: any
  var Headers: any
}

globalThis.TextDecoder ||= TextDecoder
globalThis.TextEncoder ||= TextEncoder
globalThis.ReadableStream ||= ReadableStream
globalThis.MessageChannel ||= MessageChannel
globalThis.MessagePort ||= MessagePort

const undici = require('undici')
const { Request, Response, Headers } = undici

globalThis.Request ||= Request
globalThis.Response ||= Response
globalThis.Headers ||= Headers
