import type { Express } from 'express'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes } from './testutils/appSetup'
import BehaviourService from '../services/behaviourService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { getTestIncentivesLocationSummary } from '../testData/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../services/behaviourService')

let app: Express

beforeEach(() => {
  config.featureFlags.newReviewsTable = false
  app = appWithAllRoutes({})

  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')

  const behaviorService = BehaviourService.prototype as jest.Mocked<BehaviourService>
  behaviorService.getLocationSummary.mockResolvedValue(
    getTestIncentivesLocationSummary({
      prisonId: 'MDI',
      locationId: 'MDI-2',
      locationDescription: 'Houseblock 2',
    }),
  )
})

afterEach(() => {
  app.locals.googleAnalyticsUaId = undefined
  jest.resetAllMocks()
})

describe('GET /incentive-summary/:locationPrefix', () => {
  it('renders incentive summary page', () => {
    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incentive information')
        expect(res.text).toContain('Houseblock 2')
        expect(res.text).toContain('Doe, Jane<br>A1234AB')
      })
  })

  describe(`'hideDaysColumnsInIncentivesTable' feature flag`, () => {
    describe(`when on`, () => {
      beforeAll(() => {
        app.locals.featureFlags.hideDaysColumnsInIncentivesTable = true
      })

      it('table heading does not mention review dates', () => {
        return request(app)
          .get('/incentive-summary/MDI-2')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Behaviour entries in the last 3 months')
          })
      })
    })

    describe(`when off`, () => {
      beforeAll(() => {
        app.locals.featureFlags.hideDaysColumnsInIncentivesTable = false
      })

      it('table heading mentions review dates', () => {
        return request(app)
          .get('/incentive-summary/MDI-2')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Review dates and behaviour entries in the last 3 months')
          })
      })
    })
  })

  it('sets Google Analytics custom dimension for active case load', () => {
    app.locals.googleAnalyticsUaId = 'UA-000000-0'
    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect(res => expect(res.text).toContain(`ga('set', 'dimension1', 'MDI')`))
  })
})
