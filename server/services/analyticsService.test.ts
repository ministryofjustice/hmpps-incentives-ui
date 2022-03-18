import S3Client from '../data/s3Client'
import AnalyticsService from './analyticsService'
import { mockAppS3ClientResponse } from '../testData/s3Bucket'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  const s3Client = new S3Client({ region: 'eu-west-1', bucket: 'incentives' }) as jest.Mocked<S3Client>

  beforeEach(() => {
    jest.resetAllMocks()
    analyticsService = new AnalyticsService(s3Client, () => '')
  })

  const prisonLocations = [
    ['MDI', ['All', '1', '2', '3', '4', '5', '6', '7', 'H', 'SEG']],
    ['BWI', ['All', 'B', 'C', 'F', 'H', 'M', 'O', 'P', 'R', 'V']],
  ]
  const prisonLevels = [
    ['MDI', ['Basic', 'Standard', 'Enhanced']],
    ['BWI', ['Basic', 'Standard', 'Enhanced']],
  ]

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

  describe('table manipulation', () => {
    type Table = {
      ignoredColumn: Record<string, string>
      category: Record<string, string>
      valA: Record<string, number>
      valB: Record<string, number>
    }
    type StitchedRow = [string, number, number]
    type MappedRow = [string, number]

    const sampleInputTable: Table = {
      ignoredColumn: { '1': 'a', '2': 'b', '3': 'c', '4': 'd' },
      category: { '1': 'A', '2': 'B', '3': 'C', '4': 'B' },
      valA: { '1': 1, '2': 2, '3': 3, '4': 4 },
      valB: { '1': 5, '2': 6, '3': 7, '4': 8 },
    }
    const columnsToPluck: (keyof Table)[] = ['category', 'valA', 'valB']

    it('stitchTable() stitches a column-based source table into rows', () => {
      const stitchedTable = analyticsService.stitchTable<Table, StitchedRow>(sampleInputTable, columnsToPluck)
      expect(stitchedTable).toEqual<StitchedRow[]>([
        ['A', 1, 5],
        ['B', 2, 6],
        ['C', 3, 7],
        ['B', 4, 8],
      ])
    })

    it('mapRowsAndSumTotals() maps rows of a stitched table and sums them into a grand total', () => {
      const stitchedTable = analyticsService.stitchTable<Table, StitchedRow>(sampleInputTable, columnsToPluck)
      const output = analyticsService.mapRowsAndSumTotals<StitchedRow, MappedRow>(
        stitchedTable,
        ([category, valA, valB]) => [category, valA + valB],
        1
      )
      expect(output).toEqual<MappedRow[]>([
        ['All', 36],
        ['A', 6],
        ['B', 20],
        ['C', 10],
      ])
    })
  })

  describe('getBehaviourEntriesByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client, 'behaviour_entries_28d')
    })

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

    describe.each(prisonLocations)(
      'lists locations in the correct order',
      (prison: string, expectedLocations: string[]) => {
        it(`for ${prison}`, async () => {
          const { rows } = await analyticsService.getBehaviourEntriesByLocation(prison)
          const locations = rows.map(row => row.location)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )
  })

  describe('getPrisonersWithEntriesByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client, 'behaviour_entries_28d')
    })

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

    describe.each(prisonLocations)(
      'lists locations in the correct order',
      (prison: string, expectedLocations: string[]) => {
        it(`for ${prison}`, async () => {
          const { rows } = await analyticsService.getPrisonersWithEntriesByLocation(prison)
          const locations = rows.map(row => row.location)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )
  })

  describe('getIncentiveLevelsByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client, 'incentives_latest_narrow')
    })

    it('has a totals row', async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation('MDI')
      expect(prisonersOnLevels).toHaveLength(11)

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

    describe.each(prisonLocations)(
      'lists locations in the correct order',
      (prison: string, expectedLocations: string[]) => {
        it(`for ${prison}`, async () => {
          const { rows } = await analyticsService.getIncentiveLevelsByLocation(prison)
          const locations = rows.map(row => row.location)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )

    describe.each(prisonLevels)('lists levels in the correct order', (prison: string, levels: string[]) => {
      it(`for ${prison}`, async () => {
        const { columns } = await analyticsService.getIncentiveLevelsByLocation(prison)
        expect(columns).toEqual(levels)
      })
    })
  })

  // TODO: test getIncentiveLevelsByEthnicity and getIncentiveLevelsByAgeGroup once service uses test data
})
