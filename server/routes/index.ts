import type { RequestHandler, Router } from 'express'

import HmppsAuthClient from '../data/hmppsAuthClient'
import { createRedisClient } from '../data/redisClient'
import TokenStore from '../data/tokenStore'
import asyncMiddleware from '../middleware/asyncMiddleware'
import BehaviourService from '../services/behaviourService'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    const { user } = res.locals
    const { activeLocation } = req.session

    if (!activeLocation) {
      res.redirect('/select-another-location')
      return
    }

    // TODO: Move somewhere else? Where? In Service?
    const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient()))
    const systemToken = await hmppsAuthClient.getSystemClientToken(user.username)

    const behaviorService = new BehaviourService(systemToken)
    const entries = await behaviorService.getLocationSummary(user.activeCaseLoadId, activeLocation.locationPrefix)

    res.render('pages/incentives-table', { entries })
  })

  return router
}
