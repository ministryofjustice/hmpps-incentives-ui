import type { Express } from 'express'
import request from 'supertest'

import appWithAllRoutes from './testutils/appSetup'
import BehaviourService from '../services/behaviourService'

jest.mock('../services/behaviourService')
const behaviorService = BehaviourService.prototype as jest.Mocked<BehaviourService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})

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
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Behaviour entries since last review')
        expect(res.text).toContain('Doe, Jane (A1234AB)')
      })
  })
})
