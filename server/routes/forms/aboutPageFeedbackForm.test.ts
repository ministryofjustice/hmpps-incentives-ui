import AboutPageFeedbackForm, { type AboutPageFeedbackData } from './aboutPageFeedbackForm'

describe('AboutPageFeedbackForm', () => {
  const formId = 'test-form-1'

  const unsubmittedForm = () => new AboutPageFeedbackForm(formId)
  const submittedForm = (data: Partial<AboutPageFeedbackData>) => {
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
      expect(form.getField('informationUseful').error).toBeUndefined()
      expect(form.getField('yesComments').error).toBeUndefined()
      expect(form.getField('noComments').error).toBeUndefined()
      expect(form.errorList).toEqual([])
    })

    it('has no field values', () => {
      const form = unsubmittedForm()
      expect(form.getField('informationUseful').value).toBeUndefined()
      expect(form.getField('yesComments').value).toBeUndefined()
      expect(form.getField('noComments').value).toBeUndefined()
    })
  })

  describe('when submitted', () => {
    it('throws without the right formId', () => {
      expect(() => submittedForm({})).toThrow('Data not submitted by this form')
      expect(() => submittedForm({ formId: 'incorrect' })).toThrow('Data not submitted by this form')
    })

    const correctData: Partial<AboutPageFeedbackData>[] = [
      { informationUseful: 'yes' },
      { informationUseful: 'yes', yesComments: 'Would be good to see a history too' },
      { informationUseful: 'no' },
      { informationUseful: 'no', noComments: 'How can I act on this?' },
    ]
    describe.each(correctData)('with valid data', data => {
      it(`has no errors when provided correct: ${Object.keys(data).join(' ')}`, () => {
        const form = submittedForm({ formId, ...data })
        expect(form.formId).toEqual(formId)
        expect(form.submitted).toEqual(true)
        expect(form.hasErrors).toEqual(false)
        expect(form.getField('informationUseful').error).toBeUndefined()
        expect(form.getField('yesComments').error).toBeUndefined()
        expect(form.getField('noComments').error).toBeUndefined()
        expect(form.errorList).toEqual([])
      })

      it(`remembers field values when provided correct: ${Object.keys(data).join(' ')}`, () => {
        const form = submittedForm({ formId, ...data })
        Object.keys(data).forEach((field: keyof AboutPageFeedbackData) => {
          expect(form.getField(field).value).toEqual(data[field])
        })
      })
    })

    const incorrectData: [string, unknown, (keyof AboutPageFeedbackData)[]][] = [
      ['informationUseful is missing', {}, ['informationUseful']],
      ['informationUseful is empty', { informationUseful: '' }, ['informationUseful']],
      ['informationUseful is not valid', { informationUseful: 'yep' }, ['informationUseful']],
    ]
    describe.each(incorrectData)('with invalid data', (description, data, invalidFields) => {
      // pretend that the input data had the correct type so typescript does not get in the way of form logic testing
      const typedData = data as Partial<AboutPageFeedbackData>

      it(`has errors when ${description}`, () => {
        const form = new AboutPageFeedbackForm(formId)
        form.submit({ formId, ...typedData })
        expect(form.hasErrors).toEqual(true)
        invalidFields.forEach(field => {
          expect(form.getField(field).error).toBeTruthy()
          expect(form.getField(field).error).toEqual(expect.any(String))
        })
        expect(form.errorList).toHaveLength(invalidFields.length)
      })

      if (typedData.informationUseful === 'no') {
        it(`still remembers comments field when ${description}`, () => {
          const form = new AboutPageFeedbackForm(formId)
          form.submit({ formId, noComments: 'Who can I speak to?', ...typedData })
          expect(form.getField('noComments').value).toEqual('Who can I speak to?')
        })
      }
    })

    const untrimmedData: [Partial<AboutPageFeedbackData>, string?, string?][] = [
      [
        { informationUseful: 'yes', yesComments: '\nWould be good to see a history too   ', noComments: '?' },
        'Would be good to see a history too',
      ],
      [
        { informationUseful: 'no', yesComments: '?', noComments: '  Who can help me with a query?  ' },
        'Who can help me with a query?',
      ],
    ]
    describe.each(untrimmedData)('trims or deletes comment fields', (data, comments) => {
      it(`if chart was useful: ${data.informationUseful}`, () => {
        const form = new AboutPageFeedbackForm(formId)
        form.submit({ formId, ...data })
        expect(form.hasErrors).toBeFalsy()
        if (data.informationUseful === 'yes') {
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
