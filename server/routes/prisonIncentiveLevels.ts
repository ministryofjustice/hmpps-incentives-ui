import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest, NotFound } from 'http-errors'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi, type IncentiveLevel, type PrisonIncentiveLevel } from '../data/incentivesApi'
import { requireGetOrPost } from './forms/forms'
import PrisonIncentiveLevelAddForm from './forms/prisonIncentiveLevelAddForm'
import PrisonIncentiveLevelDeactivateForm from './forms/prisonIncentiveLevelDeactivateForm'
import PrisonIncentiveLevelEditForm from './forms/prisonIncentiveLevelEditForm'
import { penceAmountToInputString, inputStringToPenceAmount } from '../utils/utils'

export const managePrisonIncentiveLevelsRole = 'ROLE_MAINTAIN_PRISON_IEP_LEVELS'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const [incentiveLevels, prisonIncentiveLevels] = await Promise.all([
      incentivesApi.getIncentiveLevels(),
      incentivesApi.getPrisonIncentiveLevels(prisonId),
    ])
    const activeLevelCodes = new Set(prisonIncentiveLevels.map(prisonIncentiveLevel => prisonIncentiveLevel.levelCode))
    const canAddLevel = incentiveLevels.some(incentiveLevel => !activeLevelCodes.has(incentiveLevel.code))
    const requiredLevelCodes = new Set(
      incentiveLevels.filter(incentiveLevel => incentiveLevel.required).map(incentiveLevel => incentiveLevel.code),
    )
    const prisonIncentiveLevelsWithRequiredFlag: (PrisonIncentiveLevel & { levelRequired: boolean })[] =
      prisonIncentiveLevels.map(prisonIncentiveLevel => {
        return { ...prisonIncentiveLevel, levelRequired: requiredLevelCodes.has(prisonIncentiveLevel.levelCode) }
      })

    res.locals.breadcrumbs.addItems({ text: 'Incentive level settings' })
    res.render('pages/prisonIncentiveLevels.njk', {
      messages: req.flash(),
      prisonIncentiveLevels: prisonIncentiveLevelsWithRequiredFlag,
      canAddLevel,
      prisonName,
    })
  })

  get('/view/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const [incentiveLevel, prisonIncentiveLevel] = await Promise.all([
      incentivesApi.getIncentiveLevel(levelCode),
      incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode),
    ])

    res.locals.breadcrumbs.addItems(
      { text: 'Incentive level settings', href: '/prison-incentive-levels' },
      { text: `View settings for ${prisonIncentiveLevel.levelName}` },
    )
    res.render('pages/prisonIncentiveLevel.njk', {
      messages: req.flash(),
      incentiveLevel,
      prisonIncentiveLevel,
      prisonName,
    })
  })

  const deactivateFormId = 'prisonIncentiveLevelDeactivateForm' as const
  router.all(
    '/remove/:levelCode',
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const form = new PrisonIncentiveLevelDeactivateForm(deactivateFormId)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[deactivateFormId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== deactivateFormId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${deactivateFormId} is allowed`)
        next(new BadRequest())
        return
      }

      form.submit(req.body)
      if (form.hasErrors) {
        logger.warn(`Form ${form.formId} submitted with errors`)
        next()
        return
      }

      if (form.getField('confirmation').value === 'yes') {
        const incentivesApi = new IncentivesApi(res.locals.user.token)
        const { levelCode } = req.params
        const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload

        const [incentiveLevel, prisonIncentiveLevel] = await Promise.all([
          incentivesApi.getIncentiveLevel(levelCode),
          incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode),
        ])
        if (!prisonIncentiveLevel.active) {
          throw BadRequest('Prison incentive level is already inactive')
        }
        if (prisonIncentiveLevel.defaultOnAdmission) {
          throw BadRequest('Default prison incentive level cannot be deactivated')
        }
        if (incentiveLevel.required) {
          throw BadRequest('Incentive level is required globally')
        }

        try {
          const deactivatedPrisonIncentiveLevel = await incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, {
            active: false,
          })
          const message = `${deactivatedPrisonIncentiveLevel.levelName} is no longer available in ${prisonName}`
          logger.info(message)
          req.flash('success', message)
        } catch (error) {
          logger.error('Failed to deactivate prison incentive level', error)
          req.flash('warning', `Incentive level was not removed! ${error?.userMessage || ''}`)
        }
      }

      res.redirect('/prison-incentive-levels')
    }),
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
      const form: PrisonIncentiveLevelDeactivateForm = res.locals.forms[deactivateFormId]

      const [incentiveLevel, prisonIncentiveLevel] = await Promise.all([
        incentivesApi.getIncentiveLevel(levelCode),
        incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode),
      ])
      if (!prisonIncentiveLevel.active) {
        throw BadRequest('Prison incentive level is already inactive')
      }
      if (prisonIncentiveLevel.defaultOnAdmission) {
        throw BadRequest('Default prison incentive level cannot be deactivated')
      }
      if (incentiveLevel.required) {
        throw BadRequest('Incentive level is required globally')
      }

      res.locals.breadcrumbs.addItems(
        { text: 'Incentive level settings', href: '/prison-incentive-levels' },
        { text: `Are you sure you want to remove ${prisonIncentiveLevel.levelName}?` },
      )
      res.render('pages/prisonIncentiveLevelDeactivateForm.njk', {
        messages: req.flash(),
        form,
        prisonIncentiveLevel,
        prisonName,
      })
    }),
  )

  const editFormId = 'prisonIncentiveLevelEditForm' as const
  router.all(
    '/edit/:levelCode',
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)
      const { levelCode } = req.params as { levelCode?: string }
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload

      const prisonIncentiveLevel = await incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode)
      if (!prisonIncentiveLevel.active) {
        throw NotFound('Prison incentive level is inactive')
      }

      const form = new PrisonIncentiveLevelEditForm(editFormId, prisonIncentiveLevel.defaultOnAdmission)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[editFormId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== editFormId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${editFormId} is allowed`)
        next(new BadRequest())
        return
      }

      form.submit(req.body)
      if (form.hasErrors) {
        logger.warn(`Form ${form.formId} submitted with errors`)
        next()
        return
      }

      const defaultOnAdmission = form.getField('defaultOnAdmission').value === 'yes'

      const remandTransferLimitInPence = inputStringToPenceAmount(form.getField('remandTransferLimit').value)
      const remandSpendLimitInPence = inputStringToPenceAmount(form.getField('remandSpendLimit').value)
      const convictedTransferLimitInPence = inputStringToPenceAmount(form.getField('convictedTransferLimit').value)
      const convictedSpendLimitInPence = inputStringToPenceAmount(form.getField('convictedSpendLimit').value)

      const visitOrders = parseInt(form.getField('visitOrders').value, 10)
      const privilegedVisitOrders = parseInt(form.getField('privilegedVisitOrders').value, 10)

      try {
        const updatedPrisonIncentiveLevel = await incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, {
          defaultOnAdmission,
          remandTransferLimitInPence,
          remandSpendLimitInPence,
          convictedTransferLimitInPence,
          convictedSpendLimitInPence,
          visitOrders,
          privilegedVisitOrders,
        })
        const message = `Incentive level information for ${updatedPrisonIncentiveLevel.levelName} at ${prisonName} was saved.`
        req.flash('success', message)
        logger.info(message)
      } catch (error) {
        logger.error('Failed to update prison incentive level', error)
        req.flash('warning', `Incentive level settings were not saved! ${error?.userMessage || ''}`)
      }

      res.redirect(`/prison-incentive-levels/view/${levelCode}`)
    }),
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
      const form: PrisonIncentiveLevelEditForm = res.locals.forms[editFormId]

      const prisonIncentiveLevel = await incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode)
      if (!prisonIncentiveLevel.active) {
        throw NotFound('Prison incentive level is inactive')
      }

      if (!form.submitted) {
        const defaultOnAdmission = prisonIncentiveLevel.defaultOnAdmission ? 'yes' : undefined

        const remandTransferLimit = penceAmountToInputString(prisonIncentiveLevel.remandTransferLimitInPence)
        const remandSpendLimit = penceAmountToInputString(prisonIncentiveLevel.remandSpendLimitInPence)
        const convictedTransferLimit = penceAmountToInputString(prisonIncentiveLevel.convictedTransferLimitInPence)
        const convictedSpendLimit = penceAmountToInputString(prisonIncentiveLevel.convictedSpendLimitInPence)

        const visitOrders = prisonIncentiveLevel.visitOrders.toString()
        const privilegedVisitOrders = prisonIncentiveLevel.privilegedVisitOrders.toString()

        form.submit({
          formId: editFormId,
          defaultOnAdmission,
          remandTransferLimit,
          remandSpendLimit,
          convictedTransferLimit,
          convictedSpendLimit,
          visitOrders,
          privilegedVisitOrders,
        })
      }

      res.locals.breadcrumbs.addItems(
        { text: 'Incentive level settings', href: '/prison-incentive-levels' },
        { text: `Change settings for ${prisonIncentiveLevel.levelName}` },
      )
      res.render('pages/prisonIncentiveLevelEditForm.njk', {
        messages: req.flash(),
        form,
        prisonIncentiveLevel,
        prisonName,
      })
    }),
  )

  const addFormId = 'prisonIncentiveLevelAddForm' as const
  router.all(
    '/add',
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)
      const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload

      const [incentiveLevels, prisonIncentiveLevels] = await Promise.all([
        incentivesApi.getIncentiveLevels(),
        incentivesApi.getPrisonIncentiveLevels(prisonId),
      ])
      const mustBeDefaultOnAdmission = prisonIncentiveLevels.length === 0
      const activeLevelCodes = new Set(
        prisonIncentiveLevels.map(prisonIncentiveLevel => prisonIncentiveLevel.levelCode),
      )
      const availableUnusedIncentiveLevels = incentiveLevels.filter(
        incentiveLevel => !activeLevelCodes.has(incentiveLevel.code),
      )
      const availableUnusedLevelCodes = availableUnusedIncentiveLevels.map(incentiveLevel => incentiveLevel.code)
      if (availableUnusedLevelCodes.length === 0) {
        throw NotFound('All available levels are active')
      }
      res.locals.availableUnusedIncentiveLevels = availableUnusedIncentiveLevels
      res.locals.mustBeDefaultOnAdmission = mustBeDefaultOnAdmission

      const form = new PrisonIncentiveLevelAddForm(addFormId, availableUnusedLevelCodes, mustBeDefaultOnAdmission)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[addFormId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== addFormId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${addFormId} is allowed`)
        next(new BadRequest())
        return
      }

      form.submit(req.body)
      if (form.hasErrors) {
        logger.warn(`Form ${form.formId} submitted with errors`)
        next()
        return
      }

      const levelCode = form.getField('levelCode').value

      const defaultOnAdmission = form.getField('defaultOnAdmission').value === 'yes'

      const remandTransferLimitInPence = inputStringToPenceAmount(form.getField('remandTransferLimit').value)
      const remandSpendLimitInPence = inputStringToPenceAmount(form.getField('remandSpendLimit').value)
      const convictedTransferLimitInPence = inputStringToPenceAmount(form.getField('convictedTransferLimit').value)
      const convictedSpendLimitInPence = inputStringToPenceAmount(form.getField('convictedSpendLimit').value)

      const visitOrders = parseInt(form.getField('visitOrders').value, 10)
      const privilegedVisitOrders = parseInt(form.getField('privilegedVisitOrders').value, 10)

      try {
        const updatedPrisonIncentiveLevel = await incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, {
          active: true,
          defaultOnAdmission,
          remandTransferLimitInPence,
          remandSpendLimitInPence,
          convictedTransferLimitInPence,
          convictedSpendLimitInPence,
          visitOrders,
          privilegedVisitOrders,
        })
        const message = `Incentive level information for ${updatedPrisonIncentiveLevel.levelName} at ${prisonName} was added.`
        req.flash('success', message)
        logger.info(message)
        res.redirect(`/prison-incentive-levels/view/${levelCode}`)
      } catch (error) {
        logger.error('Failed to update prison incentive level', error)
        req.flash('warning', `Incentive level was not added! ${error?.userMessage || ''}`)
        res.redirect('/prison-incentive-levels')
      }
    }),
    asyncMiddleware(async (req, res) => {
      const { name: prisonName } = res.locals.user.activeCaseload
      const form: PrisonIncentiveLevelAddForm = res.locals.forms[addFormId]
      const availableUnusedIncentiveLevels = res.locals.availableUnusedIncentiveLevels as IncentiveLevel[]
      const mustBeDefaultOnAdmission = res.locals.mustBeDefaultOnAdmission as boolean

      res.locals.breadcrumbs.addItems(
        { text: 'Incentive level settings', href: '/prison-incentive-levels' },
        { text: 'Add a new incentive level' },
      )
      res.render('pages/prisonIncentiveLevelAddForm.njk', {
        messages: req.flash(),
        form,
        prisonName,
        availableUnusedIncentiveLevels,
        mustBeDefaultOnAdmission,
      })
    }),
  )

  return router
}
