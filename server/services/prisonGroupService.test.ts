import PrisonGroupService from './prisonGroupService'

describe('Prison Group Service', () => {
  it('getAllPrisonGroups returns all groups', async () => {
    const allGroups = PrisonGroupService.getAllPrisonGroups()
    expect(allGroups.length).toEqual(4)
  })

  it('getPrisonGroup returns the group if it can find the prison code', async () => {
    const result = PrisonGroupService.getPrisonGroup('WM')
    expect(result.name).toEqual('West Midlands')
  })

  it('getPrisonGroup does not return a group if it cannot find one', async () => {
    const result = PrisonGroupService.getPrisonGroup('test')
    expect(result).toBeUndefined()
  })
})
