import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import { PrisonApi, Offender } from '../data/prisonApi'
import { IncentivesApi, IncentiveSummaryForBookingWithDetails } from '../data/incentivesApi'
import createUserToken from './testutils/createUserToken'
import { NomisUserRolesApi, UserCaseload } from '../data/nomisUserRolesApi'
import { samplePrisonIncentiveLevels } from '../testData/incentivesApi'
import { SanitisedError } from '../sanitisedError'

jest.mock('../data/prisonApi')
jest.mock('../data/incentivesApi')
jest.mock('../services/userService')
jest.mock('../data/hmppsAuthClient')
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
const incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
const nomisUserRolesApi = NomisUserRolesApi.prototype as jest.Mocked<NomisUserRolesApi>
beforeEach(() => {
  prisonApi.getPrisonerDetails.mockResolvedValue(prisonerDetails)
  prisonApi.getFullDetails.mockResolvedValue(prisonerDetails)
  incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(incentiveSummaryForBooking)
  incentivesApi.getPrisonIncentiveLevels.mockResolvedValue(samplePrisonIncentiveLevels)
  nomisUserRolesApi.getUserCaseloads.mockResolvedValue(userCaseload)

  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})
describe('GET /incentive-reviews/prisoner/change-incentive-level', () => {
  it('should NOT allow user to update incentive level without role', async () => {
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithMissingRole}`)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })

  it('should render the correct template with the correct data', async () => {
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Smith, John')
        expect(res.text).toContain('Record an incentive level')
        expect(res.text).toContain('Standard (current level)')
        expect(res.text).toContain('Reason for recording')
        expect(res.text).toContain('Save')
      })
  })

  it('should return 302 and redirect if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      status: 302,
      message: 'Found',
      stack: 'Found',
    }
    prisonApi.getPrisonerDetails.mockRejectedValue(error)
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect(302)
      .expect(res => {
        expect(res.text).not.toContain('John, Smith')
        expect(res.text).toContain('Found. Redirecting to /incentive-reviews/prisoner/A8083DY')
      })
  })
})

describe('POST /incentive-reviews/prisoner/change-incentive-level', () => {
  describe('When there are errors', () => {
    it('should return an error if form is missing both incentive level and reason', () => {
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({
          iepLevel: '',
          comment: '',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Select an incentive level, even if it is the same as before')
          expect(res.text).toContain('Enter a reason for recording')
        })
    })

    it('should return an error if form is missing an incentive level', () => {
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({
          newIepLevel: '',
          reason: 'reason',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Select an incentive level, even if it is the same as before')
          expect(res.text).not.toContain('Enter a reason for recording')
          expect(res.text).not.toContain('Comments must be 240 characters or less')
        })
    })

    it('should return an error if form is missing a reason', () => {
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({
          newIepLevel: 'STD',
          reason: '',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Enter a reason for recording')
          expect(res.text).not.toContain('Select an incentive level')
        })
    })

    it('should return an error if comment is over 240 characters', () => {
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({
          newIepLevel: 'STD',
          reason:
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. ' +
            'Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. ' +
            'Donec quam felis, ultricies nec, pellentesque eu,',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Comments must be 240 characters or less')
          expect(res.text).not.toContain('Select an incentive level, even if it is the same as before')
          expect(res.text).not.toContain('Enter a reason for recording')
        })
    })

    it('should retain the inputted form values', () => {
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({
          newIepLevel: '',
          reason: 'Should retain this text',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Select an incentive level, even if it is the same as before')
          expect(res.text).toContain('Should retain this text')
        })
    })

    it('should return 302 and redirect if api returns an error', () => {
      const error: SanitisedError = {
        name: 'Error',
        status: 302,
        message: 'Found',
        stack: 'Found',
      }
      incentivesApi.updateIncentiveLevelForPrisoner.mockRejectedValueOnce(error)
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .send({
          newIepLevel: 'STD',
          reason: 'text',
        })
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(302)
        .expect(res => {
          expect(res.text).not.toContain('John, Smith')
          expect(res.text).toContain('Found. Redirecting')
        })
    })
  })

  describe('When there are no errors', () => {
    it('should return confirmation page', () => {
      incentivesApi.updateIncentiveLevelForPrisoner.mockResolvedValue({
        iepLevel: 'BAS',
        comment: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
      })
      incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue({
        bookingId,
        iepDate: '2017-08-15',
        iepTime: '2017-08-15T16:04:35',
        iepLevel: 'Enhanced',
        daysSinceReview: 1868,
        nextReviewDate: '2020-08-15',
        iepDetails: [],
      })
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({
          newIepLevel: 'ENH',
          reason: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
        })
        .expect(200)
        .expect(res => {
          expect(res.text).not.toContain('Comments must be 240 characters or less')
          expect(res.text).not.toContain('Select an incentive level, even if it is the same as before')
          expect(res.text).not.toContain('Enter a reason for recording')
          expect(res.text).toContain('Enhanced')
          expect(res.text).toContain('15 August 2020')
        })
    })
  })
})
