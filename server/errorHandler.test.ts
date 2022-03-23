import { Router } from 'express'
import type { Express } from 'express'
import { Forbidden, Unauthorized } from 'http-errors'
import request from 'supertest'

import { appWithAllRoutes } from './routes/testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Something went wrong. The error has been logged. Please try again')
        expect(res.text).not.toContain('NotFoundError: Not found')
      })
  })

  describe.each([
    ['401 Unauthorised', new Unauthorized()],
    ['403 Forbidden', new Forbidden()],
  ])('should redirect to sign-out', (name, error) => {
    it(`if a request handler returns ${name}`, () => {
      const testRouter = Router()
      testRouter.use('/error', (req, res, next) => {
        next(error)
      })
      return request(appWithAllRoutes({ testRouter }))
        .get('/error')
        .expect(302)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
        })
    })
  })
})
