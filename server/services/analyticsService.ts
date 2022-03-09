import type S3Client from '../data/s3Client'

type Report<T> = {
  report: T
  lastUpdated: Date
  dataSource: string
}

type BehaviourEntriesByLocation = {
  location: string
  href?: string
  entriesPositive: number
  entriesNegative: number
}

type PrisonersWithEntriesByLocation = {
  location: string
  href?: string
  prisonersWithPositive: number
  prisonersWithNegative: number
  prisonersWithBoth: number
  prisonersWithNeither: number
}

type PrisonersOnLevelsByLocation = {
  location: string
  href?: string
  prisonersOnLevels: number[]
}

type PrisonersOnLevelsByEthnicity = {
  ethnicity: string
  prisonersOnLevels: number[]
}

type PrisonersOnLevelsByAgeGroup = {
  ageGroup: string
  prisonersOnLevels: number[]
}

/**
 * Table holds the source data in columns represented by objects with row number to value maps
 */
type Table = Record<string, Record<string, string | number>>

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
      const objectString = await this.client.getObject(objectPath)
      this.tableCache[objectPath] = JSON.parse(objectString)
    }
    return this.tableCache[objectPath] as T
  }

  private stitchAndFilter<T extends Table>(
    table: T,
    stitch: (keyof T)[],
    filterBy: keyof T,
    equalling: string | number
  ): (string | number)[][] {
    const columnToFilter: Record<string, string | number> = table[filterBy]
    const columnsToStitch: Record<string, string | number>[] = stitch.map(column => table[column])
    const rowsFiltered: string[] = Object.entries(columnToFilter)
      .filter(([, value]) => value === equalling)
      .map(([row]) => row)
    return rowsFiltered.map(row => columnsToStitch.map(column => column[row]))
  }

  async getBehaviourEntriesByLocation(prison: string): Promise<Report<BehaviourEntriesByLocation[]>> {
    const table = await this.loadTable<CaseEntriesTable>('caseEntries.json')
    const ungroupedRows = this.stitchAndFilter(table, ['wing', 'positives', 'negatives'], 'prison', prison) as [
      string,
      number,
      number
    ][]

    let [totalPositive, totalNegative] = [0, 0]
    const groups: Record<string, BehaviourEntriesByLocation> = {}
    ungroupedRows.forEach(([location, entriesPositive, entriesNegative]) => {
      if (typeof groups[location] === 'undefined') {
        groups[location] = { location, href: this.urlForLocation(prison, location), entriesPositive, entriesNegative }
      } else {
        const group = groups[location]
        group.entriesPositive += entriesPositive
        group.entriesNegative += entriesNegative
      }
      totalPositive += entriesPositive
      totalNegative += entriesNegative
    })

    const report: BehaviourEntriesByLocation[] = Object.values(groups).sort(locationSort)
    report.unshift({
      location: 'All',
      entriesPositive: totalPositive,
      entriesNegative: totalNegative,
    })

    return { report, lastUpdated: new Date(), dataSource: 'NOMIS positive and negative case notes' }
  }

  async getPrisonersWithEntriesByLocation(prison: string): Promise<Report<PrisonersWithEntriesByLocation[]>> {
    const table = await this.loadTable<CaseEntriesTable>('caseEntries.json')
    const ungroupedRows = this.stitchAndFilter(table, ['wing', 'positives', 'negatives'], 'prison', prison) as [
      string,
      number,
      number
    ][]

    let [totalPositive, totalNegative, totalBoth, totalNeither] = [0, 0, 0, 0]
    const groups: Record<string, PrisonersWithEntriesByLocation> = {}
    ungroupedRows.forEach(([location, entriesPositive, entriesNegative]) => {
      if (typeof groups[location] === 'undefined') {
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
        totalBoth += 1
        group.prisonersWithBoth += 1
      } else if (entriesPositive > 0) {
        totalPositive += 1
        group.prisonersWithPositive += 1
      } else if (entriesNegative > 0) {
        totalNegative += 1
        group.prisonersWithNegative += 1
      } else {
        totalNeither += 1
        group.prisonersWithNeither += 1
      }
    })

    const report: PrisonersWithEntriesByLocation[] = Object.values(groups).sort(locationSort)
    report.unshift({
      location: 'All',
      prisonersWithPositive: totalPositive,
      prisonersWithNegative: totalNegative,
      prisonersWithBoth: totalBoth,
      prisonersWithNeither: totalNeither,
    })

    return { report, lastUpdated: new Date(), dataSource: 'NOMIS positive and negative case notes' }
  }

  async getIncentiveLevelsByLocation(
    prison: string
  ): Promise<{ levels: string[] } & Report<PrisonersOnLevelsByLocation[]>> {
    // TODO: fake response; move into test
    const levels = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
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

    const totals: number[] = []
    for (let i = 0; i < levels.length; i += 1) {
      totals.push(0)
    }
    const prisonersOnLevels: PrisonersOnLevelsByLocation[] = response.map(row => {
      const [location, ...prisoners] = row
      for (let i = 0; i < levels.length; i += 1) {
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
    return { levels, report: prisonersOnLevels, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByEthnicity(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<{ levels: string[] } & Report<PrisonersOnLevelsByEthnicity[]>> {
    // TODO: fake response; move into test
    const levels = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['Asian or Asian British', 3, 39, 42, 0],
      ['Black or Black British', 8, 62, 46, 2],
      ['Mixed', 2, 30, 40, 0],
      ['Other', 1, 7, 8, 0],
      ['White', 28, 615, 623, 2],
    ]

    const totals: number[] = []
    for (let i = 0; i < levels.length; i += 1) {
      totals.push(0)
    }
    const prisonersOnLevels: PrisonersOnLevelsByEthnicity[] = response.map(row => {
      const [ethnicity, ...prisoners] = row
      for (let i = 0; i < levels.length; i += 1) {
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
    return { levels, report: prisonersOnLevels, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }

  async getIncentiveLevelsByAgeGroup(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<{ levels: string[] } & Report<PrisonersOnLevelsByAgeGroup[]>> {
    // TODO: fake response; move into test
    const levels = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['15 - 17', 0, 0, 0, 0],
      ['18 - 25', 15, 218, 105, 0],
      ['26 - 35', 14, 285, 240, 3],
      ['36 - 45', 8, 154, 193, 0],
      ['46 - 55', 1, 79, 95, 0],
      ['56 - 65', 0, 29, 36, 0],
      ['66+', 0, 41, 9, 0],
    ]

    const totals: number[] = []
    for (let i = 0; i < levels.length; i += 1) {
      totals.push(0)
    }
    const prisonersOnLevels: PrisonersOnLevelsByAgeGroup[] = response.map(row => {
      const [ageGroup, ...prisoners] = row
      for (let i = 0; i < levels.length; i += 1) {
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
    return { levels, report: prisonersOnLevels, lastUpdated: new Date(), dataSource: 'NOMIS' }
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
