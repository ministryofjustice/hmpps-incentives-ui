import AnalyticsService from './analyticsService'

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  beforeEach(() => {
    analyticsService = new AnalyticsService()
    // TODO: move fake data from service into mock here
  })

  describe('getBehaviourEntriesByLocation()', () => {
    it('has a totals row', async () => {
      const { report: entries } = await analyticsService.getBehaviourEntriesByLocation('MDI')
      expect(entries).toHaveLength(10)

      const prisonTotal = entries.shift()
      expect(prisonTotal.location).toEqual('All')
      expect(prisonTotal.href).toBeUndefined()

      let [sumPositive, sumNegative] = [0, 0]
      entries.forEach(({ entriesPositive, entriesNegative }) => {
        sumPositive += entriesPositive
        sumNegative += entriesNegative
      })
      expect(prisonTotal.entriesPositive).toEqual(sumPositive)
      expect(prisonTotal.entriesNegative).toEqual(sumNegative)
    })
  })

  describe('getPrisonersWithEntriesByLocation()', () => {
    it('has a totals row', async () => {
      const { report: prisoners } = await analyticsService.getPrisonersWithEntriesByLocation('MDI')
      expect(prisoners).toHaveLength(10)

      const prisonTotal = prisoners.shift()
      expect(prisonTotal.location).toEqual('All')
      expect(prisonTotal.href).toBeUndefined()

      let [sumPositive, sumNegative, sumBoth, sumNeither] = [0, 0, 0, 0]
      prisoners.forEach(({ prisonersWithPositive, prisonersWithNegative, prisonersWithBoth, prisonersWithNeither }) => {
        sumPositive += prisonersWithPositive
        sumNegative += prisonersWithNegative
        sumBoth += prisonersWithBoth
        sumNeither += prisonersWithNeither
      })
      expect(prisonTotal.prisonersWithPositive).toEqual(sumPositive)
      expect(prisonTotal.prisonersWithNegative).toEqual(sumNegative)
      expect(prisonTotal.prisonersWithBoth).toEqual(sumBoth)
      expect(prisonTotal.prisonersWithNeither).toEqual(sumNeither)
    })
  })

  describe('getIncentiveLevelsByLocation()', () => {
    it('has a totals row', async () => {
      const { levels, report: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation('MDI')
      expect(prisonersOnLevels).toHaveLength(10)

      const prisonTotal = prisonersOnLevels.shift()
      expect(prisonTotal.location).toEqual('All')
      expect(prisonTotal.href).toBeUndefined()

      const totals = [0, 0, 0, 0]
      prisonersOnLevels.forEach(({ prisonersOnLevels: prisoners }) => {
        for (let i = 0; i < levels.length; i += 1) {
          totals[i] += prisoners[i]
        }
      })
      for (let i = 0; i < levels.length; i += 1) {
        expect(prisonTotal.prisonersOnLevels[i]).toEqual(totals[i])
      }
    })
  })
})
