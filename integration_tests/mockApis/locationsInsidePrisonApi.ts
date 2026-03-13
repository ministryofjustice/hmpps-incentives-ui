import { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'

export default {
  stubPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/locationsInsidePrisonApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },

  stubPrisonTopLevelLocations: (prisonId: string = 'MDI'): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/locationsInsidePrisonApi/locations/prison/${prisonId}/residential-first-level\\?includeVirtualLocations=true`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            locationId: '019ce762-05ad-79bb-8f3c-9cfbb74a6a24',
            locationType: 'WING',
            locationCode: '2',
            fullLocationPath: '2',
            localName: 'Houseblock 2',
            status: 'ACTIVE',
            level: 1,
          },
          {
            locationId: '019ce762-32ca-7412-ae67-3b1d5f249dfa',
            locationType: 'WING',
            locationCode: '42',
            fullLocationPath: '42',
            localName: 'Houseblock 42',
            status: 'ACTIVE',
            level: 1,
          },
        ],
      },
    })
  },
}
