import type { Express } from 'express'
import request from 'supertest'

import config from '../config'
import { TableType } from '../services/analyticsServiceTypes'
import { appWithAllRoutes } from './testutils/appSetup'
import { MockTable, mockSdkS3ClientReponse } from '../testData/s3Bucket'

jest.mock('@aws-sdk/client-s3')

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
      .expect(res => expect(res.text).toContain('Incentives data'))
  })

  it('otherwise it is hidden', () => {
    app.locals.featureFlags.showAnalytics = false
    return request(app)
      .get('/')
      .expect(res => expect(res.text).not.toContain('Incentives data'))
  })

  it('it is also hidden when user does not have appropriate case load', () => {
    config.prisonsWithAnalytics.pop()
    config.prisonsWithAnalytics.push('LEI')
    return request(app)
      .get('/')
      .expect(res => expect(res.text).not.toContain('Incentives data'))
  })

  it('it is also hidden when username is not explicitly allowed', () => {
    config.usernamesWithAnalytics.pop()
    config.usernamesWithAnalytics.push('user5')
    return request(app)
      .get('/')
      .expect(res => expect(res.text).not.toContain('Incentives data'))
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
  },
  {
    name: 'Incentive levels',
    url: '/analytics/incentive-levels',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by wing',
    linksToIncentivesTable: true,
    sampleLocations: ['1', '2', '3', '4', '5', '6', '7', '8', 'SEG'],
    sourceTable: TableType.incentiveLevels,
  },
  {
    name: 'Protected characteristics',
    url: '/analytics/protected-characteristics',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by ethnicity',
    linksToIncentivesTable: false,
    sourceTable: TableType.incentiveLevels,
  },
]

const samplePrison = 'MDI'

describe.each(analyticsPages)(
  'Analytics data pages',
  ({ name, url, expectedHeading, linksToIncentivesTable, sampleLocations, sourceTable }) => {
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
  }
)
