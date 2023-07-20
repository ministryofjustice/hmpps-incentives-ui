import type { RequestHandler, Router } from 'express'

import { PrisonApi } from '../data/prisonApi'
import asyncMiddleware from '../middleware/asyncMiddleware'

const oneDay = 86400 as const

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    const prisonApi = new PrisonApi(res.locals.user.token)

    const imageData = await prisonApi.getImageByPrisonerNumber(req.params.prisonerNumber)

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', `private, max-age=${oneDay}`)

    if (imageData == null) {
      res.sendFile('prisoner.jpeg', { root: `${__dirname}/../../../assets/images` })
    } else {
      res.send(imageData)
    }
  })

  return router
}
