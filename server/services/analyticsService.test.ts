import PrisonRegister from '../data/prisonRegister'
import S3Client from '../data/s3Client'
import AnalyticsService from './analyticsService'
import {
  AnalyticsError,
  TableType,
  ProtectedCharacteristic,
  Ethnicities,
  Ages,
  Religions,
  Disabilities,
  SexualOrientations,
  BehaviourEntriesByProtectedCharacteristic,
} from './analyticsServiceTypes'
import type { PrisonersOnLevelsByProtectedCharacteristic, TrendsReportRow, TrendsTable } from './analyticsServiceTypes'
import { mapRowsAndSumTotals, mapRowsForMonthlyTrends } from './analyticsServiceUtils'
import { MemoryStitchedTablesCache } from './stitchedTablesCache'
import { MockTable, mockAppS3ClientResponse } from '../testData/s3Bucket'
import { AnalyticsView } from '../routes/analyticsView'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

const isYouthCustodyServiceOriginal = PrisonRegister.isYouthCustodyService

const prisonLocations = {
  MDI: ['All', '1', '2', '3', '4', '5', '6', '7', '8', 'SEG'],
  BWI: ['All', 'A', 'B', 'C', 'CASU'],
}
// Behaviour entries source tables don't filter out `RECP` location
const prisonLocationsBehaviourEntries = {
  MDI: ['All', '1', '2', '3', '4', '5', '6', '7', '8', 'RECP', 'SEG'],
  BWI: ['All', 'A', 'B', 'C', 'CASU', 'RECP'],
}

const prisonLevels = {
  MDI: ['Basic', 'Standard', 'Enhanced'],
  BWI: ['Basic', 'Standard', 'Enhanced'],
}

