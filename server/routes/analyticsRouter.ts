import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest, MethodNotAllowed, NotFound } from 'http-errors'

import config from '../config'
import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import S3Client from '../data/s3Client'
import ZendeskClient, { CreateTicketRequest } from '../data/zendeskClient'
import AnalyticsService from '../services/analyticsService'
import {
  AgeYoungPeople,
  AnalyticsError,
  knownGroupsFor,
  ProtectedCharacteristic,
} from '../services/analyticsServiceTypes'
import {
  BehaviourEntriesChartsContent,
  IncentiveLevelsChartsContent,
  ProtectedCharacteristicsChartsContent,
} from './analyticsChartsContent'
import type { ChartId } from './analyticsChartTypes'
import ChartFeedbackForm from './forms/chartFeedbackForm'

export const protectedCharacteristicRoutes = {
  age: { label: 'Age', groupSelectLabel: 'Select an age', characteristic: ProtectedCharacteristic.Age },
  ethnicity: {
    label: 'Ethnicity',
    groupSelectLabel: 'Select an ethnicity',
    characteristic: ProtectedCharacteristic.Ethnicity,
  },
  disability: {
    label: 'Recorded disability',
    groupSelectLabel: 'Select a recorded disability',
    characteristic: ProtectedCharacteristic.Disability,
  },
  religion: {
    label: 'Religion',
    groupSelectLabel: 'Select a religion',
    characteristic: ProtectedCharacteristic.Religion,
  },
  'sexual-orientation': {
    label: 'Sexual orientation',
    groupSelectLabel: 'Select a sexual orientation',
    characteristic: ProtectedCharacteristic.SexualOrientation,
  },
} as const

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
 * Makes a link from locations in analytics charts to incentives review table
 */
function urlForLocation(prison: string, location: string): string {
  return `/incentive-summary/${prison}-${location}`
}

/**
 * Makes an empty report object indicating errors occurred
 * if the promise is rejected with an AnalyticsError
 */
