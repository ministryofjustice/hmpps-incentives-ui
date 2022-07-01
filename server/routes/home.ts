import type { RequestHandler, Router, NextFunction, Request, Response } from 'express'
import { BadRequest, MethodNotAllowed } from 'http-errors'

import config from '../config'
import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import ZendeskClient, { CreateTicketRequest } from '../data/zendeskClient'
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
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
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

      const activeCaseLoad = res.locals.user.activeCaseload.id
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`

      const informationUseful = form.getField('informationUseful').value
      const yesComments = form.getField('yesComments').value
      const noComments = form.getField('noComments').value
      const tags = ['hmpps-incentives', 'about-page-feedback', `useful-${informationUseful}`]
      let comment =
        informationUseful === 'yes'
          ? `
About page (${url})
Prison: ${activeCaseLoad}

Is this information useful? ${informationUseful}`
          : `
About page (${url})
Prison: ${activeCaseLoad}

Is this information useful? ${informationUseful}`
      if (yesComments) {
        comment += `

Comments:
${yesComments}`
      }
      if (noComments) {
        comment += `

Comments:
${noComments}`
      }

      logger.info(`Submitting feedback to Zendesk: About page was useful=${informationUseful}`)

      const ticket: CreateTicketRequest = {
        subject: 'Feedback on about page',
        comment: { body: comment.trim() },
        type: 'task',
        tags,
        custom_fields: [
          // Service
          { id: 23757677, value: 'hmpps_incentives' },
          // Environment
          { id: 32342378, value: config.environment },
          // URL
          { id: 23730083, value: url },
          // Prison
          { id: 23984153, value: activeCaseLoad },
        ],
      }
      const { username, token } = config.apis.zendesk
      if (username && token) {
        const zendesk = new ZendeskClient(config.apis.zendesk, username, token)
        try {
          await zendesk.createTicket(ticket)
          req.flash('success', 'Your feedback has been submitted.')
        } catch (error) {
          logger.error('Failed to create Zendesk ticket', error)
        }
      } else {
        logger.error('No Zendesk credetials. Cannot create ticket.')
      }

      next()
    }),
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
