import type { RequestHandler, Router } from 'express'

import { PrisonApi } from '../data/prisonApi'
import asyncMiddleware from '../middleware/asyncMiddleware'

const secondsInWeek = 604800

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    const prisonApi = new PrisonApi(res.locals.user.token)

    const imageData = await prisonApi.getImage(req.params.imageId)

    res.setHeader('Content-Type', 'images/jpeg')
    res.setHeader('Cache-Control', `private, max-age=${secondsInWeek}`)
    res.send(imageData)
  })

  return router
}
