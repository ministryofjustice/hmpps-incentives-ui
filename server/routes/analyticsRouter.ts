import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import AnalyticsService from '../services/analyticsService'
import featureGate from '../middleware/featureGate'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) =>
    router.get(path, featureGate('showAnalytics', asyncMiddleware(handler)))

  get('/behaviour-entries', async (req, res) => {
    res.locals.breadcrumbs.addItem({ text: 'Behaviour entries' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const analyticsService = new AnalyticsService()

    const behaviourEntries = await analyticsService.getBehaviourEntriesByLocation(activeCaseLoad)
    const prisonersWithEntries = await analyticsService.getPrisonersWithEntriesByLocation(activeCaseLoad)

    res.render('pages/analytics/behaviour-entries/index', {
      lastUpdated: new Date(),
      behaviourEntries,
      prisonersWithEntries,
    })
  })

  return router
}