async function transformAnalyticsError<R>(reportPromise: Promise<R>): Promise<R> {
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
      } as unknown as R
    }
    throw error
  }
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', (req, res) => {
    res.redirect('/analytics/incentive-levels')
  })

  const routeWithFeedback = (path: string, chartIds: ReadonlyArray<ChartId>, handler: RequestHandler) =>
    router.all(
      path,
      (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'POST') {
          next(new MethodNotAllowed())
          return
        }
        next()
      },
      asyncMiddleware(chartFeedbackHandler(chartIds)),
      asyncMiddleware(handler)
    )

  const behaviourEntryChartIds: ChartId[] = [
    'entries-by-location',
    'prisoners-with-entries-by-location',
    'trends-entries',
  ]
  routeWithFeedback('/behaviour-entries', behaviourEntryChartIds, async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Behaviour entries' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)

    const charts = [
      analyticsService.getBehaviourEntriesByLocation(activeCaseLoad),
      analyticsService.getPrisonersWithEntriesByLocation(activeCaseLoad),
      analyticsService.getBehaviourEntryTrends(activeCaseLoad),
    ].map(transformAnalyticsError)
    const [behaviourEntries, prisonersWithEntries, trends] = await Promise.all(charts)

    res.render('pages/analytics/behaviourEntries', {
      ...templateContext(req),
      behaviourEntries,
      prisonersWithEntries,
      trends,
      BehaviourEntriesChartsContent,
    })
  })

  const incentiveLevelChartIds: ChartId[] = ['incentive-levels-by-location', 'trends-incentive-levels']
  routeWithFeedback('/incentive-levels', incentiveLevelChartIds, async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentive levels' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)

    const charts = [
      analyticsService.getIncentiveLevelsByLocation(activeCaseLoad),
      analyticsService.getIncentiveLevelTrends(activeCaseLoad),
    ].map(transformAnalyticsError)
    const [prisonersOnLevels, trends] = await Promise.all(charts)

    res.render('pages/analytics/incentiveLevels', {
      ...templateContext(req),
      prisonersOnLevels,
      trends,
      IncentiveLevelsChartsContent,
    })
  })

  get('/protected-characteristics', (req, res) => {
    res.redirect('/analytics/protected-characteristic?characteristic=age')
  })

  const protectedCharacteristicChartIds: ChartId[] = [
    'population-by-age',
    'population-by-disability',
    'population-by-ethnicity',
    'population-by-religion',
    'population-by-sexual-orientation',
    'incentive-levels-by-age',
    'incentive-levels-by-disability',
    'incentive-levels-by-ethnicity',
    'incentive-levels-by-religion',
    'incentive-levels-by-sexual-orientation',
    'trends-incentive-levels-by-age',
    'trends-incentive-levels-by-disability',
    'trends-incentive-levels-by-ethnicity',
    'trends-incentive-levels-by-religion',
    'trends-incentive-levels-by-sexual-orientation',
    'trends-entries-by-age',
    'trends-entries-by-disability',
    'trends-entries-by-ethnicity',
    'trends-entries-by-religion',
    'trends-entries-by-sexual-orientation',
    'entries-by-age',
    'entries-by-disability',
    'entries-by-ethnicity',
    'entries-by-religion',
    'entries-by-sexual-orientation',
  ]
  routeWithFeedback('/protected-characteristic', protectedCharacteristicChartIds, async (req, res, next) => {
    res.locals.breadcrumbs.addItems({ text: 'Protected characteristics' })

    const characteristicName = (req.query.characteristic || 'age') as string

    // TODO: Hardcoded for now. Take value from query param
    const protectedCharacteristicGroup = '26-35'

    if (!(characteristicName in protectedCharacteristicRoutes)) {
      next(new NotFound())
      return
    }

    const characteristicOptions = Object.entries(protectedCharacteristicRoutes).map(([name, { label }]) => {
      return {
        value: name,
        label,
        selected: name === characteristicName,
      }
    })

    const protectedCharacteristic = protectedCharacteristicRoutes[characteristicName].characteristic

    const groupsForCharacteristic =
      protectedCharacteristic === ProtectedCharacteristic.Age
        ? knownGroupsFor(protectedCharacteristic).filter(ageGroup => ageGroup !== AgeYoungPeople)
        : knownGroupsFor(protectedCharacteristic)

    const trendsEntriesGroup = (req.query.trendsEntriesGroup || groupsForCharacteristic[0]) as string
    const trendsEntriesOptions = groupsForCharacteristic.map(name => {
      return {
        value: name,
        selected: name === trendsEntriesGroup,
      }
    })
    const { groupSelectLabel } = protectedCharacteristicRoutes[characteristicName]

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)

    const charts = [
      analyticsService.getIncentiveLevelsByProtectedCharacteristic(activeCaseLoad, protectedCharacteristic),
      analyticsService.getIncentiveLevelTrendsByCharacteristic(
        activeCaseLoad,
        protectedCharacteristic,
        protectedCharacteristicGroup
      ),
      analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
        activeCaseLoad,
        protectedCharacteristic,
        trendsEntriesGroup
      ),
      analyticsService.getBehaviourEntriesByProtectedCharacteristic(activeCaseLoad, protectedCharacteristic),
    ].map(transformAnalyticsError)
    const [
      incentiveLevelsByCharacteristic,
      incentiveLevelsTrendsByCharacteristic,
      behaviourEntryTrendsByCharacteristic,
      behaviourEntriesByCharacteristic,
    ] = await Promise.all(charts)

    res.render('pages/analytics/protectedCharacteristicTemplate', {
      ...templateContext(req),
      characteristicName,
      characteristicOptions,
      trendsEntriesOptions,
      groupSelectLabel,
      incentiveLevelsByCharacteristic,
      incentiveLevelsTrendsByCharacteristic,
      behaviourEntryTrendsByCharacteristic,
      behaviourEntriesByCharacteristic,
      ProtectedCharacteristicsChartsContent,
    })
  })

  return router
}

const chartFeedbackHandler = (chartIds: ReadonlyArray<ChartId>) =>
  async function handler(req: Request, res: Response, next: NextFunction) {
    res.locals.chartIds = chartIds
    res.locals.forms = res.locals.forms || {}
    chartIds.forEach(chartId => {
      res.locals.forms[chartId] = new ChartFeedbackForm(chartId)
    })

    if (req.method !== 'POST') {
      next()
      return
    }

    const activeCaseLoad = res.locals.user.activeCaseload.id
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`

    if (!req.body.formId || !chartIds.includes(req.body.formId)) {
      logger.error(`Form posted with incorrect formId=${req.body.formId} when only ${chartIds.join(' ')} are allowed`)
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
