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

describe('Behaviour entry graphs page', () => {
  const samplePrison = 'MDI'
  const sampleLocations = ['1', '2', '3', '4', '5', '6', '7', 'SEG']

  it('page loads if feature is turned on', () => {
    return request(app)
      .get('/analytics/behaviour-entries')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Comparison of positive and negative behaviour entries by wing')
        expect(res.text).not.toContain('Not Found')
      })
  })

  it('otherwise it responds with a 404', () => {
    app.locals.featureFlags.showAnalytics = false
    return request(app)
      .get('/analytics/behaviour-entries')
      .expect(404)
      .expect(res => {
        expect(res.text).not.toContain('Comparison of positive and negative behaviour entries by wing')
        expect(res.text).toContain('Not Found')
      })
  })

  it('has graphs that link to incentive tables for locations', () => {
    return request(app)
      .get('/analytics/behaviour-entries')
      .expect(res => {
        sampleLocations.forEach(location => {
          expect(res.text).toContain(`href="/incentive-summary/${samplePrison}-${location}"`)
        })
      })
  })
})
