import fs from 'fs'
import path from 'path'

import S3Client from '../data/s3Client'
import AnalyticsService from './analyticsService'

jest.mock('@aws-sdk/client-s3')
jest.mock('../data/s3Client')

describe('AnalyticsService', () => {
  let sampleCaseEntriesTable: string
  let analyticsService: AnalyticsService

  const s3Client = new S3Client({ bucket: 'test-bucket' }) as jest.Mocked<S3Client>

  beforeAll(done => {
    fs.readFile(path.resolve(__dirname, '../testData/s3Bucket/caseEntries.json'), { encoding: 'utf8' }, (err, data) => {
      sampleCaseEntriesTable = data
      done()
    })
  })

  beforeEach(() => {
    analyticsService = new AnalyticsService(s3Client, () => '')
  })

  const prisonLocations = [
    ['MDI', ['All', '1', '2', '3', '4', '5', '6', '7', 'H', 'SEG']],
    ['BWI', ['All', 'B', 'C', 'F', 'H', 'M', 'O', 'P', 'R', 'V']],
  ]

  describe('getBehaviourEntriesByLocation()', () => {
    beforeEach(() => {
      s3Client.getObject.mockResolvedValue(sampleCaseEntriesTable)
    })

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

    describe.each(prisonLocations)(
      'lists locations in the correct order',
      (prison: string, expectedLocations: string[]) => {
        it(`for ${prison}`, async () => {
          const { report } = await analyticsService.getBehaviourEntriesByLocation(prison)
          const locations = report.map(row => row.location)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )
  })

  describe('getPrisonersWithEntriesByLocation()', () => {
    beforeEach(() => {
      s3Client.getObject.mockResolvedValue(sampleCaseEntriesTable)
    })

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

    describe.each(prisonLocations)(
      'lists locations in the correct order',
      (prison: string, expectedLocations: string[]) => {
        it(`for ${prison}`, async () => {
          const { report } = await analyticsService.getPrisonersWithEntriesByLocation(prison)
          const locations = report.map(row => row.location)
          expect(locations).toEqual(expectedLocations)
        })
      }
    )
  })

  describe('getIncentiveLevelsByLocation()', () => {
    it('has a totals row', async () => {
      const { columns, report: prisonersOnLevels } = await analyticsService.getIncentiveLevelsByLocation('MDI')
      expect(prisonersOnLevels).toHaveLength(10)

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
})
