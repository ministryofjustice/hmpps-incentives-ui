import promClient from 'prom-client'

import config from '../config'
import logger from '../../logger'
import PrisonRegister from '../data/prisonRegister'
import type S3Client from '../data/s3Client'
import type AnalyticsView from './analyticsView'
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
  PrisonersWithEntriesByProtectedCharacteristic,
  knownGroupsFor,
  ProtectedCharacteristic,
  TableType,
  BehaviourEntriesByProtectedCharacteristic,
} from './analyticsServiceTypes'
import {
  addMissingMonths,
  compareCharacteristics,
  compareLocations,
  mapRowsAndSumTotals,
  mapRowsForMonthlyTrends,
  removeSortingPrefix,
  removeMonthsOutsideBounds,
} from './analyticsServiceUtils'
import type { StitchedTablesCache } from './stitchedTablesCache'

// Function returning the URL to a specific location (be it wing, prison or PGD Region)
//
// filterValue could be null (for national), a PGD region name or prison ID
// groupValue could be a PGD region name, a prison ID or a residential location ID
// for national, regional and prison views respectively
export type UrlForLocationFunction = (filterValue: string | null, groupValue: string) => string | null

export default class AnalyticsService {
  constructor(
    private readonly client: S3Client,
    private readonly cache: StitchedTablesCache,
    private readonly view: AnalyticsView,
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
  stitchTable<T extends Table, Row extends [...(number | string)[]]>(table: T, columns: (keyof T)[]): Row[] {
    const [keyColumn] = columns
    return Object.keys(table[keyColumn]).map(rowIndex => {
      return columns.map(column => table[column][rowIndex]) as Row
    })
  }

  /**
   * Looks up a cached stitched table or loads and caches a fresh one
   */
  async getStitchedTable<T extends Table, Row extends [...(number | string)[]]>(
    tableType: TableType,
    columnsToStitch: string[],
  ): Promise<{ date: Date; modified: Date; stitchedTable: Row[] }> {
    const cacheKey = this.cache.getCacheKey(tableType, columnsToStitch)

    let value = await this.cache.get<Row>(this, tableType, cacheKey)
    if (value) {
      checkDataStaleness(tableType, value.date)
      return value
    }

    // No cached value found or cache is stale: Get/calculate fresh value
    const { table, date, modified } = await this.findTable<T>(tableType)
    const stitchedTable = this.stitchTable<T, Row>(table, columnsToStitch)

    value = { date, modified, stitchedTable }
    await this.cache.set(cacheKey, value)

    return value
  }

  async getBehaviourEntriesByLocation(): Promise<Report<BehaviourEntriesByLocation>> {
    const { view } = this
    const { filterColumn, filterValue, groupBy } = this.view.getFiltering()

    const columnsToStitch = filterColumn
      ? [filterColumn, groupBy, 'positives', 'negatives', 'prison_name']
      : [groupBy, 'positives', 'negatives']
    type StitchedRowFiltered = [string, string, number, number, string]
    type StitchedRowNational = [string, number, number]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const sourceTable = this.getBehaviourEntriesSourceTable()
    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<CaseEntriesTable, StitchedRow>(
      sourceTable,
      columnsToStitch,
    )

    const filteredTables = stitchedTable.filter(row => {
      const [filteredColumn, groupedColumn] = filterColumn
        ? (row as StitchedRowFiltered)
        : ['', ...(row as StitchedRowNational)]

      return (
        groupedColumn &&
        // filter only selected PGD region/prison
        (view.isNational() || filteredColumn === filterValue)
      )
    })

    if (filteredTables.length === 0) {
      throw new AnalyticsError(AnalyticsErrorType.EmptyTable, 'Filtered BehaviourEntriesByLocation report has no rows')
    }

    const columns = ['Positive', 'Negative']
    type AggregateRow = [string, number, number]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_filteredColumn, groupedColumn, positives, negatives, prisonName] = view.isNational()
          ? ['', ...(row as StitchedRowNational)]
          : (row as StitchedRowFiltered)

        // Show prison names, not IDs, in regional charts
        const label = view.isRegional() ? prisonName : groupedColumn

        return [label, positives, negatives]
      },
      2,
    )

    const urlForLocation = view.getUrlFunction()
    const rows: BehaviourEntriesByLocation[] = aggregateTable.map(([label, ...values], index) => {
      const href = index === aggregateTable.length - 1 ? null : urlForLocation(filterValue, label)
      return { label, href, values }
    })
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  async getPrisonersWithEntriesByLocation(): Promise<Report<PrisonersWithEntriesByLocation>> {
    const { view } = this
    const { filterColumn, filterValue, groupBy } = view.getFiltering()

    const columnsToStitch = view.isNational()
      ? [groupBy, 'positives', 'negatives']
      : [filterColumn, groupBy, 'positives', 'negatives', 'prison_name']

    type StitchedRowFiltered = [string, string, number, number, string]
    type StitchedRowNational = [string, number, number]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const sourceTable = this.getBehaviourEntriesSourceTable()
    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<CaseEntriesTable, StitchedRow>(
      sourceTable,
      columnsToStitch,
    )

    const filteredTables = stitchedTable.filter(row => {
      const [filteredColumn, groupedColumn] = view.isNational()
        ? ['', ...(row as StitchedRowNational)]
        : (row as StitchedRowFiltered)

      return (
        groupedColumn &&
        // filter only selected PGD region/prison
        (view.isNational() || filteredColumn === filterValue)
      )
    })

    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        `Filtered PrisonersWithEntriesByLocation ('${sourceTable}') report has no rows`,
      )
    }

    const columns = ['Positive', 'Negative', 'Both', 'None']
    type AggregateRow = [string, number, number, number, number]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_filteredColumn, groupedColumn, positives, negatives, prisonName] = view.isNational()
          ? ['', ...(row as StitchedRowNational)]
          : (row as StitchedRowFiltered)

        // Show prison names, not IDs, in regional charts
        const label = view.isRegional() ? prisonName : groupedColumn

        if (positives > 0 && negatives > 0) {
          return [label, 0, 0, 1, 0]
        }
        if (positives > 0) {
          return [label, 1, 0, 0, 0]
        }
        if (negatives > 0) {
          return [label, 0, 1, 0, 0]
        }
        return [label, 0, 0, 0, 1]
      },
      4,
    )

    // Remove 'All' row calculated from current level's source table
    aggregateTable.pop()
    // Replace with 'All' row calculated from level above's source table
    const allRow = await this.getBehaviourEntriesHeatmapAllRow()
    aggregateTable.push(allRow)

    const urlForLocation = view.getUrlFunction()
    const rows: PrisonersWithEntriesByLocation[] = aggregateTable.map(([label, ...values], index) => {
      const href = index === aggregateTable.length - 1 ? null : urlForLocation(filterValue, label)
      return { label, href, values }
    })
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  private async getBehaviourEntriesHeatmapAllRow(): Promise<[string, number, number, number, number]> {
    const { view } = this
    const { filterColumn, filterValue } = view.getFiltering()

    const columnsToStitch = view.isNational() ? ['positives', 'negatives'] : [filterColumn, 'positives', 'negatives']

    type StitchedRowFiltered = [string, number, number]
    type StitchedRowNational = [number, number]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const sourceTable = this.getBehaviourEntriesSourceTable(true)
    const { stitchedTable } = await this.getStitchedTable<CaseEntriesTable, StitchedRow>(sourceTable, columnsToStitch)

    let filteredTables = stitchedTable
    if (!view.isNational()) {
      filteredTables = filteredTables.filter(row => {
        const [filteredColumn] = row as StitchedRowFiltered

        return filteredColumn === filterValue
      })
    }

    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        `Filtered data for getBehaviourEntriesHeatmapAllRow ('${sourceTable}') has no rows`,
      )
    }

    // In this context doesn't matter, we sum everything up
    const groupLabel = 'All'
    type AggregateRow = [string, number, number, number, number]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_filteredColumn, positives, negatives] = view.isNational()
          ? ['', ...(row as StitchedRowNational)]
          : (row as StitchedRowFiltered)

        if (positives > 0 && negatives > 0) {
          return [groupLabel, 0, 0, 1, 0]
        }
        if (positives > 0) {
          return [groupLabel, 1, 0, 0, 0]
        }
        if (negatives > 0) {
          return [groupLabel, 0, 1, 0, 0]
        }
        return [groupLabel, 0, 0, 0, 1]
      },
      4,
    )

    return aggregateTable.pop()
  }

  async getIncentiveLevelsByLocation(): Promise<Report<PrisonersOnLevelsByLocation>> {
    const { view } = this
    const { filterColumn, filterValue, groupBy } = view.getFiltering()
    const columnsToStitch = view.isNational()
      ? [groupBy, 'incentive', 'characteristic', 'charac_group']
      : [filterColumn, groupBy, 'incentive', 'characteristic', 'charac_group', 'prison_name']
    type StitchedRow = [string, string, string, string, string?, string?]

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<IncentiveLevelsTable, StitchedRow>(
      TableType.incentiveLevels,
      columnsToStitch,
    )

    const columnSet: Set<string> = new Set()
    const filteredTables = stitchedTable.filter(row => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [filteredColumn, _groupedColumn, incentive, characteristic] = view.isNational() ? ['', ...row] : row

      const include =
        // if not national filter only selected PGD region or prison
        (view.isNational() || filteredColumn === filterValue) &&
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
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const [_filteredColumn, groupedColumn, incentive, _characteristic, _characGroup, prisonName] =
          view.isNational() ? ['', ...row] : row

        const levels = Array(columns.length).fill(0)
        const levelIndex = columns.findIndex(someIncentive => someIncentive === incentive)
        levels[levelIndex] = 1

        // Show prison names, not IDs, in regional charts
        const label = view.isRegional() ? prisonName : groupedColumn
        return [label, ...levels]
      },
      columns.length,
    )
    columns = columns.map(removeSortingPrefix)

    const urlForLocation = view.getUrlFunction()
    const rows: PrisonersOnLevelsByLocation[] = aggregateTable.map(([label, ...values], index) => {
      const href = index === aggregateTable.length - 1 ? null : urlForLocation(filterValue, label)
      return { label, href, values }
    })
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByProtectedCharacteristic(
    protectedCharacteristic: ProtectedCharacteristic,
  ): Promise<Report<PrisonersOnLevelsByProtectedCharacteristic>> {
    const { view } = this
    const { filterColumn, filterValue, groupBy } = view.getFiltering()
    const columnsToStitch = view.isNational()
      ? [groupBy, 'incentive', 'characteristic', 'charac_group']
      : [filterColumn, groupBy, 'incentive', 'characteristic', 'charac_group']
    type StitchedRow = [string, string, string, string, string?]

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<IncentiveLevelsTable, StitchedRow>(
      TableType.incentiveLevels,
      columnsToStitch,
    )

    const columnSet: Set<string> = new Set()
    const filteredTables = stitchedTable.filter(row => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [filteredColumn, _groupedColumn, incentive, characteristic, characteristicGroup] = view.isNational()
        ? ['', ...row]
        : row

      // TODO: null characteristicGroup is excluded; convert to 'Unknown'?
      const include =
        // if not national filter only selected PGD region or prison
        (view.isNational() || filteredColumn === filterValue) &&
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
    })
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        `Filtered PrisonersOnLevelsByProtectedCharacteristic report for ${protectedCharacteristic} has no rows`,
      )
    }

    let columns = Array.from(columnSet)
    columns.sort() // NB: levels sort naturally because they include a prefix

    type AggregateRow = [string, ...number[]]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const [_filteredColumn, _groupedColumn, incentive, _characteristic, characteristicGroup] =
          view.isNational() ? ['', ...row] : row

        const levels = Array(columns.length).fill(0)
        const levelIndex = columns.findIndex(someIncentive => someIncentive === incentive)
        levels[levelIndex] = 1
        return [characteristicGroup.trim(), ...levels]
      },
      columns.length,
    )
    columns = columns.map(removeSortingPrefix)

    const rows: PrisonersOnLevelsByProtectedCharacteristic[] = aggregateTable.map(([characteristic, ...values]) => {
      return { label: characteristic, values }
    })
    const missingCharacteristics = new Set(knownGroupsFor(protectedCharacteristic))
    // Don't show empty young people ('15-17') group in non-YCS prisons
    if (
      view.isPrisonLevel() &&
      protectedCharacteristic === ProtectedCharacteristic.Age &&
      !PrisonRegister.isYouthCustodyService(filterValue)
    ) {
      missingCharacteristics.delete(AgeYoungPeople)
    }
    rows.forEach(({ label: characteristic }) => missingCharacteristics.delete(characteristic))
    missingCharacteristics.forEach(characteristic => {
      rows.push({ label: characteristic, values: Array(columns.length).fill(0) })
    })
    rows.sort(compareCharacteristics)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS' }
  }

  async getPrisonersWithEntriesByProtectedCharacteristic(
    protectedCharacteristic: ProtectedCharacteristic,
  ): Promise<Report<PrisonersWithEntriesByProtectedCharacteristic>> {
    const { view } = this
    const { filterColumn, filterValue } = view.getFiltering()
    const columnsToStitch = filterColumn
      ? [filterColumn, 'behaviour_profile', 'characteristic', 'charac_group']
      : ['behaviour_profile', 'characteristic', 'charac_group']
    type StitchedRow = [string, string, string, string?]

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<IncentiveLevelsTable, StitchedRow>(
      TableType.incentiveLevels,
      columnsToStitch,
    )

    const filteredTables = stitchedTable.filter(row => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [filteredColumn, _behaviourProfile, characteristic, characteristicGroup] = view.isNational()
        ? ['', ...row]
        : row

      // TODO: null characteristicGroup is excluded; convert to 'Unknown'?
      return (
        // if not national filter only selected PGD region or prison
        (view.isNational() || filteredColumn === filterValue) &&
        // filter by selected characteristic
        characteristic === protectedCharacteristic &&
        // it's possible for characteristic to be null
        characteristicGroup
      )
    })
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        `Filtered PrisonersWithEntriesByProtectedCharacteristic report for ${protectedCharacteristic} has no rows`,
      )
    }

    const columns = ['Positive', 'Negative', 'Both', 'None']
    type AggregateRow = [string, ...number[]]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
        let [_filteredColumn, behaviourProfile, _characteristic, characteristicGroup] = view.isNational()
          ? ['', ...row]
          : row

        behaviourProfile = removeSortingPrefix(behaviourProfile)
        const behaviourProfiles = Array(columns.length).fill(0)
        const behaviourProfileIndex = columns.findIndex(
          someBehaviourProfile => someBehaviourProfile === behaviourProfile,
        )
        behaviourProfiles[behaviourProfileIndex] = 1
        return [characteristicGroup.trim(), ...behaviourProfiles]
      },
      columns.length,
    )

    const rows: PrisonersWithEntriesByProtectedCharacteristic[] = aggregateTable.map(([characteristic, ...values]) => {
      return { label: characteristic, values }
    })
    const missingCharacteristics = new Set(knownGroupsFor(protectedCharacteristic))
    // Don't show empty young people ('15-17') group in non-YCS prisons
    if (
      view.isPrisonLevel() &&
      protectedCharacteristic === ProtectedCharacteristic.Age &&
      !PrisonRegister.isYouthCustodyService(filterValue)
    ) {
      missingCharacteristics.delete(AgeYoungPeople)
    }
    rows.forEach(({ label: characteristic }) => missingCharacteristics.delete(characteristic))
    missingCharacteristics.forEach(characteristic => {
      rows.push({ label: characteristic, values: Array(columns.length).fill(0) })
    })
    rows.sort(compareCharacteristics)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  async getBehaviourEntryTrends(): Promise<TrendsReport> {
    const { view } = this
    const { filterColumn, filterValue } = view.getFiltering()
    const columnsToStitch = view.isNational()
      ? ['year_month_str', 'snapshots', 'offenders', 'positives', 'negatives']
      : [filterColumn, 'year_month_str', 'snapshots', 'offenders', 'positives', 'negatives']
    type StitchedRowFiltered = [string, string, number, number, number, number]
    type StitchedRowNational = [string, number, number, number, number]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<TrendsTable, StitchedRow>(
      TableType.trends,
      columnsToStitch,
    )

    let filteredTables = stitchedTable
    // filter only selected PGD region/prison
    if (!view.isNational()) {
      filteredTables = filteredTables.filter(([filteredColumn]) => filteredColumn === filterValue)
    }
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        'Filtered trends report for behaviour entries has no rows',
      )
    }

    const columns = ['Positive', 'Negative']
    let rows = mapRowsForMonthlyTrends<StitchedRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_filteredColumn, yearAndMonth, snapshots, offenders, positives, negatives] = view.isNational()
          ? ['', ...(row as StitchedRowNational)]
          : (row as StitchedRowFiltered)

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
      2,
    )
    addMissingMonths(lastUpdated, rows, 2)
    rows = removeMonthsOutsideBounds(lastUpdated, rows)

    return {
      columns,
      rows,
      lastUpdated,
      dataSource: 'NOMIS positive and negative case notes',
      plotPercentage: false,
      populationIsTotal: false,
      verticalAxisTitle: 'Entries',
      monthlyTotalName: 'All entries',
    }
  }

  async getIncentiveLevelTrends(): Promise<TrendsReport> {
    const { view } = this
    const { filterColumn, filterValue } = view.getFiltering()
    const columnsToStitch = view.isNational()
      ? ['year_month_str', 'snapshots', 'offenders', 'incentive']
      : [filterColumn, 'year_month_str', 'snapshots', 'offenders', 'incentive']
    type StitchedRowNational = [string, number, number, string]
    type StitchedRowFiltered = [string, string, number, number, string]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<TrendsTable, StitchedRow>(
      TableType.trends,
      columnsToStitch,
    )

    const columnSet: Set<string> = new Set()
    const filteredTables = stitchedTable.filter(row => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [filteredColumn, _yearAndMonth, _snapshots, _offenders, incentive] = view.isNational()
        ? ['', ...(row as StitchedRowNational)]
        : (row as StitchedRowFiltered)

      const include =
        // if not national filter only selected PGD region or prison
        (view.isNational() || filteredColumn === filterValue) &&
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
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_filteredColumn, yearAndMonth, snapshots, offenders, incentive] = view.isNational()
          ? ['', ...(row as StitchedRowNational)]
          : (row as StitchedRowFiltered)

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
      columns.length,
    )
    addMissingMonths(lastUpdated, rows, columns.length)
    rows = removeMonthsOutsideBounds(lastUpdated, rows)
    columns = columns.map(removeSortingPrefix)

    return {
      columns,
      rows,
      lastUpdated,
      dataSource: 'NOMIS',
      plotPercentage: true,
      populationIsTotal: true,
    }
  }

  async getIncentiveLevelTrendsByCharacteristic(
    protectedCharacteristic: ProtectedCharacteristic,
    characteristicGroup: string,
  ): Promise<TrendsReport> {
    const { view } = this
    const { filterColumn, filterValue } = view.getFiltering()
    const columnsToStitch = view.isNational()
      ? ['year_month_str', 'snapshots', 'offenders', 'incentive', protectedCharacteristic]
      : [filterColumn, 'year_month_str', 'snapshots', 'offenders', 'incentive', protectedCharacteristic]

    type StitchedRowNational = [string, number, number, string, string]
    type StitchedRowFiltered = [string, string, number, number, string, string]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<TrendsTable, StitchedRow>(
      TableType.trends,
      columnsToStitch,
    )

    const columnSet: Set<string> = new Set()
    const filteredTables = stitchedTable.filter(row => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [filteredColumn, _yearAndMonth, _snapshots, _offenders, incentive, someCharacteristicGroup] =
        view.isNational() ? ['', ...(row as StitchedRowNational)] : (row as StitchedRowFiltered)

      const include =
        // it's possible for incentive level to be null
        incentive &&
        // it's possible for characteristic group to be null
        someCharacteristicGroup &&
        // if not national filter only selected PGD region or prison
        (view.isNational() || filteredColumn === filterValue) &&
        someCharacteristicGroup.trim() === characteristicGroup
      if (include) {
        columnSet.add(incentive)
      }
      return include
    })
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        'Filtered PC trends report for incentive levels has no rows',
      )
    }

    let columns = Array.from(columnSet)
    columns.sort() // NB: levels sort naturally because they include a prefix

    let rows = mapRowsForMonthlyTrends<StitchedRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const [_filteredColumn, yearAndMonth, snapshots, offenders, incentive, _someCharacteristic] =
          view.isNational() ? ['', ...(row as StitchedRowNational)] : (row as StitchedRowFiltered)

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
      columns.length,
    )
    addMissingMonths(lastUpdated, rows, columns.length)
    rows = removeMonthsOutsideBounds(lastUpdated, rows)
    columns = columns.map(removeSortingPrefix)

    return {
      columns,
      rows,
      lastUpdated,
      dataSource: 'NOMIS',
      plotPercentage: true,
      populationIsTotal: false,
      monthlyTotalName: `Total ${characteristicGroup} population`,
    }
  }

  async getBehaviourEntriesByProtectedCharacteristic(
    protectedCharacteristic: ProtectedCharacteristic,
  ): Promise<Report<BehaviourEntriesByProtectedCharacteristic>> {
    const { view } = this
    const { filterColumn, filterValue } = view.getFiltering()
    const columnsToStitch = view.isNational()
      ? ['characteristic', 'charac_group', 'positives', 'negatives']
      : [filterColumn, 'characteristic', 'charac_group', 'positives', 'negatives']
    type StitchedRowFiltered = [string, string, string, number, number]
    type StitchedRowNational = [string, string, number, number]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<IncentiveLevelsTable, StitchedRow>(
      TableType.incentiveLevels,
      columnsToStitch,
    )

    const filteredTables = stitchedTable.filter(row => {
      const [filteredColumn, characteristic, characteristicGroup] = view.isNational()
        ? ['', ...(row as StitchedRowNational)]
        : (row as StitchedRowFiltered)

      return (
        // if not national filter only selected PGD region or prison
        (view.isNational() || filteredColumn === filterValue) &&
        // filter by selected characteristic
        characteristic === protectedCharacteristic &&
        // it's possible for characteristic to be null
        characteristicGroup
      )
    })
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        'Filtered BehaviourEntriesByProtectedCharacteristic report has no rows',
      )
    }

    const columns = ['Positive', 'Negative']
    type AggregateRow = [string, number, number]
    const aggregateTable = mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_filteredColumn, _characteristic, characteristicGroup, positives, negatives] = view.isNational()
          ? ['', ...(row as StitchedRowNational)]
          : (row as StitchedRowFiltered)

        return [characteristicGroup.trim(), positives, negatives]
      },
      2,
    )

    const rows: BehaviourEntriesByProtectedCharacteristic[] = aggregateTable.map(([characteristic, ...values]) => {
      return { label: characteristic, values }
    })
    const missingCharacteristics = new Set(knownGroupsFor(protectedCharacteristic))
    // Don't show empty young people ('15-17') group in non-YCS prisons
    if (
      view.isPrisonLevel() &&
      protectedCharacteristic === ProtectedCharacteristic.Age &&
      !PrisonRegister.isYouthCustodyService(filterValue)
    ) {
      missingCharacteristics.delete(AgeYoungPeople)
    }
    rows.forEach(({ label: characteristic }) => missingCharacteristics.delete(characteristic))
    missingCharacteristics.forEach(characteristic => {
      rows.push({ label: characteristic, values: [0, 0] })
    })
    rows.sort(compareCharacteristics)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  async getBehaviourEntryTrendsByProtectedCharacteristic(
    protectedCharacteristic: ProtectedCharacteristic,
    characteristicGroup: string,
  ): Promise<TrendsReport> {
    const { view } = this
    const { filterColumn, filterValue } = view.getFiltering()

    const columnsToStitch = view.isNational()
      ? ['year_month_str', 'snapshots', 'offenders', 'positives', 'negatives', protectedCharacteristic]
      : [filterColumn, 'year_month_str', 'snapshots', 'offenders', 'positives', 'negatives', protectedCharacteristic]
    type StitchedRowFiltered = [string, string, number, number, number, number, string]
    type StitchedRowNational = [string, number, number, number, number, string]
    type StitchedRow = StitchedRowFiltered | StitchedRowNational

    const { stitchedTable, date: lastUpdated } = await this.getStitchedTable<TrendsTable, StitchedRow>(
      TableType.trends,
      columnsToStitch,
    )

    const filteredTables = stitchedTable.filter(row => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [filteredColumn, _yearAndMonth, _snapshots, _offenders, _positives, _negatives, someCharacteristicGroup] =
        view.isNational() ? ['', ...(row as StitchedRowNational)] : (row as StitchedRowFiltered)

      return (
        // it's possible for characteristic group to be null
        someCharacteristicGroup &&
        // if not national filter only selected PGD region or prison
        (view.isNational() || filteredColumn === filterValue) &&
        someCharacteristicGroup.trim() === characteristicGroup
      )
    })
    if (filteredTables.length === 0) {
      throw new AnalyticsError(
        AnalyticsErrorType.EmptyTable,
        'Filtered PC trends report for behaviour entries has no rows',
      )
    }

    const columns = ['Positive', 'Negative']
    let rows = mapRowsForMonthlyTrends<StitchedRow>(
      filteredTables,
      row => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_filteredColumn, yearAndMonth, snapshots, offenders, positives, negatives, _someCharacteristic] =
          view.isNational() ? ['', ...(row as StitchedRowNational)] : (row as StitchedRowFiltered)

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
      2,
    )
    addMissingMonths(lastUpdated, rows, 2)
    rows = removeMonthsOutsideBounds(lastUpdated, rows)

    return {
      columns,
      rows,
      lastUpdated,
      dataSource: 'NOMIS positive and negative case notes',
      plotPercentage: false,
      populationIsTotal: false,
      verticalAxisTitle: 'Entries',
      monthlyTotalName: `All ${characteristicGroup} entries`,
      populationTotalName: `Total ${characteristicGroup} population`,
    }
  }

  private getBehaviourEntriesSourceTable(forAllRow = false): TableType {
    const { view } = this

    if (view.isNational()) {
      return forAllRow ? TableType.behaviourEntriesNationalAll : TableType.behaviourEntriesNational
    }
    if (view.isRegional()) {
      return forAllRow ? TableType.behaviourEntriesNational : TableType.behaviourEntriesRegional
    }
    if (view.isPrisonLevel()) {
      return forAllRow ? TableType.behaviourEntriesRegional : TableType.behaviourEntriesPrison
    }

    throw new Error('Unexpected filterColumn param')
  }
}

const staleDataGauge = new promClient.Gauge({
  name: 'incentives_stale_analytics_data',
  help: '1 = source table is outdated',
  labelNames: ['table_type'],
})

/**
 * Sets a prometheus flag when a table is considered stale,
 * i.e. more than `config.analyticsDataStaleAferDays` days old
 */
function checkDataStaleness(tableType: TableType, date: Date): void {
  if (config.analyticsDataStaleAferDays > 0) {
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - config.analyticsDataStaleAferDays)
    if (date < staleDate) {
      logger.warn(`${tableType} data is stale`)
      staleDataGauge.set({ table_type: tableType }, 1)
    } else {
      staleDataGauge.set({ table_type: tableType }, 0)
    }
  }
}
