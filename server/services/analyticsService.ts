import type S3Client from '../data/s3Client'
import logger from '../../logger'

/**
 * Generic source data from Analytical Platform
 * in columns represented by objects with row number to value maps
 */
type Table = Record<string, Record<string, number | string>>

/**
 * Source data table from Analytical Platform
 * NB: other unused columns exist
 */
interface CaseEntriesTable extends Table {
  prison: Record<string, string>
  wing: Record<string, string>
  positives: Record<string, number>
  negatives: Record<string, number>
}

/**
 * Source data table from Analytical Platform
 * NB: must always be filtered by _some_ characteristic to get by-wing aggregates
 * NB: other unused columns exist
 */
interface IncentiveLevelsTable extends Table {
  prison: Record<string, string>
  wing: Record<string, string>
  incentive: Record<string, string>
  characteristic: Record<string, string>
  charac_group: Record<string, string>
}

/**
 * Type returned by all analytics service functions
 */
type Report<T> = {
  columns: string[]
  rows: T
  lastUpdated: Date
  dataSource: string
}

/**
 * A row in a report returned
 */
type BehaviourEntriesByLocation = {
  location: string
  href?: string
  entriesPositive: number
  entriesNegative: number
}

/**
 * A row in a report returned
 */
type PrisonersWithEntriesByLocation = {
  location: string
  href?: string
  prisonersWithPositive: number
  prisonersWithNegative: number
  prisonersWithBoth: number
  prisonersWithNeither: number
}

/**
 * A row in a report returned
 */
type PrisonersOnLevelsByLocation = {
  location: string
  href?: string
  prisonersOnLevels: number[]
}

/**
 * A row in a report returned
 */
type PrisonersOnLevelsByEthnicity = {
  ethnicity: string
  prisonersOnLevels: number[]
}

/**
 * A row in a report returned
 */
type PrisonersOnLevelsByAgeGroup = {
  ageGroup: string
  prisonersOnLevels: number[]
}

export default class AnalyticsService {
  constructor(
    private readonly client: S3Client,
    private readonly urlForLocation: (prison: string, location: string) => string
  ) {}

  async findTable<T extends Table>(tableName: string): Promise<{ table: T; date: Date; modified: Date }> {
    logger.debug(`Finding latest "${tableName}" table`)
    let objects = await this.client.listObjects(`${tableName}/`)
    objects = objects.filter(object => /\/\d\d\d\d-\d\d-\d\d.json$/i.test(object.key))
    if (objects.length === 0) {
      throw new Error(`Cannot find latest "${tableName}" table`)
    }
    const { key, modified } = objects[objects.length - 1]
    const date = new Date(key.slice(key.length - 15, key.length - 5))
    const object = await this.client.getObject(key)
    const table = JSON.parse(object) as T
    logger.info(`Found latest "${tableName}" table: ${key} (modified ${modified.toISOString()})`)
    return { table, date, modified }
  }

  stitchTable<T extends Table, Row extends [string, ...(number | string)[]]>(table: T, columns: (keyof T)[]): Row[] {
    const [keyColumn] = columns
    return Object.keys(table[keyColumn]).map(rowIndex => {
      return columns.map(column => table[column][rowIndex]) as Row
    })
  }

