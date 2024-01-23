import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import { PrisonApi, Offender, Staff, Agency } from '../data/prisonApi'
import { IncentivesApi, IncentiveSummaryForBookingWithDetails } from '../data/incentivesApi'
import createUserToken from './testutils/createUserToken'
import { OffenderSearchClient, OffenderSearchResult } from '../data/offenderSearch'

jest.mock('../data/prisonApi')
jest.mock('../data/incentivesApi')
jest.mock('../services/userService')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/offenderSearch')

let app: Express

const bookingId = 12345
const prisonerNumber = 'A8083DY'

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken(['ROLE_MAINTAIN_IEP'])

const incentiveSummaryForBooking: IncentiveSummaryForBookingWithDetails = {
  bookingId,
  iepDate: '2017-08-15',
  iepTime: '2017-08-15T16:04:35',
  iepLevel: 'Standard',
  daysSinceReview: 1868,
  nextReviewDate: '2018-08-15',
  iepDetails: [
    {
      bookingId,
      iepDate: '2017-08-15',
      iepTime: '2017-08-15T16:04:35',
      agencyId: 'MDI',
      iepLevel: 'Standard',
      userId: 'INCENTIVES_API',
      comments: '3',
    },
    {
      bookingId,
      iepDate: '2017-08-10',
      iepTime: '2017-08-10T16:04:35',
      agencyId: 'MDI',
      iepLevel: 'Basic',
      userId: 'ITAG_USER',
      comments: '2',
    },
    {
      bookingId,
      iepDate: '2017-08-07',
      iepTime: '2017-08-07T16:04:35',
      agencyId: 'MDI',
      iepLevel: 'Enhanced',
      userId: 'UNKNOWN_USER',
      comments: '1',
    },
  ],
}

const prisonerDetails: Offender = {
  offenderNo: prisonerNumber,
  agencyId: 'MDI',
  bookingId,
  firstName: 'John',
  lastName: 'Smith',
  assignedLivingUnit: {
    agencyId: 'MDI',
    locationId: 1,
    description: '123',
    agencyName: '123',
  },
}

const staffDetails: Staff = {
  firstName: '123',
  lastName: '123',
  staffId: 123,
  username: '123',
  activeCaseLoadId: '123',
  active: true,
}

const agencyDetails: Agency = {
  agencyId: 'MDI',
  description: '123',
  agencyType: '123',
  active: true,
}

const offenderDetails: OffenderSearchResult = {
  bookingId,
  prisonerNumber,
  firstName: 'John',
  lastName: 'Smith',
  prisonId: 'MDI',
  prisonName: 'Moorland',
  cellLocation: '123',
}
beforeEach(() => {
  const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  const offenderSearch = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
  const incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>

  prisonApi.getPrisonerDetails.mockResolvedValue(prisonerDetails)
  prisonApi.getStaffDetails.mockResolvedValue(staffDetails)
  prisonApi.getAgencyDetails.mockResolvedValue(agencyDetails)
  offenderSearch.getPrisoner.mockResolvedValue(offenderDetails)
  incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(incentiveSummaryForBooking)

  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incentive-reviews/prisoner/', () => {
  it('should make the expected API calls', async () => {
    const response = await request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
    expect(response.statusCode).toBe(200)
  })
})
