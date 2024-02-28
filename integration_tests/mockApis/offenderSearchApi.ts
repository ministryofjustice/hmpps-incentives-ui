import type { SuperAgentRequest } from 'superagent'

import type { OffenderSearchResult } from '../../server/data/offenderSearch'
import { sampleOffenderDetails } from '../../server/testData/offenderSearch'
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

  stubGetPrisoner: (data?: OffenderSearchResult): SuperAgentRequest => {
    const body: OffenderSearchResult = data ?? sampleOffenderDetails
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/offenderSearchApi/prisoner/([A-Z0-9]+)',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: body,
      },
    })
  },
}
