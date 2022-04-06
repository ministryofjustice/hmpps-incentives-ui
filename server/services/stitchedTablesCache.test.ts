import S3Client from '../data/s3Client'
import AnalyticsService, { StitchedTablesCache } from './analyticsService'
import { AnalyticsError, TableType } from './analyticsServiceTypes'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

describe('StitchedTablesCache', () => {
  const s3Client = new S3Client({ region: 'eu-west-1', bucket: 'incentives' }) as jest.Mocked<S3Client>
  const analyticsService = new AnalyticsService(s3Client, () => '')
  const modified = new Date('2022-03-14T12:00:00Z')

  beforeEach(() => {
    s3Client.listObjects.mockClear()
    s3Client.listObjects.mockResolvedValue([{ key: 'behaviour_entries/2022-03-13.json', modified }])
    s3Client.getObject.mockResolvedValue(`{
      "prison": {"1": "ABC", "2": "DEF"},
      "someColumn": {"1": "Value 1", "2": "Value 2"}
    }`)
  })

  describe('clear()', () => {
    const columnsToStitch = ['prison']

    beforeEach(async () => {
      // Warm-up cache
      await StitchedTablesCache.getStitchedTable(analyticsService, TableType.behaviourEntries, columnsToStitch)
      s3Client.listObjects.mockClear()
    })

    it('clears the cache', async () => {
      await StitchedTablesCache.getStitchedTable(analyticsService, TableType.behaviourEntries, columnsToStitch)
      // Fresh data in cache, S3 not used
      expect(s3Client.listObjects).toHaveBeenCalledTimes(0)

      // Clear cache
      StitchedTablesCache.clear()

      // Cache is now empty, takes fresh data from S3
      const { stitchedTable } = await StitchedTablesCache.getStitchedTable(
        analyticsService,
        TableType.behaviourEntries,
        columnsToStitch
      )
      expect(s3Client.listObjects).toHaveBeenCalledTimes(1)
      expect(stitchedTable).toEqual([['ABC'], ['DEF']])
    })
  })

  describe('getStitchedTable()', () => {
    beforeEach(() => {
      StitchedTablesCache.clear()
    })

    it('returns the stitched table and date/updated metadata', async () => {
      const result = await StitchedTablesCache.getStitchedTable(analyticsService, TableType.behaviourEntries, [
        'prison',
        'someColumn',
      ])

      const expectedStitchedTable = [
        ['ABC', 'Value 1'],
        ['DEF', 'Value 2'],
      ]
      expect(result).toEqual({
        stitchedTable: expectedStitchedTable,
        date: new Date(2022, 2, 13),
        modified,
      })
    })

    describe('when errors occur', () => {
      beforeEach(() => {
        s3Client.getObject.mockResolvedValue('{invalid JSON"')
      })

      it('they bubble up', async () => {
        const result = StitchedTablesCache.getStitchedTable(analyticsService, TableType.behaviourEntries, ['prison'])
        await expect(result).rejects.toThrow(AnalyticsError)
      })
    })

    describe('when cache is empty', () => {
      beforeEach(() => {
        StitchedTablesCache.clear()
      })

      it('takes fresh data from S3', async () => {
        await StitchedTablesCache.getStitchedTable(analyticsService, TableType.behaviourEntries, ['prison'])
        // Cache is empty, takes fresh data from S3
        expect(s3Client.listObjects).toHaveBeenCalledTimes(1)
      })
    })

    describe('when cache is expired', () => {
      const columnsToStitch = ['prison']

      beforeEach(async () => {
        // Warm-up cache
        await StitchedTablesCache.getStitchedTable(analyticsService, TableType.behaviourEntries, columnsToStitch)
        s3Client.listObjects.mockClear()

        // Some time passes
        jest.useFakeTimers()
        const now = new Date()
        const future = now.setHours(now.getHours() + 10)
        jest.setSystemTime(future)
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it('takes fresh data from S3', async () => {
        // Cache is stale, takes fresh data from S3
        await StitchedTablesCache.getStitchedTable(analyticsService, TableType.behaviourEntries, columnsToStitch)
        expect(s3Client.listObjects).toHaveBeenCalledTimes(1)
      })
    })

    describe('when stitching different columns from same source table', () => {
      beforeEach(async () => {
        // Warm-up cache but with different set of columns
        const { stitchedTable: stitchedTable1 } = await StitchedTablesCache.getStitchedTable(
          analyticsService,
          TableType.behaviourEntries,
          ['prison', 'someColumn']
        )
        expect(stitchedTable1).toEqual([
          ['ABC', 'Value 1'],
          ['DEF', 'Value 2'],
        ])
        expect(s3Client.listObjects).toHaveBeenCalledTimes(1)
        s3Client.listObjects.mockClear()
      })

      it('gets fresh data from S3', async () => {
        // Same source table, different columns
        const { stitchedTable: stitchedTable2 } = await StitchedTablesCache.getStitchedTable(
          analyticsService,
          TableType.behaviourEntries,
          ['prison']
        )
        expect(stitchedTable2).toEqual([['ABC'], ['DEF']])
        expect(s3Client.listObjects).toHaveBeenCalledTimes(1)
      })
    })

    describe('when stitching from different source table', () => {
      beforeEach(async () => {
        // Warm-up cache but from different source table
        const { stitchedTable } = await StitchedTablesCache.getStitchedTable(
          analyticsService,
          TableType.behaviourEntries,
          ['prison', 'someColumn']
        )
        expect(stitchedTable).toEqual([
          ['ABC', 'Value 1'],
          ['DEF', 'Value 2'],
        ])
        expect(s3Client.listObjects).toHaveBeenCalledTimes(1)
        s3Client.listObjects.mockClear()

        s3Client.listObjects.mockResolvedValue([{ key: 'incentives_latest_narrow/2022-03-13.json', modified }])
        s3Client.getObject.mockResolvedValue(`{
          "prison": {"1": "ABC", "2": "DEF"},
          "incentive": {"1": "Standard", "2": "Enhanced"}
        }`)
      })

      it('gets fresh data from S3', async () => {
        // Same source table, different columns
        const result = await StitchedTablesCache.getStitchedTable(analyticsService, TableType.incentiveLevels, [
          'prison',
          'incentive',
        ])
        expect(result).toEqual({
          date: new Date(2022, 2, 13),
          modified,
          stitchedTable: [
            ['ABC', 'Standard'],
            ['DEF', 'Enhanced'],
          ],
        })
        expect(s3Client.listObjects).toHaveBeenCalledTimes(1)
      })
    })
  })
})
