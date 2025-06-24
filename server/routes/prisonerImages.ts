import type { Router } from 'express'

import { PrisonApi } from '../data/prisonApi'

const oneDay = 86400 as const

export default function routes(router: Router): Router {
  router.get('/' as string, async (req, res) => {
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
