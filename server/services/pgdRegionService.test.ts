import PgdRegionService from './pgdRegionService'

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
  })
})
