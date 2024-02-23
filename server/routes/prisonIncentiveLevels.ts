import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest, NotFound } from 'http-errors'

import logger from '../../logger'
import type { SanitisedError } from '../sanitisedError'
import asyncMiddleware from '../middleware/asyncMiddleware'
import {
  ErrorCode,
  ErrorResponse,
  IncentivesApi,
  type IncentiveLevel,
  type PrisonIncentiveLevel,
} from '../data/incentivesApi'
import { requireGetOrPost } from './forms/forms'
import PrisonIncentiveLevelAddForm from './forms/prisonIncentiveLevelAddForm'
import PrisonIncentiveLevelDeactivateForm from './forms/prisonIncentiveLevelDeactivateForm'
import PrisonIncentiveLevelEditForm from './forms/prisonIncentiveLevelEditForm'
import { penceAmountToInputString, inputStringToPenceAmount } from '../utils/utils'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  router.use((req, res, next) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentive level settings', href: '/prison-incentive-levels' })
    next()
  })

  /*
   * List of active incentive levels in the prison
   */
  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const [incentiveLevels, prisonIncentiveLevels] = await Promise.all([
      incentivesApi.getIncentiveLevels(),
      incentivesApi.getPrisonIncentiveLevels(prisonId),
    ])

    const activeLevelCodes = prisonIncentiveLevels.map(prisonIncentiveLevel => prisonIncentiveLevel.levelCode)
    const requiredLevelCodes = incentiveLevels
      .filter(incentiveLevel => incentiveLevel.required)
      .map(incentiveLevel => incentiveLevel.code)

    const missingRequiredLevelCodes = requiredLevelCodes.filter(code => !activeLevelCodes.includes(code))
    if (missingRequiredLevelCodes.length) {
      logger.warn(`${prisonName} is missing required levels: ${missingRequiredLevelCodes.join(', ')}`)
      try {
        await addMissingRequiredLevels(incentivesApi, prisonId, prisonIncentiveLevels, missingRequiredLevelCodes)
        logger.info(`Missing required incentive levels have been added to ${prisonName}`)
        req.flash('success', 'Mandatory incentive levels have been added.')
        res.redirect('/prison-incentive-levels')
        return
      } catch (error) {
        logger.error(`Missing required incentive levels could not be added to ${prisonName}!`, error)
      }
    } else {
      ensureDefaultLevelExists(incentivesApi, prisonId, prisonIncentiveLevels).catch(error => {
        logger.error(`Failed to set a default level for ${prisonName}!`, error)
      })
    }

    const prisonIncentiveLevelsWithRequiredFlag: (PrisonIncentiveLevel & { levelRequired: boolean })[] =
      prisonIncentiveLevels.map(prisonIncentiveLevel => {
        return { ...prisonIncentiveLevel, levelRequired: requiredLevelCodes.includes(prisonIncentiveLevel.levelCode) }
      })
    const canRemoveLevel = prisonIncentiveLevelsWithRequiredFlag.some(
      prisonIncentiveLevel => !prisonIncentiveLevel.levelRequired && !prisonIncentiveLevel.defaultOnAdmission,
    )

    let addLevelUrl: string | undefined
    const incentiveLevelCodeAvailability = incentiveLevels.map(incentiveLevel => {
      return { code: incentiveLevel.code, available: !activeLevelCodes.includes(incentiveLevel.code) }
    })
    const firstAvailableIndex = incentiveLevelCodeAvailability.findIndex(({ available }) => available)
    if (firstAvailableIndex >= 0) {
      // some level is available to add
      const unusedLevelCodes = incentiveLevelCodeAvailability.slice(firstAvailableIndex)
      if (unusedLevelCodes.some(({ available }) => !available)) {
        // some higher level has already been added, so let user choose
        addLevelUrl = '/prison-incentive-levels/add'
      } else {
        // all available levels are unused, so add next by default
        addLevelUrl = `/prison-incentive-levels/add/${unusedLevelCodes[0].code}`
      }
    }

    res.locals.breadcrumbs.popLastItem()
    res.render('pages/prisonIncentiveLevels.njk', {
      messages: req.flash(),
      prisonIncentiveLevels: prisonIncentiveLevelsWithRequiredFlag,
      addLevelUrl,
      canRemoveLevel,
      prisonName,
    })
  })

  /*
   * Detail view of active incentive level in the prison with associated information
   */
  get('/view/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const { id: prisonId, name: prisonName } = res.locals.user.activeCaseload
    const [incentiveLevel, prisonIncentiveLevel] = await Promise.all([
      incentivesApi.getIncentiveLevel(levelCode),
      incentivesApi.getPrisonIncentiveLevel(prisonId, levelCode),
    ])

    res.render('pages/prisonIncentiveLevel.njk', {
      messages: req.flash(),
      incentiveLevel,
      prisonIncentiveLevel,
      prisonName,
    })
  })

  /*
   * Remove an incentive level from the prison
   * NB: Only allowed when there are no prisoners on the level
   */
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
        const { id: prisonId } = res.locals.user.activeCaseload

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
          const message = `${deactivatedPrisonIncentiveLevel.levelName} has been removed`
          logger.info(message)
          req.flash('success', message)
        } catch (error) {
          logger.error('Failed to deactivate prison incentive level', error)
          let message = 'Incentive level was not removed!'
          const errorResponse = (error as SanitisedError<ErrorResponse>).data
          if (ErrorResponse.isErrorResponse(errorResponse)) {
            if (errorResponse.errorCode === ErrorCode.PrisonIncentiveLevelActiveIfPrisonersExist) {
              message =
                `${incentiveLevel.name} cannot be removed because there are prisoners currently on it.\n\n` +
                'Staff must review these prisoners and place them on an alternative level.'
            } else {
              const userMessage = errorResponse.userMessage?.trim() || ''
              if (userMessage.length > 0) {
                message = `${message}\n\n${userMessage}`
              }
            }
          }
          req.flash('warning', message)
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

      res.render('pages/prisonIncentiveLevelDeactivateForm.njk', {
        messages: req.flash(),
        form,
        prisonIncentiveLevel,
        prisonName,
      })
    }),
  )

  /*
   * Edit associated information of an active incentive level in the prison
   */
  const editFormId = 'prisonIncentiveLevelEditForm' as const
  router.all(
    '/edit/:levelCode',
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)
      const { levelCode } = req.params
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
        let message = 'Incentive level settings were not saved!'
        const errorResponse = (error as SanitisedError<ErrorResponse>).data
        if (ErrorResponse.isErrorResponse(errorResponse)) {
          const userMessage = errorResponse.userMessage?.trim() || ''
          if (userMessage.length > 0) {
            message = `${message}\n\n${userMessage}`
          }
        }
        req.flash('warning', message)
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

      res.render('pages/prisonIncentiveLevelEditForm.njk', {
        messages: req.flash(),
        form,
        prisonIncentiveLevel,
        prisonName,
      })
    }),
  )

  /*
   * Add an available incentive level to the prison
   */
  const addFormId = 'prisonIncentiveLevelAddForm' as const
  router.all(
    ['/add', '/add/:levelCode'],
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
        let message = 'Incentive level was not added!'
        const errorResponse = (error as SanitisedError<ErrorResponse>).data
        if (ErrorResponse.isErrorResponse(errorResponse)) {
          const userMessage = errorResponse.userMessage?.trim() || ''
          if (userMessage.length > 0) {
            message = `${message}\n\n${userMessage}`
          }
        }
        req.flash('warning', message)
        res.redirect('/prison-incentive-levels')
      }
    }),
    asyncMiddleware(async (req, res) => {
      const { name: prisonName } = res.locals.user.activeCaseload
      const form: PrisonIncentiveLevelAddForm = res.locals.forms[addFormId]
      const availableUnusedIncentiveLevels = res.locals.availableUnusedIncentiveLevels as IncentiveLevel[]
      const mustBeDefaultOnAdmission = res.locals.mustBeDefaultOnAdmission as boolean

      const { levelCode } = req.params as { levelCode?: string }
      const incentiveLevel: IncentiveLevel | undefined = availableUnusedIncentiveLevels.find(
        level => level.code === levelCode,
      )
      if (typeof levelCode === 'string' && typeof incentiveLevel === 'undefined') {
        throw NotFound(`Level "${levelCode}" is not available to add`)
      }

      res.render(
        incentiveLevel ? 'pages/prisonIncentiveLevelNextAddForm.njk' : 'pages/prisonIncentiveLevelAddForm.njk',
        {
          messages: req.flash(),
          form,
          prisonName,
          availableUnusedIncentiveLevels,
          mustBeDefaultOnAdmission,
          incentiveLevel, // NB: may be undefined
        },
      )
    }),
  )

  return router
}

