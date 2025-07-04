import type { Request, RequestHandler, Router } from 'express'
import { BadRequest, NotFound } from 'http-errors'

import config from '../config'
import logger from '../../logger'
import S3Client from '../data/s3Client'
import ZendeskClient, { CreateTicketRequest } from '../data/zendeskClient'
import AnalyticsService from '../services/analyticsService'
import {
  AgeYoungPeople,
  AnalyticsError,
  knownGroupsFor,
  ProtectedCharacteristic,
} from '../services/analyticsServiceTypes'
import type { ChartId } from './analyticsChartTypes'
import { requireGetOrPost } from './forms/forms'
import ChartFeedbackForm from './forms/chartFeedbackForm'
import PrisonRegister from '../data/prisonRegister'
import PgdRegionService, { National } from '../services/pgdRegionService'
import {
  StitchedTablesCache,
  MemoryStitchedTablesCache,
  FileStitchedTablesCache,
} from '../services/stitchedTablesCache'
import AnalyticsView from '../services/analyticsView'

export const protectedCharacteristicRoutes = {
  age: { label: 'Age', groupDropdownLabel: 'Select an age', id: ProtectedCharacteristic.Age },
  ethnicity: {
    label: 'Ethnicity',
    groupDropdownLabel: 'Select an ethnicity',
    id: ProtectedCharacteristic.Ethnicity,
  },
  disability: {
    label: 'Recorded disability',
    groupDropdownLabel: 'Select a recorded disability',
    id: ProtectedCharacteristic.Disability,
  },
  religion: {
    label: 'Religion, faith and belief',
    groupDropdownLabel: 'Select a religion, faith or belief',
    id: ProtectedCharacteristic.Religion,
  },
  'sexual-orientation': {
    label: 'Sexual orientation',
    groupDropdownLabel: 'Select a sexual orientation',
    id: ProtectedCharacteristic.SexualOrientation,
  },
} as const

/**
 * Shared template variables needed throughout analytics section
 */
