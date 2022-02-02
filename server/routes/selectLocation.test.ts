import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import { PrisonApi } from '../data/prisonApi'
import { getTestLocation } from '../testData/prisonApi'

jest.mock('../data/prisonApi')

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})

  const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getUserLocations.mockResolvedValue([
    getTestLocation({
      agencyId: 'MDI',
      locationPrefix: 'MDI-2',
      userDescription: 'Houseblock 2',
    }),
    getTestLocation({
      agencyId: 'MDI',
      locationPrefix: 'MDI-42',
      userDescription: 'Houseblock 42',
    }),
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /select-location', () => {
  it('renders location selection page', () => {
    return request(app)
      .get('/select-location')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('View by residential location')
        expect(res.text).toContain('Select a location')
        expect(res.text).toContain('<option value="MDI-2">Houseblock 2')
        expect(res.text).toContain('<option value="MDI-42">Houseblock 42')
      })
  })
})

describe('POST /select-location', () => {
  describe('when locationPrefix is missing', () => {
    it('redirects to location selection page', () => {
      return request(app)
        .post('/select-location')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/select-location')
        })
    })
  })

  describe('when locationPrefix is provided', () => {
    it('redirects to home page', () => {
      return request(app)
        .post('/select-location')
        .send({ locationPrefix: 'MDI-42' })
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/incentive-summary/MDI-42')
        })
    })
  })
})
