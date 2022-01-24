import type { Express } from 'express'
import { Session, SessionData } from 'express-session'
import request from 'supertest'

import { appWithAllRoutes, makeTestSession } from './testutils/appSetup'
import BehaviourService from '../services/behaviourService'
import HmppsAuthClient from '../data/hmppsAuthClient'

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
  behaviorService.getLocationSummary.mockResolvedValue({
    prisonId: 'MDI',
    locationId: 'MDI-2',
    locationDescription: 'Houseblock 2',
    totalPositiveBehaviours: 42,
    totalNegativeBehaviours: 42,
    totalIncentiveEncouragements: 42,
    totalIncentiveWarnings: 42,
    incentiveLevelSummary: [
      {
        level: 'BAS',
        levelDescription: 'Basic',
        numberAtThisLevel: 1,
        prisonerBehaviours: [
          {
            prisonerNumber: 'A1234AB',
            bookingId: 111111,
            imageId: 222222,
            firstName: 'Jane',
            lastName: 'Doe',
            daysOnLevel: 10,
            daysSinceLastReview: 50,
            positiveBehaviours: 6,
            incentiveEncouragements: 1,
            negativeBehaviours: 3,
            incentiveWarnings: 1,
            provenAdjudications: 2,
          },
        ],
      },
    ],
  })
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
