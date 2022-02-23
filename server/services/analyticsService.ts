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

export default class AnalyticsService {
  async getBehaviourEntriesByLocation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<BehaviourEntriesByLocation[]> {
    // TODO: fake response
    const response: [string, number, number][] = [
      ['1', 13, 58],
      ['2', 5, 47],
      ['3', 24, 64],
      ['4', 10, 53],
      ['5', 13, 2],
      ['6', 5, 14],
      ['7', 12, 33],
      ['SEG', 0, 8],
    ]

    let [totalPositive, totalNegative] = [0, 0]
    const entries: BehaviourEntriesByLocation[] = response.map(([location, positive, negative]) => {
      totalPositive += positive
      totalNegative += negative
      return {
        location,
        href: '#', // TODO: add link to DPS case notes
        entriesPositive: positive,
        entriesNegative: negative,
      }
    })
    entries.unshift({
      location: 'Prison total',
      entriesPositive: totalPositive,
      entriesNegative: totalNegative,
    })
    return entries
  }

  async getPrisonersWithEntriesByLocation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prison: string
  ): Promise<PrisonersWithEntriesByLocation[]> {
    // TODO: fake response
    const response: [string, number, number, number, number][] = [
      ['1', 9, 35, 2, 157],
      ['2', 3, 37, 2, 169],
      ['3', 18, 31, 2, 241],
      ['4', 8, 31, 1, 156],
      ['5', 10, 2, 0, 42],
      ['6', 4, 10, 1, 154],
      ['7', 9, 17, 1, 199],
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
          href: '#', // TODO: add link to DPS case notes
          prisonersWithPositive: positive,
          prisonersWithNegative: negative,
          prisonersWithBoth: both,
          prisonersWithNeither: neither,
        }
      }
    )
    prisoners.unshift({
      location: 'Prison total',
      prisonersWithPositive: totalPositive,
      prisonersWithNegative: totalNegative,
      prisonersWithBoth: totalBoth,
      prisonersWithNeither: totalNeither,
    })
    return prisoners
  }
}
