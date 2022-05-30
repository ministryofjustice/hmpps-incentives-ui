import Form, { type BaseFormData } from './forms'

export interface ChartFeedbackData extends BaseFormData {
  chartUseful: 'yes' | 'no'
  yesComments: string
  mainNoReason: 'not-relevant' | 'do-not-understand' | 'does-not-show-enough' | 'what-to-do-with-info' | 'other'
  noComments: string
}

export default class ChartFeedbackForm extends Form<ChartFeedbackData> {
  protected validate(): void {
    const { chartUseful, mainNoReason } = this.data
    if (chartUseful === 'yes') {
      this.data.yesComments = (this.data.yesComments ?? '').trim()
      delete this.data.noComments
      delete this.data.mainNoReason
    } else if (chartUseful === 'no') {
      this.data.noComments = (this.data.noComments ?? '').trim()
      delete this.data.yesComments
      if (
        !['not-relevant', 'do-not-understand', 'does-not-show-enough', 'what-to-do-with-info', 'other'].includes(
          mainNoReason,
        )
      ) {
        this.addError('mainNoReason', 'Select a reason for your answer')
        delete this.data.mainNoReason
      }
    } else {
      this.addError('chartUseful', 'Tell us if you found the chart useful')
      delete this.data.chartUseful
    }
  }
}
