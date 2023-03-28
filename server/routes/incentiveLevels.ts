import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest } from 'http-errors'
import jwtDecode from 'jwt-decode'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import authorisationMiddleware from '../middleware/authorisationMiddleware'
import { IncentivesApi, IncentiveLevel } from '../data/incentivesApi'
import { requireGetOrPost } from './forms/forms'
import IncentiveLevelForm from './forms/incentiveLevelForm'

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

  get('/view/:levelCode', async (req, res) => {
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

    return res.redirect(active ? `/incentive-levels/view/${levelCode}` : '/incentive-levels')
  }

  router.get('/activate/:levelCode', requireRole, asyncMiddleware(activateDeactivate(true)))
  router.get('/deactivate/:levelCode', requireRole, asyncMiddleware(activateDeactivate(false)))

  const formId = 'incentiveLevel' as const
  router.all(
    ['/add', '/edit/:levelCode'],
    requireRole,
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
            description: form.getField('description').value,
            active,
            required,
          })
          const message = `Incentive level ${updatedIncentiveLevel.description} was saved.`
          req.flash('success', message)
          logger.info(message)
        } catch (error) {
          logger.error('Failed to update incentive level', error)
        }
      } else {
        try {
          const createdIncentiveLevel = await incentivesApi.createIncentiveLevel({
            code: form.getField('code').value,
            description: form.getField('description').value,
            active,
            required,
          })
          levelCode = createdIncentiveLevel.code
          const message = `New incentive level ${createdIncentiveLevel.description} was added.`
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
      if (incentiveLevel) {
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
          description: incentiveLevel.description,
          availability,
        })
      }

      res.locals.breadcrumbs.addItems(
        { text: 'Manage levels', href: '/incentive-levels' },
        { text: incentiveLevel ? incentiveLevel.description : 'Add new level' },
      )
      return res.render('pages/incentiveLevelForm.njk', {
        messages: req.flash(),
        form,
        incentiveLevel,
      })
    }),
  )

  return router
}
