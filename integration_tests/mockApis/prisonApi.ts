import * as fs from 'fs'
import * as path from 'path'

import { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'

export default {
  stubPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/health/ping',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: 'UP' },
      },
    })
  },
  stubGetImage: (): SuperAgentRequest => {
    const imagePath = path.join(__dirname, '..', '..', 'assets', 'images', 'prisoner.jpeg')
    const imageContents = fs.readFileSync(imagePath, { encoding: 'base64' })

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/images/([0-9]+)/data',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'images/jpeg',
        },
        base64Body: imageContents,
      },
    })
  },
  stubGetUserCaseLoads: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/users/me/caseLoads',
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
  stubGetUserLocations: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/users/me/locations',
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
