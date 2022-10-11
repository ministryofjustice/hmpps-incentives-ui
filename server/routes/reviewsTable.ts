import type { RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'

import config from '../config'
import { pagination } from '../utils/pagination'
import asyncMiddleware from '../middleware/asyncMiddleware'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { createRedisClient } from '../data/redisClient'
import { IncentivesApi } from '../data/incentivesApi'
import TokenStore from '../data/tokenStore'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient('routes/incentivesTable.ts')))
const feedbackUrl = config.feedbackUrlForTable || config.feedbackUrl

const PAGE_SIZE = 20

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Manage incentive reviews' })

    const { user } = res.locals
    const { locationPrefix } = req.params
    let { level: selectedLevelCode }: { level?: string } = req.query
    const { page: pageString }: { page?: string } = req.query
    const agencyId = locationPrefix.split('-')[0]

    const page = parseInt(pageString ?? '1', 10)
    if (!(page >= 1)) {
      throw new NotFound('Page number is out of range')
    }
    const caseNoteFilter = getCaseNoteFilter()

    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
    const incentivesApi = new IncentivesApi(systemToken)

    const levels = await incentivesApi.getAvailableLevels(agencyId)
    const defaultLevel = levels.find(level => level.default) ?? levels[0]
    if (!levels.some(level => level.iepLevel === selectedLevelCode)) {
      selectedLevelCode = defaultLevel.iepLevel
    }

    const response = await incentivesApi.getReviews(agencyId, locationPrefix, selectedLevelCode)

    const pageCount = Math.ceil(response.reviewCount / PAGE_SIZE)
    const paginationParams = pagination(page, pageCount, `?level=${selectedLevelCode}&`)

    res.render('pages/reviewsTable', {
      dpsUrl: config.dpsUrl,
      feedbackUrl,
      locationDescription: response.locationDescription,
      overdueCount: response.overdueCount,
      levels,
      caseNoteFilter,
      selectedLevelCode,
      reviews: response.reviews,
      paginationParams,
    })
  })

  return router
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
