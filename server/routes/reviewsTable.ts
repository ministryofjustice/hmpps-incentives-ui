import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'

import config from '../config'
import { pagination } from '../utils/pagination'
import { type SortableTableColumns, sortableTableHead } from '../utils/sortableTable'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { createRedisClient } from '../data/redisClient'
import {
  IncentivesApi,
  sortOptions,
  orderOptions,
  type IncentivesReviewsPaginationAndSorting,
} from '../data/incentivesApi'
import TokenStore from '../data/tokenStore'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient('routes/incentivesTable.ts')))

const PAGE_SIZE = 20

const tableColumns: SortableTableColumns<string> = [
  { column: 'photo', escapedHtml: '<span class="govuk-visually-hidden">Prisoner photo</span>', unsortable: true },
  { column: 'LAST_NAME', escapedHtml: 'Name and prison number' },
  { column: 'NEXT_REVIEW_DATE', escapedHtml: 'Next review due by' },
  { column: 'DAYS_SINCE_LAST_REVIEW', escapedHtml: 'Days since last review' },
  {
    column: 'POSITIVE_BEHAVIOURS',
    escapedHtml: 'Positive behaviours <br /> since last review <br /> (up to 3 months)',
  },
  {
    column: 'NEGATIVE_BEHAVIOURS',
    escapedHtml: 'Negative behaviours <br /> since last review <br /> (up to 3 months)',
  },
  { column: 'info', escapedHtml: 'Additional information', unsortable: true },
]

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { user } = res.locals
    const { locationPrefix } = req.params
    let { level: selectedLevelCode }: { level?: string } = req.query
    const { page: pageString }: { page?: string } = req.query
    const { sort: sortString, order: orderString }: { sort?: string; order?: string } = req.query

    const page = parsePagination(pageString)
    const { sort, order } = parseSorting(sortString, orderString)

    const caseNoteFilter = getCaseNoteFilter()

    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
    const incentivesApi = new IncentivesApi(systemToken)

    const agencyId = locationPrefix.split('-')[0]
    const levels = await incentivesApi.getPrisonIncentiveLevels(agencyId)

    const selectedLevel = levels.find(level => level.levelCode === selectedLevelCode)
    let selectedLevelDescription = selectedLevel?.levelName
    if (!selectedLevel) {
      const basicOrFirstLevel = levels.find(level => level.levelCode === 'BAS') ?? levels[0]
      selectedLevelCode = basicOrFirstLevel.levelCode
      selectedLevelDescription = basicOrFirstLevel.levelName
    }

    const response = await incentivesApi.getReviews({
      agencyId,
      locationPrefix,
      levelCode: selectedLevelCode,
      sort,
      order,
      page: page - 1,
      pageSize: PAGE_SIZE,
    })

    const tableHead = sortableTableHead({
      gaPrefix: 'Reviews table',
      columns: tableColumns,
      urlPrefix: `?level=${selectedLevelCode}`,
      sortColumn: sort,
      order,
    })

    const { reviewCount } = response.levels.find(level => level.levelCode === selectedLevelCode)
    const pageCount = Math.ceil(reviewCount / PAGE_SIZE)
    const paginationUrlPrefix = `?level=${selectedLevelCode}&sort=${sort}&order=${order}&`
    const paginationParams = pagination(page, pageCount, paginationUrlPrefix)
    paginationParams.landmarkLabel = 'Incentive level review details'
    if (paginationParams.previous) {
      paginationParams.previous.attributes = {
        'aria-label': 'Previous page of prisoner details and review status',
      }
    }
    if (paginationParams.next) {
      paginationParams.next.attributes = {
        'aria-label': 'Next page of prisoner details and review status',
      }
    }

    res.render('pages/reviewsTable', {
      dpsUrl: config.dpsUrl,
      locationPrefix,
      locationDescription: response.locationDescription,
      levels: response.levels,
      caseNoteFilter,
      selectedLevelCode,
      selectedLevelDescription,
      tableHead,
      reviews: response.reviews,
      page,
      pageCount,
      paginationParams,
      sort,
      order,
    })
  })

  return router
}

function parsePagination(pageString: string | undefined): number {
  const page = parseInt(pageString ?? '1', 10)
  if (!(page >= 1)) {
    throw new NotFound('Page number is out of range')
  }
  return page
}

type Sort = IncentivesReviewsPaginationAndSorting['sort']
type Order = IncentivesReviewsPaginationAndSorting['order']

function parseSorting(sortString: string | undefined, orderString: string | undefined): { sort: Sort; order: Order } {
  // default to sorting by next review date if not provided or invalid
  if (!sortOptions.includes(sortString as Sort)) {
    // eslint-disable-next-line no-param-reassign
    sortString = 'NEXT_REVIEW_DATE'
  }

  // default ordering if not provided or invalid
  if (!orderOptions.includes(orderString as Order)) {
    // these columns prefer descending order:
    if (['POSITIVE_BEHAVIOURS', 'NEGATIVE_BEHAVIOURS', 'HAS_ACCT_OPEN', 'IS_NEW_TO_PRISON'].includes(sortString)) {
      // eslint-disable-next-line no-param-reassign
      orderString = 'DESC'
    } else {
      // eslint-disable-next-line no-param-reassign
      orderString = 'ASC'
    }
  }

  return { sort: sortString as Sort, order: orderString as Order }
}

function getCaseNoteFilter() {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setMonth(date.getMonth() - 3)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `fromDate=${day}/${month}/${year}`
}
