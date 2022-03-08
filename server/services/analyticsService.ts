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

export default class AnalyticsService {
  getUrlToIncentivesTable(prison: string, location: string): string {
    return `/incentive-summary/${prison}-${location}`
  }

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
        href: this.getUrlToIncentivesTable(prison, location),
        entriesPositive: positive,
        entriesNegative: negative,
      }
    })
    entries.unshift({
      location: 'All',
      entriesPositive: totalPositive,
      entriesNegative: totalNegative,
    })
    return { report: entries, lastUpdated: new Date(), dataSource: 'NOMIS' }
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
          href: this.getUrlToIncentivesTable(prison, location),
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
    return { report: prisoners, lastUpdated: new Date(), dataSource: 'NOMIS' }
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
        href: this.getUrlToIncentivesTable(prison, location),
        prisonersOnLevels: prisoners,
      }
    })
    prisonersOnLevels.unshift({
      location: 'All',
      prisonersOnLevels: totals,
    })
    return { levels, report: prisonersOnLevels, lastUpdated: new Date(), dataSource: 'NOMIS' }
  }
}
