import PrisonRegister from '../data/prisonRegister'
import S3Client from '../data/s3Client'
import AnalyticsService, { StitchedTablesCache } from './analyticsService'
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
import type { PrisonersOnLevelsByProtectedCharacteristic, TrendsReportRow, TrendsTable } from './analyticsServiceTypes'
import { mapRowsAndSumTotals, mapRowsForMonthlyTrends } from './analyticsServiceUtils'
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
      const output = mapRowsAndSumTotals<StitchedRow, MappedRow>(
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

  describe('trends table manipulation', () => {
    type StitchedRow = [string, string, number, number, string]

    const sampleInputTable = {
      year_month_str: { '1': '2022-02', '2': '2022-03', '3': '2022-04', '4': '2022-05' },
      snapshots: { '1': 1, '2': 1, '3': 1, '4': 1 },
      prison: { '1': 'A', '2': 'A', '3': 'A', '4': 'A' },
      offenders: { '1': 1800, '2': 1790, '3': 1805, '4': 1800 },
      incentive: { '1': 'B. Standard', '2': 'B. Standard', '3': 'B. Standard', '4': 'B. Standard' },
    } as unknown as TrendsTable // ignore missing columns; they're not used
    const columnsToPluck: (keyof TrendsTable)[] = ['prison', 'year_month_str', 'snapshots', 'offenders', 'incentive']

    it('stitchTable() stitches a column-based source table into rows', () => {
      const stitchedTable = analyticsService.stitchTable<TrendsTable, StitchedRow>(sampleInputTable, columnsToPluck)
      expect(stitchedTable).toEqual<StitchedRow[]>([
        ['A', '2022-02', 1, 1800, 'B. Standard'],
        ['A', '2022-03', 1, 1790, 'B. Standard'],
        ['A', '2022-04', 1, 1805, 'B. Standard'],
        ['A', '2022-05', 1, 1800, 'B. Standard'],
      ])
    })

    it('mapRowsForMonthlyTrends() maps simple rows', () => {
      const stitchedTable = analyticsService.stitchTable<TrendsTable, StitchedRow>(sampleInputTable, columnsToPluck)
      const output = mapRowsForMonthlyTrends<StitchedRow>(
        stitchedTable,
        ([_prison, yearAndMonth, _snapshots, offenders, _incentive]) => {
          return [
            {
              yearAndMonth,
              columnIndex: 0,
              value: offenders,
              population: offenders,
            },
          ]
        },
        1
      )
      expect(output).toEqual<TrendsReportRow[]>([
        { yearAndMonth: '2022-02', population: 1800, values: [1800], total: 1800 },
        { yearAndMonth: '2022-03', population: 1790, values: [1790], total: 1790 },
        { yearAndMonth: '2022-04', population: 1805, values: [1805], total: 1805 },
        { yearAndMonth: '2022-05', population: 1800, values: [1800], total: 1800 },
      ])
    })

    it('mapRowsForMonthlyTrends() maps multiple rows into months', () => {
      const sampleInputTable2 = {
        year_month_str: { '1': '2022-02', '2': '2022-02', '3': '2022-03', '4': '2022-03' },
        snapshots: { '1': 1, '2': 1, '3': 1, '4': 1 },
        prison: { '1': 'A', '2': 'A', '3': 'A', '4': 'A' },
        offenders: { '1': 1800, '2': 1790, '3': 1805, '4': 1800 },
        incentive: { '1': 'B. Standard', '2': 'B. Standard', '3': 'B. Standard', '4': 'B. Standard' },
      } as unknown as TrendsTable // ignore missing columns; they're not used

      const stitchedTable = analyticsService.stitchTable<TrendsTable, StitchedRow>(sampleInputTable2, columnsToPluck)
      const output = mapRowsForMonthlyTrends<StitchedRow>(
        stitchedTable,
        ([_prison, yearAndMonth, _snapshots, offenders, _incentive]) => {
          return [
            {
              yearAndMonth,
              columnIndex: 0,
              value: offenders,
              population: offenders,
            },
          ]
        },
        1
      )
      expect(output).toEqual<TrendsReportRow[]>([
        { yearAndMonth: '2022-02', population: 3590, values: [3590], total: 3590 },
        { yearAndMonth: '2022-03', population: 3605, values: [3605], total: 3605 },
      ])
    })

    it('mapRowsForMonthlyTrends() maps rows with multiple values and calculates total', () => {
      const sampleInputTable3 = {
        year_month_str: { '1': '2022-02', '2': '2022-02', '3': '2022-03', '4': '2022-03' },
        snapshots: { '1': 1, '2': 1, '3': 1, '4': 1 },
        prison: { '1': 'A', '2': 'A', '3': 'A', '4': 'A' },
        offenders: { '1': 1800, '2': 1790, '3': 1805, '4': 1800 },
        positives: { '1': 1, '2': 3, '3': 5, '4': 7 },
        negatives: { '1': 11, '2': 13, '3': 17, '4': 21 },
      } as unknown as TrendsTable // ignore missing columns; they're not used
      type StitchedRow2 = [string, string, number, number, number, number]

      const stitchedTable = analyticsService.stitchTable<TrendsTable, StitchedRow2>(sampleInputTable3, [
        'prison',
        'year_month_str',
        'snapshots',
        'offenders',
        'positives',
        'negatives',
      ])
      const output = mapRowsForMonthlyTrends<StitchedRow2>(
        stitchedTable,
        ([_prison, yearAndMonth, _snapshots, offenders, positives, negatives]) => {
          return [
            {
              yearAndMonth,
              columnIndex: 0,
              value: positives,
              population: offenders,
            },
            {
              yearAndMonth,
              columnIndex: 1,
              value: negatives,
              population: 0,
            },
          ]
        },
        2
      )
      expect(output).toEqual<TrendsReportRow[]>([
        { yearAndMonth: '2022-02', population: 3590, values: [4, 24], total: 28 },
        { yearAndMonth: '2022-03', population: 3605, values: [12, 38], total: 50 },
      ])
    })
  })

  describe('getBehaviourEntriesByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('has a totals row', async () => {
      const { rows: entries } = await analyticsService.getBehaviourEntriesByLocation('MDI')
      expect(entries).toHaveLength(prisonLocations.MDI.length)

      const prisonTotal = entries.shift()
      expect(prisonTotal.label).toEqual('All')
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
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getBehaviourEntriesByLocation('MDI')).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const { rows } = await analyticsService.getBehaviourEntriesByLocation(prison)
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )
  })

  describe('getPrisonersWithEntriesByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('has a totals row', async () => {
      const { rows: prisoners } = await analyticsService.getPrisonersWithEntriesByLocation('MDI')
      expect(prisoners).toHaveLength(prisonLocations.MDI.length)

      const prisonTotal = prisoners.shift()
      expect(prisonTotal.label).toEqual('All')
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
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getPrisonersWithEntriesByLocation('MDI')).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const { rows } = await analyticsService.getPrisonersWithEntriesByLocation(prison)
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )
  })

  describe('getIncentiveLevelsByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('has a totals row', async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation('MDI')
      expect(prisonersOnLevels).toHaveLength(prisonLocations.MDI.length)

      const prisonTotal = prisonersOnLevels.shift()
      expect(prisonTotal.label).toEqual('All')
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
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelsByLocation('MDI')).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const { rows } = await analyticsService.getIncentiveLevelsByLocation(prison)
          const locations = rows.map(row => row.label)
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
      mockAppS3ClientResponse(s3Client)

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
      expect(prisonTotal.label).toEqual('All')

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
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)).rejects.toThrow(
        AnalyticsError
      )
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)
      const characteristics = rows.map(row => row.label)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([
          {
            label: '15-17',
            values: [0, 0, 0],
          },
        ])
      })

      it(`[${characteristic}]: skips 15-17 group in non-YCS prison`, async () => {
        // make MDI not a YCS by restoring isYouthCustodyService()
        PrisonRegister.isYouthCustodyService = isYouthCustodyServiceOriginal

        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic('MDI', characteristic)
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
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

  describe('getBehaviourEntryTrends()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('returns 12 months', async () => {
      const report = await analyticsService.getBehaviourEntryTrends('MDI')
      expect(report.rows).toHaveLength(12)
    })

    it('plots percentage values', async () => {
      const report = await analyticsService.getBehaviourEntryTrends('MDI')
      expect(report.plotPercentage).toBeFalsy()
      expect(report).toHaveProperty('verticalAxisTitle')
    })

    it('shows population', async () => {
      const report = await analyticsService.getBehaviourEntryTrends('MDI')
      expect(report.populationIsTotal).toBeFalsy()
      expect(report).toHaveProperty('monthlyTotalName')
      report.rows
        // TODO: remove filter when full 12 months provided in sample data
        .filter(row => row.population !== 0)
        .forEach(row => expect(row.total).not.toBeCloseTo(row.population))
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getBehaviourEntryTrends('MDI')).rejects.toThrow(AnalyticsError)
    })
  })

  describe('getIncentiveLevelTrends()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('returns 12 months', async () => {
      const report = await analyticsService.getIncentiveLevelTrends('MDI')
      expect(report.rows).toHaveLength(12)
    })

    it('plots absolute values', async () => {
      const report = await analyticsService.getIncentiveLevelTrends('MDI')
      expect(report.plotPercentage).toBeTruthy()
      expect(report).not.toHaveProperty('verticalAxisTitle')
    })

    it('does not show population', async () => {
      const report = await analyticsService.getIncentiveLevelTrends('MDI')
      expect(report.populationIsTotal).toBeTruthy()
      expect(report).not.toHaveProperty('monthlyTotalName')
      report.rows
        // TODO: remove filter when full 12 months provided in sample data
        .filter(row => row.population !== 0)
        .forEach(row => expect(row.total).toBeCloseTo(row.population))
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelTrends('MDI')).rejects.toThrow(AnalyticsError)
    })
  })

  describe.each([
    [ProtectedCharacteristic.Ethnicity, ['All', ...Ethnicities]],
    [ProtectedCharacteristic.Age, ['All', ...Ages]],
    [ProtectedCharacteristic.Religion, ['All', ...Religions]],
    [ProtectedCharacteristic.Disability, ['All', ...Disabilities]],
    [ProtectedCharacteristic.SexualOrientation, ['All', ...SexualOrientations]],
  ])('getBehaviourEntriesByProtectedCharacteristic()', (characteristic, expectedCharacteristics) => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)

      // pretend that MDI is a YCS
      PrisonRegister.isYouthCustodyService = (prisonId: string) => prisonId === 'MDI'
    })

    it(`[${characteristic}]: has a totals row`, async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(
        'MDI',
        characteristic
      )
      expect(prisonersOnLevels).toHaveLength(expectedCharacteristics.length)

      const prisonTotal = prisonersOnLevels.shift()
      expect(prisonTotal.label).toEqual('All')

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
  })
})
