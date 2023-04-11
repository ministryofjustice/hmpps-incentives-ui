import PrisonIncentiveLevelAddForm from './prisonIncentiveLevelAddForm'
import { type PrisonIncentiveLevelEditData } from './prisonIncentiveLevelEditForm'

describe('PrisonIncentiveLevelAddForm', () => {
  const formId = 'test-form-1' as const
  const validLevelCodes = ['BAS', 'STD', 'ENH']

  const validBaseData: PrisonIncentiveLevelEditData = {
    formId,
    remandTransferLimit: '60.50',
    remandSpendLimit: '605.00',
    convictedTransferLimit: '30.90',
    convictedSpendLimit: '309.00',

    visitOrders: '1',
    privilegedVisitOrders: '1',
  }

  it.each(validLevelCodes)('with valid data: %s', (levelCode: string) => {
    const form = new PrisonIncentiveLevelAddForm(formId, validLevelCodes)
    form.submit({ ...validBaseData, levelCode })
    expect(form.hasErrors).toBeFalsy()
  })

  it.each([undefined, null, '', 'EN2', 'bas'])('with invalid data: %s', (levelCode: unknown) => {
    const form = new PrisonIncentiveLevelAddForm(formId, validLevelCodes)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    form.submit({ ...validBaseData, levelCode })
    expect(form.hasErrors).toBeTruthy()
  })
})
