import type { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { BadRequest } from 'http-errors'
import jwtDecode from 'jwt-decode'

import config from '../config'
import logger from '../../logger'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { PrisonApi } from '../data/prisonApi'
import ZendeskClient, { CreateTicketRequest } from '../data/zendeskClient'
import S3Client from '../data/s3Client'
import AnalyticsService from '../services/analyticsService'
import { type CaseEntriesTable, TableType } from '../services/analyticsServiceTypes'
import AnalyticsView from '../services/analyticsView'
import { National } from '../services/pgdRegionService'
import { cache } from './analyticsRouter'
import { manageIncentiveLevelsRole } from './incentiveLevels'
import { managePrisonIncentiveLevelsRole } from './prisonIncentiveLevels'
import { requireGetOrPost } from './forms/forms'
import AboutPageFeedbackForm from './forms/aboutPageFeedbackForm'

const getUserRoles = (res: Response): string[] => {
  try {
    const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }
    return roles
  } catch (e) {
    return []
  }
}

export default function routes(router: Router): Router {
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res) => {
    // a prison case load would have locations, e.g. wings or house blocks
    // an LSA's special case load (CADM_I) has no locations
    const prisonApi = new PrisonApi(res.locals.user.token)
    const locations = await prisonApi.getUserLocations()
    const canViewLocationBasedTiles = locations.length > 0

    const userRoles = getUserRoles(res)
    const canManageIncentiveLevels = userRoles.includes(manageIncentiveLevelsRole)
    const canManagePrisonIncentiveLevels =
      canViewLocationBasedTiles && userRoles.includes(managePrisonIncentiveLevelsRole)

    res.locals.breadcrumbs.popLastItem()

    res.render('pages/home.njk', {
      canViewLocationBasedTiles,
      canManageIncentiveLevels,
      canManagePrisonIncentiveLevels,
    })
  })

  get('/about-national-policy', (req, res) => {
    res.render('pages/about-national-policy.njk')
  })

  const formId = 'about-page-feedback' as const

  router.all(
    '/about',
    requireGetOrPost,
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
      const form = new AboutPageFeedbackForm(formId)
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

      const activeCaseLoad = res.locals.user.activeCaseload.id
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`

      const informationUseful = form.getField('informationUseful').value
      const yesComments = form.getField('yesComments').value
      const noComments = form.getField('noComments').value
      const tags = ['hmpps-incentives', 'about-page-feedback', `useful-${informationUseful}`]
      let comment = `
About page (${url})
Prison: ${activeCaseLoad}

Is this information useful? ${informationUseful}
`
      if (yesComments) {
        comment += `
Comments:
${yesComments}`
      } else if (noComments) {
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
    asyncMiddleware(async (req: Request, res: Response) => {
      const activeCaseLoad = res.locals.user.activeCaseload.id
      const prisonRegions = await getPrisonRegions(activeCaseLoad)
      const prisonRegionTableRows = Object.entries(prisonRegions).map(([region, prisons]) => {
        return [{ text: region }, { html: prisons.join('<br />') }]
      })

      res.render('pages/about-analytics.njk', {
        prisonRegionTableRows,
        messages: req.flash(),
        form: res.locals.forms[formId],
      })
    }),
  )

  return router
}

async function getPrisonRegions(activeCaseLoad: string): Promise<Record<string, string[]>> {
  const analyticsView = new AnalyticsView(National, 'behaviour-entries', activeCaseLoad)
  const s3Client = new S3Client(config.s3)
  const analyticsService = new AnalyticsService(s3Client, cache, analyticsView)
  const sourceTable = await analyticsService.getStitchedTable<CaseEntriesTable, [string, string]>(
    TableType.behaviourEntriesRegional,
    ['pgd_region', 'prison_name'],
  )
  const prisonRegions: Record<string, Set<string>> = {}
  sourceTable.stitchedTable.forEach(([region, prison]) => {
    if (!(region in prisonRegions)) {
      prisonRegions[region] = new Set()
    }
    prisonRegions[region].add(prison)
  })
  const sortedPrisonRegions: Record<string, string[]> = {}
  Object.keys(prisonRegions)
    .sort()
    .forEach(region => {
      sortedPrisonRegions[region] = Array.from(prisonRegions[region]).sort()
    })
  return sortedPrisonRegions
}
