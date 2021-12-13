import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import BehaviourService from '../services/behaviourService'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    const behaviorService = new BehaviourService()
    const entries = await behaviorService.getBehaviourEntries()

    const wing = {
      name: 'Houseblock 1',
      entries,
    }

    res.render('pages/incentives-table', { wing })
  })

  return router
}