  mapRowsAndSumTotals<RowIn extends [string, ...(number | string)[]], RowOut extends [string, ...number[]]>(
    stitchedTable: RowIn[],
    grouper: (row: RowIn) => RowOut,
    summedColumnCount: number // the number of number columns at the end of RowOut
  ): RowOut[] {
    const groups: Record<string, RowOut> = {}
    const grandTotals: number[] = Array(summedColumnCount).fill(0)
    stitchedTable.forEach(rowIn => {
      const rowOut = grouper(rowIn)
      const [groupId, ...rest] = rowOut
      const rowValues = rest as number[]
      if (typeof groups[groupId] === 'undefined') {
        groups[groupId] = rowOut
      } else {
        const group = groups[groupId]
        rowValues.forEach((value, index) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          group[index + 1] += value
        })
      }
      rowValues.forEach((value, index) => {
        grandTotals[index] += value
      })
    })
    const rows = Object.values(groups)
    rows.unshift(['All', ...grandTotals] as RowOut)
    return rows
  }

  async getBehaviourEntriesByLocation(prison: string): Promise<Report<BehaviourEntriesByLocation[]>> {
    const { table, date: lastUpdated } = await this.findTable<CaseEntriesTable>('behaviour_entries_28d')

    const columnsToStitch = ['prison', 'wing', 'positives', 'negatives']
    type StitchedRow = [string, string, number, number]
    const stitchedTable = this.stitchTable<CaseEntriesTable, StitchedRow>(table, columnsToStitch)

    const filteredTables = stitchedTable.filter(([somePrison]) => somePrison === prison)

    const columns = ['Positive', 'Negative']
    type AggregateRow = [string, number, number]
    const aggregateTable = this.mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      ([, wing, positives, negatives]) => [wing, positives, negatives],
      2
    )

    const rows: BehaviourEntriesByLocation[] = aggregateTable.map(
      ([location, entriesPositive, entriesNegative], index) => {
        const href = index === 0 ? undefined : this.urlForLocation(prison, location)
        return { location, href, entriesPositive, entriesNegative }
      }
    )
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  async getPrisonersWithEntriesByLocation(prison: string): Promise<Report<PrisonersWithEntriesByLocation[]>> {
    const { table, date: lastUpdated } = await this.findTable<CaseEntriesTable>('behaviour_entries_28d')

    const columnsToStitch = ['prison', 'wing', 'positives', 'negatives']
    type StitchedRow = [string, string, number, number]
    const stitchedTable = this.stitchTable<CaseEntriesTable, StitchedRow>(table, columnsToStitch)

    const filteredTables = stitchedTable.filter(([somePrison]) => somePrison === prison)

    const columns = ['Positive', 'Negative', 'Both', 'None']
    type AggregateRow = [string, number, number, number, number]
    const aggregateTable = this.mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      ([, wing, positives, negatives]) => {
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

    const rows: PrisonersWithEntriesByLocation[] = aggregateTable.map(
      ([location, prisonersWithPositive, prisonersWithNegative, prisonersWithBoth, prisonersWithNeither], index) => {
        const href = index === 0 ? undefined : this.urlForLocation(prison, location)
        return { location, href, prisonersWithPositive, prisonersWithNegative, prisonersWithBoth, prisonersWithNeither }
      }
    )
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS positive and negative case notes' }
  }

  async getIncentiveLevelsByLocation(prison: string): Promise<Report<PrisonersOnLevelsByLocation[]>> {
    const { table, date: lastUpdated } = await this.findTable<IncentiveLevelsTable>('incentives_latest_narrow')

    const columnsToStitch = ['prison', 'wing', 'incentive', 'characteristic', 'charac_group']
    type StitchedRow = [string, string, string, string, string]
    const stitchedTable = this.stitchTable<IncentiveLevelsTable, StitchedRow>(table, columnsToStitch)

    const filteredTables = stitchedTable.filter(
      ([somePrison, _wing, _incentive, characteristic]) => somePrison === prison && characteristic === 'age_group_10yr'
    )

    let columns = Array.from(new Set(Object.values(table.incentive)))
    columns.sort() // TODO: sort level
    type AggregateRow = [string, ...number[]]
    const aggregateTable = this.mapRowsAndSumTotals<StitchedRow, AggregateRow>(
      filteredTables,
      ([, wing, incentive]) => {
        const levels = Array(columns.length).fill(0)
        const levelIndex = columns.findIndex(someIncentive => someIncentive === incentive)
        levels[levelIndex] = 1
        return [wing, ...levels]
      },
      4
    )
    columns = columns.map(removeLevelPrefix)

    const rows: PrisonersOnLevelsByLocation[] = aggregateTable.map(([location, ...prisonersOnLevels], index) => {
      const href = index === 0 ? undefined : this.urlForLocation(prison, location)
      return { location, href, prisonersOnLevels }
    })
    rows.sort(compareLocations)
    return { columns, rows, lastUpdated, dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByEthnicity(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<Report<PrisonersOnLevelsByEthnicity[]>> {
    // TODO: fake response; move into test
    const columns = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['Asian or Asian British', 0, 40, 40, 0],
      ['Black or Black British', 4, 51, 41, 1],
      ['Mixed', 2, 30, 29, 0],
      ['Other', 2, 6, 5, 0],
      ['White', 28, 646, 595, 2],
    ]

    const totals: number[] = []
    for (let i = 0; i < columns.length; i += 1) {
      totals.push(0)
    }
    const rows: PrisonersOnLevelsByEthnicity[] = response.map(row => {
      const [ethnicity, ...prisoners] = row
      for (let i = 0; i < columns.length; i += 1) {
        totals[i] += prisoners[i]
      }
      return {
        ethnicity,
        prisonersOnLevels: prisoners,
      }
    })
    rows.unshift({
      ethnicity: 'All',
      prisonersOnLevels: totals,
    })
    return { columns, rows, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByAgeGroup(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<Report<PrisonersOnLevelsByAgeGroup[]>> {
    // TODO: fake response; move into test
    const columns = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['15 - 17', 0, 0, 0, 0],
      ['18 - 25', 15, 217, 105, 0],
      ['26 - 35', 14, 285, 240, 3],
      ['36 - 45', 8, 154, 193, 0],
      ['46 - 55', 1, 79, 95, 0],
      ['56 - 65', 0, 29, 36, 0],
      ['66+', 0, 41, 9, 0],
    ]

    const totals: number[] = []
    for (let i = 0; i < columns.length; i += 1) {
      totals.push(0)
    }
    const rows: PrisonersOnLevelsByAgeGroup[] = response.map(row => {
      const [ageGroup, ...prisoners] = row
      for (let i = 0; i < columns.length; i += 1) {
        totals[i] += prisoners[i]
      }
      return {
        ageGroup,
        prisonersOnLevels: prisoners,
      }
    })
    rows.unshift({
      ageGroup: 'All',
      prisonersOnLevels: totals,
    })
    return { columns, rows, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }
}

type LocationRow = { location: string }
export function compareLocations({ location: location1 }: LocationRow, { location: location2 }: LocationRow) {
  if (location1 === 'All') {
    return -1
  }
  if (location2 === 'All') {
    return 1
  }
  if (location1.length === 1 && location2.length !== 1) {
    return -1
  }
  if (location1.length !== 1 && location2.length === 1) {
    return 1
  }
  return location1.localeCompare(location2)
}

export function removeLevelPrefix(level: string): string {
  return /.\. (.*)/.exec(level)[1]
}
