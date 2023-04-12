import PrisonIncentiveLevelEditForm, { type PrisonIncentiveLevelEditData } from './prisonIncentiveLevelEditForm'

describe('PrisonIncentiveLevelEditForm', () => {
  const formId = 'test-form-1' as const

  const validData: Partial<PrisonIncentiveLevelEditData>[] = [
    {
      remandTransferLimit: '60.50',
      remandSpendLimit: '605.00',
      convictedTransferLimit: '30.90',
      convictedSpendLimit: '309.00',

      visitOrders: '1',
      privilegedVisitOrders: '1',
    },
    {
      remandTransferLimit: '60.50',
      remandSpendLimit: '605',
      convictedTransferLimit: '30.90',
      convictedSpendLimit: '309',

      visitOrders: '2',
      privilegedVisitOrders: '0',
    },
  ]
  it.each(validData)('with valid data', (testCase: Partial<PrisonIncentiveLevelEditData>) => {
    const form = new PrisonIncentiveLevelEditForm(formId, false)
    form.submit({ formId, ...testCase })
    expect(form.hasErrors).toBeFalsy()
  })

  const invalidData: [string, unknown][] = [
    ['empty submission', {}],
    [
      'missing spend limits',
      {
        remandTransferLimit: '60.50',
        remandSpendLimit: '605',
        convictedTransferLimit: '30.90',
        convictedSpendLimit: '309',
      },
    ],
    [
      'one missing field',
      {
        remandSpendLimit: '605',
        convictedTransferLimit: '30.90',
        convictedSpendLimit: '309',

        visitOrders: '2',
        privilegedVisitOrders: '0',
      },
    ],
    [
      'invalid defaultOnAdmission',
      {
        defaultOnAdmission: 'true',

        remandTransferLimit: '60.50',
        remandSpendLimit: '605.00',
        convictedTransferLimit: '30.90',
        convictedSpendLimit: '309.00',

        visitOrders: '1',
        privilegedVisitOrders: '1',
      },
    ],
  ]
  it.each(invalidData)('with invalid data: %s', (_, testCase: unknown) => {
    const form = new PrisonIncentiveLevelEditForm(formId, false)
    form.submit({ formId, ...(testCase as Partial<PrisonIncentiveLevelEditData>) })
    expect(form.hasErrors).toBeTruthy()
  })

  const currencyFields: (keyof PrisonIncentiveLevelEditData)[] = [
    'remandTransferLimit',
    'remandSpendLimit',
    'convictedTransferLimit',
    'convictedSpendLimit',
    'visitOrders',
    'privilegedVisitOrders',
  ]
  describe.each(currencyFields)('with invalid %s field', (amountFiend: keyof PrisonIncentiveLevelEditData) => {
    const form = new PrisonIncentiveLevelEditForm(formId, false)

    it.each(['', 'one', '£1.00', '1.1', '-1', '1.000'])('having value %s', (value: string) => {
      // valid data
      const data: PrisonIncentiveLevelEditData = {
        formId,
        remandTransferLimit: '60.50',
        remandSpendLimit: '605',
        convictedTransferLimit: '30.90',
        convictedSpendLimit: '309',

        visitOrders: '2',
        privilegedVisitOrders: '0',
      }
      // make 1 field invalid
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data[amountFiend] = value
      form.submit(data)
      expect(form.hasErrors).toBeTruthy()
    })
  })

  it('when defaultOnAdmission is required but unchecked', () => {
    const form = new PrisonIncentiveLevelEditForm(formId, true)
    const data: PrisonIncentiveLevelEditData = {
      formId,
      remandTransferLimit: '60.50',
      remandSpendLimit: '605.00',
      convictedTransferLimit: '30.90',
      convictedSpendLimit: '309.00',

      visitOrders: '1',
      privilegedVisitOrders: '1',
    }
    form.submit(data)
    expect(form.hasErrors).toBeTruthy()
  })
})
