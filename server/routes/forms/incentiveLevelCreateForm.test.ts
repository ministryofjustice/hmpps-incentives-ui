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
    {
      name: ' Enhanced 4  ',
      code: 'EN4',
    },
  ]
  it.each(validData)('with valid data', testCase => {
    const form = new IncentiveLevelCreateForm(formId)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  it('trims name', () => {
    const form = new IncentiveLevelCreateForm(formId)
    form.submit({
      formId,
      name: ' Enhanced 4  ',
      code: 'EN4',
    })
    expect(form.hasErrors).toBeFalsy()
    expect(form.getField('name').value).toEqual('Enhanced 4')
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
      'name with only spaces',
      {
        name: '   ',
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
    [
      'short code',
      {
        name: 'Standard',
        code: 'st',
      },
    ],
    [
      'long code',
      {
        name: 'Standard',
        code: 'Standard',
      },
    ],
    [
      'code with invalid characters',
      {
        name: 'Enhanced 4',
        code: 'E 4',
      },
    ],
  ]
  it.each(invalidData)('with invalid data: %s', (_, testCase: unknown) => {
    const form = new IncentiveLevelCreateForm(formId)
    form.submit({ formId, ...(testCase as Partial<IncentiveLevelCreateData>) })
    expect(form.hasErrors).toBeTruthy()
  })
})
