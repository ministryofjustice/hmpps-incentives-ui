import IncentiveLevelForm, { type IncentiveLevelData } from './incentiveLevelForm'

describe('IncentiveLevelForm', () => {
  const formId = 'test-form-1'

  const validData: Partial<IncentiveLevelData>[] = [
    { description: 'Standard', availability: 'required' },
    { code: 'BAS', description: 'Basic', availability: 'active' },
    { code: 'ENT', description: 'Entry', availability: 'inactive' },
  ]
  it.each(validData)('with valid data', (testCase: Partial<IncentiveLevelData>) => {
    const form = new IncentiveLevelForm(formId)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  const invalidData: unknown[] = [
    {},
    { description: 'Standard' },
    { code: '', description: 'Standard', availability: 'required' },
    { code: 'BAS', description: '', availability: 'required' },
    { code: 'BAS', description: 'Basuc', availability: 'none' },
  ]
  it.each(invalidData)('with invalid data', (testCase: unknown) => {
    const form = new IncentiveLevelForm(formId)
    form.submit({ formId, ...(testCase as Partial<IncentiveLevelData>) })
    expect(form.hasErrors).toBeTruthy()
  })
})
