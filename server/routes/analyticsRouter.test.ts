import type { Express } from 'express'
import request from 'supertest'

import config from '../config'
import ZendeskClient from '../data/zendeskClient'
import { TableType } from '../services/analyticsServiceTypes'
import { appWithAllRoutes } from './testutils/appSetup'
import { MockTable, mockSdkS3ClientReponse } from '../testData/s3Bucket'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/zendeskClient')

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

let originalPrisonsWithAnalytics: string[]
let originalUsernamesWithAnalytics: string[]

beforeAll(() => {
  originalPrisonsWithAnalytics = config.prisonsWithAnalytics
  originalUsernamesWithAnalytics = config.usernamesWithAnalytics
})

let app: Express

beforeEach(() => {
  jest.clearAllMocks()

  config.prisonsWithAnalytics = ['MDI']
  config.usernamesWithAnalytics = ['user1']

  app = appWithAllRoutes({})
  app.locals.featureFlags.showAnalytics = true
})

afterAll(() => {
  config.prisonsWithAnalytics = originalPrisonsWithAnalytics
  config.usernamesWithAnalytics = originalUsernamesWithAnalytics
})

describe('Home page shows card linking to incentives analytics', () => {
  it('if feature is turned on', () => {
    return request(app)
      .get('/')
      .expect(res => expect(res.text).toContain('/analytics'))
  })

  it('otherwise it is hidden', () => {
    app.locals.featureFlags.showAnalytics = false
    return request(app)
      .get('/')
      .expect(res => expect(res.text).not.toContain('/analytics'))
  })

  it('it is also hidden when user does not have appropriate case load', () => {
    config.prisonsWithAnalytics.pop()
    config.prisonsWithAnalytics.push('LEI')
    return request(app)
      .get('/')
      .expect(res => expect(res.text).not.toContain('/analytics'))
  })

  it('it is also hidden when username is not explicitly allowed', () => {
    config.usernamesWithAnalytics.pop()
    config.usernamesWithAnalytics.push('user5')
    return request(app)
      .get('/')
      .expect(res => expect(res.text).not.toContain('/analytics'))
  })
})

const analyticsPages = [
  {
    name: 'Behaviour entries',
    url: '/analytics/behaviour-entries',
    expectedHeading: 'Behaviour entries – comparison of positive and negative behaviour entries by wing',
    linksToIncentivesTable: true,
    sampleLocations: ['1', '2', '3', '4', '5', '6', '7', '8', 'SEG'],
    sourceTable: TableType.behaviourEntries,
    graphIds: ['entries-by-location', 'prisoners-with-entries-by-location'],
  },
  {
    name: 'Incentive levels',
    url: '/analytics/incentive-levels',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by wing',
    linksToIncentivesTable: true,
    sampleLocations: ['1', '2', '3', '4', '5', '6', '7', '8', 'SEG'],
    sourceTable: TableType.incentiveLevels,
    graphIds: ['incentive-levels-by-location'],
  },
  {
    name: 'Protected characteristics',
    url: '/analytics/protected-characteristics',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by ethnicity',
    linksToIncentivesTable: false,
    sourceTable: TableType.incentiveLevels,
    graphIds: ['incentive-levels-by-ethnicity', 'incentive-levels-by-age-group'],
  },
]

const samplePrison = 'MDI'

