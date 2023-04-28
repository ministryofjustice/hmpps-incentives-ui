import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest } from 'http-errors'

import logger from '../../logger'
import type { SanitisedError } from '../sanitisedError'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi, ErrorCode, ErrorResponse } from '../data/incentivesApi'
import { PrisonApi, type Agency } from '../data/prisonApi'
import { requireGetOrPost } from './forms/forms'
import IncentiveLevelCreateForm from './forms/incentiveLevelCreateForm'
import IncentiveLevelEditForm from './forms/incentiveLevelEditForm'
import IncentiveLevelReorderForm from './forms/incentiveLevelReorderForm'
import IncentiveLevelStatusForm from './forms/incentiveLevelStatusForm'

export const manageIncentiveLevelsRole = 'ROLE_MAINTAIN_INCENTIVE_LEVELS'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  /*
   * List of all incentive levels that exist globally, whether in use or historic
   */
  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const incentiveLevels = await incentivesApi.getIncentiveLevels(true)
    const canChangeStatus = incentiveLevels.some(incentiveLevel => !incentiveLevel.required)

    res.locals.breadcrumbs.addItems({ text: 'Global incentive level admin' })
    res.render('pages/incentiveLevels.njk', { messages: req.flash(), incentiveLevels, canChangeStatus })
  })

  /*
   * Detail view of a specific incentive level
   * NB: Only for super-admin use; not linked to
   */
  get('/view/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)

    res.locals.breadcrumbs.addItems(
      { text: 'Global incentive level admin', href: '/incentive-levels' },
      { text: `View details for ${incentiveLevel.name}` },
    )
    res.render('pages/incentiveLevel.njk', { messages: req.flash(), incentiveLevel })
  })

  /*
   * Set whether an incentive level is active, i.e. available for prisons to use
   * NB: Deactivating is only allowed if the level is not active in any prison
   */
  const statusFormId = 'incentiveLevelStatusForm' as const
  router.all(
    ['/status/:levelCode'],
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params

      const form = new IncentiveLevelStatusForm(statusFormId)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[statusFormId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== statusFormId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${statusFormId} is allowed`)
        next(new BadRequest())
        return
      }

      form.submit(req.body)
      if (form.hasErrors) {
        logger.warn(`Form ${form.formId} submitted with errors`)
        next()
        return
      }

      try {
        const updatedIncentiveLevel = await incentivesApi.updateIncentiveLevel(levelCode, {
          active: form.getField('status').value === 'active',
        })
        const message = `Incentive level status was saved for ${updatedIncentiveLevel.name}.`
        req.flash('success', message)
        logger.info(message)
      } catch (error) {
        logger.error('Failed to update incentive level status', error)
        let message = 'Incentive level status was not saved!'
        const errorResponse = (error as SanitisedError<ErrorResponse>).data
        if (ErrorResponse.isErrorResponse(errorResponse)) {
          const prisonApi = new PrisonApi(res.locals.user.token)
          if (errorResponse.errorCode === ErrorCode.IncentiveLevelActiveIfActiveInPrison) {
            message = await errorMessageWhenCannotDeactivate(prisonApi, errorResponse)
          } else {
            const userMessage = errorResponse.userMessage?.trim() || ''
            if (userMessage.length > 0) {
              message = `${message}\n\n${userMessage}`
            }
          }
        }
        req.flash('warning', message)
      }

      res.redirect('/incentive-levels')
    }),
    asyncMiddleware(async (req: Request, res: Response) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params
      const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)

      const form: IncentiveLevelStatusForm = res.locals.forms[statusFormId]
      if (!form.submitted) {
        form.submit({
          formId: statusFormId,
          status: incentiveLevel.active ? 'active' : 'inactive',
        })
      }

      res.locals.breadcrumbs.addItems(
        { text: 'Global incentive level admin', href: '/incentive-levels' },
        { text: 'Select incentive level status' },
      )
      res.render('pages/incentiveLevelStatusForm.njk', {
        messages: req.flash(),
        form,
        incentiveLevel,
      })
    }),
  )

  /*
   * Edit any of an existing incentive level’s details
   * NB: Only for super-admin use; not linked to
   */
  const editFormId = 'incentiveLevelEditForm' as const
  router.all(
    ['/edit/:levelCode'],
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const form = new IncentiveLevelEditForm(editFormId)
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

      const incentivesApi = new IncentivesApi(res.locals.user.token)
      const { levelCode } = req.params

      const availability = form.getField('availability').value
      let active: boolean
      let required: boolean
      if (availability === 'required') {
        active = true
        required = true
      } else if (availability === 'active') {
        active = true
        required = false
      } else {
        active = false
        required = false
      }

      try {
        const updatedIncentiveLevel = await incentivesApi.updateIncentiveLevel(levelCode, {
          name: form.getField('name').value,
          active,
          required,
        })
        const message = `Incentive level ${updatedIncentiveLevel.name} was saved.`
        req.flash('success', message)
        logger.info(message)
      } catch (error) {
        logger.error('Failed to update incentive level', error)
        let message = 'Incentive level details were not saved!'
        const errorResponse = (error as SanitisedError<ErrorResponse>).data
        if (ErrorResponse.isErrorResponse(errorResponse)) {
          const prisonApi = new PrisonApi(res.locals.user.token)
          if (errorResponse.errorCode === ErrorCode.IncentiveLevelActiveIfActiveInPrison) {
            message = await errorMessageWhenCannotDeactivate(prisonApi, errorResponse)
          } else {
            const userMessage = errorResponse.userMessage?.trim() || ''
            if (userMessage.length > 0) {
              message = `${message}\n\n${userMessage}`
            }
          }
        }
        req.flash('warning', message)
      }

      res.redirect(`/incentive-levels/view/${levelCode}`)
    }),
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params
      const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)

      const form: IncentiveLevelEditForm = res.locals.forms[editFormId]
      if (!form.submitted) {
        let availability
        if (incentiveLevel.required) {
          availability = 'required' as const
        } else if (incentiveLevel.active) {
          availability = 'active' as const
        } else {
          availability = 'inactive' as const
        }
        form.submit({
          formId: editFormId,
          name: incentiveLevel.name,
          availability,
        })
      }

      res.locals.breadcrumbs.addItems(
        { text: 'Global incentive level admin', href: '/incentive-levels' },
        { text: `Change details for ${incentiveLevel.name}` },
      )
      res.render('pages/incentiveLevelEditForm.njk', {
        messages: req.flash(),
        form,
        incentiveLevel,
      })
    }),
  )

  /*
   * Create a new incentive level which is automatically active but not required
   */
  const createFormId = 'incentiveLevelCreateForm' as const
  router.all(
    ['/add'],
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const form = new IncentiveLevelCreateForm(createFormId)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[createFormId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== createFormId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${createFormId} is allowed`)
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
      try {
        const incentiveLevel = await incentivesApi.createIncentiveLevel({
          code: form.getField('code').value,
          name: form.getField('name').value,
          active: true,
          required: false,
        })
        logger.info(`Incentive level ${incentiveLevel.name} was created.`)
        res.redirect(`/incentive-levels/status/${incentiveLevel.code}`)
      } catch (error) {
        logger.error('Failed to create incentive level', error)
        let message = 'Incentive level was not created!'
        const errorResponse = (error as SanitisedError<ErrorResponse>).data
        if (ErrorResponse.isErrorResponse(errorResponse)) {
          if (errorResponse.errorCode === ErrorCode.IncentiveLevelCodeNotUnique) {
            message =
              'Incentive level was not created because the code must be unique. Go back and try a different code.'
          } else {
            const userMessage = errorResponse.userMessage?.trim() || ''
            if (userMessage.length > 0) {
              message = `${message}\n\n${userMessage}`
            }
          }
        }
        req.flash('warning', message)
        res.redirect('/incentive-levels')
      }
    }),
    asyncMiddleware(async (req, res) => {
      const form: IncentiveLevelCreateForm = res.locals.forms[createFormId]

      res.locals.breadcrumbs.addItems(
        { text: 'Global incentive level admin', href: '/incentive-levels' },
        { text: 'Create a new incentive level' },
      )
      res.render('pages/incentiveLevelCreateForm.njk', {
        messages: req.flash(),
        form,
      })
    }),
  )

  /*
   * Change the order of incentive levels
   * NB: Only for super-admin use; not linked to
   */
  const reorderFormId = 'incentiveLevelReorderForm' as const
  router.all(
    ['/reorder'],
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const form = new IncentiveLevelReorderForm(reorderFormId)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[reorderFormId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== reorderFormId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${reorderFormId} is allowed`)
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
      const incentiveLevels = await incentivesApi.getIncentiveLevels(true)

      let incentiveLevelCodes: string[]
      try {
        incentiveLevelCodes = form.reorderIncentiveLevels(incentiveLevels)
      } catch (error) {
        logger.warn(error.message)
        req.flash('warning', error.message)
        res.redirect('/incentive-levels/reorder')
        return
      }

      try {
        await incentivesApi.setIncentiveLevelOrder(incentiveLevelCodes)
        const message = 'Incentive level order was changed.'
        req.flash('success', message)
        logger.info(message)
      } catch (error) {
        logger.error('Failed to reorder incentive levels', error)
        let message = 'Incentive level order was not changed!'
        const errorResponse = (error as SanitisedError<ErrorResponse>).data
        if (ErrorResponse.isErrorResponse(errorResponse)) {
          const userMessage = errorResponse.userMessage?.trim() || ''
          if (userMessage.length > 0) {
            message = `${message}\n\n${userMessage}`
          }
        }
        req.flash('warning', message)
      }
      res.redirect('/incentive-levels/reorder')
    }),
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)
      const incentiveLevels = await incentivesApi.getIncentiveLevels(true)

      const form: IncentiveLevelCreateForm = res.locals.forms[reorderFormId]

      res.locals.breadcrumbs.addItems(
        { text: 'Global incentive level admin', href: '/incentive-levels' },
        { text: 'Change order of levels' },
      )
      res.render('pages/incentiveLevelReorderForm.njk', {
        messages: req.flash(),
        form,
        incentiveLevels,
      })
    }),
  )

  return router
}

async function errorMessageWhenCannotDeactivate(prisonApi: PrisonApi, errorResponse: ErrorResponse): Promise<string> {
  let message = 'This level cannot be made inactive because some establishments are using it.'

  const prisonPromises = (errorResponse?.moreInfo ?? '')
    .split(',')
    .map(prisonId => prisonId.trim())
    .filter(prisonName => prisonName)
    .map(prisonId =>
      prisonApi.getAgency(prisonId, false).catch(error => {
        logger.error(`Could not look up agency \`${prisonId}\` in prison-api`, error)
      }),
    )
  const prisonResults = await Promise.allSettled(prisonPromises)
  const prisonNames = prisonResults
    .filter((result: PromiseSettledResult<Agency>) => result.status === 'fulfilled')
    .map((result: PromiseFulfilledResult<Agency>) => result?.value?.description)
    .filter(prisonName => prisonName)

  if (prisonNames.length > 0) {
    const prisonNamesList = prisonNames.sort().join('\n')
    message = `${message}\n\nContact the following establishments and ask them to remove it from their incentive level settings:\n\n${prisonNamesList}`
  }

  return message
}
