import type { NextFunction, Request, Response, RequestHandler, Router } from 'express'
import { NotFound } from 'http-errors'

import asyncMiddleware from '../middleware/asyncMiddleware'
import AnalyticsService from '../services/analyticsService'

export default function routes(router: Router): Router {
  const featureGate = (handler: RequestHandler): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (req.app.locals.featureFlags.showAnalytics) {
        handler(req, res, next)
      } else {
        next(new NotFound())
      }
    }
  }

  const get = (path: string, handler: RequestHandler) => router.get(path, featureGate(asyncMiddleware(handler)))

  get('/behaviour-entries', async (req, res) => {
    res.locals.breadcrumbs.addItem({ text: 'Behaviour entries' })

    const analyticsService = new AnalyticsService()

    const behaviourEntries = await analyticsService.getBehaviourEntriesByLocation('????')
    const prisonersWithEntries = await analyticsService.getPrisonersWithEntriesByLocation('????')

    res.render('pages/analytics/behaviour-entries/index', {
      lastUpdated: new Date(),
      behaviourEntries,
      prisonersWithEntries,
    })
  })

  return router
}
