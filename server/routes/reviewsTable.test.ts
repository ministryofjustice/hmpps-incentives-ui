import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes } from './testutils/appSetup'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { IncentivesApi, type Level } from '../data/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/incentivesApi')

const sampleLevels: Level[] = [
  {
    iepLevel: 'BAS',
    iepDescription: 'Basic',
    sequence: 1,
    default: false,
  },
  {
    iepLevel: 'STD',
    iepDescription: 'Standard',
    sequence: 2,
    default: true,
  },
  {
    iepLevel: 'ENH',
    iepDescription: 'Enhanced',
    sequence: 3,
    default: false,
  },
]

let app: Express

beforeEach(() => {
  config.featureFlags.newReviewsTable = true
  app = appWithAllRoutes({})

  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')

  const incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getAvailableLevels.mockResolvedValue(sampleLevels)
  incentivesApi.getReviews.mockResolvedValue({
    locationDescription: 'Houseblock 1',
    overdueCount: 16,
    reviewCount: 135,
    reviews: [
      {
        firstName: 'John',
        lastName: 'Saunders',
        prisonerNumber: 'G6123VU',
        bookingId: 100000,
        imageId: 0,
        nextReviewDate: new Date(2022, 6, 12),
        positiveBehaviours: 3,
        negativeBehaviours: 2,
        acctStatus: true,
      },
      {
        firstName: 'Flem',
        lastName: 'Hermosilla',
        prisonerNumber: 'G5992UH',
        bookingId: 100001,
        imageId: 0,
        nextReviewDate: new Date(2023, 9, 10),
        positiveBehaviours: 2,
        negativeBehaviours: 0,
        acctStatus: false,
      },
    ],
  })
})

describe('Reviews table', () => {
  beforeAll(() => {
    const today = new Date('2022-10-09T13:20:35.000+01:00')
    jest.useFakeTimers({ now: today, advanceTimers: true })
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should show selected location', () => {
    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage incentive reviews')
        expect(res.text).toContain('Houseblock 1')
      })
  })

  it('should show number of overdue reviews', () => {
    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage incentive reviews')
        expect(res.text).toContain('<dd>16</dd>')
      })
  })

  it('shows tabs for each available level', () => {
    return request(app)
      .get('/incentive-summary/MDI-1')
      .expect(res => {
        // eslint-disable-next-line no-restricted-syntax
        for (const { iepLevel } of sampleLevels) {
          expect(res.text).toContain(`?level=${iepLevel}`)
        }
      })
  })

  it.each([
    ['', 'Standard'],
    ['?level=BAS', 'Basic'],
    ['?level=ENH', 'Enhanced'],
    ['?level=EN2', 'Standard'],
  ])('should select requested tab or fall back to default', (urlSuffix, expectedLevel) => {
    const $ = jquery(new JSDOM().window) as unknown as typeof jquery

    return request(app)
      .get(`/incentive-summary/MDI-1${urlSuffix}`)
      .expect(res => {
        const $body = $(res.text)
        const selectedLevel = $body.find('.govuk-tabs__list-item--selected').text().trim()
        expect(selectedLevel).toEqual(expectedLevel)
      })
  })

  it('lists basic review information', () => {
    return request(app)
      .get('/incentive-summary/MDI-1')
      .expect(res => {
        expect(res.text).toContain('Saunders, John')
        expect(res.text).toContain('G6123VU')
        expect(res.text).toContain('12 July 2022')
        expect(res.text).toContain('89 days overdue')
        expect(res.text).toContain('/prisoner/G6123VU/case-notes?type=POS&amp;fromDate=09/07/2022')
        expect(res.text).toContain('/prisoner/G6123VU/case-notes?type=NEG&amp;fromDate=09/07/2022')
        expect(res.text).toContain('ACCT open')
      })
  })

  it.each([
    ['?level=ENH', 'ENH', [1, 2, 6, 7]],
    ['?level=ENH&page=1', 'ENH', [1, 2, 6, 7]],
    ['?page=3&level=STD', 'STD', [1, 2, 3, 4, 6, 7]],
    ['?page=7', 'STD', [1, 2, 6, 7]],
  ])('includes pagination component', (urlSuffix, level, pages) => {
    return request(app)
      .get(`/incentive-summary/MDI-1${urlSuffix}`)
      .expect(res => {
        const pageLink = (page: number) => `?level=${level}&amp;page=${page}`
        for (let page = 1; page <= 10; page += 1) {
          if (pages.includes(page)) {
            expect(res.text).toContain(pageLink(page))
          } else {
            expect(res.text).not.toContain(pageLink(page))
          }
        }
      })
  })

  it.each(['?page=', '?page=0', '?page=-1', '?page=one', '?page=two&level=BAS'])(
    'responds with 404 if page number is invalid',
    urlSuffix => {
      return request(app).get(`/incentive-summary/MDI-1${urlSuffix}`).expect(404)
    },
  )
})
