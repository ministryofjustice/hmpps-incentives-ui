// eslint-disable-next-line max-classes-per-file
import type S3Client from '../data/s3Client'
import logger from '../../logger'

import type {
  BehaviourEntriesByLocation,
  CaseEntriesTable,
  IncentiveLevelsTable,
  PrisonersOnLevelsByLocation,
  PrisonersOnLevelsByProtectedCharacteristic,
  PrisonersWithEntriesByLocation,
  Report,
  Table,
  TrendsReport,
  TrendsTable,
} from './analyticsServiceTypes'
import {
  AgeYoungPeople,
  AnalyticsError,
  AnalyticsErrorType,
  ProtectedCharacteristic,
  TableType,
  knownGroupsFor,
} from './analyticsServiceTypes'
import {
  addMissingMonths,
  compareCharacteristics,
  compareLocations,
  mapRowsAndSumTotals,
  mapRowsForMonthlyTrends,
  removeLevelPrefix,
  removeMonthsOutsideBounds,
} from './analyticsServiceUtils'
import PrisonRegister from '../data/prisonRegister'

export default class AnalyticsService {
  private readonly cache = StitchedTablesCache

  constructor(
    private readonly client: S3Client,
    private readonly urlForLocation: (prison: string, location: string) => string
  ) {}

  async findLatestTable(tableType: TableType): Promise<{ key: string; date: Date; modified: Date }> {
    logger.debug(`Finding latest "${tableType}" table`)
    let objects = await this.client.listObjects(`${tableType}/`)
    objects = objects.filter(object => /\/\d\d\d\d-\d\d-\d\d.json$/i.test(object.key))
    if (objects.length === 0) {
      const errorMessage = `Cannot find latest "${tableType}" table`
      logger.error(errorMessage)
      throw new AnalyticsError(AnalyticsErrorType.MissingTable, errorMessage)
    }
    const { key, modified } = objects[objects.length - 1]
    const date = new Date(key.slice(key.length - 15, key.length - 5))

    logger.info(`Found latest "${tableType}" table: ${key} (modified ${modified.toISOString()})`)

    return { key, date, modified }
  }

  async getTable<T extends Table>(key: string): Promise<T> {
    const object = await this.client.getObject(key)
    try {
      const table = JSON.parse(object) as T
      logger.info(`Downloaded table: "${key}"`)
      return table
    } catch (e) {
      const errorMessage = `Cannot parse "${key}" table: ${e}`
      logger.error(errorMessage)
      throw new AnalyticsError(AnalyticsErrorType.MalformedTable, errorMessage)
    }
  }

  /**
   * Finds the latest available table (by date) in S3 bucket, returning an object.
   * The source data hold columns separately
   */
  async findTable<T extends Table>(tableType: TableType): Promise<{ table: T; date: Date; modified: Date }> {
    const { key, date, modified } = await this.findLatestTable(tableType)
    const table = await this.getTable<T>(key)

    return { table, date, modified }
  }

  /**
   * Stitches together the source table into arrays representing the rows
   */
  stitchTable<T extends Table, Row extends [string, ...(number | string)[]]>(table: T, columns: (keyof T)[]): Row[] {
    const [keyColumn] = columns
    return Object.keys(table[keyColumn]).map(rowIndex => {
      return columns.map(column => table[column][rowIndex]) as Row
    })
  }

  async getBehaviourEntriesByLocation(prison: string): Promise<Report<BehaviourEntriesByLocation>> {
    const columnsToStitch = ['prison', 'wing', 'positives', 'negatives']
    type StitchedRow = [string, string, number, number]

    const { stitchedTable, date: lastUpdated } = await this.cache.getStitchedTable<CaseEntriesTable, StitchedRow>(
      this,
      TableType.behaviourEntries,
      columnsToStitch
    )

    const filteredTables = stitchedTable.filter(
      ([somePrison]) =>
        // filter only selected prison
        somePrison === prison
    )
    if (filteredTables.length === 0) {
      throw new AnalyticsError(AnalyticsErrorType.EmptyTable, 'Filtered BehaviourEntriesByLocation report has no rows')
    }

    const columns = ['Positive', 'Negative']
    type AggregateRow = [string, number, number]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      ([_prison, wing, positives, negatives]) => [wing, positives, negatives],
      2
    )

