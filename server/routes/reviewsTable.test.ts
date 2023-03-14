import type { Express } from 'express'
import jquery from 'jquery'
import { JSDOM } from 'jsdom'
import request from 'supertest'

import config from '../config'
import { appWithAllRoutes } from './testutils/appSetup'
import { getTestIncentivesReviews } from '../testData/incentivesApi'
import HmppsAuthClient from '../data/hmppsAuthClient'
import type { Level, IncentivesReviewsRequest, sortOptions, orderOptions } from '../data/incentivesApi'
import { IncentivesApi } from '../data/incentivesApi'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/incentivesApi', () => {
  type module = typeof import('../data/incentivesApi')
  const realModule = jest.requireActual<module>('../data/incentivesApi')
  const mockedModule = jest.createMockFromModule<module>('../data/incentivesApi')
  return { __esModule: true, ...realModule, IncentivesApi: mockedModule.IncentivesApi }
})

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

const reviewsResponse = getTestIncentivesReviews()

let incentivesApi: jest.Mocked<IncentivesApi>

beforeAll(() => {
  const today = new Date('2022-10-09T13:20:35.000+01:00')
  jest.useFakeTimers({ now: today, advanceTimers: true })

  const hmppsAuthClient = HmppsAuthClient.prototype as jest.Mocked<HmppsAuthClient>
  hmppsAuthClient.getSystemClientToken.mockResolvedValue('test system token')

  incentivesApi = IncentivesApi.prototype as jest.Mocked<IncentivesApi>
  incentivesApi.getAvailableLevels.mockResolvedValue(sampleLevels)
})

afterAll(() => {
  jest.useRealTimers()
})

let app: Express

beforeEach(() => {
  config.featureFlags.newReviewsTable = ['*']
  app = appWithAllRoutes({})
  incentivesApi.getReviews.mockResolvedValue(reviewsResponse)
})

afterEach(() => {
  incentivesApi.getReviews.mockClear()
})

