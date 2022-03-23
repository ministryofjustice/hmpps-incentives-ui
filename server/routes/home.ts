import type { RequestHandler, Router } from 'express'

import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { userActiveCaseloadMatches, usernameMatches } from '../middleware/featureGate'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    res.locals.breadcrumbs.lastItem.href = undefined

    const showAnalytics =
      req.app.locals.featureFlags.showAnalytics &&
      userActiveCaseloadMatches(config.prisonsWithAnalytics, res.locals.user) &&
      usernameMatches(config.usernamesWithAnalytics, res.locals.user)

    res.render('pages/home.njk', { showAnalytics })
  })

  return router
}
