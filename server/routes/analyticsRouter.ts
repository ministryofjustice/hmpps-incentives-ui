import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { MethodNotAllowed } from 'http-errors'

import config from '../config'
import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { featureGate, activeCaseloadGate, usernameGate } from '../middleware/featureGate'
import S3Client from '../data/s3Client'
import ZendeskClient, { CreateTicketRequest } from '../data/zendeskClient'
import AnalyticsService from '../services/analyticsService'
import { ProtectedCharacteristic } from '../services/analyticsServiceTypes'
import Form from './forms/forms'
import { type ChartFeedbackForm, validate } from './forms/chartFeedbackForm'

/**
 * Shared template variables needed throughout analytics section
 */
function getAnalyticsContext(): Record<string, unknown> {
  return {
    feedbackUrl: config.feedbackUrlForAnalytics || config.feedbackUrl,
  }
}

/**
 * Makes a link from locations in analytics graphs to incentives review table
 */
function urlForLocation(prison: string, location: string): string {
  return `/incentive-summary/${prison}-${location}`
}

/**
 * Adds global, per-prison and per-user feature gates to an analytics request handler
 */
function addFeatureGates(asyncHandler: RequestHandler): RequestHandler {
  return featureGate(
    'showAnalytics',
    activeCaseloadGate(
      config.prisonsWithAnalytics,
      usernameGate(config.usernamesWithAnalytics, asyncMiddleware(asyncHandler))
    )
  )
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, addFeatureGates(handler))

  get('/', (req, res) => {
    res.redirect('/analytics/incentive-levels')
  })

  const routeWithFeedback = (path: string, handler: RequestHandler) =>
    router.all(
      path,
      addFeatureGates((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          next(new MethodNotAllowed())
        }
        next()
      }),
      addFeatureGates(chartFeedbackHandler),
      addFeatureGates(handler)
    )

  routeWithFeedback('/behaviour-entries', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Behaviour entries' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)
    const behaviourEntries = await analyticsService.getBehaviourEntriesByLocation(activeCaseLoad)
    const prisonersWithEntries = await analyticsService.getPrisonersWithEntriesByLocation(activeCaseLoad)

    res.render('pages/analytics/behaviour-entries/index', {
      ...getAnalyticsContext(),
      behaviourEntries,
      prisonersWithEntries,
    })
  })

  routeWithFeedback('/incentive-levels', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentive levels' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)
    const prisonersOnLevels = await analyticsService.getIncentiveLevelsByLocation(activeCaseLoad)

    res.render('pages/analytics/incentive-levels/index', {
      ...getAnalyticsContext(),
      prisonersOnLevels,
    })
  })

  routeWithFeedback('/protected-characteristics', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Protected characteristics' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)
    const prisonersByEthnicity = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
      activeCaseLoad,
      ProtectedCharacteristic.Ethnicity
    )
    const prisonersInAgeGroups = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
      activeCaseLoad,
      ProtectedCharacteristic.AgeGroup
    )

    res.render('pages/analytics/protected-characteristics/index', {
      ...getAnalyticsContext(),
      prisonersByEthnicity,
      prisonersInAgeGroups,
    })
  })

  return router
}

async function chartFeedbackHandler(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST') {
    next()
    return
  }

  const activeCaseLoad = res.locals.user.activeCaseload.id
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  const data = req.body as Partial<ChartFeedbackForm>

  if (!data.formId) {
    logger.error('Form posted without specifying formId')
    next()
    return
  }

  const form = new Form<ChartFeedbackForm>(data)
  validate(form)
  if (form.hasErrors) {
    // form has errors so should be re-displayed
    res.locals.formsWithErrors = { [form.data.formId]: form }
    next()
    return
  }

  logger.info(`Submitting feedback to Zendesk: Chart ${form.data.formId} was useful=${form.data.chartUseful}`)

  const tags = ['hmpps-incentives', 'chart-feedback', `useful-${form.data.chartUseful}`]
  if (form.data.chartUseful === 'no') {
    tags.push(`not-useful-${form.data.mainNoReason}`)
  }

  let comment =
    form.data.chartUseful === 'yes'
      ? `
Chart: ${form.data.formId} (${url})
Prison: ${activeCaseLoad}

Is this chart useful? ${form.data.chartUseful}`
      : `
Chart: ${form.data.formId} (${url})
Prison: ${activeCaseLoad}

Is this chart useful? ${form.data.chartUseful}
Main reason: ${form.data.mainNoReason}`
  if (form.data.yesComments) {
    comment += `

Comments:
${form.data.yesComments}`
  }
  if (form.data.noComments) {
    comment += `

Comments:
${form.data.noComments}`
  }

  const ticket: CreateTicketRequest = {
    subject: `Feedback on chart ${form.data.formId}`,
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
    } catch (error) {
      logger.error('Failed to create Zendesk ticket', error)
    }
  } else {
    logger.error('No Zendesk credetials. Cannot create ticket.')
  }
  next()
}