function templateContext(req: Request): Record<string, unknown> {
  return {
    messages: req.flash(),
  }
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

export const cache: StitchedTablesCache = config.featureFlags.useFileSystemCache
  ? new FileStitchedTablesCache()
  : new MemoryStitchedTablesCache()

export default function routes(router: Router): Router {
  router.get('/', (_req, res) => {
    res.redirect('/analytics/incentive-levels')
  })

  router.get('/select-pgd-region', async (_req, res) => {
    const options: { value: string; text: string }[] = [{ value: National, text: National }]
    options.push(
      ...PgdRegionService.getAllPgdRegions().map(pgdRegion => ({
        value: pgdRegion.code,
        text: pgdRegion.name,
      })),
    )

    res.render('pages/analytics/changePgdRegion.njk', {
      title: 'Select a view',
      options,
      backUrl: '/',
    })
  })

  router.post('/select-pgd-region', async (req, res) => {
    const { pgdRegionCode } = req.body ?? {}

    if (!pgdRegionCode) {
      logger.error(req.originalUrl, 'pgdRegionCode is missing')
      res.redirect('/analytics/select-pgd-region')
      return
    }

    res.redirect(`/analytics/${pgdRegionCode}/incentive-levels`)
  })

  const routeWithFeedback = (path: string, chartIds: ReadonlyArray<ChartId>, handler: RequestHandler) =>
    router.all(path, requireGetOrPost, chartFeedbackHandler(chartIds), handler)

  const behaviourEntryChartIds: ChartId[] = [
    'entries-by-location',
    'prisoners-with-entries-by-location',
    'trends-entries',
  ]
  routeWithFeedback('/behaviour-entries', behaviourEntryChartIds, async (req, res) => {
    const { pgdRegionCode } = req.params as { pgdRegionCode: ConstructorParameters<typeof AnalyticsView>[0] }
    const activeCaseLoad = res.locals.user.activeCaseload.id
    const analyticsView = new AnalyticsView(pgdRegionCode, 'behaviour-entries', activeCaseLoad)
    if (!analyticsView.isValidPgdRegion) {
      res.redirect('/analytics/select-pgd-region')
      return
    }

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, cache, analyticsView)

    const charts = [
      analyticsService.getBehaviourEntriesByLocation(),
      analyticsService.getPrisonersWithEntriesByLocation(),
      analyticsService.getBehaviourEntryTrends(),
    ].map(transformAnalyticsError)
    const [behaviourEntries, prisonersWithEntries, trends] = await Promise.all(charts)

    res.render('pages/analytics/behaviourEntries', {
      ...templateContext(req),
      analyticsView,
      behaviourEntries,
      prisonersWithEntries,
      trends,
    })
  })

  const incentiveLevelChartIds: ChartId[] = ['incentive-levels-by-location', 'trends-incentive-levels']
  routeWithFeedback('/incentive-levels', incentiveLevelChartIds, async (req, res) => {
    const { pgdRegionCode } = req.params as { pgdRegionCode: ConstructorParameters<typeof AnalyticsView>[0] }
    const activeCaseLoad = res.locals.user.activeCaseload.id
    const analyticsView = new AnalyticsView(pgdRegionCode, 'incentive-levels', activeCaseLoad)
    if (!analyticsView.isValidPgdRegion) {
      res.redirect('/analytics/select-pgd-region')
      return
    }

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, cache, analyticsView)

    const charts = [analyticsService.getIncentiveLevelsByLocation(), analyticsService.getIncentiveLevelTrends()].map(
      transformAnalyticsError,
    )
    const [prisonersOnLevels, trends] = await Promise.all(charts)

    res.render('pages/analytics/incentiveLevels', {
      ...templateContext(req),
      analyticsView,
      prisonersOnLevels,
      trends,
    })
  })

  router.get('/protected-characteristics', (_req, res) => {
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
    'entries-by-age',
    'entries-by-disability',
    'entries-by-ethnicity',
    'entries-by-religion',
    'entries-by-sexual-orientation',
    'trends-entries-by-age',
    'trends-entries-by-disability',
    'trends-entries-by-ethnicity',
    'trends-entries-by-religion',
    'trends-entries-by-sexual-orientation',
    'prisoners-with-entries-by-age',
    'prisoners-with-entries-by-disability',
    'prisoners-with-entries-by-ethnicity',
    'prisoners-with-entries-by-religion',
    'prisoners-with-entries-by-sexual-orientation',
  ]
  routeWithFeedback('/protected-characteristic', protectedCharacteristicChartIds, async (req, res, next) => {
    const activeCaseLoad = res.locals.user.activeCaseload.id

    const { pgdRegionCode } = req.params as { pgdRegionCode: ConstructorParameters<typeof AnalyticsView>[0] }
    const analyticsView = new AnalyticsView(pgdRegionCode, 'protected-characteristic', activeCaseLoad)
    if (!analyticsView.isValidPgdRegion) {
      res.redirect('/analytics/select-pgd-region')
      return
    }

    const characteristicName = (req.query.characteristic || 'age') as keyof typeof protectedCharacteristicRoutes
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

    const protectedCharacteristic = protectedCharacteristicRoutes[characteristicName]

    const groupsForCharacteristic =
      protectedCharacteristic.id === ProtectedCharacteristic.Age && !PrisonRegister.housesYoungPeople(activeCaseLoad)
        ? knownGroupsFor(protectedCharacteristic.id).filter(ageGroup => ageGroup !== AgeYoungPeople)
        : knownGroupsFor(protectedCharacteristic.id)

    const trendsIncentiveLevelsGroup = (req.query.trendsIncentiveLevelsGroup || groupsForCharacteristic[0]) as string
    const trendsEntriesGroup = (req.query.trendsEntriesGroup || groupsForCharacteristic[0]) as string

    if (
      !groupsForCharacteristic.includes(trendsIncentiveLevelsGroup) ||
      !groupsForCharacteristic.includes(trendsEntriesGroup)
    ) {
      next(new NotFound())
      return
    }

    const trendsIncentiveLevelsOptions = groupsForCharacteristic.map(name => {
      return {
        value: name,
        selected: name === trendsIncentiveLevelsGroup,
      }
    })
    const trendsEntriesOptions = groupsForCharacteristic.map(name => {
      return {
        value: name,
        selected: name === trendsEntriesGroup,
      }
    })

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, cache, analyticsView)

    const charts = [
      analyticsService.getIncentiveLevelsByProtectedCharacteristic(protectedCharacteristic.id),
      analyticsService.getIncentiveLevelTrendsByCharacteristic(protectedCharacteristic.id, trendsIncentiveLevelsGroup),
      analyticsService.getBehaviourEntriesByProtectedCharacteristic(protectedCharacteristic.id),
      analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(protectedCharacteristic.id, trendsEntriesGroup),
      analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(protectedCharacteristic.id),
    ].map(transformAnalyticsError)
    const [
      incentiveLevelsByCharacteristic,
      incentiveLevelsTrendsByCharacteristic,
      behaviourEntriesByCharacteristic,
      behaviourEntryTrendsByCharacteristic,
      prisonersWithEntriesByCharacteristic,
    ] = await Promise.all(charts)

    res.render('pages/analytics/protectedCharacteristicTemplate', {
      ...templateContext(req),
      analyticsView,
      protectedCharacteristic,
      characteristicName,
      characteristicOptions,
      trendsIncentiveLevelsOptions,
      trendsEntriesOptions,
      trendsIncentiveLevelsGroup,
      trendsEntriesGroup,
      incentiveLevelsByCharacteristic,
      incentiveLevelsTrendsByCharacteristic,
      behaviourEntriesByCharacteristic,
      behaviourEntryTrendsByCharacteristic,
      prisonersWithEntriesByCharacteristic,
    })
  })

  return router
}

const chartFeedbackHandler = (chartIds: ReadonlyArray<ChartId>): RequestHandler =>
  async function handler(req, res, next) {
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

    if (!req.body?.formId || !chartIds.includes(req.body.formId)) {
      logger.error(`Form posted with incorrect formId=${req.body?.formId} when only ${chartIds.join(' ')} are allowed`)
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
