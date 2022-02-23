import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import AnalyticsService from '../services/analyticsService'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/behaviour-entries', async (req, res) => {
    const analyticsService = new AnalyticsService()

    const behaviourEntries = await analyticsService.getBehaviourEntriesByLocation('????')
    const prisonersWithEntries = await analyticsService.getPrisonersWithEntriesByLocation('????')

    res.render('pages/analyticsBehaviourEntries', {
      lastUpdated: new Date(),
      behaviourEntries,
      prisonersWithEntries,
    })
  })

  return router
}
