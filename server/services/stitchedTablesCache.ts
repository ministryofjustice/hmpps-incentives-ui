import { Table, TableType } from './analyticsServiceTypes'
import type AnalyticsService from './analyticsService'

/**
 * In-memory cache of the stiched tables values.
 *
 * The source tables are stored in S3, these files can be over 100MB
 * and tranform them into a more useful format is also relatively "slow".
 *
 * It's wasteful to transfer these files from S3 and transform them from
 * JSON to a matrix format for each request.
 *
 * A typical value would be ~30MB so small enough to be kept in memory.
 * This has the advantage of clearing the cache if application is restarted.
 *
 * Values are cached based on source filename and list of columns.
 * This means that potentially two charts could use the same source table
 * but different columns and the corresponding stiched tables would not clash.
 *
 * NOTE: The cached stiched tables are not filtered. The AnalyticsService
 * would still filter them by prison or else. This filtering is relatively
 * fast so we don't store all the small artefacts for each of the prisons.
 */
export default class StitchedTablesCache {
  /**
   * A map-like object where the key is a unique string derived from
   * the source table name and the columns (e.g. 'incentives_latest_narrow,prison,wing').
   *
   * The value contains the actual cached value, including
   * the `stichedTable` matrix and the `date`/`modified` dates.
   */
  private cache: Record<
    string, // cacheKey [TableType, ...columnsToStitch].join(',')
    {
      date: Date
      modified: Date
      stitchedTable: [string, ...(number | string)[]][]
    }
  > = {}

  /**
   * Clears the cache. Particularly useful when running tests when caching
   * may not be desirable.
   */
  clear() {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(this.cache)) {
      delete this.cache[key]
    }
  }

  async getStitchedTable<T extends Table, Row extends [string, ...(number | string)[]]>(
    analyticsService: AnalyticsService,
    tableType: TableType,
    columnsToStitch: string[],
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] }> {
    const cacheKey = [tableType, ...columnsToStitch].join(',')

    let value = await this.get<Row>(analyticsService, tableType, cacheKey)
    if (value) {
      return value
    }

    // No cached value found or cache is stale: Get/calculate fresh value
    const { table, date, modified } = await analyticsService.findTable<T>(tableType)
    const stitchedTable = analyticsService.stitchTable<T, Row>(table, columnsToStitch)

    value = { date, modified, stitchedTable }
    this.cache[cacheKey] = value

    return value
  }

  private async get<Row extends [string, ...(number | string)[]]>(
    analyticsService: AnalyticsService,
    tableType: TableType,
    cacheKey: string,
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] } | null> {
    // Check if there is a cached value
    if (cacheKey in this.cache) {
      // Check whether it matches modified in S3
      const { modified: modifiedInCache } = this.cache[cacheKey]
      const { modified: modifiedInS3 } = await analyticsService.findLatestTable(tableType)

      if (modifiedInCache.toString() === modifiedInS3.toString()) {
        return this.cache[cacheKey] as { date: Date; modified: Date; stitchedTable: Row[] }
      }

      // Delete stale cached value
      delete this.cache[cacheKey]
    }

    return null
  }
}
