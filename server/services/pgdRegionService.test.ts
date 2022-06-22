import fs from 'fs'
import path from 'path'

import PgdRegionService from './pgdRegionService'
import { TableType } from './analyticsServiceTypes'

describe('PgdRegion Service', () => {
  it('getAllPgdRegions() returns all PgdRegions', () => {
    const allGroups = PgdRegionService.getAllPgdRegions()
    expect(allGroups.length).toEqual(6)
    expect(allGroups).toContainEqual({ code: 'WM', name: 'West Midlands' })
  })

  describe('getPgdRegionByCode()', () => {
    it('returns the PgdRegion if it can find the prison code', () => {
      const pgdRegion = PgdRegionService.getPgdRegionByCode('WM')
      expect(pgdRegion.name).toEqual('West Midlands')
    })

    it('does not return a PgdRegion if it cannot find one', () => {
      const pgdRegion = PgdRegionService.getPgdRegionByCode('test')
      expect(pgdRegion).toBeNull()
    })
  })

  describe('getPgdRegionByName', () => {
    it('when it can find it by name, returns the correct region', () => {
      const pgdRegion = PgdRegionService.getPgdRegionByName('West Midlands')
      expect(pgdRegion.name).toEqual('West Midlands')
      expect(pgdRegion.code).toEqual('WM')
    })

    it('returns undefined when it cannot find a matching PGD Region', () => {
      const pgdRegion = PgdRegionService.getPgdRegionByName('Non-existant West Midlands')
      expect(pgdRegion).toBeNull()
    })

    it('all PGD regions in the source tables are found', () => {
      const filename = path.resolve(
        __dirname,
        `../testData/s3Bucket/${TableType.behaviourEntriesNational}/2022-06-06.json`,
      )
      const fileContents = fs.readFileSync(filename, { encoding: 'utf8' })
      const pgdRegions = JSON.parse(fileContents).pgd_region

      Object.entries(pgdRegions).forEach(([_, pgdRegionName]) => {
        if (!PgdRegionService.getPgdRegionByName(pgdRegionName as string)) {
          throw new Error(
            `PGD region named '${pgdRegionName}' not recognised, is this a new PGD region? Did the name change?`,
          )
        }
      })
    })
  })
})
