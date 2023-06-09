import type { ResponseError } from 'superagent'

export interface SanitisedError<Data = unknown> {
  text?: string
  status?: number
  headers?: unknown
  data?: Data
  stack: string
  message: string
}

export type UnsanitisedError = ResponseError

export default function sanitise<Data = unknown>(error: UnsanitisedError): SanitisedError<Data> {
  if (error.response) {
    const e = new Error(error.message) as SanitisedError<Data>
    e.text = error.response.text
    e.status = error.response.status
    e.headers = error.response.headers
    e.data = error.response.body
    e.message = error.message
    e.stack = error.stack
    return e
  }
  return {
    message: error.message,
    stack: error.stack,
  }
}
