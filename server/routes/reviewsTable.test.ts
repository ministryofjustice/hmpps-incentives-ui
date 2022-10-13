import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes } from './testutils/appSetup'
import { getTestIncentivesReviews } from '../testData/incentivesApi'
import HmppsAuthClient from '../data/hmppsAuthClient'
import type { Level, IncentivesReviewsRequest } from '../data/incentivesApi'
import { IncentivesApi } from '../data/incentivesApi'

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

let incentivesApi: jest.Mocked<IncentivesApi>

beforeAll(() => {
  const today = new Date('2022-10-09T13:20:35.000+01:00')
  jest.useFakeTimers({ now: today, advanceTimers: true })

  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')

  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getAvailableLevels.mockResolvedValue(sampleLevels)
  incentivesApi.getReviews.mockResolvedValue(getTestIncentivesReviews())
})

afterAll(() => {
  jest.useRealTimers()
})

let app: Express

beforeEach(() => {
  config.featureFlags.newReviewsTable = true
  app = appWithAllRoutes({})
})

afterEach(() => {
  incentivesApi.getReviews.mockClear()
})

describe('Reviews table', () => {
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

  type ReviewsRequestScenario = {
    name: string
    urlSuffix: string
    expectedRequest: Partial<IncentivesReviewsRequest>
  }
  const reviewsRequestScenario: ReviewsRequestScenario[] = [
    {
      name: 'without params',
      urlSuffix: '',
      expectedRequest: {},
    },
    {
      name: 'with incorrect params',
      urlSuffix: '?level=ENT&sort=prisonerNumber&order=down',
      expectedRequest: {},
    },
    {
      name: 'with page param',
      urlSuffix: '?page=6',
      expectedRequest: {
        page: 6,
      },
    },
    {
      name: 'with level param',
      urlSuffix: '?level=ENH',
      expectedRequest: {
        levelCode: 'ENH',
      },
    },
    {
      name: 'with incorrect level param',
      urlSuffix: '?level=EN2',
      expectedRequest: {},
    },
    {
      name: 'with order param',
      urlSuffix: '?order=descending',
      expectedRequest: {
        order: 'descending',
      },
    },
    {
      name: 'with incorrect order param',
      urlSuffix: '?order=',
      expectedRequest: {},
    },
    {
      name: 'with sort param',
      urlSuffix: '?sort=name',
      expectedRequest: {
        sort: 'name',
        order: 'ascending',
      },
    },
    {
      name: 'with incorrect sort param',
      urlSuffix: '?sort=unknown',
      expectedRequest: {},
    },
    {
      name: 'with sort and order params',
      urlSuffix: '?order=descending&sort=name',
      expectedRequest: {
        sort: 'name',
        order: 'descending',
      },
    },
    {
      name: 'with sort param but incorrect order',
      urlSuffix: '?order=reversed&sort=name',
      expectedRequest: {
        sort: 'name',
        order: 'ascending',
      },
    },
    {
      name: 'with level and page params',
      urlSuffix: '?level=ENH&page=2',
      expectedRequest: {
        levelCode: 'ENH',
        page: 2,
      },
    },
    {
      name: 'with level, sort and page params',
      urlSuffix: '?page=3&level=ENH&sort=acctStatus',
      expectedRequest: {
        levelCode: 'ENH',
        page: 3,
        sort: 'acctStatus',
        order: 'descending',
      },
    },
    {
      name: 'with level, sort, order and page params',
      urlSuffix: '?level=BAS&sort=negativeBehaviours&order=ascending&page=4',
      expectedRequest: {
        levelCode: 'BAS',
        page: 4,
        sort: 'negativeBehaviours',
        order: 'ascending',
      },
    },
  ]
  describe.each(reviewsRequestScenario)(
    'calls incentives api reviews endpoint',
    ({ name, urlSuffix, expectedRequest }) => {
      const defaultRequest: IncentivesReviewsRequest = {
        agencyId: 'MDI',
        locationPrefix: 'MDI-1',
        levelCode: 'STD',
        sort: 'nextReviewDate',
        order: 'ascending',
        page: 1,
        pageSize: 20,
      }

      it(name, () => {
        return request(app)
          .get(`/incentive-summary/MDI-1${urlSuffix}`)
          .expect(() => {
            expect(incentivesApi.getReviews).toHaveBeenCalledWith({
              ...defaultRequest,
              ...expectedRequest,
            })
          })
      })
    },
  )

  type TabScenario = {
    name: string
    givenUrl: string
    expectedLevel: string
    expectedSort: string
    expectedOrder: 'ascending' | 'descending'
  }
  const tabScenarios: TabScenario[] = [
    {
      name: 'shows each available level',
      givenUrl: '',
      expectedLevel: 'STD',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
    },
    {
      name: 'highlights requested level tab',
      givenUrl: '?level=ENH',
      expectedLevel: 'ENH',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
    },
    {
      name: 'falls back to default when given incorrect level',
      givenUrl: '?level=EN2',
      expectedLevel: 'STD',
      expectedSort: 'nextReviewDate',
      expectedOrder: 'ascending',
    },
    {
      name: 'preserves sort',
      givenUrl: '?sort=name',
      expectedLevel: 'STD',
      expectedSort: 'name',
      expectedOrder: 'ascending',
    },
    {
      name: 'preserves sort and order',
      givenUrl: '?sort=negativeBehaviours&order=ascending',
      expectedLevel: 'STD',
      expectedSort: 'negativeBehaviours',
      expectedOrder: 'ascending',
    },
    {
      name: 'accepts all parameters',
      givenUrl: '?level=BAS&sort=acctStatus&order=descending&page=3',
      expectedLevel: 'BAS',
      expectedSort: 'acctStatus',
      expectedOrder: 'descending',
    },
  ]
  describe.each(tabScenarios)(
    'includes tab component which',
    ({ name, givenUrl, expectedLevel, expectedSort, expectedOrder }) => {
      // NB: tabs reset page and sort, but preserve level

      const $ = jquery(new JSDOM().window) as unknown as typeof jquery

      it(name, () => {
        return request(app)
          .get(`/incentive-summary/MDI-1${givenUrl}`)
          .expect(res => {
            const $body = $(res.text)
            const $tabsUl = $body.find('.govuk-tabs__list')

            let selectedLevel: string | null = null
            const tabContents = $tabsUl
              .find('a')
              .map((_, a) => {
                const { href } = a
                const title = a.textContent.trim()
                const level = /level=([^&]+)/.exec(href)[1]
                expect(level).toBeTruthy()

                if ($(a).parent().hasClass('govuk-tabs__list-item--selected')) {
                  expect(selectedLevel).toBeNull()
                  selectedLevel = level
                }

                return { href, title }
              })
              .get()

            const expectedTabContents = sampleLevels.map(({ iepLevel, iepDescription }) => {
              const href = `?level=${iepLevel}&sort=${expectedSort}&order=${expectedOrder}`
              const title = iepDescription
              return { href, title }
            })

            expect(selectedLevel).toEqual(expectedLevel)
            expect(tabContents).toEqual(expectedTabContents)
          })
      })
    },
  )

  it('lists basic review information', () => {
    const $ = jquery(new JSDOM().window) as unknown as typeof jquery

    return request(app)
      .get('/incentive-summary/MDI-1')
      .expect(res => {
        const $body = $(res.text)
        const firstRowCells: HTMLTableCellElement[] = $body.find('.app-reviews-table tbody tr').first().find('td').get()
        const [
          photoCell,
          nameCell,
          nextReviewDateCell,
          positiveBehavioursCell,
          negativeBehavioursCell,
          acctStatusCell,
        ] = firstRowCells

        expect(photoCell.innerHTML).toContain('Photo of G6123VU')
        expect(nameCell.textContent).toContain('Saunders, John')
        expect(nameCell.textContent).toContain('G6123VU')
        expect(nextReviewDateCell.textContent).toContain('12 July 2022')
        expect(nextReviewDateCell.textContent).toContain('89 days overdue')
        expect(positiveBehavioursCell.textContent.trim()).toEqual('3')
        expect(positiveBehavioursCell.innerHTML).toContain(
          '/prisoner/G6123VU/case-notes?type=POS&amp;fromDate=09/07/2022',
        )
        expect(negativeBehavioursCell.textContent.trim()).toEqual('2')
        expect(negativeBehavioursCell.innerHTML).toContain(
          '/prisoner/G6123VU/case-notes?type=NEG&amp;fromDate=09/07/2022',
        )
        expect(acctStatusCell.textContent).toContain('ACCT open')
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
