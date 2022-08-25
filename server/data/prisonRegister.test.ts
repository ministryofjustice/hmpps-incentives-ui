import PrisonRegister from './prisonRegister'

describe('PrisonRegister', () => {
  describe.each(
    // known subset of YCS and Womens estate
    ['BZI', 'CKI', 'FYI', 'PYI', 'PFI'],
  )('correctly identifies prisons that house young people', prison => {
    it(prison, () => {
      expect(PrisonRegister.housesYoungPeople(prison)).toBeTruthy()
    })
  })

  describe.each(
    // YOIs known to not be YCS and adult prisons
    ['BWI', 'FMI', 'MDI', 'PBI', 'PRI', 'WRI'],
  )('correctly identifies prisons that do not house young people', prison => {
    it(prison, () => {
      expect(PrisonRegister.housesYoungPeople(prison)).toBeFalsy()
    })
  })
})
