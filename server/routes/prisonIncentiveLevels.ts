import type { RequestHandler, Response, Router } from 'express'
import jwtDecode from 'jwt-decode'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import { IncentivesApi } from '../data/incentivesApi'

const role = 'ROLE_MAINTAIN_PRISON_IEP_LEVELS'
const requireRole = authorisationMiddleware([role])
const hasRole = (res: Response) => {
  const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }
  return roles && roles.includes(role)
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const canEdit = hasRole(res)
    const prisonIncentiveLevels = await incentivesApi.getPrisonIncentiveLevels(prisonId)

    res.locals.breadcrumbs.addItems({ text: `Manage levels in ${prisonName}` })
    return res.render('pages/prisonIncentiveLevels.njk', {
      messages: req.flash(),
      canEdit,
      prisonIncentiveLevels,
      prisonName,
    })
  })

  get('/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const canEdit = hasRole(res)
    const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)
    const prisonIncentiveLevel = await incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode)

    res.locals.breadcrumbs.addItems(
      { text: `Manage levels in ${prisonName}`, href: '/prison-incentive-levels' },
      { text: prisonIncentiveLevel.levelDescription },
    )
    return res.render('pages/prisonIncentiveLevel.njk', {
      messages: req.flash(),
      canEdit,
      incentiveLevel,
      prisonIncentiveLevel,
      prisonName,
    })
  })

  const activateDeactivate: { (active: boolean): RequestHandler } = active => async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const prisonIncentiveLevel = await incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, { active })
    // TODO: handle errors
    const message = active
      ? `${prisonIncentiveLevel.levelDescription} is now available in ${prisonName}`
      : `${prisonIncentiveLevel.levelDescription} is no longer available in ${prisonName}`
    logger.info(message)
    req.flash('success', message)

    return res.redirect(active ? `/prison-incentive-levels/${levelCode}` : '/prison-incentive-levels')
  }

  router.get('/:levelCode/activate', requireRole, asyncMiddleware(activateDeactivate(true)))
  router.get('/:levelCode/deactivate', requireRole, asyncMiddleware(activateDeactivate(false)))

  return router
}
