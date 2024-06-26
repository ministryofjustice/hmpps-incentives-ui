import ChartFeedbackForm, { type ChartFeedbackData } from './chartFeedbackForm'

describe('ChartFeedbackForm', () => {
  const formId = 'test-form-1' as const

  const unsubmittedForm = () => new ChartFeedbackForm(formId)
  const submittedForm = (data: Partial<ChartFeedbackData>) => {
    const form = unsubmittedForm()
    form.submit(data)
    return form
  }

  describe('when not submitted', () => {
    it('has no errors', () => {
      const form = unsubmittedForm()
      expect(form.formId).toEqual(formId)
      expect(form.submitted).toEqual(false)
      expect(form.hasErrors).toEqual(false)
      expect(form.getField('chartUseful').error).toBeUndefined()
      expect(form.getField('yesComments').error).toBeUndefined()
      expect(form.getField('mainNoReason').error).toBeUndefined()
      expect(form.getField('noComments').error).toBeUndefined()
      expect(form.errorList).toEqual([])
    })

    it('has no field values', () => {
      const form = unsubmittedForm()
      expect(form.getField('chartUseful').value).toBeUndefined()
      expect(form.getField('yesComments').value).toBeUndefined()
      expect(form.getField('mainNoReason').value).toBeUndefined()
      expect(form.getField('noComments').value).toBeUndefined()
    })
  })

  describe('when submitted', () => {
    it('throws without the right formId', () => {
      expect(() => submittedForm({})).toThrow('Data not submitted by this form')
      expect(() => submittedForm({ formId: 'incorrect' })).toThrow('Data not submitted by this form')
    })

    const correctData: Partial<ChartFeedbackData>[] = [
      { chartUseful: 'yes' },
      { chartUseful: 'yes', yesComments: 'Would be good to see a history too' },
      { chartUseful: 'no', mainNoReason: 'does-not-show-enough' },
      { chartUseful: 'no', mainNoReason: 'what-to-do-with-info', noComments: 'How can I act on this?' },
    ]
    describe.each(correctData)('with valid data', data => {
      it(`has no errors when provided correct: ${Object.keys(data).join(' ')}`, () => {
        const form = submittedForm({ formId, ...data })
        expect(form.formId).toEqual(formId)
        expect(form.submitted).toEqual(true)
        expect(form.hasErrors).toEqual(false)
        expect(form.getField('chartUseful').error).toBeUndefined()
        expect(form.getField('yesComments').error).toBeUndefined()
        expect(form.getField('mainNoReason').error).toBeUndefined()
        expect(form.getField('noComments').error).toBeUndefined()
        expect(form.errorList).toEqual([])
      })

      it(`remembers field values when provided correct: ${Object.keys(data).join(' ')}`, () => {
        const form = submittedForm({ formId, ...data })
        Object.keys(data).forEach((field: keyof ChartFeedbackData) => {
          expect(form.getField(field).value).toEqual(data[field])
        })
      })
    })

    const incorrectData: [string, unknown, (keyof ChartFeedbackData)[]][] = [
      ['chartUseful is missing', {}, ['chartUseful']],
      ['chartUseful is empty', { chartUseful: '' }, ['chartUseful']],
      ['chartUseful is not valid', { chartUseful: 'yep' }, ['chartUseful']],
      ['mainNoReason is missing', { chartUseful: 'no' }, ['mainNoReason']],
      ['mainNoReason is empty', { chartUseful: 'no', mainNoReason: '' }, ['mainNoReason']],
      ['mainNoReason is invalid', { chartUseful: 'no', mainNoReason: 'help' }, ['mainNoReason']],
    ]
    describe.each(incorrectData)('with invalid data', (description, data, invalidFields) => {
      // pretend that the input data had the correct type so typescript does not get in the way of form logic testing
      const typedData = data as Partial<ChartFeedbackData>

      it(`has errors when ${description}`, () => {
        const form = new ChartFeedbackForm(formId)
        form.submit({ formId, ...typedData })
        expect(form.hasErrors).toEqual(true)
        invalidFields.forEach(field => {
          expect(form.getField(field).error).toBeTruthy()
          expect(form.getField(field).error).toEqual(expect.any(String))
        })
        expect(form.errorList).toHaveLength(invalidFields.length)
      })

      if (typedData.chartUseful === 'no') {
        it(`still remembers comments field when ${description}`, () => {
          const form = new ChartFeedbackForm(formId)
          form.submit({ formId, noComments: 'Who can I speak to?', ...typedData })
          expect(form.getField('noComments').value).toEqual('Who can I speak to?')
        })
      }
    })

    const untrimmedData: [Partial<ChartFeedbackData>, string?, string?][] = [
      [
        { chartUseful: 'yes', yesComments: '\nWould be good to see a history too   ', noComments: '?' },
        'Would be good to see a history too',
      ],
      [
        { chartUseful: 'no', yesComments: '?', mainNoReason: 'other', noComments: '  Who can help me with a query?  ' },
        'Who can help me with a query?',
      ],
    ]
    describe.each(untrimmedData)('trims or deletes comment fields', (data, comments) => {
      it(`if chart was useful: ${data.chartUseful}`, () => {
        const form = new ChartFeedbackForm(formId)
        form.submit({ formId, ...data })
        expect(form.hasErrors).toBeFalsy()
        if (data.chartUseful === 'yes') {
          expect(form.getField('yesComments').value).toEqual(comments)
          expect(form.getField('noComments').value).toBeUndefined()
        } else {
          expect(form.getField('yesComments').value).toBeUndefined()
          expect(form.getField('noComments').value).toEqual(comments)
        }
      })
    })
  })
})
