import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest } from 'http-errors'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi, type IncentiveLevel } from '../data/incentivesApi'
import { requireGetOrPost } from './forms/forms'
import IncentiveLevelForm from './forms/incentiveLevelForm'

export const manageIncentiveLevelsRole = 'ROLE_MAINTAIN_INCENTIVE_LEVELS'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const incentiveLevels = await incentivesApi.getIncentiveLevels(true)
    const canChangeStatus = incentiveLevels.some(incentiveLevel => !incentiveLevel.required)

    res.locals.breadcrumbs.addItems({ text: 'Global incentive level admin' })
    res.render('pages/incentiveLevels.njk', { messages: req.flash(), incentiveLevels, canChangeStatus })
  })

  get('/view/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)

    res.locals.breadcrumbs.addItems(
      { text: 'Global incentive level admin', href: '/incentive-levels' },
      { text: incentiveLevel.name },
    )
    res.render('pages/incentiveLevel.njk', { messages: req.flash(), incentiveLevel })
  })

  const formId = 'incentiveLevel' as const
  router.all(
    ['/add', '/edit/:levelCode'],
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const form = new IncentiveLevelForm(formId)
      res.locals.forms = res.locals.forms || {}
      res.locals.forms[formId] = form

      if (req.method !== 'POST') {
        next()
        return
      }
      if (!req.body.formId || req.body.formId !== formId) {
        logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${formId} is allowed`)
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
      let { levelCode } = req.params as { levelCode?: string }

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

      if (levelCode) {
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
        }
      } else {
        try {
          const createdIncentiveLevel = await incentivesApi.createIncentiveLevel({
            code: form.getField('code').value,
            name: form.getField('name').value,
            active,
            required,
          })
          levelCode = createdIncentiveLevel.code
          const message = `New incentive level ${createdIncentiveLevel.name} was added.`
          req.flash('success', message)
          logger.info(message)
        } catch (error) {
          logger.error('Failed to create incentive level', error)
        }
      }

      res.redirect(`/incentive-levels/view/${levelCode}`)
    }),
    asyncMiddleware(async (req, res) => {
      const incentivesApi = new IncentivesApi(res.locals.user.token)

      const { levelCode } = req.params as { levelCode?: string }
      const form: IncentiveLevelForm = res.locals.forms[formId]

      const incentiveLevel: IncentiveLevel | null = levelCode ? await incentivesApi.getIncentiveLevel(levelCode) : null
      if (incentiveLevel && !form.submitted) {
        let availability
        if (incentiveLevel.required) {
          availability = 'required' as const
        } else if (incentiveLevel.active) {
          availability = 'active' as const
        } else {
          availability = 'inactive' as const
        }
        form.submit({
          formId,
          code: incentiveLevel.code,
          name: incentiveLevel.name,
          availability,
        })
      }

      res.locals.breadcrumbs.addItems(
        { text: 'Global incentive level admin', href: '/incentive-levels' },
        { text: incentiveLevel ? 'Change incentive level details' : 'Create a new incentive level' },
      )
      res.render('pages/incentiveLevelForm.njk', {
        messages: req.flash(),
        form,
        incentiveLevel,
      })
    }),
  )

  return router
}
