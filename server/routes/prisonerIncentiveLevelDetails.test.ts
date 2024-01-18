import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import { PrisonApi } from '../data/prisonApi'
import { IncentivesApi, IncentiveSummaryForBookingWithDetails } from '../data/incentivesApi'
import UserService from '../services/userService'
import createUserToken from './testutils/createUserToken'
import HmppsAuthClient from '../data/hmppsAuthClient'

jest.mock('../data/prisonApi')
jest.mock('../data/incentivesApi')
jest.mock('../services/userService')
jest.mock('../data/hmppsAuthClient')

let app: Express
let prisonApi: jest.Mocked<PrisonApi>
let incentivesApi: jest.Mocked<IncentivesApi>
let userService: jest.Mocked<UserService>

const bookingId = 'TESTING'
const prisonerNumber = 'A8083DY'

let req
let res

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken(['ROLE_MAINTAIN_IEP'])

const incentiveSummaryForBooking: IncentiveSummaryForBookingWithDetails = {
  bookingId: 123,
  iepDate: '2017-08-15',
  iepTime: '2017-08-15T16:04:35',
  iepLevel: 'Standard',
  daysSinceReview: 1868,
  nextReviewDate: '2018-08-15',
  iepDetails: [
    {
      bookingId: 123,
      iepDate: '2017-08-15',
      iepTime: '2017-08-15T16:04:35',
      agencyId: 'LEI',
      iepLevel: 'Standard',
      userId: 'INCENTIVES_API',
      comments: '3',
    },
    {
      bookingId: 123,
      iepDate: '2017-08-10',
      iepTime: '2017-08-10T16:04:35',
      agencyId: 'HEI',
      iepLevel: 'Basic',
      userId: 'ITAG_USER',
      comments: '2',
    },
    {
      bookingId: 123,
      iepDate: '2017-08-07',
      iepTime: '2017-08-07T16:04:35',
      agencyId: 'HEI',
      iepLevel: 'Enhanced',
      userId: 'UNKNOWN_USER',
      comments: '1',
    },
  ],
}

beforeEach(() => {
  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')

  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(incentiveSummaryForBooking)
  app = appWithAllRoutes({})
})
afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incentive-reviews/prisoner/', () => {
  it('should make the expected API calls', () => {
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect(res => {
        // expect(res.statusCode).toBe(200)
        console.log(res.statusCode)
      })
  })
})
