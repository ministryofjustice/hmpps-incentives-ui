import type { Express } from 'express'
import request from 'supertest'

import appWithAllRoutes from './routes/testutils/appSetup'
import { PrisonApi } from './data/prisonApi'

jest.mock('./data/prisonApi')
const prisonApi = PrisonApi.prototype as jest.Mocked<PrisonApi>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})

  prisonApi.getAgencyIepReviews.mockResolvedValue([])
  prisonApi.getUserCaseLoads.mockResolvedValue([
    {
      caseLoadId: 'MDI',
      description: 'Moorland (HMP & YOI)',
      currentlyActive: true,
      type: 'INST',
    },
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Something went wrong. The error has been logged. Please try again')
        expect(res.text).not.toContain('NotFoundError: Not found')
      })
  })
})
