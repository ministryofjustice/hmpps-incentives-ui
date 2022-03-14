import type S3Client from '../data/s3Client'
import logger from '../../logger'

/**
 * Type returned by all analytics service functions
 */
type Report<T> = {
  columns: string[]
  report: T
  lastUpdated: Date
  dataSource: string
}

/**
 * A row in a report
 */
type BehaviourEntriesByLocation = {
  location: string
  href?: string
  entriesPositive: number
  entriesNegative: number
}

/**
 * A row in a report
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
 * A row in a report
 */
type PrisonersOnLevelsByLocation = {
  location: string
  href?: string
  prisonersOnLevels: number[]
}

/**
 * A row in a report
 */
type PrisonersOnLevelsByEthnicity = {
  ethnicity: string
  prisonersOnLevels: number[]
}

/**
 * A row in a report
 */
type PrisonersOnLevelsByAgeGroup = {
  ageGroup: string
  prisonersOnLevels: number[]
}

/**
 * Holds the Analytical Platform generic source data in columns represented by objects with row number to value maps
 */
type Table = Record<string, Record<string, string | number>>

/**
 * Source data from Analytical Platform
 */
interface CaseEntriesTable extends Table {
  prison: Record<string, string>
  wing: Record<string, string>
  positives: Record<string, number>
  negatives: Record<string, number>
}

export default class AnalyticsService {
  private readonly tableCache: Record<string, Table>

  constructor(
    private readonly client: S3Client,
    private readonly urlForLocation: (prison: string, location: string) => string
  ) {
    this.tableCache = {}
  }

  private async loadTable<T extends Table>(objectPath: string): Promise<T> {
    if (typeof this.tableCache[objectPath] === 'undefined') {
      logger.debug(`Analytics service loading table "${objectPath}"`)
      const objectString = await this.client.getObject(objectPath)
      this.tableCache[objectPath] = JSON.parse(objectString)
    }
    return this.tableCache[objectPath] as T
  }

  private stitchAndFilter<T extends Table>(
    // table as represented in Analytical Platform
    table: T,
    // columns to pluck from the table and stich into rows
    stitch: (keyof T)[],
    // column to filter on
    filterBy: keyof T,
    // value to filter by
    equalling: string | number
  ): (string | number)[][] {
    const columnToFilter: Record<string, string | number> = table[filterBy]
    const columnsToStitch: Record<string, string | number>[] = stitch.map(column => table[column])
    const rowsFiltered: string[] = Object.entries(columnToFilter)
      .filter(([, value]) => value === equalling)
      .map(([row]) => row)
    return rowsFiltered.map(row => columnsToStitch.map(column => column[row]))
  }

  private group<T>(
    // stitched and filtered rows
    rows: (string | number)[][],
    // columns to be produced by grouper
    columns: string[],
    // callback to process a row at a time
    grouper: (row: (string | number)[], groups: Record<string, T>, totals: number[]) => void
  ): [Record<string, T>, number[]] {
    const totals = Array(columns.length).fill(0)
    const groups: Record<string, T> = {}
    rows.forEach(row => grouper(row, groups, totals))
    return [groups, totals]
  }

  async getBehaviourEntriesByLocation(prison: string): Promise<Report<BehaviourEntriesByLocation[]>> {
    const table = await this.loadTable<CaseEntriesTable>('incentives_visuals/incentives_latest/2022-03-09.json')
    const ungroupedRows = this.stitchAndFilter(table, ['wing', 'positives', 'negatives'], 'prison', prison) as [
      string,
      number,
      number
    ][]
    const columns = ['Positive', 'Negative']
    const [groups, totals] = this.group<BehaviourEntriesByLocation>(
      ungroupedRows,
      columns,
      // eslint-disable-next-line no-shadow
      ([location, entriesPositive, entriesNegative]: [string, number, number], groups, totals) => {
        if (typeof groups[location] === 'undefined') {
          // eslint-disable-next-line no-param-reassign
          groups[location] = { location, href: this.urlForLocation(prison, location), entriesPositive, entriesNegative }
        } else {
          const group = groups[location]
          group.entriesPositive += entriesPositive
          group.entriesNegative += entriesNegative
        }
        // eslint-disable-next-line no-param-reassign
        totals[0] += entriesPositive
        // eslint-disable-next-line no-param-reassign
        totals[1] += entriesNegative
      }
    )
    const report: BehaviourEntriesByLocation[] = Object.values(groups).sort(locationSort)
    report.unshift({
      location: 'All',
      entriesPositive: totals[0],
      entriesNegative: totals[1],
    })

    return { columns, report, lastUpdated: new Date(), dataSource: 'NOMIS positive and negative case notes' }
  }

