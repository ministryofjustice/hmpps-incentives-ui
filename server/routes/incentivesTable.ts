import type { RequestHandler, Router } from 'express'

import HmppsAuthClient from '../data/hmppsAuthClient'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import asyncMiddleware from '../middleware/asyncMiddleware'
import BehaviourService from '../services/behaviourService'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient('routes/incentivesTable.ts')))

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentive information' })

    const { user } = res.locals
    const { locationPrefix } = req.params
    const agencyId = locationPrefix.split('-')[0]

    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)

    const behaviorService = new BehaviourService(systemToken)
    const entries = await behaviorService.getLocationSummary(agencyId, locationPrefix)

    const threeMonthsAgo = daysAgo(90)

    res.render('pages/incentives-table', { entries, threeMonthsAgo, locationPrefix })
  })

  return router
}

function daysAgo(days: number): Date {
  const result = new Date()
  result.setDate(result.getDate() - days)

  return result
}
