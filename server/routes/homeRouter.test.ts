import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'

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
})
