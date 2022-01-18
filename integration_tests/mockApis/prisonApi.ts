import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetUserCaseLoads: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/users/me/caseLoads',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            caseLoadId: 'MDI',
            description: 'Moorland (HMP & YOI)',
            currentlyActive: true,
            type: 'INST',
          },
        ],
      },
    })
  },
  stubGetAgencyLocations: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/agencies/MDI/locations',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            locationId: 2,
            locationType: 'WING',
            description: '2',
            agencyId: 'MDI',
            currentOccupancy: 199,
            locationPrefix: 'MDI-2',
            operationalCapacity: 200,
            userDescription: 'Houseblock 2',
          },
          {
            locationId: 42,
            locationType: 'WING',
            description: '42',
            agencyId: 'MDI',
            currentOccupancy: 199,
            locationPrefix: 'MDI-42',
            operationalCapacity: 200,
            userDescription: 'Houseblock 42',
          },
        ],
      },
    })
  },
}
