import IncentiveLevelCreateForm, { type IncentiveLevelCreateData } from './incentiveLevelCreateForm'

describe('IncentiveLevelCreateForm', () => {
  const formId = 'test-form-1' as const

  const validData: Partial<IncentiveLevelCreateData>[] = [
    {
      name: 'Standard',
      code: 'STD',
    },
    {
      name: 'Enhanced 4',
      code: 'EN4',
    },
  ]
  it.each(validData)('with valid data', testCase => {
    const form = new IncentiveLevelCreateForm(formId)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  const invalidData: [string, unknown][] = [
    ['empty submission', {}],
    [
      'blank name',
      {
        name: '',
        code: 'ABC',
      },
    ],
    [
      'blank code',
      {
        name: 'Standard',
        code: '',
      },
    ],
  ]
  it.each(invalidData)('with invalid data: %s', (_, testCase: unknown) => {
    const form = new IncentiveLevelCreateForm(formId)
    form.submit({ formId, ...(testCase as Partial<IncentiveLevelCreateData>) })
    expect(form.hasErrors).toBeTruthy()
  })
})
