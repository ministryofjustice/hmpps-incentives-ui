import type { RequestHandler, Router, NextFunction, Request, Response } from 'express'
import { BadRequest, MethodNotAllowed } from 'http-errors'

import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import AboutPageFeedbackForm from './forms/aboutPageFeedbackForm'

export default function routes(router: Router): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    res.locals.breadcrumbs.lastItem.href = undefined

    res.render('pages/home.njk')
  })

  const formId = 'about-page-feedback'

  router.all(
    '/about',
    (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'POST') {
        next(new MethodNotAllowed())
        return
      }
      next()
    },
    (req: Request, res: Response, next: NextFunction) => {
      const form = new AboutPageFeedbackForm(formId)
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

      const informationUseful = form.getField('informationUseful').value

      logger.info(`Submitting feedback to Zendesk: About page was useful=${informationUseful}`)
      req.flash('success', 'Your feedback has been submitted.')

      next()
    },
    (req: Request, res: Response) => {
      res.locals.breadcrumbs.addItems({ text: 'About' })

      res.render('pages/about.njk', {
        messages: req.flash(),
        form: res.locals.forms['about-page-feedback'],
      })
    },
  )

  return router
}
