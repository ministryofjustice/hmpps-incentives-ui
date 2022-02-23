import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/behaviour-entries', async (req, res) => {
    res.render('pages/analyticsBehaviourEntries')
  })

  return router
}
