import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import { PrisonApi } from '../data/prisonApi'

jest.mock('../data/prisonApi')

let app: Express
let prisonApi: jest.Mocked<PrisonApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getImage.mockResolvedValue('image 123 data')
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
})
