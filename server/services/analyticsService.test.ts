import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

import S3Client from '../data/s3Client'
import AnalyticsService from './analyticsService'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

const s3Client = new S3Client('test-bucket') as jest.Mocked<S3Client>

describe('AnalyticsService', () => {
  let sampleCaseEntriesTable: string
  let analyticsService: AnalyticsService

  beforeAll(done => {
    fs.readFile(path.resolve(__dirname, 'testData/caseEntries.json.gz'), (readErr, gzdata) => {
      zlib.gunzip(gzdata, (gunzipErr, data) => {
        sampleCaseEntriesTable = data.toString()
        done()
      })
    })
  })

  beforeEach(() => {
    analyticsService = new AnalyticsService(s3Client, () => '')
  })

  describe('getBehaviourEntriesByLocation()', () => {
    it('has a totals row', async () => {
      s3Client.getObject.mockResolvedValue(sampleCaseEntriesTable)

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
