import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import { PrisonApi } from '../data/prisonApi'
import UserService from '../services/userService'

jest.mock('../data/prisonApi')
jest.mock('../services/userService')

let app: Express
let prisonApi: jest.Mocked<PrisonApi>
let userService: jest.Mocked<UserService>

beforeEach(() => {
  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getImage.mockResolvedValue('image 123 data')

  userService = UserService.prototype as jest.Mocked<UserService>

  app = appWithAllRoutes({ mockUserService: userService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner-images/:imageId.jpeg', () => {
  it('responds with the image data', () => {
    const imageId = '123'
    const secondsInWeek = 604800

    return request(app)
      .get(`/prisoner-images/${imageId}.jpeg`)
      .expect('Content-Type', /images\/jpeg/)
      .expect(res => {
        expect(prisonApi.getImage).toBeCalledWith(imageId)

        expect(res.statusCode).toBe(200)
        expect(res.headers['cache-control']).toEqual(`private, max-age=${secondsInWeek}`)
        expect(res.text).toEqual('image 123 data')
      })
  })

  it('does not trigger getUser()', () => {
    return request(app)
      .get(`/prisoner-images/123.jpeg`)
      .expect('Content-Type', /images\/jpeg/)
      .expect(res => {
        expect(userService.getUser).toBeCalledTimes(0)
      })
  })
})
