import httpErrors from 'http-errors'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'

// eslint-disable-next-line import/prefer-default-export
export function mockRestClientError<ErrorData>(
  status: number,
  data?: ErrorData | undefined,
): SanitisedError<ErrorData> {
  const httpError = httpErrors[status.toString() as '404']()
  const error = new SanitisedError<ErrorData>(httpError.message)
  Object.assign(error, {
    responseStatus: httpError.statusCode,
    stack: httpError.stack,
  })
  if (data !== undefined) {
    error.data = data
  }
  return error
}
