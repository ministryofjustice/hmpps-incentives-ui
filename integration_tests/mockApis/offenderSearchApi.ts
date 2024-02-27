import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'

export default {
  stubPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/offenderSearchApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  stubGetPrisoner: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/offenderSearchApi/prisoner/([A-Z0-9]+)`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          bookingId: -1,
          prisonerNumber: 'A1234A',
          firstName: 'John',
          lastName: 'Smith',
          prisonId: 'MDI',
          prisonName: 'Moorland',
          cellLocation: '123',
        },
      },
    })
  },
}
