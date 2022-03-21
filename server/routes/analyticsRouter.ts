import type { RequestHandler, Router } from 'express'

import config from '../config'
import asyncMiddleware from '../middleware/asyncMiddleware'
import featureGate from '../middleware/featureGate'
import S3Client from '../data/s3Client'
import AnalyticsService from '../services/analyticsService'
import { ProtectedCharacteristic } from '../services/analyticsServiceTypes'

function urlForLocation(prison: string, location: string): string {
  return `/incentive-summary/${prison}-${location}`
}

export default function routes(router: Router): Router {
  const get = (path: string, handler: RequestHandler) =>
    router.get(path, featureGate('showAnalytics', asyncMiddleware(handler)))

  get('/', (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentives data' })
    res.render('pages/analytics/index')
  })

  get('/behaviour-entries', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentives data', href: '/analytics' }, { text: 'Behaviour entries' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)
    const behaviourEntries = await analyticsService.getBehaviourEntriesByLocation(activeCaseLoad)
    const prisonersWithEntries = await analyticsService.getPrisonersWithEntriesByLocation(activeCaseLoad)

    res.render('pages/analytics/behaviour-entries/index', {
      behaviourEntries,
      prisonersWithEntries,
    })
  })

  get('/incentive-levels', async (req, res) => {
    res.locals.breadcrumbs.addItems({ text: 'Incentives data', href: '/analytics' }, { text: 'Incentive levels' })

    const activeCaseLoad = res.locals.user.activeCaseload.id

    const s3Client = new S3Client(config.s3)
    const analyticsService = new AnalyticsService(s3Client, urlForLocation)
    const prisonersOnLevels = await analyticsService.getIncentiveLevelsByLocation(activeCaseLoad)

    res.render('pages/analytics/incentive-levels/index', {
      prisonersOnLevels,
    })
  })

  get('/protected-characteristics', async (req, res) => {
    res.locals.breadcrumbs.addItems(
      { text: 'Incentives data', href: '/analytics' },
      { text: 'Protected characteristics' }
    )

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
      prisonersByEthnicity,
      prisonersInAgeGroups,
    })
  })

  return router
}
