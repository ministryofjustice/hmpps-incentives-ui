import S3Client from '../data/s3Client'
import AnalyticsService from './analyticsService'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  const s3Client = new S3Client({ bucket: 'incentives' }) as jest.Mocked<S3Client>

  beforeEach(() => {
    jest.resetAllMocks()
    analyticsService = new AnalyticsService(s3Client, () => '')
  })

  describe('findTable()', () => {
    it('returns a table when there is only one candidate', async () => {
      const modified = new Date('2022-03-14T12:00:00Z')
      s3Client.listObjects.mockResolvedValue([{ key: 'behaviour_entries/2022-03-13.json', modified }])
      s3Client.getObject.mockResolvedValue('{"column":{"1":1,"2":2}}')

      await expect(analyticsService.findTable('behaviour_entries')).resolves.toEqual({
        table: { column: { '1': 1, '2': 2 } },
        date: new Date(2022, 2, 13),
        modified,
      })
      expect(s3Client.getObject).toBeCalledWith('behaviour_entries/2022-03-13.json')
    })

    it('returns latest table when there are several available', async () => {
      const modified = new Date('2022-03-14T12:00:00Z')
      s3Client.listObjects.mockResolvedValue([
        // older matching key is ignored
        { key: 'behaviour_entries/2022-03-12.json', modified: new Date('2022-03-13T01:00:00Z') },
        // the key that should be selected
        { key: 'behaviour_entries/2022-03-13.json', modified },
        // newer key that does not match
        { key: 'behaviour_entries/2022-03-14.csv', modified: new Date('2022-03-15T02:00:00Z') },
        // newer key that does not match
        { key: 'behaviour_entries/2022-March-14.json', modified: new Date('2022-03-15T02:00:00Z') },
      ])
      s3Client.getObject.mockResolvedValue('{"column":{"1":1,"2":2}}')

      await expect(analyticsService.findTable('behaviour_entries')).resolves.toEqual({
        table: { column: { '1': 1, '2': 2 } },
        date: new Date(2022, 2, 13),
        modified,
      })
      expect(s3Client.getObject).toBeCalledWith('behaviour_entries/2022-03-13.json')
    })

    it('throws an error when it cannot find a table', async () => {
      s3Client.listObjects.mockResolvedValue([])

      await expect(analyticsService.findTable('behaviour_entries')).rejects.toThrow()
    })

    it('throws an error when object contents cannot be parsed', async () => {
      const modified = new Date('2022-03-14T12:00:00Z')
      s3Client.listObjects.mockResolvedValue([{ key: 'behaviour_entries/2022-03-13.json', modified }])
      s3Client.getObject.mockResolvedValue('{"column":')

      await expect(analyticsService.findTable('behaviour_entries')).rejects.toThrow()
    })
  })

  describe('getBehaviourEntriesByLocation()', () => {
    // TODO: move fake data from service into mock here

    it('has a totals row', async () => {
      const { rows: entries } = await analyticsService.getBehaviourEntriesByLocation('MDI')
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
    // TODO: move fake data from service into mock here

    it('has a totals row', async () => {
      const { rows: prisoners } = await analyticsService.getPrisonersWithEntriesByLocation('MDI')
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
    // TODO: move fake data from service into mock here

    it('has a totals row', async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation('MDI')
      expect(prisonersOnLevels).toHaveLength(9)

      const prisonTotal = prisonersOnLevels.shift()
      expect(prisonTotal.location).toEqual('All')
      expect(prisonTotal.href).toBeUndefined()

      const totals = [0, 0, 0, 0]
      prisonersOnLevels.forEach(({ prisonersOnLevels: prisoners }) => {
        for (let i = 0; i < columns.length; i += 1) {
          totals[i] += prisoners[i]
        }
      })
      for (let i = 0; i < columns.length; i += 1) {
        expect(prisonTotal.prisonersOnLevels[i]).toEqual(totals[i])
      }
    })
  })

  // TODO: test getIncentiveLevelsByEthnicity and getIncentiveLevelsByAgeGroup once service uses test data
})
