import type { Express } from 'express'
import { Session, SessionData } from 'express-session'
import request from 'supertest'

import { appWithAllRoutes, makeTestSession } from './testutils/appSetup'
import BehaviourService from '../services/behaviourService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { getTestIncentivesLocationSummary } from '../testData/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../services/behaviourService')

let app: Express
let testSession: Session & Partial<SessionData>

beforeEach(() => {
  testSession = makeTestSession()
  app = appWithAllRoutes({ testSession })

  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')

  const behaviorService = BehaviourService.prototype as jest.Mocked<BehaviourService>
  behaviorService.getLocationSummary.mockResolvedValue(
    getTestIncentivesLocationSummary({
      prisonId: 'MDI',
      locationId: 'MDI-2',
      locationDescription: 'Houseblock 2',
    })
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('renders index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Houseblock 2 incentive levels and behaviour')
        expect(res.text).toContain('Behaviour entries since last review')
        expect(res.text).toContain('Doe, Jane (A1234AB)')
      })
  })

  describe('when no active location', () => {
    beforeEach(() => {
      testSession.activeLocation = null
    })

    it('redirects to change location page', () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/select-another-location')
        })
    })
  })
})
