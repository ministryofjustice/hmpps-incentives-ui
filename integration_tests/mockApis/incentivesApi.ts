import { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import { getTestIncentivesLocationSummary } from '../../server/testData/incentivesApi'

export default {
  stubPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/incentivesApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },
  stubGetLocationSummary: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/incentivesApi/incentives-summary/prison/MDI/location/MDI-42',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: getTestIncentivesLocationSummary({
          prisonId: 'MDI',
          locationId: 'MDI-42',
          locationDescription: 'Houseblock 42',
        }),
      },
    })
  },
}
