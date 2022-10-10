import type { Express } from 'express'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes } from './testutils/appSetup'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { IncentivesApi, type Level } from '../data/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/incentivesApi')

let app: Express

beforeEach(() => {
  config.featureFlags.newReviewsTable = true
  app = appWithAllRoutes({})

  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')
})

const sampleLevels: Level[] = [
  {
    iepLevel: 'BAS',
    iepDescription: 'Basic',
    sequence: 1,
    default: false,
  },
  {
    iepLevel: 'STD',
    iepDescription: 'Standard',
    sequence: 2,
    default: true,
  },
  {
    iepLevel: 'ENH',
    iepDescription: 'Enhanced',
    sequence: 3,
    default: false,
  },
]

describe('Reviews table', () => {
  it('should show selected location', () => {
    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage incentive reviews')
        expect(res.text).toContain('A wing')
      })
  })

  it('should show number of overdue reviews', () => {
    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage incentive reviews')
        expect(res.text).toContain('<dd>16</dd>')
      })
  })

  it('shows tabs for each available level', () => {
    const incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
    incentivesApi.getAvailableLevels.mockResolvedValue(sampleLevels)

    return request(app)
      .get('/incentive-summary/MDI-1')
      .expect(res => {
        // eslint-disable-next-line no-restricted-syntax
        for(const { iepDescription } of sampleLevels) {
          expect(res.text).toContain(iepDescription)
        }
      })
  })
})
