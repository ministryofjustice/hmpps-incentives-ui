import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest, NotFound } from 'http-errors'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { IncentivesApi, IncentiveLevel } from '../data/incentivesApi'
import { requireGetOrPost } from './forms/forms'
import IncentiveLevelForm from './forms/incentiveLevelForm'

export const manageIncentiveLevelsRole = 'ROLE_MAINTAIN_INCENTIVE_LEVELS'

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const incentiveLevels = await incentivesApi.getIncentiveLevels(true)

    res.locals.breadcrumbs.addItems({ text: 'Manage levels' })
    return res.render('pages/incentiveLevels.njk', { messages: req.flash(), incentiveLevels })
  })

  get('/view/:levelCode', async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const incentiveLevel = await incentivesApi.getIncentiveLevel(levelCode)

    res.locals.breadcrumbs.addItems({ text: 'Manage levels', href: '/incentive-levels' }, { text: incentiveLevel.name })
    return res.render('pages/incentiveLevel.njk', { messages: req.flash(), incentiveLevel })
  })

  const activateDeactivate: { (active: boolean): RequestHandler } = active => async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const incentiveLevel = await incentivesApi.updateIncentiveLevel(levelCode, { active })
    // TODO: handle errors
    const message = active ? `${incentiveLevel.name} is now active` : `${incentiveLevel.name} is no longer active`
    logger.info(message)
    req.flash('success', message)

    return res.redirect(active ? `/incentive-levels/view/${levelCode}` : '/incentive-levels')
  }

  router.get('/activate/:levelCode', asyncMiddleware(activateDeactivate(true)))
  router.get('/deactivate/:levelCode', asyncMiddleware(activateDeactivate(false)))

  const moveLevel: { (move: 'up' | 'down'): RequestHandler } = move => async (req, res) => {
    const incentivesApi = new IncentivesApi(res.locals.user.token)

    const { levelCode } = req.params
    const incentiveLevels = await incentivesApi.getIncentiveLevels(true)
    const previousIndex = incentiveLevels.findIndex(incentiveLevel => incentiveLevel.code === levelCode)
    if (typeof previousIndex !== 'number' || previousIndex < 0) {
      throw new NotFound()
    }
    if ((previousIndex === 0 && move === 'up') || (previousIndex === incentiveLevels.length - 1 && move === 'down')) {
      throw new BadRequest()
    }
    const newIndex = move === 'up' ? previousIndex - 1 : previousIndex + 1
    const level1 = incentiveLevels[previousIndex]
    const level2 = incentiveLevels[newIndex]
    incentiveLevels[newIndex] = level1
    incentiveLevels[previousIndex] = level2
    await incentivesApi.setIncentiveLevelOrder(incentiveLevels.map(incentiveLevel => incentiveLevel.code))
    const message = 'Incentive levels reordered'
    logger.info(message)
    req.flash('success', message)

    return res.redirect('/incentive-levels')
  }

  // NB: move direction refers to a visual represenation where levels are presented in a list top-to-bottom
  router.get('/move-up/:levelCode', asyncMiddleware(moveLevel('up')))
  router.get('/move-down/:levelCode', asyncMiddleware(moveLevel('down')))

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
            name: form.getField('name').value,
            description: form.getField('description').value || '',
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
            description: form.getField('description').value || '',
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
        { text: 'Manage levels', href: '/incentive-levels' },
        { text: incentiveLevel ? incentiveLevel.name : 'Add new level' },
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
