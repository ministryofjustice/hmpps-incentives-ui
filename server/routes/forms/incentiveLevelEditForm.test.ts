import IncentiveLevelEditForm, { type IncentiveLevelEditData } from './incentiveLevelEditForm'

describe('IncentiveLevelEditForm', () => {
  const formId = 'test-form-1' as const

  const validData: Partial<IncentiveLevelEditData>[] = [
    { name: 'Standard', availability: 'required' },
    { name: 'Basic', availability: 'active' },
    { name: 'Entry', availability: 'inactive' },
    { name: 'Entry   ', availability: 'inactive' },
  ]
  it.each(validData)('with valid data', (testCase: Partial<IncentiveLevelEditData>) => {
    const form = new IncentiveLevelEditForm(formId)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  it('trims name', () => {
    const form = new IncentiveLevelEditForm(formId)
    form.submit({
      formId,
      name: ' Enhanced 4  ',
      availability: 'inactive',
    })
    expect(form.hasErrors).toBeFalsy()
    expect(form.getField('name').value).toEqual('Enhanced 4')
  })

  const invalidData: [string, unknown][] = [
    ['empty submission', {}],
    ['missing availability', { name: 'Standard' }],
    ['blank name', { name: '', availability: 'required' }],
    ['name with only spaces', { name: '    ', availability: 'required' }],
    ['invalid availability', { name: 'Basic', availability: 'none' }],
    ['excessively long name', { name: '123456789 123456789 123456789 X', availability: 'required' }],
  ]
  it.each(invalidData)('with invalid data: %s', (_, testCase: unknown) => {
    const form = new IncentiveLevelEditForm(formId)
    form.submit({ formId, ...(testCase as Partial<IncentiveLevelEditData>) })
    expect(form.hasErrors).toBeTruthy()
  })
})
