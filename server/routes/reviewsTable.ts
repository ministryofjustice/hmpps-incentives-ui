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
    const agencyId = locationPrefix.split('-')[0]

    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)
    const incentivesApi = new IncentivesApi(systemToken)

    const levels = await incentivesApi.getAvailableLevels(agencyId)

    const locationDescription = 'A wing'
    const overdueCount = 16

    res.render('pages/reviewsTable', { feedbackUrl, locationDescription, overdueCount, levels })
  })

  return router
}
