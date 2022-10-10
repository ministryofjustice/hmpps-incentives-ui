import type { RequestHandler, Router } from 'express'

import config from '../config'
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
    const agencyId = locationPrefix.split('-')[0]

    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
    const incentivesApi = new IncentivesApi(systemToken)

    const levels = await incentivesApi.getAvailableLevels(agencyId)
    const defaultLevel = levels.find(level => level.default) ?? levels[0]
    if (!levels.some(level => level.iepLevel === selectedLevelCode)) {
      selectedLevelCode = defaultLevel.iepLevel
    }

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
      selectedLevelCode,
      results,
    })
  })

  return router
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
