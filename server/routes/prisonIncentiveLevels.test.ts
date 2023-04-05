import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
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

let app: Express
let incentivesApi: jest.Mocked<IncentivesApi>

beforeEach(() => {
  app = appWithAllRoutes({})

  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getIncentiveLevels.mockResolvedValue(sampleIncentiveLevels)
  incentivesApi.getPrisonIncentiveLevels.mockResolvedValue(samplePrisonIncentiveLevels)
  incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[1])
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

  describe('list of levels', () => {
    it('should list all incentive levels', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="prison-incentive-levels-table"] tbody tr')
          const levelNames = $tableRows
            .map((_index, tr) => {
              const levelNameCell = $(tr).find('th')[0]
              return levelNameCell.textContent.trim()
            })
            .toArray()
          expect(levelNames).toEqual(['Basic', 'Standard', 'Enhanced'])
        })
    })

    it('should lable the default level for new prisoners', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="prison-incentive-levels-table"] tbody tr')
          const tags = $tableRows
            .map((_index, tr) => {
              const tagCell = $(tr).find('td')[0]
              return tagCell.textContent.trim()
            })
            .toArray()
          expect(tags).toHaveLength(3)
          expect(tags[0]).not.toContain('Default')
          expect(tags[1]).toContain('Default')
          expect(tags[2]).not.toContain('Default')
        })
    })

    it('should only show remove link for levels that are not required', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery
      // pretend that only BAS & STD are required
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.map((incentiveLevel, index) => {
          return { ...incentiveLevel, required: index < 2 }
        }),
      )

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('[data-qa="prison-incentive-levels-table"] tbody tr')
          const linkTexts = $tableRows
            .map((_index, tr) => {
              const linkCell = $(tr).find('td')[1]
              return linkCell.textContent
            })
            .toArray()
          expect(linkTexts).toHaveLength(3)
          expect(linkTexts[0]).not.toContain('Remove level')
          expect(linkTexts[1]).not.toContain('Remove level')
          expect(linkTexts[2]).toContain('Remove level')
        })
    })

    it('should show add level button when there are some available levels', () => {
      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).toContain('Add a new incentive level')
        })
    })

    it('should show not add level button when there are no more available levels', () => {
      // pretend that only BAS, STD & ENH exist all of which are already active
      incentivesApi.getIncentiveLevels.mockResolvedValue(
        sampleIncentiveLevels.filter(incentiveLevel =>
          samplePrisonIncentiveLevels.some(
            prisonIncentiveLevel => incentiveLevel.code === prisonIncentiveLevel.levelCode,
          ),
        ),
      )

      return request(app)
        .get('/prison-incentive-levels')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          expect(res.text).not.toContain('Add a new incentive level')
        })
    })
  })

  describe('details of a level', () => {
    it('should show money and visit information', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      return request(app)
        .get('/prison-incentive-levels/view/STD')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('tbody tr')
          const values = $tableRows
            .map((_index, tr) => {
              const valueCell = $(tr).find('td')[1]
              return valueCell.textContent.trim()
            })
            .toArray()
          expect(values).toEqual([
            'Yes',
            '£60.50 per week',
            '£19.80 per week',
            '£605',
            '£198',
            '1 per 2 weeks',
            '2 per 4 weeks',
          ])
        })
    })

    it('should state when a level is not the default for new prisoners', () => {
      const $ = jquery(new JSDOM().window) as unknown as typeof jquery
      incentivesApi.getPrisonIncentiveLevel.mockResolvedValue(samplePrisonIncentiveLevels[0])

      return request(app)
        .get('/prison-incentive-levels/view/BAS')
        .set('authorization', `bearer ${tokenWithNecessaryRole}`)
        .expect(res => {
          const $body = $(res.text)
          const $tableRows = $body.find('tbody tr')
          const values = $tableRows
            .map((_index, tr) => {
              const valueCell = $(tr).find('td')[1]
              return valueCell.textContent.trim()
            })
            .toArray()
          expect(values).toEqual([
            'No',
            '£27.50 per week',
            '£5.50 per week',
            '£275',
            '£55',
            '1 per 2 weeks',
            '0 per 4 weeks',
          ])
        })
    })
  })
})
