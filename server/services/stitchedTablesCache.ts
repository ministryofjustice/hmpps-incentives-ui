// eslint-disable-next-line max-classes-per-file
import type { TableType } from './analyticsServiceTypes'
import type AnalyticsService from './analyticsService'

type CachedValue = {
  date: Date
  modified: Date
  stitchedTable: [string, ...(number | string)[]][]
}

/**
 * The source tables are stored in S3, these files can be over 100MB
 * and tranform them into a more useful format is also relatively "slow".
 *
 * It's wasteful to transfer these files from S3 and transform them from
 * JSON to a matrix format for each request.
 *
 * Values are cached based on source filename and list of columns.
 * This means that potentially two charts could use the same source table
 * but different columns and the corresponding stiched tables would not clash.
 *
 * NOTE: The cached stiched tables are not filtered. The AnalyticsService
 * would still filter them by prison or else. This filtering is relatively
 * fast so we don't store all the small artefacts for each of the prisons.
 */
export abstract class StitchedTablesCache {
  getCacheKey(tableType: TableType, columnsToStitch: string[]): string {
    return [tableType, ...columnsToStitch].join(',')
  }

  abstract clear(): void

  abstract get<Row extends [string, ...(number | string)[]]>(
    analyticsService: AnalyticsService,
    tableType: TableType,
    cacheKey: string,
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] } | null>

  abstract set(cacheKey: string, value: CachedValue): void
}

/**
 * In-memory cache of the stiched tables values.
 *
 * A typical value would be ~30MB so small enough to be kept in memory.
 * This has the advantage of clearing the cache if application is restarted.
 */
export class MemoryStitchedTablesCache extends StitchedTablesCache {
  /**
   * A map-like object where the key is a unique string derived from
   * the source table name and the columns (e.g. 'incentives_latest_narrow,prison,wing').
   *
   * The value contains the actual cached value, including
   * the `stichedTable` matrix and the `date`/`modified` dates.
   */
  private cache: Record<
    string, // cacheKey [TableType, ...columnsToStitch].join(',')
    CachedValue
  > = {}

  /**
   * Clears the cache. Particularly useful when running tests when caching
   * may not be desirable.
   */
  clear(): void {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(this.cache)) {
      delete this.cache[key]
    }
  }

  async get<Row extends [string, ...(number | string)[]]>(
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

  set(cacheKey: string, value: CachedValue): void {
    this.cache[cacheKey] = value
  }
}
