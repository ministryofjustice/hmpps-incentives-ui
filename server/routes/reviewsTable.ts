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

    const pageCount = 10
    const paginationParams = pagination(page, pageCount, `?level=${selectedLevelCode}&`)

    const locationDescription = 'A wing'
    const overdueCount = 16
    const results: Result[] = [
      {
        firstName: 'John',
        lastName: 'Saunders',
        prisonerNumber: 'G6123VU',
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
        imageId: 0,
        nextReviewDate: new Date(2023, 9, 10),
        positiveBehaviours: 2,
        negativeBehaviours: 0,
        acctStatus: false,
      },
    ]

    res.render('pages/reviewsTable', {
      dpsUrl: config.dpsUrl,
      feedbackUrl,
      locationDescription,
      overdueCount,
      levels,
      caseNoteFilter,
      selectedLevelCode,
      results,
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

interface Result {
  firstName: string
  lastName: string
  prisonerNumber: string
  imageId: number
  nextReviewDate: Date
  positiveBehaviours: number
  negativeBehaviours: number
  acctStatus: boolean
}
