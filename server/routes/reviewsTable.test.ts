import type { Express } from 'express'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes } from './testutils/appSetup'
import HmppsAuthClient from '../data/hmppsAuthClient'

jest.mock('../data/hmppsAuthClient')

let app: Express

beforeEach(() => {
  config.featureFlags.newReviewsTable = true
  app = appWithAllRoutes({})

  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')
})

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
})
