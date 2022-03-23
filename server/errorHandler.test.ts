import { Router } from 'express'
import { Forbidden, Unauthorized } from 'http-errors'
import request from 'supertest'

import { appWithAllRoutes } from './routes/testutils/appSetup'

describe('Error pages', () => {
  describe('should render 404 page', () => {
    it('with stack in dev mode', () => {
      return request(appWithAllRoutes({}))
        .get('/unknown')
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
          expect(res.text).toContain('NotFoundError: Not found')
          expect(res.text).not.toContain('Sorry, there is a problem with the service')
        })
    })

    it('without stack in production mode', () => {
      return request(appWithAllRoutes({ production: true }))
        .get('/unknown')
        .expect(404)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
          expect(res.text).not.toContain('NotFoundError: Not found')
          expect(res.text).not.toContain('Sorry, there is a problem with the service')
        })
    })
  })

  describe('should render 500 page', () => {
    function makeApp(production: boolean) {
      const testRouter = Router()
      testRouter.use('/error', (req, res, next) => {
        next(new Error('custom error'))
      })
      return appWithAllRoutes({ production, testRouter })
    }

    it('with stack in dev mode', () => {
      return request(makeApp(false))
        .get('/error')
        .expect(500)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with the service')
          expect(res.text).toContain('custom error')
          expect(res.text).not.toContain('Page not found')
        })
    })

    it('without stack in production mode', () => {
      return request(makeApp(true))
        .get('/error')
        .expect(500)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with the service')
          expect(res.text).not.toContain('custom error')
          expect(res.text).not.toContain('Page not found')
        })
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
