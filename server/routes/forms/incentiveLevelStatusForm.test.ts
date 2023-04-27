import IncentiveLevelStatusForm from './incentiveLevelStatusForm'

describe('IncentiveLevelStatusForm', () => {
  const formId = 'test-form-1' as const

  it.each(['active', 'inactive'])('with valid data: %s', (status: 'active' | 'inactive') => {
    const form = new IncentiveLevelStatusForm(formId)
    form.submit({ formId, status })
    expect(form.hasErrors).toBeFalsy()
  })

  it.each([undefined, null, '', 'ACTIVE', 'required'])('with invalid data: %s', (status: unknown) => {
    const form = new IncentiveLevelStatusForm(formId)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    form.submit({ formId, status })
    expect(form.hasErrors).toBeTruthy()
  })
})
