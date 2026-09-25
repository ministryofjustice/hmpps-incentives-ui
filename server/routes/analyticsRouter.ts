import type { Request, Router } from 'express'
import { NotFound } from 'http-errors'

import config from '../config'
import logger from '../../logger'
import S3Client from '../data/s3Client'
import AnalyticsService from '../services/analyticsService'
import {
  AgeYoungPeople,
  AnalyticsError,
  knownGroupsFor,
  ProtectedCharacteristic,
} from '../services/analyticsServiceTypes'
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

  router.get('/behaviour-entries', async (req, res) => {
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

  router.get('/incentive-levels', async (req, res) => {
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

  router.get('/protected-characteristic', async (req, res, next) => {
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