describe.each(analyticsPages)(
  'Analytics data pages',
  ({ name, url, expectedHeading, graphIds, linksToIncentivesTable, sampleLocations, sourceTable }) => {
    beforeEach(() => {
      mockSdkS3ClientReponse(s3.send, sourceTable)
    })

    it(`${name} page loads if feature is turned on`, () => {
      return request(app)
        .get(url)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain(expectedHeading)
          expect(res.text).not.toContain('Page not found')
        })
    })

    it(`otherwise ${name} page responds with a 404`, () => {
      app.locals.featureFlags.showAnalytics = false
      return request(app)
        .get(url)
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain(expectedHeading)
          expect(res.text).toContain('Page not found')
        })
    })

    it(`error is presented on ${name} page if no source table was found`, () => {
      mockSdkS3ClientReponse(s3.send, sourceTable, MockTable.Missing)

      return request(app)
        .get(url)
        .expect(500)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with the service')
        })
    })

    it(`error is presented on ${name} page if source table contains no data`, () => {
      mockSdkS3ClientReponse(s3.send, sourceTable, MockTable.Empty)

      return request(app)
        .get(url)
        .expect(500)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with the service')
        })
    })

    if (linksToIncentivesTable) {
      it(`${name} page has graphs that link to incentive tables for locations`, () => {
        return request(app)
          .get(url)
          .expect(res => {
            sampleLocations.forEach(location => {
              expect(res.text).toContain(`href="/incentive-summary/${samplePrison}-${location}"`)
            })
          })
      })
    }

    describe.each(graphIds)('charts have feedback forms', graphId => {
      let originalZendeskConfig: typeof config.apis.zendesk

      let mockedZendeskClientClass: jest.Mock<ZendeskClient>

      beforeAll(() => {
        originalZendeskConfig = config.apis.zendesk
        config.apis.zendesk.url = 'http://zendesk.local'
        config.apis.zendesk.username = 'anonymous@justice.gov.uk'
        config.apis.zendesk.token = '123456789012345678901234567890'

        mockedZendeskClientClass = ZendeskClient as jest.Mock<ZendeskClient>

        mockSdkS3ClientReponse(s3.send, sourceTable)
      })

      afterAll(() => {
        config.apis.zendesk = originalZendeskConfig
      })

      it(`${name} page can post simple feedback on ${graphId} chart`, () => {
        return request(app)
          .post(url)
          .send({ formId: graphId, chartUseful: 'yes' })
          .expect(200)
          .expect(res => {
            expect(res.text).toContain(expectedHeading)
            expect(mockedZendeskClientClass).toHaveBeenCalled()
            const mockedZendeskClient = mockedZendeskClientClass.mock.instances[0] as jest.Mocked<ZendeskClient>
            expect(mockedZendeskClient.createTicket).toHaveBeenCalledWith({
              subject: `Feedback on chart ${graphId}`,
              comment: { body: expect.any(String) },
              type: 'task',
              tags: ['hmpps-incentives', 'chart-feedback', 'useful-yes'],
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
            expect(createTicketRequest.comment.body).toContain('Is this chart useful? yes')
            expect(createTicketRequest.comment.body).toContain('Prison: MDI')
            expect(createTicketRequest.comment.body).not.toContain('Comments:')
          })
      })

      it(`${name} page can post more complex feedback on ${graphId} chart`, () => {
        return request(app)
          .post(url)
          .send({
            formId: graphId,
            chartUseful: 'no',
            mainNoReason: 'do-not-understand',
            noComments: 'How do I use this?',
          })
          .expect(200)
          .expect(res => {
            expect(res.text).toContain(expectedHeading)
            const mockedZendeskClient = mockedZendeskClientClass.mock.instances[0] as jest.Mocked<ZendeskClient>
            expect(mockedZendeskClient.createTicket).toHaveBeenCalledWith({
              subject: expect.any(String),
              comment: { body: expect.any(String) },
              type: 'task',
              tags: ['hmpps-incentives', 'chart-feedback', 'useful-no', 'not-useful-do-not-understand'],
              custom_fields: expect.anything(),
            })
            expect(mockedZendeskClientClass).toHaveBeenCalled()
            const createTicketRequest = mockedZendeskClient.createTicket.mock.calls[0][0]
            expect(createTicketRequest.comment.body).toContain('Is this chart useful? no')
            expect(createTicketRequest.comment.body).toContain('Prison: MDI')
            expect(createTicketRequest.comment.body).toContain('Main reason: do-not-understand')
            expect(createTicketRequest.comment.body).toContain('Comments:')
            expect(createTicketRequest.comment.body).toContain('How do I use this?')
          })
      })

      it(`${name} page will not post invalid feedback on ${graphId} chart`, () => {
        return request(app)
          .post(url)
          .send({
            formId: graphId,
            chartUseful: 'no',
            noComments: 'Do I have to choose only one reason?',
          })
          .expect(200)
          .expect(res => {
            expect(res.text).toContain(expectedHeading)
            expect(mockedZendeskClientClass).not.toHaveBeenCalled()
          })
      })
    })
  }
)
