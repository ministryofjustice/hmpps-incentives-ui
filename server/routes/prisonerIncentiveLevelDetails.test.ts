import type { Express } from 'express'
import request from 'supertest'

import { maintainPrisonerIncentiveLevelRole } from '../data/constants'
import { appWithAllRoutes, MockUserService } from './testutils/appSetup'
import { PrisonApi } from '../data/prisonApi'
import { IncentivesApi } from '../data/incentivesApi'
import { OffenderSearchClient } from '../data/offenderSearch'
import { getAgencyMockImplementation, prisonerDetails, staffDetails, agencyDetails } from '../testData/prisonApi'
import { incentiveSummaryForBooking, emptyIncentiveSummaryForBooking } from '../testData/incentivesApi'
import offenderDetails from '../testData/offenderSearch'
import { SanitisedError } from '../sanitisedError'
import { makeMockUser } from './testutils/mockUsers'

jest.mock('../data/prisonApi')
jest.mock('../data/incentivesApi')
jest.mock('../services/userService')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/offenderSearch')
jest.mock('../data/nomisUserRolesApi')

let app: Express

const prisonerNumber = 'A8083DY'

const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
const offenderSearch = OffenderSearchClient.prototype as jest.Mocked<OffenderSearchClient>
const incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>

beforeEach(() => {
  prisonApi.getPrisonerDetails.mockResolvedValue(prisonerDetails)
  prisonApi.getStaffDetails.mockResolvedValue(staffDetails)
  prisonApi.getAgency.mockImplementation(getAgencyMockImplementation)
  offenderSearch.getPrisoner.mockResolvedValue(offenderDetails)
  incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(incentiveSummaryForBooking)

  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

const mockMoorlandUserWithRole = makeMockUser({ caseloads: ['MDI'], roles: [maintainPrisonerIncentiveLevelRole] })
const mockMoorlandUserWithoutRole = makeMockUser({ caseloads: ['MDI'], roles: [] })
const mockLeedsUserWithRole = makeMockUser({ caseloads: ['LEI'], roles: [maintainPrisonerIncentiveLevelRole] })

describe('GET /incentive-reviews/prisoner/', () => {
  it('should make the expected API calls', () => {
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(() => {
        expect(prisonApi.getPrisonerDetails).toHaveBeenCalledWith(prisonerNumber)
        expect(prisonApi.getAgency).toHaveBeenCalledWith(agencyDetails.agencyId)
        expect(prisonApi.getStaffDetails).toHaveBeenCalledWith('SYSTEM_USER')
        expect(offenderSearch.getPrisoner).toHaveBeenCalledWith(prisonerNumber)
        expect(incentivesApi.getIncentiveSummaryForPrisoner).toHaveBeenCalledWith(prisonerNumber)
      })
  })

  it('should render the correct template with the correct data', () => {
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.request.url).toContain('/incentive-reviews/prisoner/A8083DY')
        expect(res.text).toContain('Incentive level history')
        expect(res.text).toContain('SYSTEM_USER_COMMENT')
        expect(res.text).toContain('15 August 2017 - 16:04')
        expect(res.text).toContain('Smith, John')
      })
  })

  it('should allow user to update iep if user is in case load and has CORRECT role', () => {
    app = appWithAllRoutes({
      mockUserService: new MockUserService(mockMoorlandUserWithRole),
    })

    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Record incentive level')
      })
  })

  it('should NOT allow user to update iep if user is in case load and has INCORRECT role', () => {
    app = appWithAllRoutes({
      mockUserService: new MockUserService(mockMoorlandUserWithoutRole),
    })

    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incentive level history')
        expect(res.text).not.toContain('Record incentive level')
      })
  })

  it('should NOT allow user to update iep if user is NOT in case load and has CORRECT role', () => {
    app = appWithAllRoutes({
      mockUserService: new MockUserService(mockLeedsUserWithRole),
    })

    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incentive level history')
        expect(res.text).not.toContain('Record incentive level')
      })
  })

  it('should filter by level', () => {
    const level = 'Basic'
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/?incentiveLevel=${level}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('BASIC_SYSTEM_USER_COMMENT')
        expect(res.text).not.toContain('STANDARD_NOMIS_USER_COMMENT')
      })
  })

  it('should filter by date', () => {
    const date = '07%2F08%2F2017'
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/?fromDate=${date}&toDate=${date}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('ENHANCED_UNKNOWN_USER_COMMENT')
        expect(res.text).not.toContain('STANDARD_NOMIS_USER_COMMENT')
      })
  })

  it('should filter by establishment', () => {
    const establishment = 'LEI'
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/?agencyId=${establishment}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('LEI')
        expect(res.text).not.toContain('ENHANCED_UNKNOWN_USER_COMMENT')
      })
  })

  it('should filter by all filters', () => {
    const establishment = 'MDI'
    const date = '15%2F08%2F2017'
    const level = 'Standard'
    return request(app)
      .get(
        `/incentive-reviews/prisoner/${prisonerNumber}/?agencyId=${establishment}&fromDate=${date}&toDate=${date}&level=${level}`,
      )
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('STANDARD_NOMIS_USER_COMMENT')
        expect(res.text).not.toContain('ENHANCED_UNKNOWN_USER_COMMENT')
      })
  })

  it('should show error when dates are incorrect', () => {
    const establishment = 'MDI'
    const fromDate = '16%2F08%2F2017'
    const toDate = '15%2F08%2F2017'
    const level = 'Standard'
    return request(app)
      .get(
        `/incentive-reviews/prisoner/${prisonerNumber}/?agencyId=${establishment}&fromDate=${fromDate}&toDate=${toDate}&level=${level}`,
      )
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Enter a from date which is not after the to date')
        expect(res.text).toContain('Enter a to date which is not before the from date')
      })
  })

  it('should return default message for no incentive level history', () => {
    incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(emptyIncentiveSummaryForBooking)
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('John Smith has no incentive level history')
      })
  })

  it('should return default message when no level history is returned for supplied filters', () => {
    const establishment = 'MDI'
    const fromDate = '15%2F08%2F1990'
    const toDate = '15%2F08%2F1991'
    const level = 'Standard'
    return request(app)
      .get(
        `/incentive-reviews/prisoner/${prisonerNumber}/?agencyId=${establishment}&fromDate=${toDate}&toDate=${fromDate}&level=${level}`,
      )
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('There is no incentive level history for the selections you have made')
        expect(res.text).not.toContain('ENHANCED_UNKNOWN_USER_COMMENT')
      })
  })

  it('should return 302 and redirect if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 302,
      message: 'Found',
      stack: 'Found',
    }
    offenderSearch.getPrisoner.mockRejectedValue(error)
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}`)
      .expect(302)
      .expect(res => {
        expect(res.text).not.toContain('John, Smith')
        expect(res.text).toContain('Found. Redirecting')
      })
  })
})
