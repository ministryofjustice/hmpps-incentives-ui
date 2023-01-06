import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import UserService from '../services/userService'

jest.mock('../services/userService')

const notificationId = 'test-notification-id'
const expectedCookieName = `notification-banner-${notificationId}`
const expectedMaxAgeSecs = 52 * 24 * 3600

let app: Express
let userService: jest.Mocked<UserService>

beforeEach(() => {
  userService = UserService.prototype as jest.Mocked<UserService>

  app = appWithAllRoutes({ mockUserService: userService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('POST /notification/dismiss', () => {
  it('sets the dismissed notification cookie', () =>
    request(app)
      .post(`/notification/dismiss`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ id: notificationId })
      .expect(res => {
        expect(res.statusCode).toBe(200)
        const setCookieHeader = res.headers['set-cookie'][0]
        expect(setCookieHeader).toContain(`${expectedCookieName}=dismissed; Max-Age=${expectedMaxAgeSecs};`)
      }))

  it('when no notification id provided, it responds 400 Bad Request', () =>
    request(app)
      .post(`/notification/dismiss`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({})
      .expect(res => {
        expect(res.statusCode).toBe(400)
      }))
})