async function ensureDefaultLevelExists(
  incentivesApi: IncentivesApi,
  prisonId: string,
  prisonIncentiveLevels: PrisonIncentiveLevel[],
) {
  if (!prisonIncentiveLevels.some(prisonIncentiveLevel => prisonIncentiveLevel.defaultOnAdmission)) {
    logger.warn(`${prisonId} is missing a default level`)
    const defaultLevelCode =
      (await incentivesApi.getPrisonIncentiveLevels(prisonId, true)).find(
        prisonIncentiveLevel => prisonIncentiveLevel.defaultOnAdmission,
      )?.levelCode ?? 'STD'
    logger.info(`Selecting ${defaultLevelCode} as the default level for ${prisonId}`)
    await incentivesApi.updatePrisonIncentiveLevel(prisonId, defaultLevelCode, {
      active: true,
      defaultOnAdmission: true,
    })
    logger.info(`Default incentive level has been set for ${prisonId}`)
  }
}

async function addMissingRequiredLevels(
  incentivesApi: IncentivesApi,
  prisonId: string,
  prisonIncentiveLevels: PrisonIncentiveLevel[],
  levelCodes: string[],
) {
  // ensure that there is a default level, otherwise no other levels can be updated
  await ensureDefaultLevelExists(incentivesApi, prisonId, prisonIncentiveLevels)

  // make all missing required levels active
  await Promise.allSettled(
    levelCodes.map(levelCode =>
      incentivesApi.updatePrisonIncentiveLevel(prisonId, levelCode, {
        active: true,
      }),
    ),
  )
}
