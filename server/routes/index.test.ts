import type { Express } from 'express'
import { Session, SessionData } from 'express-session'
import request from 'supertest'

import { appWithAllRoutes, makeTestSession } from './testutils/appSetup'
import BehaviourService from '../services/behaviourService'

jest.mock('../services/behaviourService')

let app: Express
let testSession: Session & Partial<SessionData>

beforeEach(() => {
  testSession = makeTestSession()
  app = appWithAllRoutes({ testSession })

  const behaviorService = BehaviourService.prototype as jest.Mocked<BehaviourService>
  behaviorService.getBehaviourEntries.mockResolvedValue({
    name: 'C',
    Basic: [
      {
        fullName: 'Doe, Jane',
        offenderNo: 'A1234AB',
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
