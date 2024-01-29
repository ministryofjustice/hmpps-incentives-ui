import type { Express } from 'express'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes, MockUserService } from './testutils/appSetup'
import { getTestLocation } from '../testData/prisonApi'
import { mockSdkS3ClientResponse } from '../testData/s3Bucket'
import type { AboutPageFeedbackData } from './forms/aboutPageFeedbackForm'
import { PrisonApi } from '../data/prisonApi'
import ZendeskClient from '../data/zendeskClient'
import { cache } from './analyticsRouter'

jest.mock('../data/prisonApi')

const s3 = {
  send: jest.fn(),
}
jest.mock('@aws-sdk/client-s3', () => {
  const { GetObjectCommand, ListObjectsV2Command } = jest.requireActual('@aws-sdk/client-s3')
  return {
    S3Client: jest.fn(() => s3),
    GetObjectCommand,
    ListObjectsV2Command,
  }
})

jest.mock('../data/zendeskClient')
let originalZendeskConfig: { url: string; username: string; token: string }
let mockedZendeskClientClass: jest.Mock<ZendeskClient>

beforeAll(() => {
  const { url, username, token } = config.apis.zendesk
  originalZendeskConfig = { url, username, token }
  config.apis.zendesk.url = 'http://zendesk.local'
  config.apis.zendesk.username = 'anonymous@justice.gov.uk'
  config.apis.zendesk.token = '123456789012345678901234567890'

  mockedZendeskClientClass = ZendeskClient as jest.Mock<ZendeskClient>
})

afterAll(() => {
  config.apis.zendesk = { ...config.apis.zendesk, ...originalZendeskConfig }
})

let app: Express
let prisonApi: jest.Mocked<PrisonApi>

beforeEach(() => {
  jest.clearAllMocks()

  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getUserLocations.mockResolvedValue([
    getTestLocation({
      agencyId: 'MDI',
      locationPrefix: 'MDI-1',
      userDescription: 'Houseblock 1',
      subLocations: true,
    }),
  ])

  app = appWithAllRoutes({})
})

describe('Home page', () => {
  const incentiveReviewTileIds = ['incentive-information', 'about-national-policy']
  const analyticsChartTileIds = ['incentive-analytics', 'select-pgd-region', 'about-data']

  describe('when user’s active case load has "locations"', () => {
    // a prison case load would have locations (e.g. wings or house blocks) so can see location-specific tiles

    it.each(incentiveReviewTileIds)('shows incentive review management tile: %s', tileId => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain(`data-test="${tileId}"`)
        })
    })

    it.each(analyticsChartTileIds)('shows analytics chart tile: %s', tileId => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain(`data-test="${tileId}"`)
        })
    })
  })

  describe('when user’s active case load has no "locations"', () => {
    // an LSA's special case load (CADM_I) has no locations so cannot see location-specific tiles

    beforeEach(() => {
      prisonApi.getUserLocations.mockResolvedValue([])
    })

    it.each(incentiveReviewTileIds)('does not show incentive review management tile: %s', tileId => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain(`data-test="${tileId}"`)
        })
    })

    it('does not show analytics chart tile: incentive-analytics', () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain('data-test="incentive-analytics"')
        })
    })

    it('shows analytics chart tile: select-pgd-region', () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-test="select-pgd-region"')
        })
    })

    it('shows analytics chart tile: about-data', () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-test="about-data"')
        })
    })
  })

  describe('admin section', () => {
    it('does not show if user does not have appropriate role', () => {
      app = appWithAllRoutes({})

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain('data-qa="admin-section"')
        })
    })

    it('shows tile to manage incentive levels if user has appropriate role', () => {
      app = appWithAllRoutes({
        mockUserService: MockUserService.withRoles(['ROLE_MAINTAIN_INCENTIVE_LEVELS']),
      })

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-qa="admin-section"')
          expect(res.text).toContain('data-test="manage-incentive-levels"')
          expect(res.text).not.toContain('data-test="manage-prison-incentive-levels"')
        })
    })

    it('shows tile to manage incentive levels if user has appropriate role even without having any locations in active case load', () => {
      app = appWithAllRoutes({
        mockUserService: MockUserService.withRoles(['ROLE_MAINTAIN_INCENTIVE_LEVELS']),
      })
      prisonApi.getUserLocations.mockResolvedValue([])

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-qa="admin-section"')
          expect(res.text).toContain('data-test="manage-incentive-levels"')
          expect(res.text).not.toContain('data-test="manage-prison-incentive-levels"')
        })
    })

    it('shows tile to manage prison incentive levels if user has appropriate role and there are locations in active case load', () => {
      app = appWithAllRoutes({
        mockUserService: MockUserService.withRoles(['ROLE_MAINTAIN_PRISON_IEP_LEVELS']),
      })

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('data-qa="admin-section"')
          expect(res.text).not.toContain('data-test="manage-incentive-levels"')
          expect(res.text).toContain('data-test="manage-prison-incentive-levels"')
        })
    })

    it('does not show tile to manage prison incentive levels if active case load does not have locations even if user has appropriate role', () => {
      app = appWithAllRoutes({
        mockUserService: MockUserService.withRoles(['ROLE_MAINTAIN_PRISON_IEP_LEVELS']),
      })
      prisonApi.getUserLocations.mockResolvedValue([])

      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).not.toContain('data-qa="admin-section"')
          expect(res.text).not.toContain('data-test="manage-incentive-levels"')
          expect(res.text).not.toContain('data-test="manage-prison-incentive-levels"')
        })
    })
  })
})