    const rows: BehaviourEntriesByLocation[] = aggregateTable.map(([location, ...values], index) => {
      const href = index === aggregateTable.length - 1 ? undefined : this.urlForLocation(prison, location)
      return { label: location, href, values }
    })
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  async getPrisonersWithEntriesByLocation(prison: string): Promise<Report<PrisonersWithEntriesByLocation>> {
    const columnsToStitch = ['prison', 'wing', 'positives', 'negatives']
    type StitchedRow = [string, string, number, number]

    const { stitchedTable, date: lastUpdated } = await this.cache.getStitchedTable<CaseEntriesTable, StitchedRow>(
      this,
      TableType.behaviourEntries,
      columnsToStitch
    )

    const filteredTables = stitchedTable.filter(
      ([somePrison]) =>
        // filter only selected prison
        somePrison === prison
    )
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        'Filtered PrisonersWithEntriesByLocation report has no rows'
      )
    }

    const columns = ['Positive', 'Negative', 'Both', 'None']
    type AggregateRow = [string, number, number, number, number]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      ([_prison, wing, positives, negatives]) => {
        if (positives > 0 && negatives > 0) {
          return [wing, 0, 0, 1, 0]
        }
        if (positives > 0) {
          return [wing, 1, 0, 0, 0]
        }
        if (negatives > 0) {
          return [wing, 0, 1, 0, 0]
        }
        return [wing, 0, 0, 0, 1]
      },
      4
    )

    const rows: PrisonersWithEntriesByLocation[] = aggregateTable.map(([location, ...values], index) => {
      const href = index === aggregateTable.length - 1 ? undefined : this.urlForLocation(prison, location)
      return { label: location, href, values }
    })
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  async getIncentiveLevelsByLocation(prison: string): Promise<Report<PrisonersOnLevelsByLocation>> {
    const columnsToStitch = ['prison', 'wing', 'incentive', 'characteristic', 'charac_group']
    type StitchedRow = [string, string, string, string, string]

    const { stitchedTable, date: lastUpdated } = await this.cache.getStitchedTable<IncentiveLevelsTable, StitchedRow>(
      this,
      TableType.incentiveLevels,
      columnsToStitch
    )

    const columnSet: Set<string> = new Set()
    const filteredTables = stitchedTable.filter(([somePrison, _wing, incentive, characteristic]) => {
      const include =
        // filter only selected prison
        somePrison === prison &&
        // arbitrarily filter by a characteristic (using one is required)
        characteristic === 'age_group_10yr' &&
        // it's possible for incentive level to be null
        incentive
      if (include) {
        columnSet.add(incentive)
      }
      return include
    })
    if (filteredTables.length === 0) {
      throw new AnalyticsError(AnalyticsErrorType.EmptyTable, 'Filtered PrisonersOnLevelsByLocation report has no rows')
    }

    let columns = Array.from(columnSet)
    columns.sort() // NB: levels sort naturally because they include a prefix

    type AggregateRow = [string, ...number[]]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      ([_prison, wing, incentive]) => {
        const levels = Array(columns.length).fill(0)
        const levelIndex = columns.findIndex(someIncentive => someIncentive === incentive)
        levels[levelIndex] = 1
        return [wing, ...levels]
      },
      columns.length
    )
    columns = columns.map(removeLevelPrefix)

    const rows: PrisonersOnLevelsByLocation[] = aggregateTable.map(([location, ...values], index) => {
      const href = index === aggregateTable.length - 1 ? undefined : this.urlForLocation(prison, location)
      return { label: location, href, values }
    })
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByProtectedCharacteristic(
    prison: string,
    protectedCharacteristic: ProtectedCharacteristic
  ): Promise<Report<PrisonersOnLevelsByProtectedCharacteristic>> {
    const columnsToStitch = ['prison', 'wing', 'incentive', 'characteristic', 'charac_group']
    type StitchedRow = [string, string, string, string, string]

    const { stitchedTable, date: lastUpdated } = await this.cache.getStitchedTable<IncentiveLevelsTable, StitchedRow>(
      this,
      TableType.incentiveLevels,
      columnsToStitch
    )

    const columnSet: Set<string> = new Set()
    const filteredTables = stitchedTable.filter(
      ([somePrison, _wing, incentive, characteristic, characteristicGroup]) => {
        // TODO: null characteristicGroup is excluded; convert to 'Unknown'?
        const include =
          // filter only selected prison
          somePrison === prison &&
          // filter by selected characteristic
          characteristic === protectedCharacteristic &&
          // it's possible for characteristic to be null
          characteristicGroup &&
          // it's possible for incentive level to be null
          incentive
        if (include) {
          columnSet.add(incentive)
        }
        return include
      }
    )
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        `Filtered PrisonersOnLevelsByProtectedCharacteristic report for ${protectedCharacteristic} has no rows`
      )
    }

    let columns = Array.from(columnSet)
    columns.sort() // NB: levels sort naturally because they include a prefix

    type AggregateRow = [string, ...number[]]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      ([_prison, _wing, incentive, _characteristic, characteristicGroup]) => {
        const levels = Array(columns.length).fill(0)
        const levelIndex = columns.findIndex(someIncentive => someIncentive === incentive)
        levels[levelIndex] = 1
        return [characteristicGroup.trim(), ...levels]
      },
      columns.length
    )
    columns = columns.map(removeLevelPrefix)

    const rows: PrisonersOnLevelsByProtectedCharacteristic[] = aggregateTable.map(([characteristic, ...values]) => {
      return { label: characteristic, values }
    })
    const missingCharacteristics = new Set(knownGroupsFor(protectedCharacteristic))
    // Don't show empty young people ('15-17') group in non-YCS prisons
    if (protectedCharacteristic === ProtectedCharacteristic.Age && !PrisonRegister.isYouthCustodyService(prison)) {
      missingCharacteristics.delete(AgeYoungPeople)
    }
    rows.forEach(({ label: characteristic }) => missingCharacteristics.delete(characteristic))
    missingCharacteristics.forEach(characteristic => {
      rows.push({ label: characteristic, values: Array(columns.length).fill(0) })
    })
    rows.sort(compareCharacteristics)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS' }
  }

  async getBehaviourEntryTrends(prison: string): Promise<TrendsReport> {
    const columnsToStitch = ['prison', 'year_month_str', 'snapshots', 'offenders', 'positives', 'negatives']
    type StitchedRow = [string, string, number, number, number, number]

    const { stitchedTable, date: lastUpdated } = await this.cache.getStitchedTable<TrendsTable, StitchedRow>(
      this,
      TableType.trends,
      columnsToStitch
    )

    const filteredTables = stitchedTable.filter(
      ([somePrison]) =>
        // filter only selected prison
        somePrison === prison
    )
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        'Filtered trends report for behaviour entries has no rows'
      )
    }

    const columns = ['Positive', 'Negative']
    let rows = mapRowsForMonthlyTrends<StitchedRow>(
      filteredTables,
      ([_prison, yearAndMonth, snapshots, offenders, positives, negatives]) => {
        return [
          {
            yearAndMonth,
            columnIndex: 0, // positive entries
            value: positives,
            population: offenders / snapshots,
          },
          {
            yearAndMonth,
            columnIndex: 1, // negative entries
            value: negatives,
            population: 0, // so that population isn't double-counted
          },
        ]
      },
      2
    )
    addMissingMonths(rows, 2)
    rows = removeMonthsOutsideBounds(rows)

    return {
      columns,
      rows,
      lastUpdated,
      dataSource: 'NOMIS',
      plotPercentage: false,
      populationIsTotal: false,
      verticalAxisTitle: 'Entries',
      monthlyTotalName: 'All entries',
    }
  }

  async getIncentiveLevelTrends(prison: string): Promise<TrendsReport> {
    const columnsToStitch = ['prison', 'year_month_str', 'snapshots', 'offenders', 'incentive']
    type StitchedRow = [string, string, number, number, string]

    const { stitchedTable, date: lastUpdated } = await this.cache.getStitchedTable<TrendsTable, StitchedRow>(
      this,
      TableType.trends,
      columnsToStitch
    )

    const columnSet: Set<string> = new Set()
    const filteredTables = stitchedTable.filter(([somePrison, _yearAndMonth, _snapshots, _offenders, incentive]) => {
      const include =
        // filter only selected prison
        somePrison === prison &&
        // it's possible for incentive level to be null
        incentive
      if (include) {
        columnSet.add(incentive)
      }
      return include
    })
    if (filteredTables.length === 0) {
      throw new AnalyticsError(AnalyticsErrorType.EmptyTable, 'Filtered trends report for incentive levels has no rows')
    }

    let columns = Array.from(columnSet)
    columns.sort() // NB: levels sort naturally because they include a prefix

    let rows = mapRowsForMonthlyTrends<StitchedRow>(
      filteredTables,
      ([_prison, yearAndMonth, snapshots, offenders, incentive]) => {
        const levelIndex = columns.findIndex(someIncentive => someIncentive === incentive)
        return [
          {
            yearAndMonth,
            columnIndex: levelIndex,
            value: offenders / snapshots,
            population: offenders / snapshots,
          },
        ]
      },
      columns.length
    )
    addMissingMonths(rows, columns.length)
    rows = removeMonthsOutsideBounds(rows)
    columns = columns.map(removeLevelPrefix)

    return {
      columns,
      rows,
      lastUpdated,
      dataSource: 'NOMIS',
      plotPercentage: true,
      populationIsTotal: true,
    }
  }
}

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
 * This means that potentially two graphs could use the same source table
 * but different columns and the corresponding stiched tables would not clash.
 *
 * NOTE: The cached stiched tables are not filtered. The AnalyticsService
 * would still filter them by prison or else. This filtering is relatively
 * fast so we don't store all the small artefacts for each of the prisons.
 */
export class StitchedTablesCache {
  /**
   * A map-like object where the key is a unique string derived from
   * the source table name and the columns (e.g. 'incentives_latest_narrow,prison,wing').
   *
   * The value contains the actual cached value, including
   * the `stichedTable` matrix and the `date`/`modified` dates.
   */
  private static cache: Record<
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
  static clear() {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(this.cache)) {
      delete this.cache[key]
    }
  }

  static async getStitchedTable<T extends Table, Row extends [string, ...(number | string)[]]>(
    analyticsService: AnalyticsService,
    tableType: TableType,
    columnsToStitch: string[]
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] }> {
    const cacheKey = [tableType, ...columnsToStitch].join(',')

    let value = await this.get<Row>(analyticsService, cacheKey)
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

  private static async get<Row extends [string, ...(number | string)[]]>(
    analyticsService: AnalyticsService,
    cacheKey: string
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] } | null> {
    // Check if there is a cached value
    if (cacheKey in this.cache) {
      // Check whether it matches modified in S3
      const tableType = cacheKey.split(',')[0] as TableType
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