describe('Reviews table', () => {
  it('should show correct feedback link', () => {
    config.feedbackUrl = 'https://example.com/incorrect-1'
    config.feedbackUrlForAnalytics = 'https://example.com/incorrect-2'
    config.feedbackUrlForTable = 'https://example.com/incorrect-3'
    config.feedbackUrlForReviewsTable = 'https://example.com/correct'

    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('https://example.com/correct')
        expect(res.text).not.toContain('https://example.com/incorrect')
      })
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
    const $ = jquery(new JSDOM().window) as unknown as typeof jquery

    return request(app)
      .get('/incentive-summary/MDI-2')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage incentive reviews')

        const $body = $(res.text)
        reviewsResponse.levels.forEach(({ levelCode, levelName, overdueCount }) => {
          const overdueAtLevel = $body.find(`div[data-qa="overdue-at-level-${levelCode}"]`).text()
          expect(overdueAtLevel).toContain(levelName)
          expect(overdueAtLevel).toContain(overdueCount.toString())
        })
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
        page: 5,
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
      urlSuffix: '?order=DESC',
      expectedRequest: {
        order: 'DESC',
      },
    },
    {
      name: 'with incorrect order param',
      urlSuffix: '?order=',
      expectedRequest: {},
    },
    {
      name: 'with sort param',
      urlSuffix: '?sort=LAST_NAME',
      expectedRequest: {
        sort: 'LAST_NAME',
        order: 'ASC',
      },
    },
    {
      name: 'with incorrect sort param',
      urlSuffix: '?sort=PRISON',
      expectedRequest: {},
    },
    {
      name: 'with sort and order params',
      urlSuffix: '?order=DESC&sort=LAST_NAME',
      expectedRequest: {
        sort: 'LAST_NAME',
        order: 'DESC',
      },
    },
    {
      name: 'with sort param but incorrect order',
      urlSuffix: '?order=reversed&sort=LAST_NAME',
      expectedRequest: {
        sort: 'LAST_NAME',
        order: 'ASC',
      },
    },
    {
      name: 'with level and page params',
      urlSuffix: '?level=ENH&page=2',
      expectedRequest: {
        levelCode: 'ENH',
        page: 1,
      },
    },
    {
      name: 'with level, sort and page params',
      urlSuffix: '?page=3&level=ENH&sort=HAS_ACCT_OPEN',
      expectedRequest: {
        levelCode: 'ENH',
        page: 2,
        sort: 'HAS_ACCT_OPEN',
        order: 'DESC',
      },
    },
    {
      name: 'with level, sort, order and page params',
      urlSuffix: '?level=BAS&sort=NEGATIVE_BEHAVIOURS&order=ASC&page=4',
      expectedRequest: {
        levelCode: 'BAS',
        page: 3,
        sort: 'NEGATIVE_BEHAVIOURS',
        order: 'ASC',
      },
    },
  ]
  describe.each(reviewsRequestScenario)(
    'calls incentives api reviews endpoint',
    ({ name, urlSuffix, expectedRequest }) => {
      const defaultRequest: IncentivesReviewsRequest = {
        agencyId: 'MDI',
        locationPrefix: 'MDI-1',
        levelCode: 'BAS',
        sort: 'NEXT_REVIEW_DATE',
        order: 'ASC',
        page: 0,
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
    expectedSort: (typeof sortOptions)[number]
    expectedOrder: (typeof orderOptions)[number]
  }
  const tabScenarios: TabScenario[] = [
    {
      name: 'shows each available level',
      givenUrl: '',
      expectedLevel: 'BAS',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
    },
    {
      name: 'highlights requested level tab',
      givenUrl: '?level=ENH',
      expectedLevel: 'ENH',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
    },
    {
      name: 'falls back to basic when given incorrect level',
      givenUrl: '?level=EN2',
      expectedLevel: 'BAS',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
    },
    {
      name: 'preserves sort',
      givenUrl: '?sort=LAST_NAME',
      expectedLevel: 'BAS',
      expectedSort: 'LAST_NAME',
      expectedOrder: 'ASC',
    },
    {
      name: 'preserves sort and order',
      givenUrl: '?sort=NEGATIVE_BEHAVIOURS&order=ASC',
      expectedLevel: 'BAS',
      expectedSort: 'NEGATIVE_BEHAVIOURS',
      expectedOrder: 'ASC',
    },
    {
      name: 'accepts all parameters',
      givenUrl: '?level=BAS&sort=HAS_ACCT_OPEN&order=DESC&page=3',
      expectedLevel: 'BAS',
      expectedSort: 'HAS_ACCT_OPEN',
      expectedOrder: 'DESC',
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

            const expectedTabContents = reviewsResponse.levels.map(({ levelCode, levelName, reviewCount }) => {
              const href = `?level=${levelCode}&sort=${expectedSort}&order=${expectedOrder}`
              const title = `${levelName} (${reviewCount})`
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
        const tableRows = $body.find('.app-reviews-table tbody tr')
        const firstRowCells: HTMLTableCellElement[] = tableRows.eq(0).find('td').get()
        const [
          photoCell,
          nameCell,
          nextReviewDateCell,
          daysSinceLastReviewCell,
          positiveBehavioursCell,
          negativeBehavioursCell,
          acctCell,
        ] = firstRowCells

        expect(photoCell.innerHTML).toContain('Photo of G6123VU')
        expect(nameCell.textContent).toContain('Saunders, John')
        expect(nameCell.textContent).toContain('G6123VU')
        expect(nextReviewDateCell.textContent).toContain('12 July 2022')
        expect(nextReviewDateCell.textContent).toContain('89 days overdue')
        expect(daysSinceLastReviewCell.textContent).toContain('37 days ago')
        expect(positiveBehavioursCell.textContent.trim()).toEqual('3')
        expect(positiveBehavioursCell.innerHTML).toContain(
          '/prisoner/G6123VU/case-notes?type=POS&amp;fromDate=09/07/2022',
        )
        expect(negativeBehavioursCell.textContent.trim()).toEqual('2')
        expect(negativeBehavioursCell.innerHTML).toContain(
          '/prisoner/G6123VU/case-notes?type=NEG&amp;fromDate=09/07/2022',
        )
        expect(acctCell.textContent).toContain('ACCT open')

        const secondRowCells: HTMLTableCellElement[] = tableRows.eq(1).find('td').get()
        const daysSinceLastReviewWithoutRealReviewCell = secondRowCells[3]
        expect(daysSinceLastReviewWithoutRealReviewCell.textContent).toContain('Not reviewed')
      })
  })

  it('shows an informative message instead of no rows', () => {
    const $ = jquery(new JSDOM().window) as unknown as typeof jquery

    incentivesApi.getReviews.mockResolvedValue({
      ...getTestIncentivesReviews(),
      reviewCount: 0,
      reviews: [],
    })

    return request(app)
      .get('/incentive-summary/MDI-1')
      .expect(res => {
        const $body = $(res.text)
        const firstRowCells: HTMLTableCellElement[] = $body.find('.app-reviews-table tbody tr').first().find('td').get()
        expect(firstRowCells.length).toEqual(1)
        const [messageCell] = firstRowCells
        expect(messageCell.textContent).toContain('There are no prisoners at Houseblock 1 on Basic')
      })
  })

  type SortingScenario = {
    name: string
    givenUrl: string
    expectedLevel: string
    expectedSort: (typeof sortOptions)[number]
    expectedOrder: (typeof orderOptions)[number]
  }
  const sortingScenarios: SortingScenario[] = [
    {
      name: 'uses basic level and sorting if not provided',
      givenUrl: '',
      expectedLevel: 'BAS',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
    },
    {
      name: 'preserves level and uses default sorting if not provided',
      givenUrl: '?level=ENH',
      expectedLevel: 'ENH',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
    },
    {
      name: 'preserves level, dropping page, and uses default sorting if not provided',
      givenUrl: '?level=ENH&page=3',
      expectedLevel: 'ENH',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
    },
    {
      name: 'accepts provided sort and uses basic level',
      givenUrl: '?sort=LAST_NAME',
      expectedLevel: 'BAS',
      expectedSort: 'LAST_NAME',
      expectedOrder: 'ASC',
    },
    {
      name: 'accepts provided sort & ordering and uses basic level',
      givenUrl: '?sort=LAST_NAME&order=DESC',
      expectedLevel: 'BAS',
      expectedSort: 'LAST_NAME',
      expectedOrder: 'DESC',
    },
    {
      name: 'accepts provided sort and uses basic level',
      givenUrl: '?sort=POSITIVE_BEHAVIOURS',
      expectedLevel: 'BAS',
      expectedSort: 'POSITIVE_BEHAVIOURS',
      expectedOrder: 'DESC',
    },
    {
      name: 'accepts provided sort & ordering and uses basic level',
      givenUrl: '?sort=POSITIVE_BEHAVIOURS&order=DESC',
      expectedLevel: 'BAS',
      expectedSort: 'POSITIVE_BEHAVIOURS',
      expectedOrder: 'DESC',
    },
    {
      name: 'accepts provided sort and preserves level',
      givenUrl: '?sort=LAST_NAME&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'LAST_NAME',
      expectedOrder: 'ASC',
    },
    {
      name: 'accepts provided sort & ordering and preserves level',
      givenUrl: '?sort=LAST_NAME&order=DESC&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'LAST_NAME',
      expectedOrder: 'DESC',
    },
    {
      name: 'accepts provided sort and preserves level',
      givenUrl: '?sort=POSITIVE_BEHAVIOURS&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'POSITIVE_BEHAVIOURS',
      expectedOrder: 'DESC',
    },
    {
      name: 'accepts provided sort & ordering and preserves level',
      givenUrl: '?sort=POSITIVE_BEHAVIOURS&order=DESC&level=BAS',
      expectedLevel: 'BAS',
      expectedSort: 'POSITIVE_BEHAVIOURS',
      expectedOrder: 'DESC',
    },
  ]
  describe.each(sortingScenarios)(
    'includes sortable columns which',
    ({ name, givenUrl, expectedLevel, expectedSort, expectedOrder }) => {
      // NB: sorting resets page, but preserves level

      const oppositeOrder = expectedOrder === 'ASC' ? 'DESC' : 'ASC'

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
                const ariaSortOrder = th.getAttribute('aria-sort')
                if (index === 0) {
                  // first column is not sortable and has no link
                  expect(href).toBeUndefined()
                  expect(ariaSortOrder).toBeNull()
                }
                return { href, ariaSortOrder }
              })
              .get()
              .slice(1)

            // eslint-disable-next-line no-restricted-syntax
            for (const { href, ariaSortOrder } of columns) {
              const column = /sort=([^&]+)/.exec(href)[1]
              // level should be preserved
              expect(href).toContain(`?level=${expectedLevel}&`)
              // page should be reset
              expect(href).not.toContain('page=')
              if (column === expectedSort) {
                // column by which table is sorted
                const expectedAriaSortOrder = { ASC: 'ascending', DESC: 'descending' }[expectedOrder]
                expect(ariaSortOrder).toEqual(expectedAriaSortOrder)
                // sorted column's link should flip order
                expect(href).toContain(`sort=${column}&order=${oppositeOrder}`)
              } else {
                // column by which table is not sorted
                expect(ariaSortOrder).toEqual('none')
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
    expectedSort: (typeof sortOptions)[number]
    expectedOrder: (typeof orderOptions)[number]
    expectedPages: number[]
  }
  const paginationScenarios: PaginationScenario[] = [
    {
      name: 'preserves level and uses default sorting; defaults to page 1',
      givenUrl: '?level=ENH',
      expectedLevel: 'ENH',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves level and uses default sorting; accepts page',
      givenUrl: '?level=ENH&page=1',
      expectedLevel: 'ENH',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves level and uses default sorting; accepts another page',
      givenUrl: '?page=3&level=STD',
      expectedLevel: 'STD',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
      expectedPages: [1, 2, 3, 4, 6, 7],
    },
    {
      name: 'uses basic level and sorting if not provided',
      givenUrl: '',
      expectedLevel: 'BAS',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'uses basic level and sorting if not provided; accepts page',
      givenUrl: '?page=7',
      expectedLevel: 'BAS',
      expectedSort: 'NEXT_REVIEW_DATE',
      expectedOrder: 'ASC',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves sort and uses basic level if not provided',
      givenUrl: '?page=7&sort=LAST_NAME',
      expectedLevel: 'BAS',
      expectedSort: 'LAST_NAME',
      expectedOrder: 'ASC',
      expectedPages: [1, 2, 6, 7],
    },
    {
      name: 'preserves sort and order, but uses basic level if not provided',
      givenUrl: '?page=7&order=DESC&sort=LAST_NAME',
      expectedLevel: 'BAS',
      expectedSort: 'LAST_NAME',
      expectedOrder: 'DESC',
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
