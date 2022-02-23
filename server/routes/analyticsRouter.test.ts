import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
  app.locals.featureFlags.showAnalytics = true
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Home page shows card linking to incentives analytics', () => {
  it('if feature is turned on', () => {
    return request(app)
      .get('/')
      .expect(res => expect(res.text).toContain('See incentives data'))
  })

  it('otherwise it is hidden', () => {
    app.locals.featureFlags.showAnalytics = false
    return request(app)
      .get('/')
      .expect(res => expect(res.text).not.toContain('See incentives data'))
  })
})

describe('Behaviour entries page', () => {
  it('page loads', () => {
    return request(app)
      .get('/analytics/behaviour-entries')
      .expect(res => {
        expect(res.statusCode).toBe(200)
        expect(res.text).toContain('Comparison of positive and negative behaviour entries by wing')
      })
  })
})