  async getPrisonersWithEntriesByLocation(prison: string): Promise<Report<PrisonersWithEntriesByLocation[]>> {
    const table = await this.loadTable<CaseEntriesTable>('incentives_visuals/incentives_latest/2022-03-09.json')
    const ungroupedRows = this.stitchAndFilter(table, ['wing', 'positives', 'negatives'], 'prison', prison) as [
      string,
      number,
      number
    ][]
    const columns = ['Positive', 'Negative', 'Both', 'None']
    const [groups, totals] = this.group<PrisonersWithEntriesByLocation>(
      ungroupedRows,
      columns,
      // eslint-disable-next-line no-shadow
      ([location, entriesPositive, entriesNegative]: [string, number, number], groups, totals) => {
        if (typeof groups[location] === 'undefined') {
          // eslint-disable-next-line no-param-reassign
          groups[location] = {
            location,
            href: this.urlForLocation(prison, location),
            prisonersWithPositive: 0,
            prisonersWithNegative: 0,
            prisonersWithBoth: 0,
            prisonersWithNeither: 0,
          }
        }
        const group = groups[location]
        if (entriesPositive > 0 && entriesNegative > 0) {
          // eslint-disable-next-line no-param-reassign
          totals[2] += 1
          group.prisonersWithBoth += 1
        } else if (entriesPositive > 0) {
          // eslint-disable-next-line no-param-reassign
          totals[0] += 1
          group.prisonersWithPositive += 1
        } else if (entriesNegative > 0) {
          // eslint-disable-next-line no-param-reassign
          totals[1] += 1
          group.prisonersWithNegative += 1
        } else {
          // eslint-disable-next-line no-param-reassign
          totals[3] += 1
          group.prisonersWithNeither += 1
        }
      }
    )
    const report: PrisonersWithEntriesByLocation[] = Object.values(groups).sort(locationSort)
    report.unshift({
      location: 'All',
      prisonersWithPositive: totals[0],
      prisonersWithNegative: totals[1],
      prisonersWithBoth: totals[2],
      prisonersWithNeither: totals[3],
    })

    return { columns, report, lastUpdated: new Date(), dataSource: 'NOMIS positive and negative case notes' }
  }

  async getIncentiveLevelsByLocation(prison: string): Promise<Report<PrisonersOnLevelsByLocation[]>> {
    // TODO: fake response; move into test
    const columns = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['1', 9, 35, 20, 3],
      ['2', 3, 37, 21, 0],
      ['3', 18, 31, 27, 10],
      ['4', 8, 31, 4, 1],
      ['5', 10, 2, 15, 0],
      ['6', 4, 10, 21, 0],
      ['7', 9, 17, 10, 0],
      ['H', 0, 0, 0, 0],
      ['SEG', 1, 2, 0, 0],
    ]

    const totals: number[] = Array(columns.length).fill(0)
    const prisonersOnLevels: PrisonersOnLevelsByLocation[] = response.map(row => {
      const [location, ...prisoners] = row
      for (let i = 0; i < columns.length; i += 1) {
        totals[i] += prisoners[i]
      }
      return {
        location,
        href: this.urlForLocation(prison, location),
        prisonersOnLevels: prisoners,
      }
    })
    prisonersOnLevels.unshift({
      location: 'All',
      prisonersOnLevels: totals,
    })
    return { columns, report: prisonersOnLevels, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByEthnicity(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<Report<PrisonersOnLevelsByEthnicity[]>> {
    // TODO: fake response; move into test
    const columns = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['Asian or Asian British', 3, 39, 42, 0],
      ['Black or Black British', 8, 62, 46, 2],
      ['Mixed', 2, 30, 40, 0],
      ['Other', 1, 7, 8, 0],
      ['White', 28, 615, 623, 2],
    ]

    const totals: number[] = Array(columns.length).fill(0)
    const prisonersOnLevels: PrisonersOnLevelsByEthnicity[] = response.map(row => {
      const [ethnicity, ...prisoners] = row
      for (let i = 0; i < columns.length; i += 1) {
        totals[i] += prisoners[i]
      }
      return {
        ethnicity,
        prisonersOnLevels: prisoners,
      }
    })
    prisonersOnLevels.unshift({
      ethnicity: 'All',
      prisonersOnLevels: totals,
    })
    return { columns, report: prisonersOnLevels, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByAgeGroup(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<Report<PrisonersOnLevelsByAgeGroup[]>> {
    // TODO: fake response; move into test
    const columns = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['15 - 17', 0, 0, 0, 0],
      ['18 - 25', 15, 218, 105, 0],
      ['26 - 35', 14, 285, 240, 3],
      ['36 - 45', 8, 154, 193, 0],
      ['46 - 55', 1, 79, 95, 0],
      ['56 - 65', 0, 29, 36, 0],
      ['66+', 0, 41, 9, 0],
    ]

    const totals: number[] = Array(columns.length).fill(0)
    const prisonersOnLevels: PrisonersOnLevelsByAgeGroup[] = response.map(row => {
      const [ageGroup, ...prisoners] = row
      for (let i = 0; i < columns.length; i += 1) {
        totals[i] += prisoners[i]
      }
      return {
        ageGroup,
        prisonersOnLevels: prisoners,
      }
    })
    prisonersOnLevels.unshift({
      ageGroup: 'All',
      prisonersOnLevels: totals,
    })
    return { columns, report: prisonersOnLevels, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }
}

function locationSort(a: { location: string }, b: { location: string }): number {
  if (a.location.length === 1 && b.location.length !== 1) {
    return -1
  }
  if (a.location.length !== 1 && b.location.length === 1) {
    return 1
  }
  return a.location.localeCompare(b.location)
}
