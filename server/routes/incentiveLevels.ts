import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    return res.render('pages/incentiveLevels.njk')
  })

  get('/:levelCode', async (req, res) => {
    const levelCode = req.params.levelCode
    return res.render("pages/incentiveLevel.njk", { levelCode })
  })

  return router
}
