import IncentiveLevelReorderForm, { type IncentiveLevelReorderData } from './incentiveLevelReorderForm'

describe('IncentiveLevelReorderForm', () => {
  const formId = 'test-form-1' as const

  const validData: Partial<IncentiveLevelReorderData>[] = [
    { code: 'ENT', direction: 'up' },
    { code: 'EN3', direction: 'down' },
  ]
  it.each(validData)('with valid data', (testCase: Partial<IncentiveLevelReorderData>) => {
    const form = new IncentiveLevelReorderForm(formId)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  const invalidData: unknown[] = [
    {},
    { code: 'ENT' },
    { code: '', direction: 'up' },
    { code: 'ENT', direction: 'higher' },
  ]
  it.each(invalidData)('with invalid data', (testCase: unknown) => {
    const form = new IncentiveLevelReorderForm(formId)
    form.submit({ formId, ...(testCase as Partial<IncentiveLevelReorderData>) })
    expect(form.hasErrors).toBeTruthy()
  })
})
