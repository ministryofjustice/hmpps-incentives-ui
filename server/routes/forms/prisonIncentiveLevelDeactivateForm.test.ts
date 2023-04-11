import PrisonIncentiveLevelDeactivateForm from './prisonIncentiveLevelDeactivateForm'

describe('PrisonIncentiveLevelDeactivateForm', () => {
  const formId = 'test-form-1' as const

  it.each(['yes', 'no'])('with valid data: %s', (confirmation: 'yes' | 'no') => {
    const form = new PrisonIncentiveLevelDeactivateForm(formId)
    form.submit({ formId, confirmation })
    expect(form.hasErrors).toBeFalsy()
  })

  it.each([undefined, null, '', 'true', 'YES'])('with invalid data: %s', (confirmation: unknown) => {
    const form = new PrisonIncentiveLevelDeactivateForm(formId)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    form.submit({ formId, confirmation })
    expect(form.hasErrors).toBeTruthy()
  })
})
