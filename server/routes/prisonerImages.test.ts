import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes, MockUserService } from './testutils/appSetup'
import { PrisonApi } from '../data/prisonApi'

jest.mock('../data/prisonApi')
jest.mock('../services/userService')

const imageData = Buffer.from('image 123 data')

let app: Express
let prisonApi: jest.Mocked<PrisonApi>
let mockUserService: MockUserService

beforeEach(() => {
  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getImageByPrisonerNumber.mockResolvedValue(imageData)

  mockUserService = new MockUserService()
  app = appWithAllRoutes({ mockUserService })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner-images/:prisonerNumber.jpeg', () => {
  it('responds with the image data', () => {
    const prisonerNumber = 'A1234AB'
    const oneDay = 86400 as const

    return request(app)
      .get(`/prisoner-images/${prisonerNumber}.jpeg`)
      .expect('Content-Type', /image\/jpeg/)
      .expect(res => {
        expect(prisonApi.getImageByPrisonerNumber).toBeCalledWith(prisonerNumber)

        expect(res.statusCode).toBe(200)
        expect(res.headers['cache-control']).toEqual(`private, max-age=${oneDay}`)
        expect(res.body).toEqual(imageData)
      })
  })

  it('does not trigger getUser()', () => {
    return request(app)
      .get('/prisoner-images/123.jpeg')
      .expect('Content-Type', /image\/jpeg/)
      .expect(res => {
        expect(mockUserService.getUser).not.toHaveBeenCalled()
      })
  })
})
