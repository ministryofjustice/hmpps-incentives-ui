import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import { appWithAllRoutes } from './testutils/appSetup'
import createUserToken from './testutils/createUserToken'
import { sampleIncentiveLevels } from '../testData/incentivesApi'
import { IncentivesApi } from '../data/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/incentivesApi', () => {
  type module = typeof import('../data/incentivesApi')
  const realModule = jest.requireActual<module>('../data/incentivesApi')
  const mockedModule = jest.createMockFromModule<module>('../data/incentivesApi')
  return { __esModule: true, ...realModule, IncentivesApi: mockedModule.IncentivesApi }
})

let app: Express
let incentivesApi: jest.Mocked<IncentivesApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getIncentiveLevels.mockResolvedValue(sampleIncentiveLevels)
  incentivesApi.getIncentiveLevel.mockResolvedValue(sampleIncentiveLevels[1])
})

afterEach(() => {
  incentivesApi.updateIncentiveLevel.mockClear()
  incentivesApi.setIncentiveLevelOrder.mockClear()
})

const tokenWithMissingRole = createUserToken([])
const tokenWithNecessaryRole = createUserToken(['ROLE_MAINTAIN_INCENTIVE_LEVELS'])

describe('Incentive level management', () => {
  it.each(['/incentive-levels', '/incentive-levels/view/STD'])(
    'should not be accessible without correct role: %s',
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
    ['/incentive-levels', 'incentive-levels-list'],
    ['/incentive-levels/view/STD', 'incentive-levels-detail'],
  ])('should be accessible with necessary role: %s', (url: string, expectedPage: string) => {
    return request(app)
      .get(url)
      .set('authorization', `bearer ${tokenWithNecessaryRole}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(`data-qa="${expectedPage}"`)
      })
  })

  describe('list of levels', () => {
    it('should list all incentive levels', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          expect($tableRows.length).toEqual(6)
          const levelNames = $tableRows
            .map((_index, tr) => {
              const levelNameCell = $(tr).find('td')[0]
              return levelNameCell.textContent.trim()
            })
            .toArray()
          expect(levelNames).toEqual(['Basic', 'Standard', 'Enhanced', 'Enhanced 2', 'Enhanced 3', 'Entry'])
          const levelCodes = $tableRows
            .map((_index, tr) => {
              const levelCodeCell = $(tr).find('td')[1]
              return levelCodeCell.textContent.trim()
            })
            .toArray()
          expect(levelCodes).toEqual(['BAS', 'STD', 'ENH', 'EN2', 'EN3', 'ENT'])
        })
    })

    it('should label the status of levels', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          const statuses = $tableRows
            .map((_index, tr) => {
              const statusCell = $(tr).find('td')[2]
              return statusCell.textContent.trim()
            })
            .toArray()
          expect(statuses).toEqual(['Active', 'Active', 'Active', 'Active', 'Active', 'Inactive'])
        })
    })

    it('should only show change status link for non-required levels', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          const canBeChanged = $tableRows
            .map((_index, tr) => {
              const changeStatusCell = $(tr).find('td')[3]
              return changeStatusCell.textContent.includes('Change status')
            })
            .toArray()
          expect(canBeChanged).toEqual([false, false, false, true, true, true])
        })
    })

    it('should not show actions if all levels are required', () => {
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.filter(incentiveLevel => incentiveLevel.required),
      )
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="incentive-levels-table"] tbody tr')
          expect($tableRows.length).toEqual(3)
          $tableRows.each((_index, tr) => {
            const cell = $(tr).find('td')[3]
            expect(cell).toBeUndefined()
          })
        })
    })

    it('should always show add level button', () => {
      return request(app)
        .get('/incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).toContain('Create a new incentive level')
        })
    })
  })
})
