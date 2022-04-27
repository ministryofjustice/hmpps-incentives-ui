import PrisonRegister from '../data/prisonRegister'
import S3Client from '../data/s3Client'
import AnalyticsService, {
  compareLocations,
  compareCharacteristics,
  removeLevelPrefix,
  StitchedTablesCache,
} from './analyticsService'
import {
  AnalyticsError,
  TableType,
  ProtectedCharacteristic,
  Ethnicities,
  Ages,
  Religions,
  Disabilities,
  SexualOrientations,
} from './analyticsServiceTypes'
import type { PrisonersOnLevelsByProtectedCharacteristic } from './analyticsServiceTypes'
import { MockTable, mockAppS3ClientResponse } from '../testData/s3Bucket'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

const isYouthCustodyServiceOriginal = PrisonRegister.isYouthCustodyService

const prisonLocations = {
  MDI: ['All', '1', '2', '3', '4', '5', '6', '7', '8', 'SEG'],
  BWI: ['All', 'A', 'B', 'C', 'CASU'],
}

const prisonLevels = {
  MDI: ['Basic', 'Standard', 'Enhanced'],
  BWI: ['Basic', 'Standard', 'Enhanced'],
}

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  const s3Client = new S3Client({ region: 'eu-west-1', bucket: 'incentives' }) as jest.Mocked<S3Client>

  beforeEach(() => {
    jest.resetAllMocks()
    StitchedTablesCache.clear()
    analyticsService = new AnalyticsService(s3Client, () => '')
  })

  describe('findTable()', () => {
    it('returns a table when there is only one candidate', async () => {
      const modified = new Date('2022-03-14T12:00:00Z')
      s3Client.listObjects.mockResolvedValue([{ key: 'behaviour_entries/2022-03-13.json', modified }])
      s3Client.getObject.mockResolvedValue('{"column":{"1":1,"2":2}}')

      await expect(analyticsService.findTable(TableType.behaviourEntries)).resolves.toEqual({
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

      await expect(analyticsService.findTable(TableType.behaviourEntries)).resolves.toEqual({
        table: { column: { '1': 1, '2': 2 } },
        date: new Date(2022, 2, 13),
        modified,
      })
      expect(s3Client.getObject).toBeCalledWith('behaviour_entries/2022-03-13.json')
    })

    it('throws an error when it cannot find a table', async () => {
      s3Client.listObjects.mockResolvedValue([])

      await expect(analyticsService.findTable(TableType.behaviourEntries)).rejects.toThrow(AnalyticsError)
    })

    it('throws an error when object contents cannot be parsed', async () => {
      const modified = new Date('2022-03-14T12:00:00Z')
      s3Client.listObjects.mockResolvedValue([{ key: 'behaviour_entries/2022-03-13.json', modified }])
      s3Client.getObject.mockResolvedValue('{"column":')

      await expect(analyticsService.findTable(TableType.behaviourEntries)).rejects.toThrow(AnalyticsError)
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
        ['A', 6],
        ['B', 20],
        ['C', 10],
        ['All', 36],
      ])
    })
  })

  describe('comparators and filters', () => {
    describe.each([
      { a: { location: 'All' }, b: { location: '1' }, expected: -1 },
      { a: { location: 'Unknown' }, b: { location: '1' }, expected: 1 },
      { a: { location: 'Unknown' }, b: { location: 'All' }, expected: 1 },
      { a: { location: 'A' }, b: { location: 'All' }, expected: 1 },
      { a: { location: '1' }, b: { location: 'A' }, expected: -1 },
      { a: { location: '1' }, b: { location: 'Unknown' }, expected: -1 },
      { a: { location: 'A' }, b: { location: '1' }, expected: 1 },
      { a: { location: 'A' }, b: { location: 'B' }, expected: -1 },
      { a: { location: 'SEG' }, b: { location: 'X' }, expected: 1 },
      { a: { location: 'RECP' }, b: { location: 'SEG' }, expected: -1 },
      { a: { location: 'RECP' }, b: { location: 'Unknown' }, expected: -1 },
    ])('compareLocations()', ({ a, b, expected }) => {
      let compares = '='
      if (expected > 0) {
        compares = '>'
      } else if (expected < 0) {
        compares = '<'
      }
      it(`${a.location} ${compares} ${b.location}`, () => {
        expect(compareLocations(a, b)).toEqual(expected)
      })
    })

    describe.each([
      { a: { characteristic: 'All' }, b: { characteristic: 'Asian or Asian British' }, expected: -1 },
      { a: { characteristic: 'Black or Black British' }, b: { characteristic: 'Mixed' }, expected: -1 },
      { a: { characteristic: 'Unknown' }, b: { characteristic: 'All' }, expected: 1 },
      { a: { characteristic: 'Other' }, b: { characteristic: 'All' }, expected: 1 },
      { a: { characteristic: 'White' }, b: { characteristic: 'All' }, expected: 1 },
      { a: { characteristic: 'Asian or Asian British' }, b: { characteristic: 'Other' }, expected: -1 },
      { a: { characteristic: 'Asian or Asian British' }, b: { characteristic: 'Unknown' }, expected: -1 },
      { a: { characteristic: 'Yes' }, b: { characteristic: 'Unknown' }, expected: -1 },
      { a: { characteristic: 'Other' }, b: { characteristic: 'Yes' }, expected: 1 },
      { a: { characteristic: 'Unknown' }, b: { characteristic: 'Other' }, expected: 1 },
    ])('compareCharacteristics()', ({ a, b, expected }) => {
      let compares = '='
      if (expected > 0) {
        compares = '>'
      } else if (expected < 0) {
        compares = '<'
      }
      it(`${a.characteristic} ${compares} ${b.characteristic}`, () => {
        expect(compareCharacteristics(a, b)).toEqual(expected)
      })
    })

    describe.each([
      ['B. Basic', 'Basic'],
      ['C. Standard', 'Standard'],
      ['D. Enhanced', 'Enhanced'],
      ['E. Enhanced 2', 'Enhanced 2'],
      // Prefixes are expected to always be "[letter]. ", so don't mangle other formats
      ['Enhanced 2', 'Enhanced 2'],
      ['A Entry', 'A Entry'],
    ])('removeLevelPrefix()', (levelWithPrefix, expectedLevelWithoutPrefix) => {
      it(`Level "${levelWithPrefix}" becomes "${expectedLevelWithoutPrefix}" without prefix`, () => {
        expect(removeLevelPrefix(levelWithPrefix)).toEqual(expectedLevelWithoutPrefix)
      })
    })
  })

  describe('getBehaviourEntriesByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client, TableType.behaviourEntries)
    })

    it('has a totals row', async () => {
      const { rows: entries } = await analyticsService.getBehaviourEntriesByLocation('MDI')
      expect(entries).toHaveLength(prisonLocations.MDI.length)

      const prisonTotal = entries.shift()
      expect(prisonTotal.location).toEqual('All')
      expect(prisonTotal.href).toBeUndefined()

      let [sumPositive, sumNegative] = [0, 0]
      entries.forEach(({ values }) => {
        const [entriesPositive, entriesNegative] = values
        sumPositive += entriesPositive
        sumNegative += entriesNegative
      })
      expect(prisonTotal.values[0]).toEqual(sumPositive)
      expect(prisonTotal.values[1]).toEqual(sumNegative)
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, TableType.behaviourEntries, MockTable.Empty)

      await expect(analyticsService.getBehaviourEntriesByLocation('MDI')).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
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
      mockAppS3ClientResponse(s3Client, TableType.behaviourEntries)
    })

    it('has a totals row', async () => {
      const { rows: prisoners } = await analyticsService.getPrisonersWithEntriesByLocation('MDI')
      expect(prisoners).toHaveLength(prisonLocations.MDI.length)

      const prisonTotal = prisoners.shift()
      expect(prisonTotal.location).toEqual('All')
      expect(prisonTotal.href).toBeUndefined()

      let [sumPositive, sumNegative, sumBoth, sumNeither] = [0, 0, 0, 0]
      prisoners.forEach(({ values }) => {
        const [prisonersWithPositive, prisonersWithNegative, prisonersWithBoth, prisonersWithNeither] = values
        sumPositive += prisonersWithPositive
        sumNegative += prisonersWithNegative
        sumBoth += prisonersWithBoth
        sumNeither += prisonersWithNeither
      })
      expect(prisonTotal.values[0]).toEqual(sumPositive)
      expect(prisonTotal.values[1]).toEqual(sumNegative)
      expect(prisonTotal.values[2]).toEqual(sumBoth)
      expect(prisonTotal.values[3]).toEqual(sumNeither)
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, TableType.behaviourEntries, MockTable.Empty)

      await expect(analyticsService.getPrisonersWithEntriesByLocation('MDI')).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
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
      mockAppS3ClientResponse(s3Client, TableType.incentiveLevels)
    })

    it('has a totals row', async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation('MDI')
      expect(prisonersOnLevels).toHaveLength(prisonLocations.MDI.length)

      const prisonTotal = prisonersOnLevels.shift()
      expect(prisonTotal.location).toEqual('All')
      expect(prisonTotal.href).toBeUndefined()

      const totals = [0, 0, 0, 0]
      prisonersOnLevels.forEach(({ values }) => {
        for (let i = 0; i < columns.length; i += 1) {
          totals[i] += values[i]
        }
      })
      for (let i = 0; i < columns.length; i += 1) {
        expect(prisonTotal.values[i]).toEqual(totals[i])
      }
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, TableType.behaviourEntries, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelsByLocation('MDI')).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const { rows } = await analyticsService.getIncentiveLevelsByLocation(prison)
          const locations = rows.map(row => row.location)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )

    describe.each(Object.entries(prisonLevels))('lists levels in the correct order', (prison, levels) => {
      it(`for ${prison}`, async () => {
        const { columns } = await analyticsService.getIncentiveLevelsByLocation(prison)
        expect(columns).toEqual(levels)
      })
    })
  })

  describe.each([
    [ProtectedCharacteristic.Ethnicity, ['All', ...Ethnicities]],
    [ProtectedCharacteristic.Age, ['All', ...Ages]],
    [ProtectedCharacteristic.Religion, ['All', ...Religions]],
    [ProtectedCharacteristic.Disability, ['All', ...Disabilities]],
    [ProtectedCharacteristic.SexualOrientation, ['All', ...SexualOrientations]],
  ])('getIncentiveLevelsByProtectedCharacteristic()', (characteristic, expectedCharacteristics) => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client, TableType.incentiveLevels)

      // pretend that MDI is a YCS
      PrisonRegister.isYouthCustodyService = (prisonId: string) => prisonId === 'MDI'
    })

    it(`[${characteristic}]: has a totals row`, async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
        'MDI',
        characteristic
      )
      expect(prisonersOnLevels).toHaveLength(expectedCharacteristics.length)

      const prisonTotal = prisonersOnLevels.shift()
      expect(prisonTotal.characteristic).toEqual('All')

      const totals = [0, 0, 0, 0]
      prisonersOnLevels.forEach(({ values }) => {
        for (let i = 0; i < columns.length; i += 1) {
          totals[i] += values[i]
        }
      })
      for (let i = 0; i < columns.length; i += 1) {
        expect(prisonTotal.values[i]).toEqual(totals[i])
      }
    })

    it(`[${characteristic}]: throws an error when the table is empty`, async () => {
      mockAppS3ClientResponse(s3Client, TableType.behaviourEntries, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)).rejects.toThrow(
        AnalyticsError
      )
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)
      const characteristics = rows.map(row => row.characteristic)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)
        const zeroRows = rows.filter(({ characteristic: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([
          {
            characteristic: '15-17',
            values: [0, 0, 0],
          },
        ])
      })

      it(`[${characteristic}]: skips 15-17 group in non-YCS prison`, async () => {
        // make MDI not a YCS by restoring isYouthCustodyService()
        PrisonRegister.isYouthCustodyService = isYouthCustodyServiceOriginal

        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)
        const zeroRows = rows.filter(({ characteristic: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([])
      })
    }

    describe.each(Object.entries(prisonLevels))(
      `[${characteristic}]: lists levels in the correct order`,
      (prison, levels) => {
        it(`for ${prison}`, async () => {
          const { columns } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(prison, characteristic)
          expect(columns).toEqual(levels)
        })
      }
    )
  })
})