describe('About visualisations page', () => {
  const url = '/about'
  const formId = 'about-page-feedback'

  beforeEach(() => {
    mockSdkS3ClientResponse(s3.send)
    cache.clear()
  })

  it('lists prisons using analytics table', () => {
    return request(app)
      .get(url)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Wales')
        expect(res.text).toContain('Berwyn (HMP & YOI)')
        expect(s3.send).toHaveBeenCalledTimes(2) // once to list tables and once to retrieve
      })
  })

  describe('has a feedback form', () => {
    it('which is displayed when the page is loaded', () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Please leave your feedback')
          expect(mockedZendeskClientClass).not.toHaveBeenCalled()
        })
    })

    const correctData: Partial<AboutPageFeedbackData>[] = [
      { informationUseful: 'yes' },
      { informationUseful: 'yes', yesComments: 'Great to know these details' },
      { informationUseful: 'no' },
      { informationUseful: 'no', noComments: 'My prison is not listed' },
    ]
    describe.each(correctData)('which allows posting feedback', formSubmission => {
      it('and shows a success message', () => {
        return request(app)
          .post(url)
          .send({ formId, ...formSubmission })
          .expect(200)
          .expect(res => {
            expect(res.text).toContain('Your feedback has been submitted')

            expect(mockedZendeskClientClass).toHaveBeenCalled()
            const mockedZendeskClient = mockedZendeskClientClass.mock.instances[0] as jest.Mocked<ZendeskClient>
            expect(mockedZendeskClient.createTicket).toHaveBeenCalledWith({
              subject: 'Feedback on about page',
              comment: { body: expect.any(String) },
              type: 'task',
              tags: ['hmpps-incentives', 'about-page-feedback', `useful-${formSubmission.informationUseful}`],
              custom_fields: [
                // Service
                { id: 23757677, value: 'hmpps_incentives' },
                // Environment
                { id: 32342378, value: config.environment },
                // URL
                { id: 23730083, value: expect.stringContaining(url) },
                // Prison
                { id: 23984153, value: 'MDI' },
              ],
            })
            const createTicketRequest = mockedZendeskClient.createTicket.mock.calls[0][0]
            expect(createTicketRequest.comment.body).toContain(
              `Is this information useful? ${formSubmission.informationUseful}`,
            )
            expect(createTicketRequest.comment.body).toContain('Prison: MDI')
            if (formSubmission.yesComments || formSubmission.noComments) {
              expect(createTicketRequest.comment.body).toContain('Comments:')
            } else {
              expect(createTicketRequest.comment.body).not.toContain('Comments:')
            }
          })
      })
    })

    const incorrectData: object[] = [
      {},
      { informationUseful: '' },
      { informationUseful: 'nope' },
      { noComments: 'It’s confusing' },
    ]
    describe.each(incorrectData)('which prevents posting invalid feedback', formSubmission => {
      it('and shows an error message', () => {
        return request(app)
          .post(url)
          .send({ formId, ...formSubmission })
          .expect(200)
          .expect(res => {
            expect(res.text).not.toContain('Your feedback has been submitted')
            expect(res.text).toContain('There is a problem') // error summary
            expect(res.text).toContain('Tell us if you found this information useful') // error message
            expect(res.text).toContain(`#${formId}-informationUseful`) // link to field
            expect(mockedZendeskClientClass).not.toHaveBeenCalled()
          })
      })
    })
  })
})

describe('Product info', () => {
  it('should return product ID', () => {
    return request(app)
      .get('/info')
      .expect('Content-Type', /application\/json/)
      .expect(res => {
        expect(res.body).toHaveProperty('productId', 'DPS???')
      })
  })
})
