import type { RequestHandler, Router } from 'express'

import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'

const feedbackUrl = config.feedbackUrlForTable || config.feedbackUrl

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Manage incentive reviews' })

    const locationDescription = 'A wing'
    const overdueCount = 16

    res.render('pages/reviewsTable', { feedbackUrl, locationDescription, overdueCount })
  })

  return router
}
