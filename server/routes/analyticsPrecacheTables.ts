import { setImmediate } from 'timers'

import logger from '../../logger'
import config from '../config'
import S3Client from '../data/s3Client'
import AnalyticsView from '../services/analyticsView'
import AnalyticsService from '../services/analyticsService'
import { Ages, ProtectedCharacteristic } from '../services/analyticsServiceTypes'
import PgdRegionService, { National } from '../services/pgdRegionService'
import { cache } from './analyticsRouter'

async function precacheTablesForRegion(region: string | null) {
  // NB: viewType and activeCaseLoad have no effect on what data is loaded and stitched
  const analyticsView = new AnalyticsView(region, 'behaviour-entries', 'MDI')
  const s3Client = new S3Client(config.s3)
  const analyticsService = new AnalyticsService(s3Client, cache, analyticsView)

  await analyticsService.getBehaviourEntriesByLocation()
  await analyticsService.getPrisonersWithEntriesByLocation()
  await analyticsService.getBehaviourEntryTrends()
  await analyticsService.getIncentiveLevelsByLocation()
  await analyticsService.getIncentiveLevelTrends()

  // NB: specific characteristic has no effect on what data is loaded and stitched
  const age = ProtectedCharacteristic.Age
  const ageGroup = Ages[2]
  await analyticsService.getIncentiveLevelsByProtectedCharacteristic(age)
  await analyticsService.getIncentiveLevelTrendsByCharacteristic(age, ageGroup)
  await analyticsService.getBehaviourEntriesByProtectedCharacteristic(age)
  await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(age, ageGroup)
  await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(age)
}

async function precachePrisonTables() {
  logger.info('Pre-caching analytics tables…')
  await precacheTablesForRegion(null)
  setImmediate(precacheRegionTables)
}

async function precacheRegionTables() {
  // NB: specific region has no effect on what data is loaded and stitched
  await precacheTablesForRegion(PgdRegionService.getPgdRegionByCode('WLS').code)
  setImmediate(precacheNationalTables)
}

async function precacheNationalTables() {
  await precacheTablesForRegion(National)
  logger.info('Done pre-caching analytics tables')
}

/**
 * Sequentially loads each analytics table to warm up the cache,
 * repeating for each view level (i.e. prison, region, national)
 */
export default async function precacheTables() {
  return precachePrisonTables()
}
