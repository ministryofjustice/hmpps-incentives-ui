import promClient, { type metric as PromMetric } from 'prom-client'

import config from '../config'
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
import AnalyticsView from './analyticsView'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

const cache = new MemoryStitchedTablesCache()

const isYouthCustodyServiceOriginal = PrisonRegister.isYouthCustodyService

const prisonLocations = {
  MDI: [
    'All',
    'Houseblock 1',
    'Houseblock 2',
    'Houseblock 3',
    'Houseblock 4',
    'Houseblock 5',
    'Houseblock 6',
    'Houseblock 7',
    'Houseblock 8',
    'Segregation Unit',
  ],
  BWI: ['All', 'Alwen', 'Bala', 'Casu', 'Ceiriog'],
}
// Behaviour entries source tables don't filter out `Non-wing` location
const prisonLocationsBehaviourEntries = {
  MDI: [
    'All',
    'Houseblock 1',
    'Houseblock 2',
    'Houseblock 3',
    'Houseblock 4',
    'Houseblock 5',
    'Houseblock 6',
    'Houseblock 7',
    'Houseblock 8',
    'Segregation Unit',
    'Non-wing',
  ],
  BWI: ['All', 'Alwen', 'Bala', 'Casu', 'Ceiriog'],
}

const prisonLevels = {
  MDI: ['Basic', 'Standard', 'Enhanced'],
  BWI: ['Basic', 'Standard', 'Enhanced'],
}

