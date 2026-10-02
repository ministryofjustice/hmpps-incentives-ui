import type { Router } from 'express'

import { AuthenticationClient, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { managePrisonIncentiveLevelsRole, manageIncentiveLevelsRole } from '../data/constants'
import S3Client from '../data/s3Client'
import AnalyticsService from '../services/analyticsService'
import { type CaseEntriesTable, TableType } from '../services/analyticsServiceTypes'
import AnalyticsView from '../services/analyticsView'
import { National } from '../services/pgdRegionService'
import { cache } from './analyticsRouter'
import { LocationsInsidePrisonApi } from '../data/locationsInsidePrisonApi'
import { createRedisClient } from '../data/redisClient'

const hmppsAuthClient = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  new RedisTokenStore(createRedisClient('routes/home.ts')),
)

export default function routes(router: Router): Router {
  router.get('/', async (_req, res) => {
    // a prison case load would have locations, e.g. wings or house blocks
    const systemToken = await hmppsAuthClient.getToken(res.locals.user.username)
    const locationsApi = new LocationsInsidePrisonApi(systemToken)
    const locations = await locationsApi.getTopLevelPrisonLocations(res.locals.user.activeCaseload.id)
    const canViewLocationBasedTiles = locations.length > 0

    const userRoles = res.locals.user.roles ?? []
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

  router.get('/about-national-policy', (_req, res) => {
    res.render('pages/about-national-policy.njk')
  })

  router.get('/about', async (req, res) => {
    const activeCaseLoad = res.locals.user.activeCaseload.id
    const prisonRegions = await getPrisonRegions(activeCaseLoad)
    const prisonRegionTableRows = Object.entries(prisonRegions).map(([region, prisons]) => {
      return [{ text: region }, { html: prisons.join('<br />') }]
    })

    res.render('pages/about-analytics.njk', {
      prisonRegionTableRows,
    })
  })

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
