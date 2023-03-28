import type { RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi } from '../data/incentivesApi'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const prisonId = res.locals.user.activeCaseload.id
    const prisonName = res.locals.user.activeCaseload.name
    const prisonIncentiveLevels = await incentivesApi.getPrisonIncentiveLevels(prisonId)

    res.locals.breadcrumbs.addItems({ text: 'Manage prison incentive levels' })
    return res.render('pages/prisonIncentiveLevels.njk', { prisonIncentiveLevels, prisonName })
  })

  get('/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const prisonId = res.locals.user.activeCaseload.id
    const prisonName = res.locals.user.activeCaseload.name
    const prisonIncentiveLevel = await incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode)

    res.locals.breadcrumbs.addItems(
      { text: 'Manage prison incentive levels', href: '/prison-incentive-levels' },
      { text: prisonName },
    )
    return res.render('pages/prisonIncentiveLevel.njk', { prisonIncentiveLevel, prisonName })
  })

  return router
}
