import type { Express } from 'express'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes } from './testutils/appSetup'
import type { AboutPageFeedbackData } from './forms/aboutPageFeedbackForm'
import ZendeskClient from '../data/zendeskClient'

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

beforeEach(() => {
  jest.clearAllMocks()

  app = appWithAllRoutes({})
})

describe('Home page', () => {
  describe(`'hideDaysColumnsInIncentivesTable' feature flag`, () => {
    describe('when on', () => {
      beforeEach(() => {
        app.locals.featureFlags.hideDaysColumnsInIncentivesTable = true
      })

      it('incentive information tile does not mention review dates', () => {
        return request(app)
          .get('/')
          .expect(res => {
            expect(res.text).toContain('Prisoner incentive information')
            expect(res.text).toContain(
              'See incentive levels and behaviour entries for the prison population, by residential location.',
            )
            expect(res.text).not.toContain('review date')
          })
      })
    })

    describe('when off', () => {
      beforeEach(() => {
        app.locals.featureFlags.hideDaysColumnsInIncentivesTable = false
      })

      it('incentive information tile mentions review dates', () => {
        return request(app)
          .get('/')
          .expect(res => {
            expect(res.text).toContain('Prisoner incentive information')
            expect(res.text).toContain(
              'See review dates, incentive levels and behaviour entries by residential location.',
            )
          })
      })
    })
  })

  it('has a tile linking to About page', () => {
    return request(app)
      .get('/')
      .expect(res => {
        expect(res.text).toContain('Information on how we collect, group and analyse data')
      })
  })
})

describe('About page', () => {
  const url = '/about'
  const formId = 'about-page-feedback'

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
      { noComments: 'It???s confusing' },
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
