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

  type SortingScenario = {
    name: string
    givenUrl: string
    expectedLevel: string
    expectedSort: string
    expectedOrder: 'ascending' | 'descending'
  }
  const sortingScenarios: SortingScenario[] = [
    {
      name: 'uses default level and sorting if not provided',
      givenUrl: '',
      expectedLevel: 'STD',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
    },
    {
      name: 'preserves level and uses default sorting if not provided',
      givenUrl: '?level=ENH',
      expectedLevel: 'ENH',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
    },
    {
      name: 'preserves level, dropping page, and uses default sorting if not provided',
      givenUrl: '?level=ENH&page=3',
      expectedLevel: 'ENH',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
    },
    {
      name: 'accepts provided sort and uses default level',
      givenUrl: '?sort=name',
      expectedLevel: 'STD',
      expectedSort: 'name',
      expectedOrder: 'ascending',
    },
    {
      name: 'accepts provided sort & ordering and uses default level',
      givenUrl: '?sort=name&order=descending',
      expectedLevel: 'STD',
      expectedSort: 'name',
      expectedOrder: 'descending',
    },
    {
      name: 'accepts provided sort and uses default level',
      givenUrl: '?sort=positiveBehaviours',
      expectedLevel: 'STD',
      expectedSort: 'positiveBehaviours',
      expectedOrder: 'descending',
    },
    {
      name: 'accepts provided sort & ordering and uses default level',
      givenUrl: '?sort=positiveBehaviours&order=descending',
      expectedLevel: 'STD',
      expectedSort: 'positiveBehaviours',
      expectedOrder: 'descending',
    },
    {
      name: 'accepts provided sort and preserves level',
      givenUrl: '?sort=name&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'name',
      expectedOrder: 'ascending',
    },
    {
      name: 'accepts provided sort & ordering and preserves level',
      givenUrl: '?sort=name&order=descending&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'name',
      expectedOrder: 'descending',
    },
    {
      name: 'accepts provided sort and preserves level',
      givenUrl: '?sort=positiveBehaviours&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'positiveBehaviours',
      expectedOrder: 'descending',
    },
    {
      name: 'accepts provided sort & ordering and preserves level',
      givenUrl: '?sort=positiveBehaviours&order=descending&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'positiveBehaviours',
      expectedOrder: 'descending',
    },
  ]
  describe.each(sortingScenarios)(
    'includes sortable columns which',
    ({ name, givenUrl, expectedLevel, expectedSort, expectedOrder }) => {
      // NB: sorting resets page, but preserves level

      const oppositeOrder = expectedOrder === 'ascending' ? 'descending' : 'ascending'

      it(name, () => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        return request(app)
          .get(`/incentive-summary/MDI-1${givenUrl}`)
          .expect(res => {
            const $body = $(res.text)
            const columns = $body
              .find('.app-reviews-table thead tr th')
              .map((index, th: HTMLTableCellElement) => {
                const href = $(th).find('a').attr('href')
                const order = th.getAttribute('aria-sort')
                if (index === 0) {
                  // first column is not sortable and has no link
                  expect(href).toBeUndefined()
                  expect(order).toBeNull()
                }
                return { href, order }
              })
              .get()
              .slice(1)

            // eslint-disable-next-line no-restricted-syntax
            for (const { href, order } of columns) {
              const column = /sort=([^&]+)/.exec(href)[1]
              // level should be preserved
              expect(href).toContain(`?level=${expectedLevel}&`)
              // page should be reset
              expect(href).not.toContain('page=')
              if (column === expectedSort) {
                // column by which table is sorted
                expect(order).toEqual(expectedOrder)
                // sorted column's link should flip order
                expect(href).toContain(`sort=${column}&order=${oppositeOrder}`)
              } else {
                // column by which table is not sorted
                expect(order).toEqual('none')
                // unsorted column's link should replicate order
                expect(href).toContain(`sort=${column}&order=${expectedOrder}`)
              }
            }
          })
      })
    },
  )

  type PaginationScenario = {
    name: string
    givenUrl: string
    expectedLevel: string
    expectedSort: string
    expectedOrder: 'ascending' | 'descending'
    expectedPages: number[]
  }
  const paginationScenarios: PaginationScenario[] = [
    {
      name: 'preserves level and uses default sorting; defaults to page 1',
      givenUrl: '?level=ENH',
      expectedLevel: 'ENH',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves level and uses default sorting; accepts page',
      givenUrl: '?level=ENH&page=1',
      expectedLevel: 'ENH',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves level and uses default sorting; accepts another page',
      givenUrl: '?page=3&level=STD',
      expectedLevel: 'STD',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
      expectedPages: [1, 2, 3, 4, 6, 7],
    },
    {
      name: 'uses default level and sorting if not provided',
      givenUrl: '',
      expectedLevel: 'STD',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'uses default level and sorting if not provided; accepts page',
      givenUrl: '?page=7',
      expectedLevel: 'STD',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves sort and uses default level if not provided',
      givenUrl: '?page=7&sort=name',
      expectedLevel: 'STD',
      expectedSort: 'name',
      expectedOrder: 'ascending',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves sort and order, but uses default level if not provided',
      givenUrl: '?page=7&order=descending&sort=name',
      expectedLevel: 'STD',
      expectedSort: 'name',
      expectedOrder: 'descending',
      expectedPages: [1, 2, 6, 7],
    },
  ]
  describe.each(paginationScenarios)(
    'includes pagination component which',
    ({ name, givenUrl, expectedLevel, expectedSort, expectedOrder, expectedPages }) => {
      // NB: pagination preserves sort and level

      const paginationUrlPrefix = `?level=${expectedLevel}&amp;sort=${expectedSort}&amp;order=${expectedOrder}`

      it(name, () => {
        const $ = jquery(new JSDOM().window) as unknown as typeof jquery

        return request(app)
          .get(`/incentive-summary/MDI-1${givenUrl}`)
          .expect(res => {
            const $body = $(res.text)
            const paginationHtml = $body.find('.app-reviews-pagination').html()

            const pageLink = (page: number) => `${paginationUrlPrefix}&amp;page=${page}`
            for (let page = 1; page <= 10; page += 1) {
              if (expectedPages.includes(page)) {
                expect(paginationHtml).toContain(pageLink(page))
              } else {
                expect(paginationHtml).not.toContain(pageLink(page))
              }
            }
          })
      })
    },
  )

  it.each(['?page=', '?page=0', '?page=-1', '?page=one', '?page=two&level=BAS'])(
    'responds with 404 if page number is invalid',
    urlSuffix => {
      return request(app).get(`/incentive-summary/MDI-1${urlSuffix}`).expect(404)
    },
  )
})
