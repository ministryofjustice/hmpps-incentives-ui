import IncentiveLevelForm, { type IncentiveLevelData } from './incentiveLevelForm'

describe('IncentiveLevelForm', () => {
  const formId = 'test-form-1' as const

  const validData: Partial<IncentiveLevelData>[] = [
    { name: 'Standard', availability: 'required' },
    { code: 'BAS', name: 'Basic', availability: 'active' },
    { code: 'ENT', name: 'Entry', availability: 'inactive' },
  ]
  it.each(validData)('with valid data', (testCase: Partial<IncentiveLevelData>) => {
    const form = new IncentiveLevelForm(formId)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  const invalidData: unknown[] = [
    {},
    { name: 'Standard' },
    { code: '', name: 'Standard', availability: 'required' },
    { code: 'BAS', name: '', availability: 'required' },
    { code: 'BAS', name: 'Basic', availability: 'none' },
  ]
  it.each(invalidData)('with invalid data', (testCase: unknown) => {
    const form = new IncentiveLevelForm(formId)
    form.submit({ formId, ...(testCase as Partial<IncentiveLevelData>) })
    expect(form.hasErrors).toBeTruthy()
  })
})
