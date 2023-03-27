import type { RequestHandler, Response, Router } from 'express'
import jwtDecode from 'jwt-decode'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import { IncentivesApi } from '../data/incentivesApi'

const role = 'ROLE_MAINTAIN_INCENTIVE_LEVELS'
const requireRole = authorisationMiddleware([role])
const hasRole = (res: Response) => {
  const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }
  return roles && roles.includes(role)
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const canEdit = hasRole(res)
    const incentiveLevels = await incentivesApi.getIncentiveLevels(true)

    res.locals.breadcrumbs.addItems({ text: 'Manage levels' })
    return res.render('pages/incentiveLevels.njk', { messages: req.flash(), canEdit, incentiveLevels })
  })

  get('/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const canEdit = hasRole(res)
    const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)

    res.locals.breadcrumbs.addItems(
      { text: 'Manage levels', href: '/incentive-levels' },
      { text: incentiveLevel.description },
    )
    return res.render('pages/incentiveLevel.njk', { messages: req.flash(), canEdit, incentiveLevel })
  })

  const activateDeactivate: { (active: boolean): RequestHandler } = active => async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const incentiveLevel = await incentivesApi.updateIncentiveLevel(levelCode, { active })
    // TODO: handle errors
    const message = active
      ? `${incentiveLevel.description} is now active`
      : `${incentiveLevel.description} is no longer active`
    logger.info(message)
    req.flash('success', message)

    return res.redirect(active ? `/incentive-levels/${levelCode}` : '/incentive-levels')
  }

  router.get('/:levelCode/activate', requireRole, asyncMiddleware(activateDeactivate(true)))
  router.get('/:levelCode/deactivate', requireRole, asyncMiddleware(activateDeactivate(false)))

  return router
}
