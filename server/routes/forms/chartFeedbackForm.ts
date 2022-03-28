/* eslint-disable no-param-reassign */
import Form from './forms'

export interface ChartFeedbackForm {
  // form
  chartUseful: 'yes' | 'no'
  yesComments: string
  mainNoReason: 'not-relevant' | 'do-not-understand' | 'does-not-show-enough' | 'what-to-do-with-info' | 'other'
  noComments: string
  // context
  formId: string
}

export function validate(form: Form<ChartFeedbackForm>) {
  const { chartUseful, mainNoReason } = form.data
  if (!['yes', 'no'].includes(chartUseful)) {
    form.fieldErrors.chartUseful = 'Tell us if you found the chart useful'
  } else if (chartUseful === 'yes') {
    form.data.yesComments = (form.data.yesComments ?? '').trim()
    delete form.data.noComments
    delete form.data.mainNoReason
  } else if (chartUseful === 'no') {
    form.data.noComments = (form.data.noComments ?? '').trim()
    delete form.data.yesComments
    if (
      !['not-relevant', 'do-not-understand', 'does-not-show-enough', 'what-to-do-with-info', 'other'].includes(
        mainNoReason
      )
    ) {
      form.fieldErrors.mainNoReason = 'Select a reason for your answer'
    }
  }
}
