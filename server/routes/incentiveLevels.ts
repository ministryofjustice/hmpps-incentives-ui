import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi } from '../data/incentivesApi'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const incentiveLevels = await incentivesApi.getIncentiveLevels(true)

    res.locals.breadcrumbs.addItems({ text: 'Manage incentive levels' })
    return res.render('pages/incentiveLevels.njk', { incentiveLevels })
  })

  get('/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)

    res.locals.breadcrumbs.addItems(
      { text: 'Manage incentive levels', href: '/incentive-levels' },
      { text: incentiveLevel.description },
    )
    return res.render('pages/incentiveLevel.njk', { incentiveLevel })
  })

  return router
}
