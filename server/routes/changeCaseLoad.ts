import type { RequestHandler, Router } from 'express'
import { CaseLoad } from '../data/prisonApi'

import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const { user } = res.locals

    const options = user.allCaseLoads.map((caseLoad: CaseLoad) => ({
      value: caseLoad.caseLoadId,
      text: caseLoad.description,
      selected: caseLoad.caseLoadId === user.activeCaseLoad.caseLoadId,
    }))

    return res.render('pages/changeCaseLoad.njk', {
      title: 'Change case load',
      options,
      backUrl: req.headers.referer,
    })
  })

  post('/', async (req, res) => {
    const { prisonApi } = res.locals.apis
    const { caseLoadId } = req.body

    // Don't call API if data is missing
    if (caseLoadId) {
      await prisonApi.setActiveCaseLoad(caseLoadId)

      res.redirect('/')
    } else {
      // logError(req.originalUrl, 'Caseload ID is missing')
      res.status(500)
      res.render('pages/error.njk', {
        url: '/change-caseload',
      })
    }
  })

  return router
}