const nationalView = new AnalyticsView('National', 'MDI')
const regionalView = new AnalyticsView('LTHS', 'MDI')
const moorlandPrisonLevelView = new AnalyticsView(null, 'MDI')

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  const s3Client = new S3Client({ region: 'eu-west-1', bucket: 'incentives' }) as jest.Mocked<S3Client>

  beforeEach(() => {
    jest.resetAllMocks()
    const cache = new MemoryStitchedTablesCache()
    analyticsService = new AnalyticsService(s3Client, cache, () => '')
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
        1,
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
        1,
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
        1,
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
        2,
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
      const { rows: entries } = await analyticsService.getBehaviourEntriesByLocation(moorlandPrisonLevelView)
      expect(entries).toHaveLength(prisonLocationsBehaviourEntries.MDI.length)

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

      await expect(analyticsService.getBehaviourEntriesByLocation(moorlandPrisonLevelView)).rejects.toThrow(
        AnalyticsError,
      )
    })

    describe.each(Object.entries(prisonLocationsBehaviourEntries))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, prison)
          const { rows } = await analyticsService.getBehaviourEntriesByLocation(prisonLevelView)
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      },
    )

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      const { rows } = await analyticsService.getBehaviourEntriesByLocation(regionalView)

      expect(rows).toEqual([
        { href: undefined, label: 'All', values: [105, 155] },
        { href: '', label: 'Whitemoor (HMP)', values: [105, 155] },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      const { rows } = await analyticsService.getBehaviourEntriesByLocation(nationalView)

      expect(rows).toEqual([
        { href: undefined, label: 'All', values: [27574, 32237] },
        { href: '', label: 'Avon and South Dorset', values: [624, 671] },
        { href: '', label: 'Bedfordshire, Cambridgeshire and Norfolk', values: [1332, 1492] },
        { href: '', label: 'Contracted', values: [3014, 3867] },
        { href: '', label: 'Cumbria and Lancashire', values: [648, 829] },
        { href: '', label: 'Devon and North Dorset', values: [577, 1090] },
        { href: '', label: 'East Midlands', values: [988, 1103] },
        { href: '', label: 'Greater Manchester, Merseyside and Cheshire', values: [856, 1069] },
        { href: '', label: 'Hertfordshire, Essex and Suffolk', values: [1745, 1367] },
        { href: '', label: 'Immigration and foreign national prisons', values: [548, 337] },
        { href: '', label: 'Kent, Surrey and Sussex', values: [1515, 1773] },
        { href: '', label: 'London', values: [2605, 2898] },
        { href: '', label: 'Long-term and high security', values: [2769, 3735] },
        { href: '', label: 'North Midlands', values: [1607, 1445] },
        { href: '', label: 'South Central', values: [801, 892] },
        { href: '', label: 'Tees and Wear', values: [449, 943] },
        { href: '', label: 'Wales', values: [709, 1071] },
        { href: '', label: 'West Midlands', values: [1386, 2026] },
        { href: '', label: 'Women', values: [1478, 1264] },
        { href: '', label: 'Yorkshire', values: [2077, 2291] },
        { href: '', label: 'Youth custody service', values: [1846, 2074] },
      ])
    })
  })

  describe('getPrisonersWithEntriesByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('has a totals row', async () => {
      const { rows: prisoners } = await analyticsService.getPrisonersWithEntriesByLocation(moorlandPrisonLevelView)
      expect(prisoners).toHaveLength(prisonLocationsBehaviourEntries.MDI.length)

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

      await expect(analyticsService.getPrisonersWithEntriesByLocation(moorlandPrisonLevelView)).rejects.toThrow(
        AnalyticsError,
      )
    })

    describe.each(Object.entries(prisonLocationsBehaviourEntries))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, prison)
          const { rows } = await analyticsService.getPrisonersWithEntriesByLocation(prisonLevelView)
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      },
    )

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      const { rows } = await analyticsService.getPrisonersWithEntriesByLocation(regionalView)

      expect(rows).toEqual([
        { href: undefined, label: 'All', values: [50, 67, 10, 199] },
        { href: '', label: 'Whitemoor (HMP)', values: [50, 67, 10, 199] },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      const { rows } = await analyticsService.getPrisonersWithEntriesByLocation(nationalView)

      expect(rows).toEqual([
        { href: undefined, label: 'All', values: [13343, 12347, 3438, 60593] },
        { href: '', label: 'Avon and South Dorset', values: [314, 257, 78, 1652] },
        { href: '', label: 'Bedfordshire, Cambridgeshire and Norfolk', values: [608, 500, 180, 2661] },
        { href: '', label: 'Contracted', values: [1677, 1918, 274, 11715] },
        { href: '', label: 'Cumbria and Lancashire', values: [418, 380, 60, 2566] },
        { href: '', label: 'Devon and North Dorset', values: [287, 374, 101, 1612] },
        { href: '', label: 'East Midlands', values: [527, 426, 115, 1885] },
        { href: '', label: 'Greater Manchester, Merseyside and Cheshire', values: [492, 440, 94, 2491] },
        { href: '', label: 'Hertfordshire, Essex and Suffolk', values: [911, 549, 167, 2359] },
        { href: '', label: 'Immigration and foreign national prisons', values: [305, 163, 50, 764] },
        { href: '', label: 'Kent, Surrey and Sussex', values: [713, 592, 214, 2420] },
        { href: '', label: 'London', values: [1189, 1102, 316, 4367] },
        { href: '', label: 'Long-term and high security', values: [1328, 1379, 398, 5656] },
        { href: '', label: 'North Midlands', values: [820, 521, 174, 2332] },
        { href: '', label: 'South Central', values: [443, 395, 93, 1872] },
        { href: '', label: 'Tees and Wear', values: [277, 440, 49, 2166] },
        { href: '', label: 'Wales', values: [455, 558, 64, 4500] },
        { href: '', label: 'West Midlands', values: [680, 843, 201, 3909] },
        { href: '', label: 'Women', values: [681, 369, 239, 1431] },
        { href: '', label: 'Yorkshire', values: [1091, 1003, 243, 4112] },
        { href: '', label: 'Youth custody service', values: [127, 138, 328, 123] },
      ])
    })
  })

  describe('getIncentiveLevelsByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('has a totals row', async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation(
        moorlandPrisonLevelView,
      )
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

      await expect(analyticsService.getIncentiveLevelsByLocation(moorlandPrisonLevelView)).rejects.toThrow(
        AnalyticsError,
      )
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, prison)
          const { rows } = await analyticsService.getIncentiveLevelsByLocation(prisonLevelView)
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      },
    )

    describe.each(Object.entries(prisonLevels))('lists levels in the correct order', (prison, levels) => {
      it(`for ${prison}`, async () => {
        const prisonLevelView = new AnalyticsView(null, prison)
        const { columns } = await analyticsService.getIncentiveLevelsByLocation(prisonLevelView)
        expect(columns).toEqual(levels)
      })
    })

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      const { rows } = await analyticsService.getIncentiveLevelsByLocation(regionalView)

      expect(rows).toEqual([
        { href: undefined, label: 'All', values: [12, 90, 217] },
        { href: '', label: 'Whitemoor (HMP)', values: [12, 90, 217] },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      const { rows } = await analyticsService.getIncentiveLevelsByLocation(nationalView)

      expect(rows).toEqual([
        { href: undefined, label: 'All', values: [83, 1350, 1684] },
        { href: '', label: 'Long-term and high security', values: [12, 90, 217] },
        { href: '', label: 'Wales', values: [45, 739, 1085] },
        { href: '', label: 'Yorkshire', values: [26, 521, 382] },
      ])
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
        moorlandPrisonLevelView,
        characteristic,
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

      await expect(
        analyticsService.getIncentiveLevelsByProtectedCharacteristic(moorlandPrisonLevelView, characteristic),
      ).rejects.toThrow(AnalyticsError)
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
        moorlandPrisonLevelView,
        characteristic,
      )
      const characteristics = rows.map(row => row.label)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
          moorlandPrisonLevelView,
          characteristic,
        )
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

        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
          moorlandPrisonLevelView,
          characteristic,
        )
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([])
      })

      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
          regionalView,
          characteristic,
        )

        expect(rows).toEqual([
          { label: 'All', values: [12, 90, 217] },
          { label: '15-17', values: [0, 0, 0] },
          { label: '18-25', values: [3, 19, 19] },
          { label: '26-35', values: [5, 31, 65] },
          { label: '36-45', values: [2, 22, 60] },
          { label: '46-55', values: [2, 11, 40] },
          { label: '56-65', values: [0, 6, 27] },
          { label: '66+', values: [0, 1, 6] },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
          nationalView,
          characteristic,
        )

        expect(rows).toEqual([
          { label: 'All', values: [83, 1350, 1684] },
          { label: '15-17', values: [0, 0, 0] },
          { label: '18-25', values: [30, 331, 185] },
          { label: '26-35', values: [34, 497, 612] },
          { label: '36-45', values: [10, 282, 455] },
          { label: '46-55', values: [6, 155, 262] },
          { label: '56-65', values: [3, 49, 107] },
          { label: '66+', values: [0, 36, 63] },
        ])
      })
    }

    describe.each(Object.entries(prisonLevels))(
      `[${characteristic}]: lists levels in the correct order`,
      (prison, levels) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, prison)
          const { columns } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(
            prisonLevelView,
            characteristic,
          )
          expect(columns).toEqual(levels)
        })
      },
    )
  })

  describe('getBehaviourEntryTrends()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('returns 12 months', async () => {
      const report = await analyticsService.getBehaviourEntryTrends(moorlandPrisonLevelView)
      expect(report.rows).toHaveLength(12)
    })

    it('plots percentage values', async () => {
      const report = await analyticsService.getBehaviourEntryTrends(moorlandPrisonLevelView)
      expect(report.plotPercentage).toBeFalsy()
      expect(report).toHaveProperty('verticalAxisTitle')
    })

    it('shows population', async () => {
      const report = await analyticsService.getBehaviourEntryTrends(moorlandPrisonLevelView)
      expect(report.populationIsTotal).toBeFalsy()
      expect(report).toHaveProperty('monthlyTotalName')
      report.rows
        // TODO: remove filter when full 12 months provided in sample data
        .filter(row => row.population !== 0)
        .forEach(row => expect(row.total).not.toBeCloseTo(row.population))
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getBehaviourEntryTrends(moorlandPrisonLevelView)).rejects.toThrow(AnalyticsError)
    })

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      const { rows } = await analyticsService.getBehaviourEntryTrends(regionalView)

      expect(rows).toEqual([
        { population: 372, total: 268, values: [99, 169], yearAndMonth: '2021-06' },
        { population: 342, total: 283, values: [114, 169], yearAndMonth: '2021-07' },
        { population: 322, total: 276, values: [106, 170], yearAndMonth: '2021-08' },
        { population: 315, total: 276, values: [100, 176], yearAndMonth: '2021-09' },
        { population: 312, total: 238, values: [70, 168], yearAndMonth: '2021-10' },
        { population: 317, total: 264, values: [74, 190], yearAndMonth: '2021-11' },
        { population: 315, total: 264, values: [64, 200], yearAndMonth: '2021-12' },
        { population: 314, total: 352, values: [61, 291], yearAndMonth: '2022-01' },
        { population: 318, total: 263, values: [63, 200], yearAndMonth: '2022-02' },
        { population: 323, total: 306, values: [120, 186], yearAndMonth: '2022-03' },
        { population: 321, total: 267, values: [96, 171], yearAndMonth: '2022-04' },
        { population: 319, total: 300, values: [94, 206], yearAndMonth: '2022-05' },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      const { rows } = await analyticsService.getBehaviourEntryTrends(nationalView)

      expect(rows).toEqual([
        { population: 3077, total: 1862, values: [578, 1284], yearAndMonth: '2021-06' },
        { population: 3070, total: 2388, values: [860, 1528], yearAndMonth: '2021-07' },
        { population: 3059, total: 2373, values: [971, 1402], yearAndMonth: '2021-08' },
        { population: 3047, total: 2327, values: [937, 1390], yearAndMonth: '2021-09' },
        { population: 3036, total: 2153, values: [786, 1367], yearAndMonth: '2021-10' },
        { population: 3057, total: 2408, values: [840, 1568], yearAndMonth: '2021-11' },
        { population: 3060, total: 2252, values: [715, 1537], yearAndMonth: '2021-12' },
        { population: 3066, total: 2302, values: [915, 1387], yearAndMonth: '2022-01' },
        { population: 3054, total: 1853, values: [641, 1212], yearAndMonth: '2022-02' },
        { population: 3059, total: 2294, values: [850, 1444], yearAndMonth: '2022-03' },
        { population: 3064, total: 2333, values: [938, 1395], yearAndMonth: '2022-04' },
        { population: 3069, total: 2370, values: [983, 1387], yearAndMonth: '2022-05' },
      ])
    })
  })

  describe('getIncentiveLevelTrends()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('returns 12 months', async () => {
      const report = await analyticsService.getIncentiveLevelTrends(moorlandPrisonLevelView)
      expect(report.rows).toHaveLength(12)
    })

    it('plots absolute values', async () => {
      const report = await analyticsService.getIncentiveLevelTrends(moorlandPrisonLevelView)
      expect(report.plotPercentage).toBeTruthy()
      expect(report).not.toHaveProperty('verticalAxisTitle')
    })

    it('does not show population', async () => {
      const report = await analyticsService.getIncentiveLevelTrends(moorlandPrisonLevelView)
      expect(report.populationIsTotal).toBeTruthy()
      expect(report).not.toHaveProperty('monthlyTotalName')
      report.rows
        // TODO: remove filter when full 12 months provided in sample data
        .filter(row => row.population !== 0)
        .forEach(row => expect(row.total).toBeCloseTo(row.population))
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelTrends(moorlandPrisonLevelView)).rejects.toThrow(AnalyticsError)
    })

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      const { rows } = await analyticsService.getIncentiveLevelTrends(regionalView)

      expect(rows).toEqual([
        { population: 372, total: 372, values: [3, 133, 236], yearAndMonth: '2021-06' },
        { population: 342, total: 342, values: [3, 116, 223], yearAndMonth: '2021-07' },
        { population: 322, total: 322, values: [3, 100, 220], yearAndMonth: '2021-08' },
        { population: 315, total: 315, values: [5, 92, 219], yearAndMonth: '2021-09' },
        { population: 312, total: 312, values: [3, 95, 214], yearAndMonth: '2021-10' },
        { population: 317, total: 317, values: [2, 96, 218], yearAndMonth: '2021-11' },
        { population: 315, total: 315, values: [4, 98, 213], yearAndMonth: '2021-12' },
        { population: 314, total: 314, values: [4, 103, 208], yearAndMonth: '2022-01' },
        { population: 318, total: 318, values: [8, 104, 207], yearAndMonth: '2022-02' },
        { population: 323, total: 323, values: [7, 112, 204], yearAndMonth: '2022-03' },
        { population: 321, total: 321, values: [9, 106, 206], yearAndMonth: '2022-04' },
        { population: 319, total: 319, values: [8, 101, 210], yearAndMonth: '2022-05' },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      const { rows } = await analyticsService.getIncentiveLevelTrends(nationalView)

      expect(rows).toEqual([
        { population: 3077, total: 3077, values: [4, 1590, 1483], yearAndMonth: '2021-06' },
        { population: 3070, total: 3070, values: [3, 1544, 1523], yearAndMonth: '2021-07' },
        { population: 3059, total: 3059, values: [13, 1470, 1576], yearAndMonth: '2021-08' },
        { population: 3047, total: 3047, values: [29, 1405, 1613], yearAndMonth: '2021-09' },
        { population: 3036, total: 3036, values: [41, 1388, 1607], yearAndMonth: '2021-10' },
        { population: 3057, total: 3057, values: [44, 1403, 1609], yearAndMonth: '2021-11' },
        { population: 3060, total: 3060, values: [58, 1421, 1582], yearAndMonth: '2021-12' },
        { population: 3066, total: 3066, values: [54, 1427, 1586], yearAndMonth: '2022-01' },
        { population: 3054, total: 3054, values: [59, 1383, 1612], yearAndMonth: '2022-02' },
        { population: 3059, total: 3059, values: [60, 1353, 1645], yearAndMonth: '2022-03' },
        { population: 3064, total: 3064, values: [60, 1360, 1643], yearAndMonth: '2022-04' },
        { population: 3069, total: 3069, values: [58, 1359, 1652], yearAndMonth: '2022-05' },
      ])
    })
  })

  describe.each([
    [ProtectedCharacteristic.Ethnicity, ['All', ...Ethnicities]],
    [ProtectedCharacteristic.Age, ['All', ...Ages]],
    [ProtectedCharacteristic.Religion, ['All', ...Religions]],
    [ProtectedCharacteristic.Disability, ['All', ...Disabilities]],
    [ProtectedCharacteristic.SexualOrientation, ['All', ...SexualOrientations]],
  ])('getPrisonersWithEntriesByProtectedCharacteristic()', (characteristic, expectedCharacteristics) => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)

      // pretend that MDI is a YCS
      PrisonRegister.isYouthCustodyService = (prisonId: string) => prisonId === 'MDI'
    })

    it(`[${characteristic}]: has a totals row`, async () => {
      const { columns, rows: behaviourEntriesByPc } =
        await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(moorlandPrisonLevelView, characteristic)
      expect(behaviourEntriesByPc).toHaveLength(expectedCharacteristics.length)

      const all = behaviourEntriesByPc.shift()
      expect(all.label).toEqual('All')

      const expectedTotals = [0, 0, 0, 0]
      behaviourEntriesByPc.forEach(({ values }) => {
        for (let i = 0; i < columns.length; i += 1) {
          expectedTotals[i] += values[i]
        }
      })
      for (let i = 0; i < columns.length; i += 1) {
        expect(all.values[i]).toEqual(expectedTotals[i])
      }
    })

    it(`[${characteristic}]: throws an error when the table is empty`, async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(
        analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(moorlandPrisonLevelView, characteristic),
      ).rejects.toThrow(AnalyticsError)
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(
        moorlandPrisonLevelView,
        characteristic,
      )
      const characteristics = rows.map(row => row.label)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(
          moorlandPrisonLevelView,
          characteristic,
        )
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([
          {
            label: '15-17',
            values: [0, 0, 0, 0],
          },
        ])
      })

      it(`[${characteristic}]: skips 15-17 group in non-YCS prison`, async () => {
        // make MDI not a YCS by restoring isYouthCustodyService()
        PrisonRegister.isYouthCustodyService = isYouthCustodyServiceOriginal

        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(
          moorlandPrisonLevelView,
          characteristic,
        )
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([])
      })

      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(
          regionalView,
          characteristic,
        )

        expect(rows).toEqual([
          { label: 'All', values: [53, 65, 11, 190] },
          { label: '15-17', values: [0, 0, 0, 0] },
          { label: '18-25', values: [5, 21, 3, 12] },
          { label: '26-35', values: [16, 23, 3, 59] },
          { label: '36-45', values: [18, 11, 3, 52] },
          { label: '46-55', values: [8, 9, 0, 36] },
          { label: '56-65', values: [5, 1, 2, 25] },
          { label: '66+', values: [1, 0, 0, 6] },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(
          nationalView,
          characteristic,
        )

        expect(rows).toEqual([
          { label: 'All', values: [505, 504, 98, 2010] },
          { label: '15-17', values: [0, 0, 0, 0] },
          { label: '18-25', values: [62, 159, 22, 303] },
          { label: '26-35', values: [209, 203, 43, 688] },
          { label: '36-45', values: [141, 97, 24, 485] },
          { label: '46-55', values: [65, 34, 7, 317] },
          { label: '56-65', values: [23, 8, 2, 126] },
          { label: '66+', values: [5, 3, 0, 91] },
        ])
      })
    }

    it(`[${characteristic}]: lists profiles in the correct order`, async () => {
      const { columns } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(
        moorlandPrisonLevelView,
        characteristic,
      )
      expect(columns).toEqual(['Positive', 'Negative', 'Both', 'None'])
    })
  })

  describe.each(Ethnicities)('getIncentiveLevelTrendsByCharacteristic()', characteristicGroup => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it(`[${characteristicGroup}]: returns 12 months`, async () => {
      const report = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
        moorlandPrisonLevelView,
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.rows).toHaveLength(12)
    })

    it(`[${characteristicGroup}]: plots percentage values`, async () => {
      const report = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
        moorlandPrisonLevelView,
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.plotPercentage).toBeTruthy()
    })

    it(`[${characteristicGroup}]: shows population`, async () => {
      const report = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
        moorlandPrisonLevelView,
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.populationIsTotal).toBeFalsy()
      expect(report).toHaveProperty('monthlyTotalName')
    })

    it(`[${characteristicGroup}]: throws an error when the table is empty`, async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(
        analyticsService.getIncentiveLevelTrendsByCharacteristic(
          moorlandPrisonLevelView,
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        ),
      ).rejects.toThrow(AnalyticsError)
    })

    // Test national/regional only on one of the characteristic groups
    if (characteristicGroup === 'Asian or Asian British') {
      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        const { rows } = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
          regionalView,
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
          { population: 40, total: 40, values: [1, 16, 23], yearAndMonth: '2021-06' },
          { population: 35, total: 35, values: [0, 13, 21], yearAndMonth: '2021-07' },
          { population: 33, total: 33, values: [0, 11, 21], yearAndMonth: '2021-08' },
          { population: 32, total: 32, values: [1, 9, 22], yearAndMonth: '2021-09' },
          { population: 31, total: 31, values: [0, 9, 22], yearAndMonth: '2021-10' },
          { population: 34, total: 34, values: [0, 10, 24], yearAndMonth: '2021-11' },
          { population: 36, total: 36, values: [0, 11, 24], yearAndMonth: '2021-12' },
          { population: 36, total: 36, values: [1, 11, 24], yearAndMonth: '2022-01' },
          { population: 35, total: 35, values: [1, 9, 24], yearAndMonth: '2022-02' },
          { population: 34, total: 34, values: [1, 10, 23], yearAndMonth: '2022-03' },
          { population: 33, total: 33, values: [1, 11, 21], yearAndMonth: '2022-04' },
          { population: 32, total: 32, values: [1, 10, 21], yearAndMonth: '2022-05' },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        const { rows } = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
          nationalView,
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
          { population: 223, total: 223, values: [1, 109, 113], yearAndMonth: '2021-06' },
          { population: 217, total: 217, values: [0, 104, 113], yearAndMonth: '2021-07' },
          { population: 211, total: 211, values: [0, 92, 118], yearAndMonth: '2021-08' },
          { population: 206, total: 206, values: [2, 86, 118], yearAndMonth: '2021-09' },
          { population: 207, total: 207, values: [2, 91, 114], yearAndMonth: '2021-10' },
          { population: 208, total: 208, values: [4, 89, 115], yearAndMonth: '2021-11' },
          { population: 208, total: 208, values: [3, 96, 110], yearAndMonth: '2021-12' },
          { population: 205, total: 205, values: [3, 92, 110], yearAndMonth: '2022-01' },
          { population: 198, total: 198, values: [4, 87, 107], yearAndMonth: '2022-02' },
          { population: 199, total: 199, values: [1, 86, 111], yearAndMonth: '2022-03' },
          { population: 205, total: 205, values: [2, 89, 114], yearAndMonth: '2022-04' },
          { population: 209, total: 209, values: [3, 97, 109], yearAndMonth: '2022-05' },
        ])
      })
    }
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
      const { rows: entries } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(
        moorlandPrisonLevelView,
        characteristic,
      )
      expect(entries).toHaveLength(expectedCharacteristics.length)

      const characteristicTotal = entries.shift()
      expect(characteristicTotal.label).toEqual('All')

      let [sumPositive, sumNegative] = [0, 0]
      entries.forEach(({ values }) => {
        const [entriesPositive, entriesNegative] = values
        sumPositive += entriesPositive
        sumNegative += entriesNegative
      })
      expect(characteristicTotal.values[0]).toEqual(sumPositive)
      expect(characteristicTotal.values[1]).toEqual(sumNegative)
    })

    it(`[${characteristic}]: throws an error when the table is empty`, async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(
        analyticsService.getBehaviourEntriesByProtectedCharacteristic(moorlandPrisonLevelView, characteristic),
      ).rejects.toThrow(AnalyticsError)
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(
        moorlandPrisonLevelView,
        characteristic,
      )
      const characteristics = rows.map(row => row.label)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(
          moorlandPrisonLevelView,
          characteristic,
        )
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<BehaviourEntriesByProtectedCharacteristic[]>([
          {
            label: '15-17',
            values: [0, 0],
          },
        ])
      })

      it(`[${characteristic}]: skips 15-17 group in non-YCS prison`, async () => {
        // make MDI not a YCS by restoring isYouthCustodyService()
        PrisonRegister.isYouthCustodyService = isYouthCustodyServiceOriginal

        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(
          moorlandPrisonLevelView,
          characteristic,
        )
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<BehaviourEntriesByProtectedCharacteristic[]>([])
      })

      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(
          regionalView,
          characteristic,
        )

        expect(rows).toEqual([
          { label: 'All', values: [112, 158] },
          { label: '15-17', values: [0, 0] },
          { label: '18-25', values: [10, 61] },
          { label: '26-35', values: [30, 49] },
          { label: '36-45', values: [39, 28] },
          { label: '46-55', values: [19, 17] },
          { label: '56-65', values: [12, 3] },
          { label: '66+', values: [2, 0] },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(
          nationalView,
          characteristic,
        )

        expect(rows).toEqual([
          { label: 'All', values: [889, 1158] },
          { label: '15-17', values: [0, 0] },
          { label: '18-25', values: [111, 373] },
          { label: '26-35', values: [389, 493] },
          { label: '36-45', values: [242, 214] },
          { label: '46-55', values: [104, 58] },
          { label: '56-65', values: [37, 12] },
          { label: '66+', values: [6, 8] },
        ])
      })
    }
  })

  describe.each(Ethnicities)('getBehaviourEntryTrendsByProtectedCharacteristic()', characteristicGroup => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it(`[${characteristicGroup}]: returns 12 months`, async () => {
      const report = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
        moorlandPrisonLevelView,
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.rows).toHaveLength(12)
    })

    it(`[${characteristicGroup}]: plots percentage values`, async () => {
      const report = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
        moorlandPrisonLevelView,
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.plotPercentage).toBeFalsy()
      expect(report).toHaveProperty('verticalAxisTitle')
    })

    it(`[${characteristicGroup}]: shows population`, async () => {
      const report = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
        moorlandPrisonLevelView,
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.populationIsTotal).toBeFalsy()
      expect(report).toHaveProperty('monthlyTotalName')
      expect(report).toHaveProperty('populationTotalName')
    })

    it(`[${characteristicGroup}]: throws an error when the table is empty`, async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(
        analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
          moorlandPrisonLevelView,
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        ),
      ).rejects.toThrow(AnalyticsError)
    })

    // Test national/regional only on one of the characteristic groups
    if (characteristicGroup === 'Asian or Asian British') {
      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        const { rows } = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
          regionalView,
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
          { population: 40, total: 34, values: [7, 27], yearAndMonth: '2021-06' },
          { population: 35, total: 27, values: [5, 22], yearAndMonth: '2021-07' },
          { population: 33, total: 27, values: [5, 22], yearAndMonth: '2021-08' },
          { population: 32, total: 22, values: [8, 14], yearAndMonth: '2021-09' },
          { population: 31, total: 17, values: [6, 11], yearAndMonth: '2021-10' },
          { population: 34, total: 25, values: [6, 19], yearAndMonth: '2021-11' },
          { population: 36, total: 28, values: [1, 27], yearAndMonth: '2021-12' },
          { population: 36, total: 48, values: [6, 42], yearAndMonth: '2022-01' },
          { population: 35, total: 34, values: [3, 31], yearAndMonth: '2022-02' },
          { population: 34, total: 25, values: [13, 12], yearAndMonth: '2022-03' },
          { population: 33, total: 15, values: [8, 7], yearAndMonth: '2022-04' },
          { population: 32, total: 20, values: [6, 14], yearAndMonth: '2022-05' },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        const { rows } = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
          nationalView,
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
          { population: 223, total: 110, values: [42, 68], yearAndMonth: '2021-06' },
          { population: 217, total: 132, values: [52, 80], yearAndMonth: '2021-07' },
          { population: 211, total: 144, values: [65, 79], yearAndMonth: '2021-08' },
          { population: 206, total: 111, values: [50, 61], yearAndMonth: '2021-09' },
          { population: 207, total: 84, values: [38, 46], yearAndMonth: '2021-10' },
          { population: 208, total: 116, values: [46, 70], yearAndMonth: '2021-11' },
          { population: 208, total: 110, values: [39, 71], yearAndMonth: '2021-12' },
          { population: 205, total: 151, values: [58, 93], yearAndMonth: '2022-01' },
          { population: 198, total: 96, values: [24, 72], yearAndMonth: '2022-02' },
          { population: 199, total: 117, values: [55, 62], yearAndMonth: '2022-03' },
          { population: 205, total: 91, values: [34, 57], yearAndMonth: '2022-04' },
          { population: 209, total: 117, values: [45, 72], yearAndMonth: '2022-05' },
        ])
      })
    }
  })
})
