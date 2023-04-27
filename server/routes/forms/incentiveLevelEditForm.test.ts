import IncentiveLevelEditForm, { type IncentiveLevelEditData } from './incentiveLevelEditForm'

describe('IncentiveLevelEditForm', () => {
  const formId = 'test-form-1' as const

  const validData: Partial<IncentiveLevelEditData>[] = [
    { name: 'Standard', availability: 'required' },
    { name: 'Basic', availability: 'active' },
    { name: 'Entry', availability: 'inactive' },
  ]
  it.each(validData)('with valid data', (testCase: Partial<IncentiveLevelEditData>) => {
    const form = new IncentiveLevelEditForm(formId)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  const invalidData: unknown[] = [
    {},
    { name: 'Standard' },
    { name: '', availability: 'required' },
    { name: 'Basic', availability: 'none' },
  ]
  it.each(invalidData)('with invalid data', (testCase: unknown) => {
    const form = new IncentiveLevelEditForm(formId)
    form.submit({ formId, ...(testCase as Partial<IncentiveLevelEditData>) })
    expect(form.hasErrors).toBeTruthy()
  })
})
