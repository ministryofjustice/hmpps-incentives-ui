import type { Express } from 'express'
import { Session, SessionData } from 'express-session'
import request from 'supertest'

import { appWithAllRoutes, makeTestSession } from './testutils/appSetup'
import { PrisonApi } from '../data/prisonApi'

jest.mock('../data/prisonApi')

let app: Express
let testSession: Session & Partial<SessionData>

beforeEach(() => {
  testSession = makeTestSession()
  app = appWithAllRoutes({ testSession })

  const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>
  prisonApi.getUserLocations.mockResolvedValue([
    {
      locationId: 2,
      locationType: 'WING',
      description: '2',
      agencyId: 'MDI',
      currentOccupancy: 199,
      locationPrefix: 'MDI-2',
      operationalCapacity: 200,
      userDescription: 'Houseblock 2',
    },
    {
      locationId: 42,
      locationType: 'WING',
      description: '42',
      agencyId: 'MDI',
      currentOccupancy: 199,
      locationPrefix: 'MDI-42',
      operationalCapacity: 200,
      userDescription: 'Houseblock 42',
    },
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /select-another-location', () => {
  it('renders location selection page', () => {
    return request(app)
      .get('/select-another-location')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('View by residential location')
        expect(res.text).toContain('Select a location')
        expect(res.text).toContain('<option value="MDI-2" selected>Houseblock 2')
        expect(res.text).toContain('<option value="MDI-42">Houseblock 42')
      })
  })
})

describe('POST /select-another-location', () => {
  describe('when locationPrefix is missing', () => {
    it('redirects to location selection page', () => {
      return request(app)
        .post('/select-another-location')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/select-another-location')
        })
    })
  })

  describe('when locationPrefix is provided', () => {
    it('redirects to home page', () => {
      return request(app)
        .post('/select-another-location')
        .send({ locationPrefix: 'MDI-42' })
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/')
          expect(testSession.activeLocation.locationPrefix).toEqual('MDI-42')
        })
    })
  })
})
