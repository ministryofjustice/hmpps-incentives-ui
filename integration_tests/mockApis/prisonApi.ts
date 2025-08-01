import * as fs from 'node:fs'
import * as path from 'node:path'

import { SuperAgentRequest } from 'superagent'

import { stubFor } from './wiremock'
import { Agency, Staff } from '../../server/data/prisonApi'

export default {
  stubPing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/prisonApi/health/ping',
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
        urlPattern: '/prisonApi/api/bookings/offenderNo/([A-Z0-9]+)/image/data',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
        },
        base64Body: imageContents,
      },
    })
  },

  stubGetUserLocations: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/users/me/locations\\?include-non-residential-locations=true',
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
            subLocations: true,
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
            subLocations: true,
          },
        ],
      },
    })
  },

  stubGetPrisonerDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/bookings/offenderNo/([A-Z0-9]+)',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          offenderNo: 'A8083DY',
          agencyId: 'MDI',
          bookingId: 12345,
          firstName: 'John',
          lastName: 'Smith',
          assignedLivingUnit: {
            agencyId: 'MDI',
            locationId: 1,
            description: '123',
            agencyName: '123',
          },
        },
      },
    })
  },

  stubGetPrisonerFullDetailsFalse: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/bookings/offenderNo/([A-Z0-9]+)\\?fullInfo=false&csraSummary=false',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          offenderNo: 'A8083DY',
          agencyId: 'MDI',
          bookingId: 12345,
          firstName: 'John',
          lastName: 'Smith',
          assignedLivingUnit: {
            agencyId: 'MDI',
            locationId: 1,
            description: '123',
            agencyName: '123',
          },
        },
      },
    })
  },

  stubGetPrisonerFullDetailsTrue: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisonApi/api/bookings/offenderNo/([A-Z0-9]+)\\?fullInfo=true&csraSummary=true',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          offenderNo: 'A8083DY',
          agencyId: 'MDI',
          bookingId: 12345,
          firstName: 'John',
          lastName: 'Smith',
          assignedLivingUnit: {
            agencyId: 'MDI',
            locationId: 1,
            description: '123',
            agencyName: '123',
          },
        },
      },
    })
  },

  stubGetStaffDetails: (staff: Staff): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisonApi/api/users/${staff.username}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: staff,
      },
    })
  },

  stubGetAgency: (agency: Agency): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisonApi/api/agencies/${agency.agencyId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: agency,
      },
    })
  },
}
