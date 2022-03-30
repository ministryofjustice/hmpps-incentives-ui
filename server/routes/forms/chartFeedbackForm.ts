import Form from './forms'

export interface ChartFeedbackData {
  // form
  chartUseful: 'yes' | 'no'
  yesComments: string
  mainNoReason: 'not-relevant' | 'do-not-understand' | 'does-not-show-enough' | 'what-to-do-with-info' | 'other'
  noComments: string
  // context
  formId: string
}

export default class ChartFeedbackForm extends Form<ChartFeedbackData> {
  protected validate(): void {
    const { chartUseful, mainNoReason } = this.data
    if (!['yes', 'no'].includes(chartUseful)) {
      this.fieldErrors.chartUseful = 'Tell us if you found the chart useful'
    } else if (chartUseful === 'yes') {
      this.data.yesComments = (this.data.yesComments ?? '').trim()
      delete this.data.noComments
      delete this.data.mainNoReason
    } else if (chartUseful === 'no') {
      this.data.noComments = (this.data.noComments ?? '').trim()
      delete this.data.yesComments
      if (
        !['not-relevant', 'do-not-understand', 'does-not-show-enough', 'what-to-do-with-info', 'other'].includes(
          mainNoReason
        )
      ) {
        this.fieldErrors.mainNoReason = 'Select a reason for your answer'
      }
    }
  }
}
