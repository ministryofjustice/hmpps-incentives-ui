import type { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import type { ResponseError } from 'superagent'

/**
 * An error as returned by superagemt, contains sensitive request headers
 */
export type UnsanitisedError = ResponseError

/**
 * Converts an UnsanitisedError (superagent.ResponseError) into a simpler Error object,
 * omitting request inforation (e.g. sensitive request headers)
 */
export default function sanitise<Data = unknown>(error: UnsanitisedError): SanitisedError<Data> {
  const e = new Error() as SanitisedError<Data>
  e.message = error.message
  e.stack = error.stack
  if (error.response) {
    e.text = error.response.text
    e.responseStatus = error.response.status
    e.headers = error.response.headers
    e.data = error.response.body
  }
  return e
}
