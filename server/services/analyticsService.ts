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

export default class AnalyticsService {
  constructor(private readonly urlForLocation: (prison: string, location: string) => string) {}

  async getBehaviourEntriesByLocation(prison: string): Promise<Report<BehaviourEntriesByLocation[]>> {
    // TODO: fake response; move into test
    const response: [string, number, number][] = [
      ['1', 13, 58],
      ['2', 5, 47],
      ['3', 24, 64],
      ['4', 10, 53],
      ['5', 13, 2],
      ['6', 5, 14],
      ['7', 12, 33],
      ['H', 0, 0],
      ['SEG', 0, 8],
    ]

    let [totalPositive, totalNegative] = [0, 0]
    const entries: BehaviourEntriesByLocation[] = response.map(([location, positive, negative]) => {
      totalPositive += positive
      totalNegative += negative
      return {
        location,
        href: this.urlForLocation(prison, location),
        entriesPositive: positive,
        entriesNegative: negative,
      }
    })
    entries.unshift({
      location: 'All',
      entriesPositive: totalPositive,
      entriesNegative: totalNegative,
    })
    return { report: entries, lastUpdated: new Date(), dataSource: 'NOMIS positive and negative case notes' }
  }

  async getPrisonersWithEntriesByLocation(prison: string): Promise<Report<PrisonersWithEntriesByLocation[]>> {
    // TODO: fake response; move into test
    const response: [string, number, number, number, number][] = [
      ['1', 9, 35, 2, 157],
      ['2', 3, 37, 2, 169],
      ['3', 18, 31, 2, 241],
      ['4', 8, 31, 1, 156],
      ['5', 10, 2, 0, 42],
      ['6', 4, 10, 1, 154],
      ['7', 9, 17, 1, 199],
      ['H', 0, 0, 0, 0],
      ['SEG', 0, 3, 0, 25],
    ]

    let [totalPositive, totalNegative, totalBoth, totalNeither] = [0, 0, 0, 0]
    const prisoners: PrisonersWithEntriesByLocation[] = response.map(
      ([location, positive, negative, both, neither]) => {
        totalPositive += positive
        totalNegative += negative
        totalBoth += both
        totalNeither += neither
        return {
          location,
          href: this.urlForLocation(prison, location),
          prisonersWithPositive: positive,
          prisonersWithNegative: negative,
          prisonersWithBoth: both,
          prisonersWithNeither: neither,
        }
      }
    )
    prisoners.unshift({
      location: 'All',
      prisonersWithPositive: totalPositive,
      prisonersWithNegative: totalNegative,
      prisonersWithBoth: totalBoth,
      prisonersWithNeither: totalNeither,
    })
    return { report: prisoners, lastUpdated: new Date(), dataSource: 'NOMIS positive and negative case notes' }
  }

  async getIncentiveLevelsByLocation(
    prison: string
  ): Promise<{ levels: string[] } & Report<PrisonersOnLevelsByLocation[]>> {
    // TODO: fake response; move into test
    const levels = ['Basic', 'Standard', 'Enhanced', 'Enhanced 2']
    const response: [string, number, number, number, number][] = [
      ['A', 11, 221, 90, 2],
      ['B', 13, 242, 105, 1],
      ['C', 7, 28, 25, 0],
      ['D', 3, 41, 46, 0],
      ['E', 2, 8, 2, 0],
      ['H', 0, 10, 4, 0],
      ['T', 2, 110, 281, 1],
      ['X', 0, 111, 161, 0],
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
      ['Asian or Asian British', 0, 40, 40, 0],
      ['Black or Black British', 4, 51, 41, 1],
      ['Mixed', 2, 30, 29, 0],
      ['Other', 2, 6, 5, 0],
      ['White', 28, 646, 595, 2],
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
      ['18 - 25', 15, 217, 105, 0],
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
