import PrisonIncentiveLevelForm, { type PrisonIncentiveLevelData } from './prisonIncentiveLevelForm'

describe('PrisonIncentiveLevelForm', () => {
  const formId = 'test-form-1'

  const validData: Partial<PrisonIncentiveLevelData>[] = [
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
  it.each(validData)('with valid data', (testCase: Partial<PrisonIncentiveLevelData>) => {
    const form = new PrisonIncentiveLevelForm(formId)
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
  ]
  it.each(invalidData)('with invalid data: %s', (_, testCase: unknown) => {
    const form = new PrisonIncentiveLevelForm(formId)
    form.submit({ formId, ...(testCase as Partial<PrisonIncentiveLevelData>) })
    expect(form.hasErrors).toBeTruthy()
  })

  const currencyFields: (keyof PrisonIncentiveLevelData)[] = [
    'remandTransferLimit',
    'remandSpendLimit',
    'convictedTransferLimit',
    'convictedSpendLimit',
    'visitOrders',
    'privilegedVisitOrders',
  ]
  describe.each(currencyFields)('with invalid %s field', (amountFiend: keyof PrisonIncentiveLevelData) => {
    const form = new PrisonIncentiveLevelForm(formId)

    it.each(['', 'one', '£1.00', '1.1', '-1', '1.000'])('having value %s', (value: string) => {
      // valid data
      const data: PrisonIncentiveLevelData = {
        formId,
        remandTransferLimit: '60.50',
        remandSpendLimit: '605',
        convictedTransferLimit: '30.90',
        convictedSpendLimit: '309',

        visitOrders: '2',
        privilegedVisitOrders: '0',
      }
      // make 1 field invalid
      data[amountFiend] = value
      form.submit(data)
      expect(form.hasErrors).toBeTruthy()
    })
  })
})
