import type { Express } from 'express'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import createUserToken from './testutils/createUserToken'
import { sampleIncentiveLevels, samplePrisonIncentiveLevels } from '../testData/incentivesApi'
import { IncentivesApi } from '../data/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/incentivesApi', () => {
  type module = typeof import('../data/incentivesApi')
  const realModule = jest.requireActual<module>('../data/incentivesApi')
  const mockedModule = jest.createMockFromModule<module>('../data/incentivesApi')
  return { __esModule: true, ...realModule, IncentivesApi: mockedModule.IncentivesApi }
})

let incentivesApi: jest.Mocked<IncentivesApi>

beforeAll(() => {
  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getIncentiveLevels.mockResolvedValue(sampleIncentiveLevels)
  incentivesApi.getPrisonIncentiveLevels.mockResolvedValue(samplePrisonIncentiveLevels)
  incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[1])
})

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken(['ROLE_MAINTAIN_PRISON_IEP_LEVELS'])

describe('Prison incentive level management', () => {
  it.each(['/prison-incentive-levels', '/prison-incentive-levels/view/STD'])(
    'should not be accessible without correct role',
    (url: string) => {
      return request(app)
        .get(url)
        .set('authorization', `bearer ${tokenWithMissingRole}`)
        .expect(res => {
          expect(res.redirect).toBeTruthy()
          expect(res.headers.location).toBe('/authError')
        })
    },
  )

  it.each([
    ['/prison-incentive-levels', 'prison-incentive-levels-list'],
    ['/prison-incentive-levels/view/STD', 'prison-incentive-levels-detail'],
  ])('should be accessible with necessary role', (url: string, expectedPage: string) => {
    return request(app)
      .get(url)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(`data-qa="${expectedPage}"`)
      })
  })
})
