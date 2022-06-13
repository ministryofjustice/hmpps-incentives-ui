import PgdRegionService from './pgdRegionService'

describe('PgdRegion Service', () => {
  it('getAllPgdRegions returns all PgdRegions', async () => {
    const allGroups = PgdRegionService.getAllPgdRegions()
    expect(allGroups.length).toEqual(4)
  })

  it('getPgdRegion returns the PgdRegion if it can find the prison code', async () => {
    const result = PgdRegionService.getPgdRegion('WM')
    expect(result.name).toEqual('West Midlands')
  })

  it('getPgdRegion does not return a PgdRegion if it cannot find one', async () => {
    const result = PgdRegionService.getPgdRegion('test')
    expect(result).toBeUndefined()
  })
})
