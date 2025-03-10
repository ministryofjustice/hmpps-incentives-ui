import type { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubTokenVerificationPing: (status = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/verification/health/ping',
      },
      response: {
        status,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    }),

  stubVerifyToken: (active = true): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPath: '/verification/token/verify',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { active },
      },
    }),
}
