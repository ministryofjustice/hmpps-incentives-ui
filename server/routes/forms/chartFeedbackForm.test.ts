import Form from './forms'
import { type ChartFeedbackForm, validate } from './chartFeedbackForm'

describe('ChartFeedbackForm', () => {
  const correctData: Partial<ChartFeedbackForm>[] = [
    { chartUseful: 'yes' },
    { chartUseful: 'yes', yesComments: 'Would be good to see a history too' },
    { chartUseful: 'no', mainNoReason: 'does-not-show-enough' },
    { chartUseful: 'no', mainNoReason: 'what-to-do-with-info', noComments: 'How can I act on this?' },
  ]
  describe.each(correctData)('validates correct forms', data => {
    it(`with valid fields: ${Object.keys(data).join(' ')}`, () => {
      const form = new Form<ChartFeedbackForm>(data)
      validate(form)
      expect(form.hasErrors).toBeFalsy()
      expect(form.fieldErrors).toEqual({})
      expect(form.errorSummary()).toEqual([])
    })
  })

  const incorrectData: [unknown, (keyof ChartFeedbackForm)[]][] = [
    [{}, ['chartUseful']],
    [{ chartUseful: '' }, ['chartUseful']],
    [{ chartUseful: 'yep' }, ['chartUseful']],
    [{ chartUseful: 'no' }, ['mainNoReason']],
    [{ chartUseful: 'no', mainNoReason: '' }, ['mainNoReason']],
    [{ chartUseful: 'no', mainNoReason: 'help' }, ['mainNoReason']],
  ]
  describe.each(incorrectData)('validates incorrect forms', (data, invalidFields) => {
    it(`with invalid fields: ${invalidFields.join(' ')}`, () => {
      const form = new Form<ChartFeedbackForm>(data)
      validate(form)
      expect(form.hasErrors).toBeTruthy()
      expect(new Set(Object.keys(form.fieldErrors))).toEqual(new Set(invalidFields))
      expect(form.errorSummary()).toHaveLength(invalidFields.length)
    })
  })

  const untrimmedData: [Partial<ChartFeedbackForm>, string?, string?][] = [
    [
      { chartUseful: 'yes', yesComments: '\nWould be good to see a history too   ' },
      'Would be good to see a history too',
    ],
    [
      { chartUseful: 'no', mainNoReason: 'other', noComments: '  Who can help me with a query?  ' },
      undefined,
      'Who can help me with a query?',
    ],
  ]
  describe.each(untrimmedData)('trims comment fields', (data, yesComments, noComments) => {
    const form = new Form<ChartFeedbackForm>(data)
    validate(form)
    expect(form.hasErrors).toBeFalsy()
    if (typeof yesComments !== 'undefined') {
      expect(form.data.yesComments).toEqual(yesComments)
    } else {
      expect(form.data.yesComments).toBeUndefined()
    }
    if (typeof noComments !== 'undefined') {
      expect(form.data.noComments).toEqual(noComments)
    } else {
      expect(form.data.noComments).toBeUndefined()
    }
  })
})
