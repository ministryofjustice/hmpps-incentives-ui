// eslint-disable-next-line max-classes-per-file
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import v8 from 'node:v8'

import logger from '../../logger'
import type { TableType } from './analyticsServiceTypes'
import type AnalyticsService from './analyticsService'

type CachedValue = {
  date: Date
  modified: Date
  stitchedTable: [...(number | string)[]][]
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

  /**
   * Clears the cache. Particularly useful when running tests when caching
   * may not be desirable.
   */
  abstract clear(): void

  /**
   * Gets a cached value (when fresh) or returns null if none exists or is stale
   */
  abstract get<Row extends [...(number | string)[]]>(
    analyticsService: AnalyticsService,
    tableType: TableType,
    cacheKey: string,
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] } | null>

  /**
   * Stores a value in the cache
   */
  abstract set(cacheKey: string, value: CachedValue): Promise<void>
}

/**
 * In-memory cache of the stiched tables values.
 *
 * A typical value would be ~30MB so small enough to be kept in memory.
 * This has the advantage of clearing the cache if application is restarted.
 *
 * However, the application now displays many charts so a lot of memory is needed overall.
 */
export class MemoryStitchedTablesCache extends StitchedTablesCache {
  /**
   * A map-like object where the key is a unique string derived from
   * the source table name and the columns (e.g. 'incentives_latest_narrow,prison,location_code').
   *
   * The value contains the actual cached value, including
   * the `stichedTable` matrix and the `date`/`modified` dates.
   */
  private cache: Record<
    string, // cacheKey, as made by StitchedTablesCache.getCacheKey
    CachedValue
  > = {}

  clear(): void {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(this.cache)) {
      delete this.cache[key]
    }
  }

  async get<Row extends [...(number | string)[]]>(
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

  set(cacheKey: string, value: CachedValue): Promise<void> {
    this.cache[cacheKey] = value
    return Promise.resolve()
  }
}

/**
 * File system cache of the stiched tables values.
 * Each cached value is stored as a V8-serialised file in a temporary directory.
 *
 * While slower than in-memory cache, it allows pods to cache many more tables
 * without running out of memory.
 */
export class FileStitchedTablesCache extends StitchedTablesCache {
  path: string

  constructor() {
    super()
    this.path = path.join(os.tmpdir(), 'hmpps-incentives')
    logger.info(`Using file system cache for stitched tables ${this.path}`)
    if (!fs.existsSync(this.path)) {
      logger.debug('Creating file system cache directory')
      fs.mkdirSync(this.path, { recursive: true })
    }
  }

  clear(): void {
    if (fs.existsSync(this.path)) {
      logger.debug('Clearing file system cache directory')
      // eslint-disable-next-line no-restricted-syntax
      for (const fileName of fs.readdirSync(this.path)) {
        fs.rmSync(path.join(this.path, fileName))
      }
    }
  }

  private getFilePath(cacheKey: string): string {
    return path.join(this.path, `${cacheKey}.v8`)
  }

  private async readCachedValue(cacheKey: string): Promise<CachedValue | null> {
    const filePath = this.getFilePath(cacheKey)
    let file
    try {
      file = await fsPromises.open(filePath, 'r')
      const contents = await file.readFile()
      const value = v8.deserialize(contents)
      // extremely basic check for value validity
      if (value.modified && value.stitchedTable) {
        return value
      }
    } catch (error) {
      // file could not be read or deserialised; ignore it simply being absent
      if (error.code !== 'ENOENT') {
        logger.warn(`Cannot read stitched table cache for ${cacheKey}: ${error}`)
      }
    } finally {
      if (file) {
        await file.close()
      }
    }
    return null
  }

  async get<Row extends [...(number | string)[]]>(
    analyticsService: AnalyticsService,
    tableType: TableType,
    cacheKey: string,
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] } | null> {
    const value = await this.readCachedValue(cacheKey)
    if (value) {
      const { modified: modifiedInCache } = value
      const { modified: modifiedInS3 } = await analyticsService.findLatestTable(tableType)
      if (modifiedInCache.toString() === modifiedInS3.toString()) {
        return value as { date: Date; modified: Date; stitchedTable: Row[] }
      }
    }
    return null
  }

  async set(cacheKey: string, value: CachedValue): Promise<void> {
    const filePath = this.getFilePath(cacheKey)
    let file
    try {
      file = await fsPromises.open(filePath, 'w')
      const contents = v8.serialize(value)
      await file.writeFile(contents)
    } finally {
      if (file) {
        await file.close()
      }
    }
  }
}
