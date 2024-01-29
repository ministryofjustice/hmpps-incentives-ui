import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes, MockUserService } from './testutils/appSetup'
import { PrisonApi, Offender, Staff, Agency } from '../data/prisonApi'
import { IncentivesApi, IncentiveSummaryForBookingWithDetails } from '../data/incentivesApi'
import createUserToken from './testutils/createUserToken'
import { OffenderSearchClient, OffenderSearchResult } from '../data/offenderSearch'
import { NomisUserRolesApi, UserCaseload } from '../data/nomisUserRolesApi'

jest.mock('../data/prisonApi')
jest.mock('../data/incentivesApi')
jest.mock('../services/userService')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/offenderSearch')
jest.mock('../data/nomisUserRolesApi')

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
      userId: 'NOMIS_USER',
      comments: 'STANDARD_NOMIS_USER_COMMENT',
    },
    {
      bookingId,
      iepDate: '2017-08-10',
      iepTime: '2017-08-10T16:04:35',
      agencyId: 'LEI',
      iepLevel: 'Basic',
      userId: 'SYSTEM_USER',
      comments: 'BASIC_SYSTEM_USER_COMMENT',
    },
    {
      bookingId,
      iepDate: '2017-08-07',
      iepTime: '2017-08-07T16:04:35',
      agencyId: 'MDI',
      iepLevel: 'Enhanced',
      userId: 'UNKNOWN_USER',
      comments: 'ENHANCED_UNKNOWN_USER_COMMENT',
    },
  ],
}

const emptyIncentiveSummaryForBooking = {
  bookingId,
  iepDate: '2017-08-15',
  iepTime: '2017-08-15T16:04:35',
  iepLevel: 'Standard',
  daysSinceReview: 1868,
  nextReviewDate: '2018-08-15',
  // @ts-ignore
  iepDetails: [],
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
  username: 'SYSTEM_USER',
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

const userCaseload: UserCaseload = {
  activeCaseload: {
    id: 'MDI',
    name: 'MDI',
  },
  caseloads: [
    {
      id: 'MDI',
      name: 'MDI',
    },
  ],
}

const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
const offenderSearch = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
const incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
const nomisUserRolesApi = NomisUserRolesApi.prototype as jest.Mocked<NomisUserRolesApi>
beforeEach(() => {
  prisonApi.getPrisonerDetails.mockResolvedValue(prisonerDetails)
  prisonApi.getStaffDetails.mockResolvedValue(staffDetails)
  prisonApi.getAgencyDetails.mockImplementation(agencyId => {
    if (agencyId === 'MDI') {
      return Promise.resolve({
        agencyId: 'MDI',
        description: '123',
        agencyType: '123',
        active: true,
      })
    } else {
      return Promise.resolve({
        agencyId: 'LEI',
        description: '123',
        agencyType: '123',
        active: true,
      })
    }
  })
  offenderSearch.getPrisoner.mockResolvedValue(offenderDetails)
  incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(incentiveSummaryForBooking)
  nomisUserRolesApi.getUserCaseloads.mockResolvedValue(userCaseload)

  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incentive-reviews/prisoner/', () => {
  
  it('should make the expected API calls', async () => {
    const res = await request(app).get(`/incentive-reviews/prisoner/${prisonerNumber}`)
    expect(res.statusCode).toBe(200)
    expect(prisonApi.getPrisonerDetails).toHaveBeenCalledWith(prisonerNumber)
    expect(prisonApi.getAgencyDetails).toHaveBeenCalledWith(agencyDetails.agencyId)
    expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('SYSTEM_USER')
    expect(offenderSearch.getPrisoner).toHaveBeenCalledWith(prisonerNumber)
    expect(incentivesApi.getIncentiveSummaryForPrisoner).toHaveBeenCalledWith(prisonerNumber)
  })

  it('should render the correct template with the correct data', async () => {
    const res = await request(app).get(`/incentive-reviews/prisoner/${prisonerNumber}`)
    expect(res.request.url).toContain('/incentive-reviews/prisoner/A8083DY')
    expect(res.text).toContain('Incentive level history')
    expect(res.text).toContain('SYSTEM_USER_COMMENT')
    expect(res.text).toContain('15 August 2017 - 16:04')
    expect(res.text).toContain('Smith, John')
  })

  it('should allow user to update iep if user is in case load and has correct role', async () => {
    app = appWithAllRoutes({
      mockUserService: new MockUserService(['MAINTAIN_IEP']),
    })

    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Record incentive level')
      })
  })

  it('should NOT allow user to update iep if user is in case load and has INCORRECT role', async () => {
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .set('authorization', `bearer ${tokenWithMissingRole}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incentive level history')
        expect(res.text).not.toContain('Record incentive level')
      })
  })

  // MIGHT, NO, WILL NEED CHANGES TO APP SETUP
  it('should NOT allow user to update iep if user is NOT in case load and has CORRECT role', async () => {
    app = appWithAllRoutes({
      // mockUserService: new MockUserService(['MAINTAIN_IEP']),
    })
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .set('authorization', `bearer ${tokenWithMissingRole}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incentive level history')
        expect(res.text).not.toContain('Record incentive level')
      })
  })

  it('should filter by level', async () => {
    const level = 'Basic'
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/?incentiveLevel=${level}`)
      .expect(res => {
        expect(res.text).toContain('BASIC_SYSTEM_USER_COMMENT')
        expect(res.text).not.toContain('STANDARD_NOMIS_USER_COMMENT')
      })
  })

  it('should filter by date', async () => {
    const date = '07%2F08%2F2017'
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/?fromDate=${date}&toDate=${date}`)
      .expect(res => {
        expect(res.text).toContain('ENHANCED_UNKNOWN_USER_COMMENT')
        expect(res.text).not.toContain('STANDARD_NOMIS_USER_COMMENT')
      })
  })

  it('should filter by establishment', async () => {
    const establishment = 'LEI'
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/?agencyId=${establishment}`)
      .expect(res => {
        expect(res.text).toContain('LEI')
        expect(res.text).not.toContain('ENHANCED_UNKNOWN_USER_COMMENT')
      })
  })

  it('should filter by all filters', async () => {
    const establishment = 'MDI'
    const date = '15%2F08%2F2017'
    const level = 'Standard'
    return request(app)
      .get(
        `/incentive-reviews/prisoner/${prisonerNumber}/?agencyId=${establishment}&fromDate=${date}&toDate=${date}&level=${level}`,
      )
      .expect(res => {
        expect(res.text).toContain('STANDARD_NOMIS_USER_COMMENT')
        expect(res.text).not.toContain('ENHANCED_UNKNOWN_USER_COMMENT')
      })
  })

  it('should return default message for no incentive level history', async () => {
    incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(emptyIncentiveSummaryForBooking)
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(res => {
        expect(res.text).toContain('John Smith has no incentive level history')
      })
  })
})
