import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest, MethodNotAllowed, NotFound } from 'http-errors'

import config from '../config'
import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { featureGate, activeCaseloadGate, usernameGate } from '../middleware/featureGate'
import S3Client from '../data/s3Client'
import ZendeskClient, { CreateTicketRequest } from '../data/zendeskClient'
import AnalyticsService from '../services/analyticsService'
import { AnalyticsError, ProtectedCharacteristic, Report } from '../services/analyticsServiceTypes'
import ChartFeedbackForm from './forms/chartFeedbackForm'

/**
 * Shared template variables needed throughout analytics section
 */
function templateContext(req: Request): Record<string, unknown> {
  return {
    feedbackUrl: config.feedbackUrlForAnalytics || config.feedbackUrl,
    messages: req.flash(),
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

/**
 * Makes an empty report object indicating errors occurred
 * if the promise is rejected with an AnalyticsError
 */
async function transformAnalyticsError<Row extends Record<string, unknown>>(
  reportPromise: Promise<Report<Row>>
): Promise<Report<Row>> {
  try {
    return await reportPromise
  } catch (error) {
    logger.error(`Analytics page cannot load chart data: ${error}`)
    if (error instanceof AnalyticsError) {
      return {
        columns: [],
        dataSource: 'Not available',
        lastUpdated: undefined,
        rows: [],
        hasErrors: true,
      }
    }
    throw error
  }
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, addFeatureGates(handler))

  get('/', (req, res) => {
    res.redirect('/analytics/incentive-levels')
  })

  const routeWithFeedback = (path: string, graphIds: ReadonlyArray<string>, handler: RequestHandler) =>
    router.all(
      path,
      addFeatureGates((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          next(new MethodNotAllowed())
        }
        next()
      }),
      addFeatureGates(chartFeedbackHandler(graphIds)),
      addFeatureGates(handler)
    )

  const behaviourEntryGraphIds = ['entries-by-location', 'prisoners-with-entries-by-location']
  routeWithFeedback('/behaviour-entries', behaviourEntryGraphIds, async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Behaviour entries' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)

    const charts = [
      analyticsService.getBehaviourEntriesByLocation(activeCaseLoad),
      analyticsService.getPrisonersWithEntriesByLocation(activeCaseLoad),
    ].map(transformAnalyticsError)
    const [behaviourEntries, prisonersWithEntries] = await Promise.all(charts)

    res.render('pages/analytics/behaviour-entries/index', {
      ...templateContext(req),
      behaviourEntries,
      prisonersWithEntries,
    })
  })

  const incentiveLevelGraphIds = ['incentive-levels-by-location']
  routeWithFeedback('/incentive-levels', incentiveLevelGraphIds, async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentive levels' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)

    const charts = [analyticsService.getIncentiveLevelsByLocation(activeCaseLoad)].map(transformAnalyticsError)
    const [prisonersOnLevels] = await Promise.all(charts)

    res.render('pages/analytics/incentive-levels/index', {
      ...templateContext(req),
      prisonersOnLevels,
    })
  })

  const protectedCharacteristicGraphIds = [
    'incentive-levels-by-ethnicity',
    'incentive-levels-by-age',
    'incentive-levels-by-religion',
    'incentive-levels-by-disability',
    'incentive-levels-by-sexual-orientation',
  ]
  routeWithFeedback('/protected-characteristics', protectedCharacteristicGraphIds, async (req, res, next) => {
    if (!config.featureFlags.showPcAnalytics) {
      next(new NotFound())
      return
    }

    res.locals.breadcrumbs.addItems({ text: 'Protected characteristics' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)

    const charts = [
      analyticsService.getIncentiveLevelsByProtectedCharacteristic(activeCaseLoad, ProtectedCharacteristic.Ethnicity),
      analyticsService.getIncentiveLevelsByProtectedCharacteristic(activeCaseLoad, ProtectedCharacteristic.Age),
      analyticsService.getIncentiveLevelsByProtectedCharacteristic(activeCaseLoad, ProtectedCharacteristic.Religion),
      analyticsService.getIncentiveLevelsByProtectedCharacteristic(activeCaseLoad, ProtectedCharacteristic.Disability),
      analyticsService.getIncentiveLevelsByProtectedCharacteristic(
        activeCaseLoad,
        ProtectedCharacteristic.SexualOrientation
      ),
    ].map(transformAnalyticsError)
    const [
      prisonersByEthnicity,
      prisonersByAge,
      prisonersByReligion,
      prisonersByDisability,
      prisonersBySexualOrientation,
    ] = await Promise.all(charts)

    res.render('pages/analytics/protected-characteristics/index', {
      ...templateContext(req),
      prisonersByEthnicity,
      prisonersByAge,
      prisonersByReligion,
      prisonersByDisability,
      prisonersBySexualOrientation,
    })
  })

  return router
}

const chartFeedbackHandler = (graphIds: ReadonlyArray<string>) =>
  async function handler(req: Request, res: Response, next: NextFunction) {
    res.locals.graphIds = graphIds
    res.locals.forms = res.locals.forms || {}
    graphIds.forEach(graphId => {
      res.locals.forms[graphId] = new ChartFeedbackForm(graphId)
    })

    if (req.method !== 'POST') {
      next()
      return
    }

    const activeCaseLoad = res.locals.user.activeCaseload.id
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`

    if (!req.body.formId || !graphIds.includes(req.body.formId)) {
      logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${graphIds.join(' ')} are allowed`)
      next(new BadRequest())
      return
    }

    const form: ChartFeedbackForm = res.locals.forms[req.body.formId]
    form.submit(req.body)
    if (form.hasErrors) {
      logger.warn(`Form ${form.formId} submitted with errors`)
      next()
      return
    }

    const chartUseful = form.getField('chartUseful').value
    const yesComments = form.getField('yesComments').value
    const mainNoReason = form.getField('mainNoReason').value
    const noComments = form.getField('noComments').value

    logger.info(`Submitting feedback to Zendesk: Chart ${form.formId} was useful=${chartUseful}`)

    const tags = ['hmpps-incentives', 'chart-feedback', `chart-${form.formId}`, `useful-${chartUseful}`]
    if (chartUseful === 'no') {
      tags.push(`not-useful-${mainNoReason}`)
    }

    let comment =
      chartUseful === 'yes'
        ? `
Chart: ${form.formId} (${url})
Prison: ${activeCaseLoad}

Is this chart useful? ${chartUseful}`
        : `
Chart: ${form.formId} (${url})
Prison: ${activeCaseLoad}

Is this chart useful? ${chartUseful}
Main reason: ${mainNoReason}`
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

    const ticket: CreateTicketRequest = {
      subject: `Feedback on chart ${form.formId}`,
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
  }
