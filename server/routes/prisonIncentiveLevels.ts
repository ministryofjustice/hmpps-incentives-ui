import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest } from 'http-errors'
import jwtDecode from 'jwt-decode'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import { IncentivesApi } from '../data/incentivesApi'
import { requireGetOrPost } from './forms/forms'
import PrisonIncentiveLevelForm from './forms/prisonIncentiveLevelForm'
import { penceAmountToInputString, inputStringToPenceAmount } from '../utils/utils'

const prisonManageRole = 'ROLE_MAINTAIN_PRISON_IEP_LEVELS'
const requirePrisonManageRole = authorisationMiddleware([prisonManageRole])
const hasPrisonManageRole = (res: Response) => {
  const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }
  return roles && roles.includes(prisonManageRole)
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const canEdit = hasPrisonManageRole(res)
    const [incentiveLevels, prisonIncentiveLevels] = await Promise.all([
      incentivesApi.getIncentiveLevels(),
      incentivesApi.getPrisonIncentiveLevels(prisonId),
    ])
    const activeLevelCodes = new Set(prisonIncentiveLevels.map(prisonIncentiveLevel => prisonIncentiveLevel.levelCode))
    const inactiveIncentiveLevels = incentiveLevels.filter(incentiveLevel => !activeLevelCodes.has(incentiveLevel.code))

    res.locals.breadcrumbs.addItems({ text: `Manage levels in ${prisonName}` })
    return res.render('pages/prisonIncentiveLevels.njk', {
      messages: req.flash(),
      canEdit,
      prisonIncentiveLevels,
      inactiveIncentiveLevels,
      prisonName,
    })
  })

  get('/view/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const canEdit = hasPrisonManageRole(res)
    const [incentiveLevel, prisonIncentiveLevel, prisonIncentiveLevels] = await Promise.all([
      incentivesApi.getIncentiveLevel(levelCode),
      incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode),
      incentivesApi.getPrisonIncentiveLevels(prisonId),
    ])
    const defaultPrisonIncentiveLevel = prisonIncentiveLevels.find(level => level.defaultOnAdmission)

    res.locals.breadcrumbs.addItems(
      { text: `Manage levels in ${prisonName}`, href: '/prison-incentive-levels' },
      { text: prisonIncentiveLevel.levelDescription },
    )
    return res.render('pages/prisonIncentiveLevel.njk', {
      messages: req.flash(),
      canEdit,
      incentiveLevel,
      prisonIncentiveLevel,
      defaultPrisonIncentiveLevel,
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

    return res.redirect(active ? `/prison-incentive-levels/view/${levelCode}` : '/prison-incentive-levels')
  }

  router.get('/activate/:levelCode', requirePrisonManageRole, asyncMiddleware(activateDeactivate(true)))
  router.get('/deactivate/:levelCode', requirePrisonManageRole, asyncMiddleware(activateDeactivate(false)))

  router.get(
    '/add/:levelCode',
    requirePrisonManageRole,
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
      const prisonIncentiveLevel = await incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, { active: true })
      // TODO: handle errors
      const message = `${prisonIncentiveLevel.levelDescription} is now available in ${prisonName}`
      logger.info(message)
      req.flash('success', message)

      res.redirect(`/prison-incentive-levels/edit/${levelCode}`)
    }),
  )

  router.get(
    '/set-default-for-admission/:levelCode',
    requirePrisonManageRole,
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
      const prisonIncentiveLevel = await incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, {
        defaultOnAdmission: true,
      })
      // TODO: handle errors
      const message = `${prisonIncentiveLevel.levelDescription} is now the default level for admissions in ${prisonName}`
      logger.info(message)
      req.flash('success', message)

      return res.redirect(`/prison-incentive-levels/view/${levelCode}`)
    }),
  )

  const formId = 'prisonIncentiveLevel' as const
  router.all(
    '/edit/:levelCode',
    requirePrisonManageRole,
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const form = new PrisonIncentiveLevelForm(formId)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[formId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== formId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${formId} are allowed`)
        next(new BadRequest())
        return
      }

      form.submit(req.body)
      if (form.hasErrors) {
        logger.warn(`Form ${form.formId} submitted with errors`)
        next()
        return
      }

      const incentivesApi = new IncentivesApi(res.locals.user.token)
      const { levelCode } = req.params as { levelCode?: string }
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload

      const remandTransferLimitInPence = inputStringToPenceAmount(form.getField('remandTransferLimit').value)
      const remandSpendLimitInPence = inputStringToPenceAmount(form.getField('remandSpendLimit').value)
      const convictedTransferLimitInPence = inputStringToPenceAmount(form.getField('convictedTransferLimit').value)
      const convictedSpendLimitInPence = inputStringToPenceAmount(form.getField('convictedSpendLimit').value)

      const visitOrders = parseInt(form.getField('visitOrders').value, 10)
      const privilegedVisitOrders = parseInt(form.getField('privilegedVisitOrders').value, 10)

      try {
        const updatedPrisonIncentiveLevel = await incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, {
          remandTransferLimitInPence,
          remandSpendLimitInPence,
          convictedTransferLimitInPence,
          convictedSpendLimitInPence,
          visitOrders,
          privilegedVisitOrders,
        })
        const message = `Incentive level information for ${updatedPrisonIncentiveLevel.levelDescription} at ${prisonName} was saved.`
        req.flash('success', message)
        logger.info(message)
      } catch (error) {
        logger.error('Failed to update prison incentive level', error)
      }

      res.redirect(`/prison-incentive-levels/view/${levelCode}`)
    }),
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
      const form: PrisonIncentiveLevelForm = res.locals.forms[formId]

      const prisonIncentiveLevel = await incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode)

      if (!form.submitted) {
        const remandTransferLimit = penceAmountToInputString(prisonIncentiveLevel.remandTransferLimitInPence)
        const remandSpendLimit = penceAmountToInputString(prisonIncentiveLevel.remandSpendLimitInPence)
        const convictedTransferLimit = penceAmountToInputString(prisonIncentiveLevel.convictedTransferLimitInPence)
        const convictedSpendLimit = penceAmountToInputString(prisonIncentiveLevel.convictedSpendLimitInPence)

        const visitOrders = prisonIncentiveLevel.visitOrders.toString()
        const privilegedVisitOrders = prisonIncentiveLevel.privilegedVisitOrders.toString()

        form.submit({
          formId,
          remandTransferLimit,
          remandSpendLimit,
          convictedTransferLimit,
          convictedSpendLimit,
          visitOrders,
          privilegedVisitOrders,
        })
      }

      res.locals.breadcrumbs.addItems(
        { text: `Manage levels in ${prisonName}`, href: '/prison-incentive-levels' },
        { text: prisonIncentiveLevel.levelDescription },
      )
      return res.render('pages/prisonIncentiveLevelForm.njk', {
        messages: req.flash(),
        form,
        prisonIncentiveLevel,
        prisonName,
      })
    }),
  )

  return router
}
