import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import { mockSdkS3ClientReponse } from '../testData/s3Bucket'

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

let app: Express

beforeEach(() => {
  jest.clearAllMocks()

  app = appWithAllRoutes({})
  app.locals.featureFlags.showAnalytics = true
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
})

const analyticsPages = [
  {
    name: 'Behaviour entries',
    url: '/analytics/behaviour-entries',
    expectedHeading: 'Behaviour entries – comparison of positive and negative behaviour entries by wing',
    linksToIncentivesTable: true,
    sampleLocations: ['1', '2', '3', '4', '5', '6', '7', 'H', 'SEG'],
    sourceTable: 'behaviour_entries_28d',
  },
  {
    name: 'Incentive levels',
    url: '/analytics/incentive-levels',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by wing',
    linksToIncentivesTable: true,
    sampleLocations: ['A', 'B', 'C', 'D', 'E', 'H', 'T', 'X'],
  },
  {
    name: 'Protected characteristics',
    url: '/analytics/protected-characteristics',
    expectedHeading: 'Percentage and number of prisoners on each incentive level by ethnicity',
    linksToIncentivesTable: false,
  },
]

describe('Analytics home page', () => {
  it('shows links to all analytics pages if feature is turned on', () => {
    return request(app)
      .get('/analytics')
      .expect(200)
      .expect(res => {
        analyticsPages.forEach(({ url }) => {
          expect(res.text).toContain(`href="${url}"`)
        })
      })
  })

  it('otherwise it responds with a 404', () => {
    app.locals.featureFlags.showAnalytics = false
    return request(app)
      .get('/analytics')
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('Not Found')
      })
  })
})

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
          expect(res.text).not.toContain('Not Found')
        })
    })

    it(`otherwise ${name} page responds with a 404`, () => {
      app.locals.featureFlags.showAnalytics = false
      return request(app)
        .get(url)
        .expect(404)
        .expect(res => {
          expect(res.text).not.toContain(expectedHeading)
          expect(res.text).toContain('Not Found')
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