let nationalView: AnalyticsView
const regionalView = new AnalyticsView('LTHS', 'behaviour-entries', 'MDI')
const moorlandPrisonLevelView = new AnalyticsView(null, 'behaviour-entries', 'MDI')

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService

  const s3Client = new S3Client({ region: 'eu-west-1', bucket: 'incentives' }) as jest.Mocked<S3Client>

  beforeEach(() => {
    jest.resetAllMocks()
    cache.clear()
    analyticsService = new AnalyticsService(s3Client, cache, moorlandPrisonLevelView)
  })

  describe('findTable()', () => {
    it('returns a table when there is only one candidate', async () => {
      const modified = new Date('2022-03-14T12:00:00Z')
      s3Client.listObjects.mockResolvedValue([{ key: 'behaviour_entries/2022-03-13.json', modified }])
      s3Client.getObject.mockResolvedValue('{"column":{"1":1,"2":2}}')

      await expect(analyticsService.findTable(TableType.behaviourEntriesPrison)).resolves.toEqual({
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

      await expect(analyticsService.findTable(TableType.behaviourEntriesPrison)).resolves.toEqual({
        table: { column: { '1': 1, '2': 2 } },
        date: new Date(2022, 2, 13),
        modified,
      })
      expect(s3Client.getObject).toBeCalledWith('behaviour_entries/2022-03-13.json')
    })

    it('throws an error when it cannot find a table', async () => {
      s3Client.listObjects.mockResolvedValue([])

      await expect(analyticsService.findTable(TableType.behaviourEntriesPrison)).rejects.toThrow(AnalyticsError)
    })

    it('throws an error when object contents cannot be parsed', async () => {
      const modified = new Date('2022-03-14T12:00:00Z')
      s3Client.listObjects.mockResolvedValue([{ key: 'behaviour_entries/2022-03-13.json', modified }])
      s3Client.getObject.mockResolvedValue('{"column":')

      await expect(analyticsService.findTable(TableType.behaviourEntriesPrison)).rejects.toThrow(AnalyticsError)
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
    type MappedRow = { label: string; values: [number] }

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
        ([category, valA, valB]) => {
          return { label: category, values: [valA + valB] }
        },
        1,
      )
      expect(output).toEqual<MappedRow[]>([
        { label: 'A', values: [6] },
        { label: 'B', values: [20] },
        { label: 'C', values: [10] },
        { label: 'All', values: [36] },
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
      const { rows: entries } = await analyticsService.getBehaviourEntriesByLocation()
      expect(entries).toHaveLength(prisonLocationsBehaviourEntries.MDI.length)

      const prisonTotal = entries.shift()
      expect(prisonTotal.label).toEqual('All')
      expect(prisonTotal.href).toBeNull()

      let [sumPositive, sumNegative] = [0, 0]
      entries.forEach(({ values }) => {
        const [entriesPositive, entriesNegative] = values
        sumPositive += entriesPositive
        sumNegative += entriesNegative
      })
      expect(prisonTotal.values[0]).toEqual(sumPositive)
      expect(prisonTotal.values[1]).toEqual(sumNegative)
    })

    it('rows (other than totals) include location codes', async () => {
      const { rows } = await analyticsService.getBehaviourEntriesByLocation()
      const [totalsRow, ...locationRows] = rows
      expect(locationRows.every(row => !!row.locationCode)).toBeTruthy()
      expect(totalsRow.locationCode).toBeUndefined()
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getBehaviourEntriesByLocation()).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocationsBehaviourEntries))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, 'behaviour-entries', prison)
          analyticsService = new AnalyticsService(s3Client, cache, prisonLevelView)
          const { rows } = await analyticsService.getBehaviourEntriesByLocation()
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      },
    )

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      analyticsService = new AnalyticsService(s3Client, cache, regionalView)
      const { rows } = await analyticsService.getBehaviourEntriesByLocation()

      expect(rows).toEqual([
        { href: null, label: 'All', values: [121, 185] },
        { href: null, label: 'Whitemoor (HMP)', values: [121, 185] },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      nationalView = new AnalyticsView('National', 'behaviour-entries', 'MDI')
      analyticsService = new AnalyticsService(s3Client, cache, nationalView)
      const { rows } = await analyticsService.getBehaviourEntriesByLocation()

      expect(rows).toEqual([
        { href: null, label: 'All', values: [27065, 33204] },
        { href: '/analytics/ASD/behaviour-entries', label: 'Avon and South Dorset', values: [700, 765] },
        {
          href: '/analytics/BCN/behaviour-entries',
          label: 'Bedfordshire, Cambridgeshire and Norfolk',
          values: [1447, 1423],
        },
        { href: '/analytics/CNTR/behaviour-entries', label: 'Contracted', values: [3241, 4316] },
        { href: '/analytics/CL/behaviour-entries', label: 'Cumbria and Lancashire', values: [647, 1111] },
        { href: '/analytics/DND/behaviour-entries', label: 'Devon and North Dorset', values: [615, 1196] },
        { href: '/analytics/EM/behaviour-entries', label: 'East Midlands', values: [911, 1299] },
        {
          href: '/analytics/GMMC/behaviour-entries',
          label: 'Greater Manchester, Merseyside and Cheshire',
          values: [1013, 1060],
        },
        { href: '/analytics/HES/behaviour-entries', label: 'Hertfordshire, Essex and Suffolk', values: [1523, 1496] },
        {
          href: '/analytics/IFNP/behaviour-entries',
          label: 'Immigration and foreign national prisons',
          values: [575, 321],
        },
        { href: '/analytics/KSS/behaviour-entries', label: 'Kent, Surrey and Sussex', values: [1402, 1550] },
        { href: '/analytics/LNDN/behaviour-entries', label: 'London', values: [2483, 2934] },
        { href: '/analytics/LTHS/behaviour-entries', label: 'Long-term and high security', values: [2621, 3587] },
        { href: '/analytics/NM/behaviour-entries', label: 'North Midlands', values: [1539, 1386] },
        { href: '/analytics/SC/behaviour-entries', label: 'South Central', values: [769, 986] },
        { href: '/analytics/TW/behaviour-entries', label: 'Tees and Wear', values: [462, 971] },
        { href: '/analytics/WLS/behaviour-entries', label: 'Wales', values: [650, 1043] },
        { href: '/analytics/WM/behaviour-entries', label: 'West Midlands', values: [1262, 2194] },
        { href: '/analytics/WMN/behaviour-entries', label: 'Women', values: [1643, 1234] },
        { href: '/analytics/YRKS/behaviour-entries', label: 'Yorkshire', values: [1774, 2231] },
        { href: '/analytics/YCS/behaviour-entries', label: 'Youth custody service', values: [1788, 2101] },
      ])
    })
  })

  describe('getPrisonersWithEntriesByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it(`has correct 'All' row`, async () => {
      const { rows } = await analyticsService.getPrisonersWithEntriesByLocation()
      expect(rows).toHaveLength(prisonLocationsBehaviourEntries.MDI.length)

      const allRow = rows.shift()
      expect(allRow).toEqual({ href: null, label: 'All', values: [122, 145, 26, 746] })
    })

    it('rows (other than totals) include location codes', async () => {
      const { rows } = await analyticsService.getPrisonersWithEntriesByLocation()
      const [totalsRow, ...locationRows] = rows
      expect(locationRows.every(row => !!row.locationCode)).toBeTruthy()
      expect(totalsRow.locationCode).toBeUndefined()
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getPrisonersWithEntriesByLocation()).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocationsBehaviourEntries))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, 'behaviour-entries', prison)
          analyticsService = new AnalyticsService(s3Client, cache, prisonLevelView)
          const { rows } = await analyticsService.getPrisonersWithEntriesByLocation()
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      },
    )

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      analyticsService = new AnalyticsService(s3Client, cache, regionalView)
      const { rows } = await analyticsService.getPrisonersWithEntriesByLocation()

      expect(rows).toEqual([
        { href: null, label: 'All', values: [1374, 1389, 409, 5646] },
        { href: null, label: 'Whitemoor (HMP)', values: [59, 82, 14, 171] },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      nationalView = new AnalyticsView('National', 'behaviour-entries', 'MDI')
      analyticsService = new AnalyticsService(s3Client, cache, nationalView)
      const { rows } = await analyticsService.getPrisonersWithEntriesByLocation()

      expect(rows).toEqual([
        { href: null, label: 'All', values: [13690, 12855, 3708, 57054] },
        { href: '/analytics/ASD/behaviour-entries', label: 'Avon and South Dorset', values: [347, 265, 96, 1571] },
        {
          href: '/analytics/BCN/behaviour-entries',
          label: 'Bedfordshire, Cambridgeshire and Norfolk',
          values: [662, 478, 237, 2592],
        },
        { href: '/analytics/CNTR/behaviour-entries', label: 'Contracted', values: [1790, 2163, 364, 11286] },
        { href: '/analytics/CL/behaviour-entries', label: 'Cumbria and Lancashire', values: [422, 467, 77, 2450] },
        { href: '/analytics/DND/behaviour-entries', label: 'Devon and North Dorset', values: [319, 386, 111, 1536] },
        { href: '/analytics/EM/behaviour-entries', label: 'East Midlands', values: [500, 454, 112, 1979] },
        {
          href: '/analytics/GMMC/behaviour-entries',
          label: 'Greater Manchester, Merseyside and Cheshire',
          values: [560, 455, 114, 2358],
        },
        {
          href: '/analytics/HES/behaviour-entries',
          label: 'Hertfordshire, Essex and Suffolk',
          values: [860, 600, 188, 2336],
        },
        {
          href: '/analytics/IFNP/behaviour-entries',
          label: 'Immigration and foreign national prisons',
          values: [329, 146, 52, 822],
        },
        { href: '/analytics/KSS/behaviour-entries', label: 'Kent, Surrey and Sussex', values: [696, 616, 196, 2463] },
        { href: '/analytics/LNDN/behaviour-entries', label: 'London', values: [1231, 1177, 288, 4541] },
        {
          href: '/analytics/LTHS/behaviour-entries',
          label: 'Long-term and high security',
          values: [1374, 1389, 409, 5646],
        },
        { href: '/analytics/NM/behaviour-entries', label: 'North Midlands', values: [859, 504, 188, 2342] },
        { href: '/analytics/SC/behaviour-entries', label: 'South Central', values: [448, 390, 103, 1902] },
        { href: '/analytics/TW/behaviour-entries', label: 'Tees and Wear', values: [256, 486, 61, 2208] },
        { href: '/analytics/WLS/behaviour-entries', label: 'Wales', values: [449, 528, 63, 4544] },
        { href: '/analytics/WM/behaviour-entries', label: 'West Midlands', values: [699, 938, 193, 3790] },
        { href: '/analytics/WMN/behaviour-entries', label: 'Women', values: [766, 370, 243, 1405] },
        { href: '/analytics/YRKS/behaviour-entries', label: 'Yorkshire', values: [1047, 1008, 229, 4284] },
        { href: '/analytics/YCS/behaviour-entries', label: 'Youth custody service', values: [120, 138, 357, 126] },
      ])
    })
  })

  describe('getIncentiveLevelsByLocation()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('has a totals row', async () => {
      const { columns, rows: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation()
      expect(prisonersOnLevels).toHaveLength(prisonLocations.MDI.length)

      const prisonTotal = prisonersOnLevels.shift()
      expect(prisonTotal.label).toEqual('All')
      expect(prisonTotal.href).toBeNull()

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

    it('rows (other than totals) include location codes', async () => {
      const { rows } = await analyticsService.getIncentiveLevelsByLocation()
      const [totalsRow, ...locationRows] = rows
      expect(locationRows.every(row => !!row.locationCode)).toBeTruthy()
      expect(totalsRow.locationCode).toBeUndefined()
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelsByLocation()).rejects.toThrow(AnalyticsError)
    })

    describe.each(Object.entries(prisonLocations))(
      'lists locations in the correct order',
      (prison, expectedLocations) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, 'behaviour-entries', prison)
          analyticsService = new AnalyticsService(s3Client, cache, prisonLevelView)
          const { rows } = await analyticsService.getIncentiveLevelsByLocation()
          const locations = rows.map(row => row.label)
          expect(locations).toEqual(expectedLocations)
        })
      },
    )

    describe.each(Object.entries(prisonLevels))('lists levels in the correct order', (prison, levels) => {
      it(`for ${prison}`, async () => {
        const prisonLevelView = new AnalyticsView(null, 'behaviour-entries', prison)
        analyticsService = new AnalyticsService(s3Client, cache, prisonLevelView)
        const { columns } = await analyticsService.getIncentiveLevelsByLocation()
        expect(columns).toEqual(levels)
      })
    })

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      analyticsService = new AnalyticsService(s3Client, cache, regionalView)
      const { rows } = await analyticsService.getIncentiveLevelsByLocation()

      expect(rows).toEqual([
        { href: null, label: 'All', values: [8, 91, 221] },
        { href: null, label: 'Whitemoor (HMP)', values: [8, 91, 221] },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      nationalView = new AnalyticsView('National', 'incentive-levels', 'MDI')
      analyticsService = new AnalyticsService(s3Client, cache, nationalView)
      const { rows } = await analyticsService.getIncentiveLevelsByLocation()

      expect(rows).toEqual([
        { href: null, label: 'All', values: [78, 1306, 1710] },
        { href: '/analytics/LTHS/incentive-levels', label: 'Long-term and high security', values: [8, 91, 221] },
        { href: '/analytics/WLS/incentive-levels', label: 'Wales', values: [42, 694, 1093] },
        { href: '/analytics/YRKS/incentive-levels', label: 'Yorkshire', values: [28, 521, 396] },
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

      await expect(analyticsService.getIncentiveLevelsByProtectedCharacteristic(characteristic)).rejects.toThrow(
        AnalyticsError,
      )
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(characteristic)
      const characteristics = rows.map(row => row.label)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(characteristic)
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

        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(characteristic)
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([])
      })

      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, regionalView)
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(characteristic)

        expect(rows).toEqual([
          { label: 'All', values: [8, 91, 221] },
          { label: '15-17', values: [0, 0, 0] },
          { label: '18-25', values: [4, 19, 19] },
          { label: '26-35', values: [2, 35, 66] },
          { label: '36-45', values: [1, 21, 60] },
          { label: '46-55', values: [1, 9, 41] },
          { label: '56-65', values: [0, 6, 29] },
          { label: '66+', values: [0, 1, 6] },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, nationalView)
        const { rows } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(characteristic)

        expect(rows).toEqual([
          { label: 'All', values: [78, 1306, 1710] },
          { label: '15-17', values: [0, 0, 0] },
          { label: '18-25', values: [33, 322, 198] },
          { label: '26-35', values: [30, 478, 616] },
          { label: '36-45', values: [8, 285, 450] },
          { label: '46-55', values: [5, 138, 273] },
          { label: '56-65', values: [1, 51, 112] },
          { label: '66+', values: [1, 32, 61] },
        ])
      })
    }

    describe.each(Object.entries(prisonLevels))(
      `[${characteristic}]: lists levels in the correct order`,
      (prison, levels) => {
        it(`for ${prison}`, async () => {
          const prisonLevelView = new AnalyticsView(null, 'behaviour-entries', prison)
          analyticsService = new AnalyticsService(s3Client, cache, prisonLevelView)
          const { columns } = await analyticsService.getIncentiveLevelsByProtectedCharacteristic(characteristic)
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
      const report = await analyticsService.getBehaviourEntryTrends()
      expect(report.rows).toHaveLength(12)
    })

    it('plots percentage values', async () => {
      const report = await analyticsService.getBehaviourEntryTrends()
      expect(report.plotPercentage).toBeFalsy()
      expect(report).toHaveProperty('verticalAxisTitle')
    })

    it('shows population', async () => {
      const report = await analyticsService.getBehaviourEntryTrends()
      expect(report.populationIsTotal).toBeFalsy()
      expect(report).toHaveProperty('monthlyTotalName')
      report.rows
        // TODO: remove filter when full 12 months provided in sample data
        .filter(row => row.population !== 0)
        .forEach(row => expect(row.total).not.toBeCloseTo(row.population))
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getBehaviourEntryTrends()).rejects.toThrow(AnalyticsError)
    })

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      analyticsService = new AnalyticsService(s3Client, cache, regionalView)
      const { rows } = await analyticsService.getBehaviourEntryTrends()

      expect(rows).toEqual([
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
        { population: 330, total: 338, values: [140, 198], yearAndMonth: '2022-06' },
        { population: 320, total: 279, values: [126, 153], yearAndMonth: '2022-07' },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      analyticsService = new AnalyticsService(s3Client, cache, nationalView)
      const { rows } = await analyticsService.getBehaviourEntryTrends()

      expect(rows).toEqual([
        { population: 3059, total: 2373, values: [971, 1402], yearAndMonth: '2021-08' },
        { population: 3047, total: 2327, values: [937, 1390], yearAndMonth: '2021-09' },
        { population: 3036, total: 2153, values: [786, 1367], yearAndMonth: '2021-10' },
        { population: 3057, total: 2408, values: [840, 1568], yearAndMonth: '2021-11' },
        { population: 3060, total: 2252, values: [715, 1537], yearAndMonth: '2021-12' },
        { population: 3066, total: 2302, values: [915, 1387], yearAndMonth: '2022-01' },
        { population: 3054, total: 1853, values: [641, 1212], yearAndMonth: '2022-02' },
        { population: 3059, total: 2294, values: [850, 1444], yearAndMonth: '2022-03' },
        { population: 3063, total: 2334, values: [938, 1396], yearAndMonth: '2022-04' },
        { population: 3069, total: 2372, values: [983, 1389], yearAndMonth: '2022-05' },
        { population: 3215, total: 2347, values: [1008, 1339], yearAndMonth: '2022-06' },
        { population: 3100, total: 2299, values: [930, 1369], yearAndMonth: '2022-07' },
      ])
    })
  })

  describe('getIncentiveLevelTrends()', () => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it('returns 12 months', async () => {
      const report = await analyticsService.getIncentiveLevelTrends()
      expect(report.rows).toHaveLength(12)
    })

    it('plots absolute values', async () => {
      const report = await analyticsService.getIncentiveLevelTrends()
      expect(report.plotPercentage).toBeTruthy()
      expect(report).not.toHaveProperty('verticalAxisTitle')
    })

    it('does not show population', async () => {
      const report = await analyticsService.getIncentiveLevelTrends()
      expect(report.populationIsTotal).toBeTruthy()
      expect(report).not.toHaveProperty('monthlyTotalName')
      report.rows
        // TODO: remove filter when full 12 months provided in sample data
        .filter(row => row.population !== 0)
        .forEach(row => expect(row.total).toBeCloseTo(row.population))
    })

    it('throws an error when the table is empty', async () => {
      mockAppS3ClientResponse(s3Client, MockTable.Empty)

      await expect(analyticsService.getIncentiveLevelTrends()).rejects.toThrow(AnalyticsError)
    })

    it('PGD region filtering returns correct prisons grouping and figures', async () => {
      analyticsService = new AnalyticsService(s3Client, cache, regionalView)
      const { rows } = await analyticsService.getIncentiveLevelTrends()

      expect(rows).toEqual([
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
        { population: 330, total: 330, values: [10, 98, 223], yearAndMonth: '2022-06' },
        { population: 320, total: 320, values: [8, 92, 220], yearAndMonth: '2022-07' },
      ])
    })

    it('national filtering returns correct PGD regions grouping and figures', async () => {
      analyticsService = new AnalyticsService(s3Client, cache, nationalView)
      const { rows } = await analyticsService.getIncentiveLevelTrends()

      expect(rows).toEqual([
        { population: 3059, total: 3059, values: [13, 1470, 1576], yearAndMonth: '2021-08' },
        { population: 3047, total: 3047, values: [29, 1405, 1613], yearAndMonth: '2021-09' },
        { population: 3036, total: 3036, values: [41, 1388, 1607], yearAndMonth: '2021-10' },
        { population: 3057, total: 3057, values: [44, 1403, 1609], yearAndMonth: '2021-11' },
        { population: 3060, total: 3060, values: [58, 1421, 1582], yearAndMonth: '2021-12' },
        { population: 3066, total: 3066, values: [54, 1427, 1586], yearAndMonth: '2022-01' },
        { population: 3054, total: 3054, values: [59, 1383, 1612], yearAndMonth: '2022-02' },
        { population: 3059, total: 3059, values: [60, 1353, 1645], yearAndMonth: '2022-03' },
        { population: 3063, total: 3064, values: [60, 1360, 1643], yearAndMonth: '2022-04' },
        { population: 3069, total: 3069, values: [58, 1359, 1652], yearAndMonth: '2022-05' },
        { population: 3215, total: 3215, values: [86, 1391, 1739], yearAndMonth: '2022-06' },
        { population: 3100, total: 3100, values: [75, 1331, 1694], yearAndMonth: '2022-07' },
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
        await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)
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

      await expect(analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)).rejects.toThrow(
        AnalyticsError,
      )
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)
      const characteristics = rows.map(row => row.label)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)
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

        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<PrisonersOnLevelsByProtectedCharacteristic[]>([])
      })

      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, regionalView)
        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)

        expect(rows).toEqual([
          { label: 'All', values: [59, 84, 15, 162] },
          { label: '15-17', values: [0, 0, 0, 0] },
          { label: '18-25', values: [5, 19, 4, 14] },
          { label: '26-35', values: [14, 37, 2, 50] },
          { label: '36-45', values: [18, 11, 4, 49] },
          { label: '46-55', values: [10, 11, 3, 27] },
          { label: '56-65', values: [10, 6, 2, 17] },
          { label: '66+', values: [2, 0, 0, 5] },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, nationalView)
        const { rows } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)

        expect(rows).toEqual([
          { label: 'All', values: [513, 532, 94, 1955] },
          { label: '15-17', values: [0, 0, 0, 0] },
          { label: '18-25', values: [78, 183, 22, 270] },
          { label: '26-35', values: [206, 225, 36, 657] },
          { label: '36-45', values: [129, 66, 24, 524] },
          { label: '46-55', values: [70, 42, 8, 296] },
          { label: '56-65', values: [26, 12, 4, 122] },
          { label: '66+', values: [4, 4, 0, 86] },
        ])
      })
    }

    it(`[${characteristic}]: lists profiles in the correct order`, async () => {
      const { columns } = await analyticsService.getPrisonersWithEntriesByProtectedCharacteristic(characteristic)
      expect(columns).toEqual(['Positive', 'Negative', 'Both', 'None'])
    })
  })

  describe.each(Ethnicities)('getIncentiveLevelTrendsByCharacteristic()', characteristicGroup => {
    beforeEach(() => {
      mockAppS3ClientResponse(s3Client)
    })

    it(`[${characteristicGroup}]: returns 12 months`, async () => {
      const report = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.rows).toHaveLength(12)
    })

    it(`[${characteristicGroup}]: plots percentage values`, async () => {
      const report = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.plotPercentage).toBeTruthy()
    })

    it(`[${characteristicGroup}]: shows population`, async () => {
      const report = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
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
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        ),
      ).rejects.toThrow(AnalyticsError)
    })

    // Test national/regional only on one of the characteristic groups
    if (characteristicGroup === 'Asian or Asian British') {
      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, regionalView)
        const { rows } = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
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
          { population: 33, total: 33, values: [1, 9, 23], yearAndMonth: '2022-06' },
          { population: 31, total: 31, values: [1, 6, 24], yearAndMonth: '2022-07' },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, nationalView)
        const { rows } = await analyticsService.getIncentiveLevelTrendsByCharacteristic(
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
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
          { population: 230, total: 230, values: [4, 111, 115], yearAndMonth: '2022-06' },
          { population: 211, total: 211, values: [4, 92, 114], yearAndMonth: '2022-07' },
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
      const { rows: entries } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(characteristic)
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

      await expect(analyticsService.getBehaviourEntriesByProtectedCharacteristic(characteristic)).rejects.toThrow(
        AnalyticsError,
      )
    })

    it(`[${characteristic}]: lists groups in the correct order`, async () => {
      const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(characteristic)
      const characteristics = rows.map(row => row.label)
      expect(characteristics).toEqual(expectedCharacteristics)
    })

    if (characteristic === ProtectedCharacteristic.Age) {
      it(`[${characteristic}]: adds missing 15-17 group with all zeros in YCS prison`, async () => {
        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(characteristic)
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

        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(characteristic)
        const zeroRows = rows.filter(({ label: someCharacteristic }) => someCharacteristic === '15-17')
        expect(zeroRows).toEqual<BehaviourEntriesByProtectedCharacteristic[]>([])
      })

      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, regionalView)
        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(characteristic)

        expect(rows).toEqual([
          { label: 'All', values: [127, 209] },
          { label: '15-17', values: [0, 0] },
          { label: '18-25', values: [13, 57] },
          { label: '26-35', values: [29, 72] },
          { label: '36-45', values: [40, 43] },
          { label: '46-55', values: [23, 25] },
          { label: '56-65', values: [19, 12] },
          { label: '66+', values: [3, 0] },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, nationalView)
        const { rows } = await analyticsService.getBehaviourEntriesByProtectedCharacteristic(characteristic)

        expect(rows).toEqual([
          { label: 'All', values: [831, 1237] },
          { label: '15-17', values: [0, 0] },
          { label: '18-25', values: [130, 430] },
          { label: '26-35', values: [339, 524] },
          { label: '36-45', values: [213, 167] },
          { label: '46-55', values: [107, 87] },
          { label: '56-65', values: [37, 20] },
          { label: '66+', values: [5, 9] },
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
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.rows).toHaveLength(12)
    })

    it(`[${characteristicGroup}]: plots percentage values`, async () => {
      const report = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
        ProtectedCharacteristic.Ethnicity,
        characteristicGroup,
      )
      expect(report.plotPercentage).toBeFalsy()
      expect(report).toHaveProperty('verticalAxisTitle')
    })

    it(`[${characteristicGroup}]: shows population`, async () => {
      const report = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
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
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        ),
      ).rejects.toThrow(AnalyticsError)
    })

    // Test national/regional only on one of the characteristic groups
    if (characteristicGroup === 'Asian or Asian British') {
      it('PGD region filtering returns correct prisons grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, regionalView)
        const { rows } = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
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
          { population: 33, total: 19, values: [7, 12], yearAndMonth: '2022-06' },
          { population: 31, total: 22, values: [8, 14], yearAndMonth: '2022-07' },
        ])
      })

      it('national filtering returns correct PGD regions grouping and figures', async () => {
        analyticsService = new AnalyticsService(s3Client, cache, nationalView)
        const { rows } = await analyticsService.getBehaviourEntryTrendsByProtectedCharacteristic(
          ProtectedCharacteristic.Ethnicity,
          characteristicGroup,
        )

        expect(rows).toEqual([
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
          { population: 230, total: 123, values: [56, 67], yearAndMonth: '2022-06' },
          { population: 211, total: 121, values: [48, 73], yearAndMonth: '2022-07' },
        ])
      })
    }
  })

  describe('Prometheus stale analytics data gauge', () => {
    beforeAll(() => {
      config.analyticsDataStaleAferDays = 3
      jest.useFakeTimers()
    })

    afterAll(() => {
      config.analyticsDataStaleAferDays = 0
      jest.useRealTimers()
    })

    beforeEach(() => {
      promClient.register.resetMetrics()
      mockAppS3ClientResponse(s3Client)
    })

    async function getStaleAnalyticsMetrics() {
      const metrics = await promClient.register.getMetricsAsJSON()
      const staleAnalyticsMetric = metrics[0] as PromMetric & {
        values: { value: number; labels: Record<string, string> }[]
      }
      expect(staleAnalyticsMetric.name).toEqual<string>('incentives_stale_analytics_data')
      expect(staleAnalyticsMetric.values).toHaveLength(1)
      return staleAnalyticsMetric.values[0]
    }

    it('set to 1 when a source table is stale', async () => {
      jest.setSystemTime(new Date('2022-08-08T12:15:00Z')) // 4 days after test source table date

      // load a table twice because only cached tables get checked for staleness
      await analyticsService.getIncentiveLevelsByLocation()
      await analyticsService.getIncentiveLevelsByLocation()

      // expect a stale behaviour entries table
      const { value, labels } = await getStaleAnalyticsMetrics()
      expect(value).toEqual<number>(1)
      expect(labels).toEqual({ table_type: TableType.incentiveLevels })
    })

    it('set to 0 when a source table is fresh', async () => {
      jest.setSystemTime(new Date('2022-08-04T22:15:00Z')) // same day as test source table date

      // load a table twice because only cached tables get checked for staleness
      await analyticsService.getIncentiveLevelsByLocation()
      await analyticsService.getIncentiveLevelsByLocation()

      // expect a fresh incentives table
      const { value, labels } = await getStaleAnalyticsMetrics()
      expect(value).toEqual<number>(0)
      expect(labels).toEqual({ table_type: TableType.incentiveLevels })
    })
  })
})
