import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(router: Router): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    res.locals.breadcrumbs.lastItem.href = undefined

    res.render('pages/home.njk')
  })

  get('/about', (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'About' })

    res.render('pages/about.njk')
  })

  return router
}
