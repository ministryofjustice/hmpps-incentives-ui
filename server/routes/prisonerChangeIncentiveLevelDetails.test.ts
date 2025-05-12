import type { Express } from 'express'
import request from 'supertest'
import { type SanitisedError } from '@ministryofjustice/hmpps-rest-client'

import { maintainPrisonerIncentiveLevelRole } from '../data/constants'
import { appWithAllRoutes } from './testutils/appSetup'
import createUserToken from './testutils/createUserToken'
import { PrisonApi } from '../data/prisonApi'
import { IncentivesApi } from '../data/incentivesApi'
import { convertIncentiveReviewHistoryDates, convertIncentiveReviewItemDates } from '../data/incentivesApiUtils'
import { NomisUserRolesApi } from '../data/nomisUserRolesApi'
import { samplePrisonIncentiveLevels, sampleReviewHistory } from '../testData/incentivesApi'
import { prisonerDetails, prisonerInLeedsDetails } from '../testData/prisonApi'
import { userCaseload } from '../testData/nomisIUserRolesApi'
import type { FormData } from './prisonerChangeIncentiveLevelDetails'

jest.mock('@ministryofjustice/hmpps-auth-clients')
jest.mock('../data/prisonApi')
jest.mock('../data/incentivesApi')
jest.mock('../services/userService')
jest.mock('../data/nomisUserRolesApi')

let app: Express

const prisonerNumber = 'A8083DY'

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken([maintainPrisonerIncentiveLevelRole])

const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
const incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
const nomisUserRolesApi = NomisUserRolesApi.prototype as jest.Mocked<NomisUserRolesApi>

beforeEach(() => {
  prisonApi.getPrisonerDetails.mockResolvedValue(prisonerDetails)
  incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(sampleReviewHistory)
  incentivesApi.getPrisonIncentiveLevels.mockResolvedValue(samplePrisonIncentiveLevels)
  nomisUserRolesApi.getUserCaseloads.mockResolvedValue(userCaseload)

  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /incentive-reviews/prisoner/change-incentive-level', () => {
  it('should NOT allow user to update incentive level without required role', () => {
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithMissingRole}`)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(res.headers.location).toBe('/authError')
      })
  })

  it('should NOT allow user to update incentive level of prisoner not in caseloads', () => {
    prisonApi.getPrisonerDetails.mockResolvedValue(prisonerInLeedsDetails)

    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerInLeedsDetails.offenderNo}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(res.headers.location).toBe('/')
      })
  })

  it('should render the correct template with the correct data', () => {
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

  it('should return 404 if prisoner is not found', () => {
    const error: SanitisedError = {
      name: 'Error',
      responseStatus: 404,
      message: 'Not Found',
      stack: 'Not Found',
    }
    prisonApi.getPrisonerDetails.mockRejectedValue(error)
    return request(app)
      .get(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('John, Smith')
      })
  })
})

describe('POST /incentive-reviews/prisoner/change-incentive-level', () => {
  const validFormData: FormData = {
    newIepLevel: 'ENH',
    reason: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.',
  }

  it('should NOT allow user to update incentive level without required role', () => {
    return request(app)
      .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithMissingRole}`)
      .send(validFormData)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(res.headers.location).toBe('/authError')
      })
  })

  it('should NOT allow user to update incentive level of prisoner not in caseloads', () => {
    prisonApi.getPrisonerDetails.mockResolvedValue(prisonerInLeedsDetails)

    return request(app)
      .post(`/incentive-reviews/prisoner/${prisonerInLeedsDetails.offenderNo}/change-incentive-level`)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .send(validFormData)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(res.headers.location).toBe('/')
      })
  })

  describe('When there are form errors', () => {
    it('should return an error if form is missing both incentive level and reason', () => {
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send({
          newIepLevel: '',
          reason: '',
        } satisfies FormData)
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
        } satisfies FormData)
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
        } satisfies FormData)
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
        } satisfies FormData)
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
        } satisfies FormData)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Select an incentive level, even if it is the same as before')
          expect(res.text).toContain('Should retain this text')
        })
    })
  })

  describe('When there are no form errors', () => {
    it('should return confirmation page', () => {
      incentivesApi.updateIncentiveLevelForPrisoner.mockResolvedValue(
        convertIncentiveReviewItemDates({
          comments: validFormData.reason,
          iepCode: 'ENH',
          iepLevel: 'Enhanced',
          prisonerNumber,
          bookingId: 12345,
          iepDate: '2017-08-15',
          iepTime: '2017-08-15T16:04:35',
          userId: 'user1',
          agencyId: 'MDI',
        }),
      )
      incentivesApi.getIncentiveSummaryForPrisoner.mockResolvedValue(
        convertIncentiveReviewHistoryDates({
          prisonerNumber,
          bookingId: 12345,
          iepDate: '2017-08-15',
          iepTime: '2017-08-15T16:04:35',
          iepCode: 'ENH',
          iepLevel: 'Enhanced',
          daysSinceReview: 0,
          nextReviewDate: '2020-08-15',
          iepDetails: [],
        }),
      )
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .send(validFormData)
        .expect(200)
        .expect(res => {
          expect(res.text).not.toContain('Comments must be 240 characters or less')
          expect(res.text).not.toContain('Select an incentive level, even if it is the same as before')
          expect(res.text).not.toContain('Enter a reason for recording')
          expect(res.text).toContain('Enhanced')
          expect(res.text).toContain('15 August 2020')
        })
    })

    it('should return 302 and redirect if api returns an error', () => {
      const error: SanitisedError = {
        name: 'Error',
        responseStatus: 500,
        message: 'Internal Server Error',
        stack: 'Internal Server Error',
      }
      incentivesApi.updateIncentiveLevelForPrisoner.mockRejectedValueOnce(error)
      return request(app)
        .post(`/incentive-reviews/prisoner/${prisonerNumber}/change-incentive-level`)
        .send(validFormData)
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(302)
        .expect(res => {
          expect(res.text).not.toContain('John, Smith')
          expect(res.text).toContain('Found. Redirecting')
        })
    })
  })
})
