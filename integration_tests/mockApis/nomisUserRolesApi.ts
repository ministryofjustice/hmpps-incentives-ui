import type { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'

export default {
  stubPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/nomisUserRolesApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  stubGetUserCaseloads: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/nomisUserRolesApi/me/caseloads',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland (HMP & YOI)',
          },
          caseloads: [
            {
              id: 'MDI',
              name: 'Moorland (HMP & YOI)',
            },
          ],
        },
      },
    })
  },
}
